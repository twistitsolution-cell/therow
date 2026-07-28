using Microsoft.EntityFrameworkCore;
using TheRow.Application.Common.Interfaces;
using TheRow.Application.DTOs;
using TheRow.Domain.Enums;
using TheRow.Infrastructure.Persistence;

namespace TheRow.Infrastructure.Services;

public class ReportService : IReportService
{
    /// <summary>Revenue is recognised for stays that were honoured, not merely requested.</summary>
    private static readonly BookingStatus[] RevenueStatuses =
    {
        BookingStatus.Confirmed, BookingStatus.CheckedIn, BookingStatus.CheckedOut
    };

    private readonly AppDbContext _db;

    public ReportService(AppDbContext db) => _db = db;

    public async Task<DashboardStatsDto> GetDashboardAsync(CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1);

        var bookings = _db.Bookings.AsNoTracking();
        var revenueBookings = bookings.Where(b => RevenueStatuses.Contains(b.Status));

        var totalRooms = await _db.Rooms.CountAsync(r => r.IsActive && r.Status != RoomStatus.OutOfService, ct);

        var occupiedRooms = await bookings.CountAsync(b =>
            AvailabilityService.BlockingStatuses.Contains(b.Status) &&
            b.CheckIn <= today && b.CheckOut > today, ct);

        var revenueTotal = await revenueBookings.SumAsync(b => (decimal?)b.TotalEtb, ct) ?? 0m;
        var revenueMonth = await revenueBookings
            .Where(b => b.CreatedAt >= monthStart)
            .SumAsync(b => (decimal?)b.TotalEtb, ct) ?? 0m;

        var collected = await _db.Payments.AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Paid)
            .SumAsync(p => (decimal?)p.AmountEtb, ct) ?? 0m;

        var roomNights = await revenueBookings.SumAsync(b => (int?)b.Nights, ct) ?? 0;

        return new DashboardStatsDto(
            TotalBookings: await bookings.CountAsync(ct),
            BookingsThisMonth: await bookings.CountAsync(b => b.CreatedAt >= monthStart, ct),
            PendingBookings: await bookings.CountAsync(b => b.Status == BookingStatus.Pending, ct),
            ArrivalsToday: await bookings.CountAsync(b => b.CheckIn == today && b.Status != BookingStatus.Cancelled, ct),
            DeparturesToday: await bookings.CountAsync(b => b.CheckOut == today && b.Status != BookingStatus.Cancelled, ct),
            InHouseGuests: await bookings
                .Where(b => b.Status == BookingStatus.CheckedIn)
                .SumAsync(b => (int?)(b.Adults + b.Children), ct) ?? 0,
            RevenueThisMonthEtb: revenueMonth,
            RevenueTotalEtb: revenueTotal,
            OutstandingBalanceEtb: Math.Max(0, revenueTotal - collected),
            OccupancyRatePercent: Percent(occupiedRooms, totalRooms),
            TotalRooms: totalRooms,
            OccupiedRooms: occupiedRooms,
            AverageDailyRateEtb: roomNights == 0 ? 0m : Math.Round(revenueTotal / roomNights, 2));
    }

    public async Task<ReportsDto> GetReportsAsync(DateTime from, DateTime to, CancellationToken ct = default)
    {
        var start = from.Date;
        var end = to.Date;
        if (end < start) (start, end) = (end, start);

        var totalRooms = await _db.Rooms.CountAsync(r => r.IsActive && r.Status != RoomStatus.OutOfService, ct);

        var inRange = await _db.Bookings.AsNoTracking()
            .Include(b => b.RoomType)
            .Where(b => RevenueStatuses.Contains(b.Status) && b.CheckIn < end.AddDays(1) && b.CheckOut > start)
            .ToListAsync(ct);

        // Grouped by the month the guest arrives, not the month the booking was taken — the range
        // filter above selects stays, so grouping by CreatedAt would bucket the same rows by an
        // unrelated date and make the trend disagree with its own filter.
        var revenueTrend = inRange
            .GroupBy(b => new { b.CheckIn.Year, b.CheckIn.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new RevenuePointDto(
                $"{g.Key.Year}-{g.Key.Month:D2}",
                g.Sum(b => b.TotalEtb),
                g.Count()))
            .ToList();

        var totalNightsInRange = Math.Max(1, (end - start).Days + 1);
        var roomTypePerformance = inRange
            .GroupBy(b => new { b.RoomTypeId, Name = b.RoomType?.Name ?? "Unknown" })
            .Select(g =>
            {
                var nights = g.Sum(b => b.Nights);
                var capacity = totalRooms * totalNightsInRange;
                return new RoomTypePerformanceDto(
                    g.Key.RoomTypeId, g.Key.Name, g.Count(), nights,
                    g.Sum(b => b.TotalEtb), Percent(nights, capacity));
            })
            .OrderByDescending(x => x.RevenueEtb)
            .ToList();

        // Walk the calendar so gaps show as genuine zero-occupancy days rather than disappearing.
        var occupancyTrend = new List<OccupancyPointDto>();
        for (var day = start; day <= end; day = day.AddDays(1))
        {
            var sold = inRange.Count(b => b.CheckIn <= day && b.CheckOut > day);
            occupancyTrend.Add(new OccupancyPointDto(day, sold, totalRooms, Percent(sold, totalRooms)));
        }

        var sourceMix = inRange
            .GroupBy(b => b.Source)
            .Select(g => new BookingSourceSliceDto(g.Key.ToString(), g.Count(), g.Sum(b => b.TotalEtb)))
            .OrderByDescending(x => x.Bookings)
            .ToList();

        return new ReportsDto(revenueTrend, roomTypePerformance, occupancyTrend, sourceMix);
    }

    private static double Percent(int numerator, int denominator) =>
        denominator <= 0 ? 0 : Math.Round(numerator * 100.0 / denominator, 1);
}
