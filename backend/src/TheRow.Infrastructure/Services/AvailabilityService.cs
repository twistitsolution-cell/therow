using Microsoft.EntityFrameworkCore;
using TheRow.Application.Common;
using TheRow.Application.Common.Interfaces;
using TheRow.Application.DTOs;
using TheRow.Domain.Entities;
using TheRow.Domain.Enums;
using TheRow.Infrastructure.Persistence;

namespace TheRow.Infrastructure.Services;

public class AvailabilityService : IAvailabilityService
{
    /// <summary>Reservations in these states hold inventory; anything else releases it.</summary>
    public static readonly BookingStatus[] BlockingStatuses =
    {
        BookingStatus.Pending, BookingStatus.Confirmed, BookingStatus.CheckedIn
    };

    /// <summary>Rooms in these states cannot be sold.</summary>
    private static readonly RoomStatus[] UnsellableStatuses = { RoomStatus.Maintenance, RoomStatus.OutOfService };

    private readonly AppDbContext _db;

    public AvailabilityService(AppDbContext db) => _db = db;

    public async Task<Result<IReadOnlyList<AvailabilityDto>>> GetAvailabilityAsync(
        AvailabilityQuery query, CancellationToken ct = default)
    {
        var checkIn = query.CheckIn.Date;
        var checkOut = query.CheckOut.Date;

        if (checkOut <= checkIn)
            return Result<IReadOnlyList<AvailabilityDto>>.Failure("Check-out must be after check-in.");

        if (checkIn < DateTime.UtcNow.Date)
            return Result<IReadOnlyList<AvailabilityDto>>.Failure("Check-in cannot be in the past.");

        var nights = (checkOut - checkIn).Days;
        if (nights > 60)
            return Result<IReadOnlyList<AvailabilityDto>>.Failure("Stays longer than 60 nights must be arranged with reservations.");

        var roomTypesQuery = _db.RoomTypes.AsNoTracking().Where(rt => rt.IsActive);
        if (query.RoomTypeId is int id) roomTypesQuery = roomTypesQuery.Where(rt => rt.Id == id);

        var roomTypes = await roomTypesQuery.OrderBy(rt => rt.DisplayOrder).ToListAsync(ct);
        if (roomTypes.Count == 0) return Result<IReadOnlyList<AvailabilityDto>>.Success(Array.Empty<AvailabilityDto>());

        var typeIds = roomTypes.Select(rt => rt.Id).ToList();

        // Sellable inventory per type.
        var inventory = await _db.Rooms.AsNoTracking()
            .Where(r => typeIds.Contains(r.RoomTypeId) && r.IsActive && !UnsellableStatuses.Contains(r.Status))
            .GroupBy(r => r.RoomTypeId)
            .Select(g => new { RoomTypeId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.RoomTypeId, x => x.Count, ct);

        // A booking overlaps the stay when it starts before we leave and ends after we arrive.
        // Same-day turnover (existing.CheckOut == checkIn) is therefore not a conflict.
        var booked = await _db.Bookings.AsNoTracking()
            .Where(bk => typeIds.Contains(bk.RoomTypeId)
                         && BlockingStatuses.Contains(bk.Status)
                         && bk.CheckIn < checkOut
                         && bk.CheckOut > checkIn)
            .GroupBy(bk => bk.RoomTypeId)
            .Select(g => new { RoomTypeId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.RoomTypeId, x => x.Count, ct);

        var seasonalRates = await _db.SeasonalRates.AsNoTracking()
            .Where(sr => typeIds.Contains(sr.RoomTypeId) && sr.IsActive
                         && sr.StartDate < checkOut && sr.EndDate >= checkIn)
            .ToListAsync(ct);

        var (vatRate, serviceRate) = await GetTaxRatesAsync(ct);
        var party = query.Adults + query.Children;

        var results = new List<AvailabilityDto>(roomTypes.Count);
        foreach (var rt in roomTypes)
        {
            var total = inventory.GetValueOrDefault(rt.Id, 0);
            var taken = booked.GetValueOrDefault(rt.Id, 0);
            var available = Math.Max(0, total - taken);

            var typeRates = seasonalRates.Where(sr => sr.RoomTypeId == rt.Id).ToList();
            decimal subtotal = 0;
            for (var night = checkIn; night < checkOut; night = night.AddDays(1))
            {
                subtotal += ResolveNightlyRate(rt, typeRates, night);
            }

            var tax = Math.Round(subtotal * (vatRate + serviceRate), 2, MidpointRounding.AwayFromZero);
            var nightly = Math.Round(subtotal / nights, 2, MidpointRounding.AwayFromZero);

            results.Add(new AvailabilityDto(
                rt.Id, rt.Slug, rt.Name, rt.HeroImageUrl,
                total, taken, available, nights,
                nightly, Math.Round(subtotal, 2), tax, Math.Round(subtotal + tax, 2),
                rt.MaxAdults, rt.MaxChildren,
                // The property states capacity as a plain headcount — "2 adults", "4 adults" —
                // not an adults-plus-children split, and MaxChildren is 0 on every category as a
                // result. Enforcing a separate children allowance against that data would reject
                // every party containing a child, from every room in the building.
                //
                // A child occupies a bed like anyone else, so the whole party is measured against
                // the room's total capacity instead. Two adults and a child need a category that
                // sleeps three.
                FitsParty: party <= rt.MaxAdults + rt.MaxChildren));
        }

        return Result<IReadOnlyList<AvailabilityDto>>.Success(results);
    }

    public async Task<decimal> GetNightlyRateAsync(int roomTypeId, DateTime night, CancellationToken ct = default)
    {
        var roomType = await _db.RoomTypes.AsNoTracking().FirstOrDefaultAsync(rt => rt.Id == roomTypeId, ct);
        if (roomType is null) return 0m;

        var rates = await _db.SeasonalRates.AsNoTracking()
            .Where(sr => sr.RoomTypeId == roomTypeId && sr.IsActive && sr.StartDate <= night && sr.EndDate >= night)
            .ToListAsync(ct);

        return ResolveNightlyRate(roomType, rates, night.Date);
    }

    /// <summary>Highest-priority seasonal range covering the night wins; otherwise the rack rate applies.</summary>
    private static decimal ResolveNightlyRate(RoomType roomType, IEnumerable<SeasonalRate> rates, DateTime night)
    {
        var match = rates
            .Where(sr => sr.StartDate.Date <= night && sr.EndDate.Date >= night)
            .OrderByDescending(sr => sr.Priority)
            .ThenByDescending(sr => sr.Id)
            .FirstOrDefault();

        return match?.NightlyRateEtb ?? roomType.BasePriceEtb;
    }

    private async Task<(decimal Vat, decimal Service)> GetTaxRatesAsync(CancellationToken ct)
    {
        var keys = new[] { "booking.vat_rate", "booking.service_charge_rate" };
        var settings = await _db.Settings.AsNoTracking()
            .Where(s => keys.Contains(s.Key))
            .ToDictionaryAsync(s => s.Key, s => s.Value, ct);

        return (ParseRate(settings, "booking.vat_rate", 0.15m),
                ParseRate(settings, "booking.service_charge_rate", 0.10m));
    }

    private static decimal ParseRate(IDictionary<string, string> settings, string key, decimal fallback) =>
        settings.TryGetValue(key, out var raw) && decimal.TryParse(raw, out var value) ? value : fallback;
}
