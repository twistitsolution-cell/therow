namespace TheRow.Application.DTOs;

public record AmenityDto(
    int Id,
    string Slug,
    string Name,
    string Description,
    string Icon,
    string Category,
    string ImageUrl,
    bool IsFeatured,
    int DisplayOrder);

public record RoomTypeImageDto(int Id, string Url, string Caption, int SortOrder);

public record RoomTypeDto(
    int Id,
    string Slug,
    string Name,
    string ShortDescription,
    string Description,
    decimal BasePriceEtb,
    int MaxAdults,
    int MaxChildren,
    int SizeSqm,
    string BedConfiguration,
    string HeroImageUrl,
    int DisplayOrder,
    bool IsActive,
    int TotalRooms,
    IReadOnlyList<RoomTypeImageDto> Images,
    IReadOnlyList<AmenityDto> Amenities);

public record RoomDto(
    int Id,
    string RoomNumber,
    int RoomTypeId,
    string RoomTypeName,
    int Floor,
    string Status,
    string Notes,
    bool IsActive);

public record SaveRoomTypeRequest(
    string Slug,
    string Name,
    string ShortDescription,
    string Description,
    decimal BasePriceEtb,
    int MaxAdults,
    int MaxChildren,
    int SizeSqm,
    string BedConfiguration,
    string HeroImageUrl,
    int DisplayOrder,
    bool IsActive,
    List<string>? ImageUrls,
    List<int>? AmenityIds);

public record SaveRoomRequest(
    string RoomNumber,
    int RoomTypeId,
    int Floor,
    string Status,
    string Notes,
    bool IsActive);

public record SaveAmenityRequest(
    string Slug,
    string Name,
    string Description,
    string Icon,
    string Category,
    string ImageUrl,
    bool IsFeatured,
    int DisplayOrder,
    bool IsActive);

/// <summary>Per-room-type availability and price for a specific stay.</summary>
public record AvailabilityDto(
    int RoomTypeId,
    string Slug,
    string Name,
    string HeroImageUrl,
    int TotalRooms,
    int BookedRooms,
    int AvailableRooms,
    int Nights,
    decimal NightlyRateEtb,
    decimal SubtotalEtb,
    decimal TaxEtb,
    decimal TotalEtb,
    int MaxAdults,
    int MaxChildren,
    bool FitsParty);

public record AvailabilityQuery(
    DateTime CheckIn,
    DateTime CheckOut,
    int Adults = 1,
    int Children = 0,
    int? RoomTypeId = null);
