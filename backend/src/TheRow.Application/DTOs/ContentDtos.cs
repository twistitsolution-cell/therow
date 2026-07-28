namespace TheRow.Application.DTOs;

public record HeroSlideDto(
    int Id,
    string Eyebrow,
    string Title,
    string Subtitle,
    string ImageUrl,
    string VideoUrl,
    string CtaLabel,
    string CtaUrl,
    int SortOrder,
    bool IsActive);

public record TestimonialDto(
    int Id,
    string GuestName,
    string Country,
    string Quote,
    int Rating,
    string AvatarUrl,
    bool IsPublished,
    int DisplayOrder);

public record ContentBlockDto(
    int Id,
    string PageKey,
    string SectionKey,
    string Title,
    string Subtitle,
    string Body,
    string ImageUrl,
    string MetadataJson,
    int SortOrder,
    bool IsActive);

public record MediaAssetDto(
    int Id,
    string FileName,
    string Url,
    string Folder,
    string ContentType,
    long SizeBytes,
    string AltText,
    DateTime CreatedAt);

public record ContactMessageDto(
    int Id,
    string Name,
    string Email,
    string Phone,
    string Subject,
    string Message,
    bool IsRead,
    DateTime CreatedAt);

public record CreateContactMessageRequest(
    string Name,
    string Email,
    string Phone,
    string Subject,
    string Message);

public record SettingDto(string Key, string Value, string Description);

/// <summary>Everything the public homepage needs, in one round trip.</summary>
public record SiteContentDto(
    IReadOnlyList<HeroSlideDto> HeroSlides,
    IReadOnlyList<TestimonialDto> Testimonials,
    IReadOnlyList<ContentBlockDto> Blocks,
    IReadOnlyList<AmenityDto> FeaturedAmenities,
    IReadOnlyList<RoomTypeDto> RoomTypes,
    IReadOnlyDictionary<string, string> Settings);
