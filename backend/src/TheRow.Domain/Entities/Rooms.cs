using TheRow.Domain.Common;
using TheRow.Domain.Enums;

namespace TheRow.Domain.Entities;

/// <summary>
/// A sellable room category (Standard, Twin, Family, Junior Suite, Apartment).
/// Inventory is tracked per <see cref="Room"/>; pricing and marketing copy live here.
/// </summary>
public class RoomType : BaseEntity
{
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    /// <summary>Rack rate per night in ETB. Seasonal overrides live in <see cref="SeasonalRate"/>.</summary>
    public decimal BasePriceEtb { get; set; }

    public int MaxAdults { get; set; } = 2;
    public int MaxChildren { get; set; }
    public int SizeSqm { get; set; }
    public string BedConfiguration { get; set; } = string.Empty;
    public string HeroImageUrl { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<RoomTypeImage> Images { get; set; } = new List<RoomTypeImage>();
    public ICollection<RoomTypeAmenity> RoomTypeAmenities { get; set; } = new List<RoomTypeAmenity>();
    public ICollection<Room> Rooms { get; set; } = new List<Room>();
    public ICollection<SeasonalRate> SeasonalRates { get; set; } = new List<SeasonalRate>();
}

public class RoomTypeImage : BaseEntity
{
    public int RoomTypeId { get; set; }
    public RoomType? RoomType { get; set; }

    public string Url { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

/// <summary>A physical, numbered room. The unit of availability.</summary>
public class Room : BaseEntity
{
    public string RoomNumber { get; set; } = string.Empty;
    public int RoomTypeId { get; set; }
    public RoomType? RoomType { get; set; }

    public int Floor { get; set; }
    public RoomStatus Status { get; set; } = RoomStatus.Available;
    public string Notes { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public class RoomTypeAmenity
{
    public int RoomTypeId { get; set; }
    public RoomType? RoomType { get; set; }

    public int AmenityId { get; set; }
    public Amenity? Amenity { get; set; }
}

/// <summary>
/// Date-ranged price override. The highest <see cref="Priority"/> range covering a night wins;
/// nights with no matching range fall back to <see cref="RoomType.BasePriceEtb"/>.
/// </summary>
public class SeasonalRate : BaseEntity
{
    public int RoomTypeId { get; set; }
    public RoomType? RoomType { get; set; }

    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal NightlyRateEtb { get; set; }
    public int Priority { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>A facility or in-room feature, surfaced on the website and filterable in admin.</summary>
public class Amenity : BaseEntity
{
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    /// <summary>Lucide icon key rendered by the frontend (e.g. "wifi", "dumbbell").</summary>
    public string Icon { get; set; } = string.Empty;

    public AmenityCategory Category { get; set; }
    public string ImageUrl { get; set; } = string.Empty;

    /// <summary>Featured amenities appear in the homepage experience grid.</summary>
    public bool IsFeatured { get; set; }

    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<RoomTypeAmenity> RoomTypeAmenities { get; set; } = new List<RoomTypeAmenity>();
}
