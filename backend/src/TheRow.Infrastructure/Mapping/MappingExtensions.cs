using TheRow.Application.DTOs;
using TheRow.Domain.Entities;

namespace TheRow.Infrastructure.Mapping;

/// <summary>
/// Hand-written entity to DTO projections. Deliberately not AutoMapper: the shapes are stable,
/// the mapping is explicit, and there is no reflection cost on hot booking/availability paths.
/// </summary>
public static class MappingExtensions
{
    public static AmenityDto ToDto(this Amenity a) => new(
        a.Id, a.Slug, a.Name, a.Description, a.Icon, a.Category.ToString(),
        a.ImageUrl, a.IsFeatured, a.DisplayOrder);

    public static RoomTypeImageDto ToDto(this RoomTypeImage i) => new(i.Id, i.Url, i.Caption, i.SortOrder);

    public static RoomTypeDto ToDto(this RoomType rt) => new(
        rt.Id, rt.Slug, rt.Name, rt.ShortDescription, rt.Description, rt.BasePriceEtb,
        rt.MaxAdults, rt.MaxChildren, rt.SizeSqm, rt.BedConfiguration, rt.HeroImageUrl,
        rt.DisplayOrder, rt.IsActive,
        rt.Rooms?.Count(r => r.IsActive) ?? 0,
        rt.Images?.OrderBy(i => i.SortOrder).Select(i => i.ToDto()).ToList() ?? new List<RoomTypeImageDto>(),
        rt.RoomTypeAmenities?
            .Where(x => x.Amenity is not null)
            .Select(x => x.Amenity!.ToDto())
            .OrderBy(x => x.DisplayOrder)
            .ToList() ?? new List<AmenityDto>());

    public static RoomDto ToDto(this Room r) => new(
        r.Id, r.RoomNumber, r.RoomTypeId, r.RoomType?.Name ?? string.Empty,
        r.Floor, r.Status.ToString(), r.Notes, r.IsActive);

    public static PaymentDto ToDto(this Payment p) => new(
        p.Id, p.Provider.ToString(), p.AmountEtb, p.Status.ToString(), p.Reference, p.PaidAt, p.Notes);

    public static BookingDto ToDto(this Booking b) => new(
        b.Id, b.Reference, b.RoomTypeId, b.RoomType?.Name ?? string.Empty, b.RoomId, b.Room?.RoomNumber,
        b.GuestFirstName, b.GuestLastName, b.GuestEmail, b.GuestPhone, b.GuestCountry,
        b.CheckIn, b.CheckOut, b.Adults, b.Children, b.Nights,
        b.NightlyRateEtb, b.SubtotalEtb, b.TaxEtb, b.TotalEtb, b.DisplayCurrency,
        b.SpecialRequests, b.Status.ToString(), b.PaymentStatus.ToString(), b.Source.ToString(),
        b.CreatedAt,
        b.Payments?.OrderByDescending(p => p.CreatedAt).Select(p => p.ToDto()).ToList() ?? new List<PaymentDto>());

    public static HeroSlideDto ToDto(this HeroSlide h) => new(
        h.Id, h.Eyebrow, h.Title, h.Subtitle, h.ImageUrl, h.VideoUrl, h.CtaLabel, h.CtaUrl, h.SortOrder, h.IsActive);

    public static TestimonialDto ToDto(this Testimonial t) => new(
        t.Id, t.GuestName, t.Country, t.Quote, t.Rating, t.AvatarUrl, t.IsPublished, t.DisplayOrder);

    public static ContentBlockDto ToDto(this ContentBlock c) => new(
        c.Id, c.PageKey, c.SectionKey, c.Title, c.Subtitle, c.Body, c.ImageUrl, c.MetadataJson, c.SortOrder, c.IsActive);

    public static MediaAssetDto ToDto(this MediaAsset m) => new(
        m.Id, m.FileName, m.Url, m.Folder, m.ContentType, m.SizeBytes, m.AltText, m.CreatedAt);

    public static ContactMessageDto ToDto(this ContactMessage m) => new(
        m.Id, m.Name, m.Email, m.Phone, m.Subject, m.Message, m.IsRead, m.CreatedAt);

    public static AuthUserDto ToAuthDto(this AppUser u) => new(
        u.Id, u.Email, u.FullName, u.Phone, u.Role?.Name ?? string.Empty,
        u.Role?.PermissionList.ToList() ?? new List<string>(), u.IsActive, u.LastLoginAt);

    public static RoleDto ToDto(this AppRole r) => new(
        r.Id, r.Name, r.Description, r.PermissionList.ToList(), r.IsSystem, r.Users?.Count ?? 0);
}
