using System.Data;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using TheRow.Application.Common;
using TheRow.Application.Common.Interfaces;
using TheRow.Application.DTOs;
using TheRow.Domain.Entities;
using TheRow.Domain.Enums;
using TheRow.Infrastructure.Mapping;
using TheRow.Infrastructure.Persistence;

namespace TheRow.Infrastructure.Services;

public class BookingService : IBookingService
{
    private const string ReferenceAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 — read aloud over the phone

    private readonly AppDbContext _db;
    private readonly IAvailabilityService _availability;

    public BookingService(AppDbContext db, IAvailabilityService availability)
    {
        _db = db;
        _availability = availability;
    }

    public async Task<Result<BookingDto>> CreateAsync(CreateBookingRequest request, CancellationToken ct = default)
    {
        var checkIn = request.CheckIn.Date;
        var checkOut = request.CheckOut.Date;

        if (checkOut <= checkIn) return Result<BookingDto>.Failure("Check-out must be after check-in.");
        if (request.Adults < 1) return Result<BookingDto>.Failure("At least one adult is required.");
        if (string.IsNullOrWhiteSpace(request.GuestEmail)) return Result<BookingDto>.Failure("Email is required.");

        // The connection is configured with EnableRetryOnFailure, so a user-initiated transaction
        // must run inside the execution strategy — otherwise EF refuses to start it. A retry
        // replays the whole block, which is exactly what we want: the availability read and the
        // insert stay one atomic unit.
        var strategy = _db.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            // Serializable keeps the availability read and the insert atomic, so two guests racing
            // for the last room cannot both succeed.
            await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);

            var availability = await _availability.GetAvailabilityAsync(
                new AvailabilityQuery(checkIn, checkOut, request.Adults, request.Children, request.RoomTypeId), ct);

            if (!availability.Succeeded) return Result<BookingDto>.Failure(availability.Error);

            var option = availability.Value!.FirstOrDefault(a => a.RoomTypeId == request.RoomTypeId);
            if (option is null) return Result<BookingDto>.Failure("That room type is not available for booking.");
            if (option.AvailableRooms <= 0) return Result<BookingDto>.Failure("No rooms of that type remain for the selected dates.");
            if (!option.FitsParty) return Result<BookingDto>.Failure("That room type cannot accommodate the selected number of guests.");

            var provider = Enum.TryParse<PaymentProvider>(request.PaymentProvider, true, out var p) ? p : PaymentProvider.Cash;
            var exchangeRate = await GetExchangeRateAsync(ct);

            var booking = new Booking
            {
                Reference = await GenerateReferenceAsync(ct),
                RoomTypeId = request.RoomTypeId,
                GuestFirstName = request.GuestFirstName.Trim(),
                GuestLastName = request.GuestLastName.Trim(),
                GuestEmail = request.GuestEmail.Trim(),
                GuestPhone = request.GuestPhone?.Trim() ?? string.Empty,
                GuestCountry = request.GuestCountry?.Trim() ?? string.Empty,
                CheckIn = checkIn,
                CheckOut = checkOut,
                Adults = request.Adults,
                Children = request.Children,
                Nights = option.Nights,
                NightlyRateEtb = option.NightlyRateEtb,
                SubtotalEtb = option.SubtotalEtb,
                TaxEtb = option.TaxEtb,
                TotalEtb = option.TotalEtb,
                DisplayCurrency = string.IsNullOrWhiteSpace(request.DisplayCurrency) ? "ETB" : request.DisplayCurrency.ToUpperInvariant(),
                ExchangeRateUsed = exchangeRate,
                SpecialRequests = request.SpecialRequests?.Trim() ?? string.Empty,
                Status = BookingStatus.Pending,
                PaymentStatus = PaymentStatus.Unpaid,
                Source = BookingSource.Website
            };

            // Recorded as an intent so the gateway callback has a row to reconcile against.
            booking.Payments.Add(new Payment
            {
                Provider = provider,
                AmountEtb = option.TotalEtb,
                Status = PaymentStatus.Unpaid,
                Notes = "Awaiting payment confirmation."
            });

            _db.Bookings.Add(booking);
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return Result<BookingDto>.Success((await GetAsync(booking.Id, ct))!);
        });
    }

    public async Task<PagedResult<BookingDto>> SearchAsync(BookingFilter filter, CancellationToken ct = default)
    {
        var query = _db.Bookings.AsNoTracking()
            .Include(b => b.RoomType)
            .Include(b => b.Room)
            .Include(b => b.Payments)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim();
            query = query.Where(b =>
                b.Reference.Contains(term) ||
                b.GuestFirstName.Contains(term) ||
                b.GuestLastName.Contains(term) ||
                b.GuestEmail.Contains(term) ||
                b.GuestPhone.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(filter.Status) && Enum.TryParse<BookingStatus>(filter.Status, true, out var status))
            query = query.Where(b => b.Status == status);

        if (!string.IsNullOrWhiteSpace(filter.PaymentStatus) && Enum.TryParse<PaymentStatus>(filter.PaymentStatus, true, out var pay))
            query = query.Where(b => b.PaymentStatus == pay);

        if (filter.From is DateTime from) query = query.Where(b => b.CheckOut > from.Date);
        if (filter.To is DateTime to) query = query.Where(b => b.CheckIn < to.Date.AddDays(1));

        var total = await query.CountAsync(ct);
        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 200);

        var items = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<BookingDto>
        {
            Items = items.Select(b => b.ToDto()).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = total
        };
    }

    public async Task<BookingDto?> GetAsync(int id, CancellationToken ct = default)
    {
        var booking = await LoadAsync(b => b.Id == id, tracking: false, ct);
        return booking?.ToDto();
    }

    public async Task<BookingDto?> GetByReferenceAsync(string reference, CancellationToken ct = default)
    {
        var normalized = reference.Trim().ToUpperInvariant();
        var booking = await LoadAsync(b => b.Reference == normalized, tracking: false, ct);
        return booking?.ToDto();
    }

    public async Task<Result<BookingDto>> UpdateStatusAsync(int id, UpdateBookingStatusRequest request, CancellationToken ct = default)
    {
        if (!Enum.TryParse<BookingStatus>(request.Status, true, out var status))
            return Result<BookingDto>.Failure($"'{request.Status}' is not a valid booking status.");

        var booking = await LoadAsync(b => b.Id == id, tracking: true, ct);
        if (booking is null) return Result<BookingDto>.Failure("Booking not found.");

        if (status == BookingStatus.CheckedIn && booking.RoomId is null)
            return Result<BookingDto>.Failure("Assign a room before checking the guest in.");

        booking.Status = status;

        if (status == BookingStatus.Cancelled)
        {
            booking.CancelledAt = DateTime.UtcNow;
            booking.CancellationReason = request.Reason ?? string.Empty;
            if (booking.RoomId is int freedRoomId) await ReleaseRoomAsync(freedRoomId, ct);
        }
        else if (status == BookingStatus.CheckedIn && booking.RoomId is int occupiedRoomId)
        {
            await SetRoomStatusAsync(occupiedRoomId, RoomStatus.Occupied, ct);
        }
        else if (status == BookingStatus.CheckedOut && booking.RoomId is int vacatedRoomId)
        {
            await ReleaseRoomAsync(vacatedRoomId, ct);
        }

        await _db.SaveChangesAsync(ct);
        return Result<BookingDto>.Success((await GetAsync(id, ct))!);
    }

    public async Task<Result<BookingDto>> AssignRoomAsync(int id, int roomId, CancellationToken ct = default)
    {
        var booking = await LoadAsync(b => b.Id == id, tracking: true, ct);
        if (booking is null) return Result<BookingDto>.Failure("Booking not found.");

        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == roomId, ct);
        if (room is null) return Result<BookingDto>.Failure("Room not found.");
        if (room.RoomTypeId != booking.RoomTypeId) return Result<BookingDto>.Failure("That room belongs to a different room type.");
        if (!room.IsActive || room.Status is RoomStatus.Maintenance or RoomStatus.OutOfService)
            return Result<BookingDto>.Failure("That room is not sellable right now.");

        var clash = await _db.Bookings.AnyAsync(b =>
            b.Id != id &&
            b.RoomId == roomId &&
            AvailabilityService.BlockingStatuses.Contains(b.Status) &&
            b.CheckIn < booking.CheckOut &&
            b.CheckOut > booking.CheckIn, ct);

        if (clash) return Result<BookingDto>.Failure("That room is already assigned for overlapping dates.");

        booking.RoomId = roomId;
        await _db.SaveChangesAsync(ct);
        return Result<BookingDto>.Success((await GetAsync(id, ct))!);
    }

    public async Task<Result<BookingDto>> RecordPaymentAsync(int id, RecordPaymentRequest request, CancellationToken ct = default)
    {
        var booking = await LoadAsync(b => b.Id == id, tracking: true, ct);
        if (booking is null) return Result<BookingDto>.Failure("Booking not found.");
        if (request.AmountEtb <= 0) return Result<BookingDto>.Failure("Payment amount must be greater than zero.");

        var provider = Enum.TryParse<PaymentProvider>(request.Provider, true, out var pr) ? pr : PaymentProvider.Cash;
        var status = Enum.TryParse<PaymentStatus>(request.Status, true, out var st) ? st : PaymentStatus.Paid;

        booking.Payments.Add(new Payment
        {
            Provider = provider,
            AmountEtb = request.AmountEtb,
            Status = status,
            Reference = request.Reference ?? string.Empty,
            Notes = request.Notes ?? string.Empty,
            PaidAt = status == PaymentStatus.Paid ? DateTime.UtcNow : null
        });

        await _db.SaveChangesAsync(ct);

        // Only settled money counts toward the balance.
        var settled = booking.Payments.Where(p => p.Status == PaymentStatus.Paid).Sum(p => p.AmountEtb);
        booking.PaymentStatus = settled <= 0 ? PaymentStatus.Unpaid
            : settled >= booking.TotalEtb ? PaymentStatus.Paid
            : PaymentStatus.PartiallyPaid;

        // A guest who has paid in full should not sit in the pending queue.
        if (booking.PaymentStatus == PaymentStatus.Paid && booking.Status == BookingStatus.Pending)
            booking.Status = BookingStatus.Confirmed;

        await _db.SaveChangesAsync(ct);
        return Result<BookingDto>.Success((await GetAsync(id, ct))!);
    }

    private async Task<Booking?> LoadAsync(
        System.Linq.Expressions.Expression<Func<Booking, bool>> predicate, bool tracking, CancellationToken ct)
    {
        var query = _db.Bookings
            .Include(b => b.RoomType)
            .Include(b => b.Room)
            .Include(b => b.Payments)
            .AsQueryable();

        if (!tracking) query = query.AsNoTracking();
        return await query.FirstOrDefaultAsync(predicate, ct);
    }

    private async Task ReleaseRoomAsync(int roomId, CancellationToken ct) =>
        await SetRoomStatusAsync(roomId, RoomStatus.Available, ct);

    private async Task SetRoomStatusAsync(int roomId, RoomStatus status, CancellationToken ct)
    {
        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == roomId, ct);
        // Never override a maintenance flag set by housekeeping.
        if (room is not null && room.Status is not (RoomStatus.Maintenance or RoomStatus.OutOfService))
            room.Status = status;
    }

    private async Task<decimal> GetExchangeRateAsync(CancellationToken ct)
    {
        var raw = await _db.Settings.AsNoTracking()
            .Where(s => s.Key == "currency.etb_per_usd")
            .Select(s => s.Value)
            .FirstOrDefaultAsync(ct);

        return decimal.TryParse(raw, out var rate) && rate > 0 ? rate : 1m;
    }

    private async Task<string> GenerateReferenceAsync(CancellationToken ct)
    {
        for (var attempt = 0; attempt < 8; attempt++)
        {
            var code = "TR-" + new string(Enumerable.Range(0, 6)
                .Select(_ => ReferenceAlphabet[RandomNumberGenerator.GetInt32(ReferenceAlphabet.Length)])
                .ToArray());

            if (!await _db.Bookings.AnyAsync(b => b.Reference == code, ct)) return code;
        }

        // Astronomically unlikely; fall back to something guaranteed unique.
        return "TR-" + DateTime.UtcNow.Ticks.ToString()[^8..];
    }
}
