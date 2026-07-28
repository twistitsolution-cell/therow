namespace TheRow.Application.DTOs;

public record DashboardStatsDto(
    int TotalBookings,
    int BookingsThisMonth,
    int PendingBookings,
    int ArrivalsToday,
    int DeparturesToday,
    int InHouseGuests,
    decimal RevenueThisMonthEtb,
    decimal RevenueTotalEtb,
    decimal OutstandingBalanceEtb,
    double OccupancyRatePercent,
    int TotalRooms,
    int OccupiedRooms,
    decimal AverageDailyRateEtb);

public record RevenuePointDto(string Period, decimal RevenueEtb, int Bookings);

public record RoomTypePerformanceDto(
    int RoomTypeId,
    string Name,
    int Bookings,
    int RoomNights,
    decimal RevenueEtb,
    double OccupancyRatePercent);

public record OccupancyPointDto(DateTime Date, int RoomsSold, int RoomsAvailable, double OccupancyRatePercent);

public record BookingSourceSliceDto(string Source, int Bookings, decimal RevenueEtb);

public record ReportsDto(
    IReadOnlyList<RevenuePointDto> RevenueTrend,
    IReadOnlyList<RoomTypePerformanceDto> RoomTypePerformance,
    IReadOnlyList<OccupancyPointDto> OccupancyTrend,
    IReadOnlyList<BookingSourceSliceDto> SourceMix);
