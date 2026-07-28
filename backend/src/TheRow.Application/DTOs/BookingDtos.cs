namespace TheRow.Application.DTOs;

public record PaymentDto(
    int Id,
    string Provider,
    decimal AmountEtb,
    string Status,
    string Reference,
    DateTime? PaidAt,
    string Notes);

public record BookingDto(
    int Id,
    string Reference,
    int RoomTypeId,
    string RoomTypeName,
    int? RoomId,
    string? RoomNumber,
    string GuestFirstName,
    string GuestLastName,
    string GuestEmail,
    string GuestPhone,
    string GuestCountry,
    DateTime CheckIn,
    DateTime CheckOut,
    int Adults,
    int Children,
    int Nights,
    decimal NightlyRateEtb,
    decimal SubtotalEtb,
    decimal TaxEtb,
    decimal TotalEtb,
    string DisplayCurrency,
    string SpecialRequests,
    string Status,
    string PaymentStatus,
    string Source,
    DateTime CreatedAt,
    IReadOnlyList<PaymentDto> Payments);

/// <summary>Public booking submission. Rates are recalculated server-side — never trusted from the client.</summary>
public record CreateBookingRequest(
    int RoomTypeId,
    string GuestFirstName,
    string GuestLastName,
    string GuestEmail,
    string GuestPhone,
    string GuestCountry,
    DateTime CheckIn,
    DateTime CheckOut,
    int Adults,
    int Children,
    string SpecialRequests,
    string DisplayCurrency = "ETB",
    string PaymentProvider = "Cash");

public record UpdateBookingStatusRequest(string Status, string? Reason);

public record AssignRoomRequest(int RoomId);

public record RecordPaymentRequest(
    string Provider,
    decimal AmountEtb,
    string Reference,
    string Status,
    string Notes);

public record BookingFilter(
    string? Search = null,
    string? Status = null,
    string? PaymentStatus = null,
    DateTime? From = null,
    DateTime? To = null,
    int Page = 1,
    int PageSize = 20);
