using TheRow.Domain.Common;

namespace TheRow.Domain.Entities;

/// <summary>A homepage hero slide. Supports either a still image or a looping background video.</summary>
public class HeroSlide : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Eyebrow { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public string CtaLabel { get; set; } = string.Empty;
    public string CtaUrl { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public class Testimonial : BaseEntity
{
    public string GuestName { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Quote { get; set; } = string.Empty;
    public int Rating { get; set; } = 5;
    public string AvatarUrl { get; set; } = string.Empty;
    public bool IsPublished { get; set; } = true;
    public int DisplayOrder { get; set; }
}

/// <summary>
/// Generic CMS block keyed by page + section, so marketing can edit copy without a deploy.
/// Example: PageKey="home", SectionKey="intro".
/// </summary>
public class ContentBlock : BaseEntity
{
    public string PageKey { get; set; } = string.Empty;
    public string SectionKey { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;

    /// <summary>Free-form JSON for section-specific fields (stats, list items, etc.).</summary>
    public string MetadataJson { get; set; } = "{}";

    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>An uploaded file tracked by the media manager.</summary>
public class MediaAsset : BaseEntity
{
    public string FileName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Folder { get; set; } = "general";
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string AltText { get; set; } = string.Empty;
    public string UploadedBy { get; set; } = string.Empty;
}

public class ContactMessage : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
}

/// <summary>Key/value site configuration (exchange rate, contact details, map coordinates).</summary>
public class Setting : BaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
