using TheRow.Application.Common;
using TheRow.Application.DTOs;
using TheRow.Domain.Entities;

namespace TheRow.Application.Common.Interfaces;

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

public interface IJwtTokenService
{
    (string Token, DateTime ExpiresAt) CreateToken(AppUser user);
}

public interface IAvailabilityService
{
    /// <summary>
    /// Availability and quoted price per room type for a stay. Room types the party does not
    /// fit into are still returned, flagged via <see cref="AvailabilityDto.FitsParty"/>, so the
    /// UI can explain why an option is unselectable rather than silently hiding it.
    /// </summary>
    Task<Result<IReadOnlyList<AvailabilityDto>>> GetAvailabilityAsync(AvailabilityQuery query, CancellationToken ct = default);

    /// <summary>Resolves the nightly rate for a room type on a given night, applying seasonal overrides.</summary>
    Task<decimal> GetNightlyRateAsync(int roomTypeId, DateTime night, CancellationToken ct = default);
}

public interface IBookingService
{
    Task<Result<BookingDto>> CreateAsync(CreateBookingRequest request, CancellationToken ct = default);
    Task<PagedResult<BookingDto>> SearchAsync(BookingFilter filter, CancellationToken ct = default);
    Task<BookingDto?> GetAsync(int id, CancellationToken ct = default);
    Task<BookingDto?> GetByReferenceAsync(string reference, CancellationToken ct = default);
    Task<Result<BookingDto>> UpdateStatusAsync(int id, UpdateBookingStatusRequest request, CancellationToken ct = default);
    Task<Result<BookingDto>> AssignRoomAsync(int id, int roomId, CancellationToken ct = default);
    Task<Result<BookingDto>> RecordPaymentAsync(int id, RecordPaymentRequest request, CancellationToken ct = default);
}

public interface IReportService
{
    Task<DashboardStatsDto> GetDashboardAsync(CancellationToken ct = default);
    Task<ReportsDto> GetReportsAsync(DateTime from, DateTime to, CancellationToken ct = default);
}

public interface IFileStorage
{
    Task<MediaAssetDto> SaveAsync(Stream content, string fileName, string contentType, string folder, string uploadedBy, CancellationToken ct = default);
    Task<bool> DeleteAsync(int mediaAssetId, CancellationToken ct = default);
}
