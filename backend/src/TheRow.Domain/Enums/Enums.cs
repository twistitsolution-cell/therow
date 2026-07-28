namespace TheRow.Domain.Enums;

/// <summary>Physical state of an individual room, independent of any booking.</summary>
public enum RoomStatus
{
    Available = 0,
    Occupied = 1,
    Maintenance = 2,
    OutOfService = 3
}

/// <summary>Lifecycle of a reservation.</summary>
public enum BookingStatus
{
    Pending = 0,
    Confirmed = 1,
    CheckedIn = 2,
    CheckedOut = 3,
    Cancelled = 4,
    NoShow = 5
}

public enum PaymentStatus
{
    Unpaid = 0,
    PartiallyPaid = 1,
    Paid = 2,
    Refunded = 3,
    Failed = 4
}

/// <summary>
/// Gateways the property accepts. Telebirr and CBE Birr are the dominant local rails;
/// Stripe is wired as the international placeholder.
/// </summary>
public enum PaymentProvider
{
    Cash = 0,
    Telebirr = 1,
    CbeBirr = 2,
    BankTransfer = 3,
    Stripe = 4
}

/// <summary>Groups amenities so the website can render them in the right section.</summary>
public enum AmenityCategory
{
    Room = 0,
    Hotel = 1,
    Wellness = 2,
    Dining = 3,
    Business = 4,
    Transport = 5
}

public enum BookingSource
{
    Website = 0,
    Phone = 1,
    WalkIn = 2,
    BookingCom = 3,
    Agent = 4
}
