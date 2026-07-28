using TheRow.Domain.Common;
using TheRow.Domain.Enums;

namespace TheRow.Domain.Entities;

/// <summary>
/// A reservation for one room type across a date range. Money is stored in ETB
/// (the property's book currency); <see cref="DisplayCurrency"/> only records what the
/// guest was quoted in so confirmations can be reprinted faithfully.
/// </summary>
public class Booking : BaseEntity
{
    /// <summary>Human-facing confirmation code, e.g. "TR-8F3K2A".</summary>
    public string Reference { get; set; } = string.Empty;

    public int RoomTypeId { get; set; }
    public RoomType? RoomType { get; set; }

    /// <summary>Assigned at check-in; null while the booking is only held against a category.</summary>
    public int? RoomId { get; set; }
    public Room? Room { get; set; }

    public string GuestFirstName { get; set; } = string.Empty;
    public string GuestLastName { get; set; } = string.Empty;
    public string GuestEmail { get; set; } = string.Empty;
    public string GuestPhone { get; set; } = string.Empty;
    public string GuestCountry { get; set; } = string.Empty;

    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public int Adults { get; set; } = 1;
    public int Children { get; set; }

    public int Nights { get; set; }
    public decimal NightlyRateEtb { get; set; }
    public decimal SubtotalEtb { get; set; }
    public decimal TaxEtb { get; set; }
    public decimal TotalEtb { get; set; }

    public string DisplayCurrency { get; set; } = "ETB";
    public decimal ExchangeRateUsed { get; set; } = 1m;

    public string SpecialRequests { get; set; } = string.Empty;
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Unpaid;
    public BookingSource Source { get; set; } = BookingSource.Website;

    public DateTime? CancelledAt { get; set; }
    public string CancellationReason { get; set; } = string.Empty;

    public ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public string GuestFullName => $"{GuestFirstName} {GuestLastName}".Trim();
}

public class Payment : BaseEntity
{
    public int BookingId { get; set; }
    public Booking? Booking { get; set; }

    public PaymentProvider Provider { get; set; }
    public decimal AmountEtb { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Unpaid;

    /// <summary>Gateway transaction id / bank slip number.</summary>
    public string Reference { get; set; } = string.Empty;

    public DateTime? PaidAt { get; set; }
    public string Notes { get; set; } = string.Empty;
}
