using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TheRow.Application.DTOs;
using TheRow.Domain.Entities;
using TheRow.Infrastructure;
using TheRow.Infrastructure.Mapping;
using TheRow.Infrastructure.Persistence;

namespace TheRow.API.Controllers;

/// <summary>CMS surface: hero slides, testimonials, page copy, settings and the contact inbox.</summary>
[ApiController]
[Route("api/content")]
[Authorize]
public class ContentController : ControllerBase
{
    private readonly AppDbContext _db;

    public ContentController(AppDbContext db) => _db = db;

    // ---------- Hero slides ----------

    [HttpGet("hero-slides")]
    [Authorize(Policy = Permissions.ContentView)]
    public async Task<ActionResult<IReadOnlyList<HeroSlideDto>>> HeroSlides(CancellationToken ct)
    {
        var slides = await _db.HeroSlides.AsNoTracking().OrderBy(h => h.SortOrder).ToListAsync(ct);
        return Ok(slides.Select(s => s.ToDto()).ToList());
    }

    [HttpPost("hero-slides")]
    [Authorize(Policy = Permissions.ContentWrite)]
    public async Task<ActionResult<HeroSlideDto>> CreateHeroSlide(HeroSlideDto request, CancellationToken ct)
    {
        var slide = new HeroSlide();
        ApplySlide(slide, request);

        _db.HeroSlides.Add(slide);
        await _db.SaveChangesAsync(ct);
        return Ok(slide.ToDto());
    }

    [HttpPut("hero-slides/{id:int}")]
    [Authorize(Policy = Permissions.ContentWrite)]
    public async Task<ActionResult<HeroSlideDto>> UpdateHeroSlide(int id, HeroSlideDto request, CancellationToken ct)
    {
        var slide = await _db.HeroSlides.FirstOrDefaultAsync(h => h.Id == id, ct);
        if (slide is null) return NotFound(new { message = "Slide not found." });

        ApplySlide(slide, request);
        await _db.SaveChangesAsync(ct);
        return Ok(slide.ToDto());
    }

    [HttpDelete("hero-slides/{id:int}")]
    [Authorize(Policy = Permissions.ContentWrite)]
    public async Task<IActionResult> DeleteHeroSlide(int id, CancellationToken ct)
        => await RemoveAsync(_db.HeroSlides, id, "Slide", ct);

    // ---------- Testimonials ----------

    [HttpGet("testimonials")]
    [Authorize(Policy = Permissions.ContentView)]
    public async Task<ActionResult<IReadOnlyList<TestimonialDto>>> Testimonials(CancellationToken ct)
    {
        var items = await _db.Testimonials.AsNoTracking().OrderBy(t => t.DisplayOrder).ToListAsync(ct);
        return Ok(items.Select(t => t.ToDto()).ToList());
    }

    [HttpPost("testimonials")]
    [Authorize(Policy = Permissions.ContentWrite)]
    public async Task<ActionResult<TestimonialDto>> CreateTestimonial(TestimonialDto request, CancellationToken ct)
    {
        var testimonial = new Testimonial();
        ApplyTestimonial(testimonial, request);

        _db.Testimonials.Add(testimonial);
        await _db.SaveChangesAsync(ct);
        return Ok(testimonial.ToDto());
    }

    [HttpPut("testimonials/{id:int}")]
    [Authorize(Policy = Permissions.ContentWrite)]
    public async Task<ActionResult<TestimonialDto>> UpdateTestimonial(int id, TestimonialDto request, CancellationToken ct)
    {
        var testimonial = await _db.Testimonials.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (testimonial is null) return NotFound(new { message = "Testimonial not found." });

        ApplyTestimonial(testimonial, request);
        await _db.SaveChangesAsync(ct);
        return Ok(testimonial.ToDto());
    }

    [HttpDelete("testimonials/{id:int}")]
    [Authorize(Policy = Permissions.ContentWrite)]
    public async Task<IActionResult> DeleteTestimonial(int id, CancellationToken ct)
        => await RemoveAsync(_db.Testimonials, id, "Testimonial", ct);

    // ---------- Page blocks ----------

    [HttpGet("blocks")]
    [Authorize(Policy = Permissions.ContentView)]
    public async Task<ActionResult<IReadOnlyList<ContentBlockDto>>> Blocks([FromQuery] string? pageKey, CancellationToken ct)
    {
        var query = _db.ContentBlocks.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(pageKey)) query = query.Where(c => c.PageKey == pageKey);

        var blocks = await query.OrderBy(c => c.PageKey).ThenBy(c => c.SortOrder).ToListAsync(ct);
        return Ok(blocks.Select(b => b.ToDto()).ToList());
    }

    /// <summary>Upsert by (pageKey, sectionKey) so the editor never has to care whether a block exists yet.</summary>
    [HttpPut("blocks")]
    [Authorize(Policy = Permissions.ContentWrite)]
    public async Task<ActionResult<ContentBlockDto>> SaveBlock(ContentBlockDto request, CancellationToken ct)
    {
        var block = await _db.ContentBlocks
            .FirstOrDefaultAsync(c => c.PageKey == request.PageKey && c.SectionKey == request.SectionKey, ct);

        if (block is null)
        {
            block = new ContentBlock { PageKey = request.PageKey, SectionKey = request.SectionKey };
            _db.ContentBlocks.Add(block);
        }

        block.Title = request.Title ?? string.Empty;
        block.Subtitle = request.Subtitle ?? string.Empty;
        block.Body = request.Body ?? string.Empty;
        block.ImageUrl = request.ImageUrl ?? string.Empty;
        block.MetadataJson = string.IsNullOrWhiteSpace(request.MetadataJson) ? "{}" : request.MetadataJson;
        block.SortOrder = request.SortOrder;
        block.IsActive = request.IsActive;

        await _db.SaveChangesAsync(ct);
        return Ok(block.ToDto());
    }

    [HttpDelete("blocks/{id:int}")]
    [Authorize(Policy = Permissions.ContentWrite)]
    public async Task<IActionResult> DeleteBlock(int id, CancellationToken ct)
        => await RemoveAsync(_db.ContentBlocks, id, "Block", ct);

    // ---------- Settings ----------

    [HttpGet("settings")]
    [Authorize(Policy = Permissions.ContentView)]
    public async Task<ActionResult<IReadOnlyList<SettingDto>>> Settings(CancellationToken ct)
    {
        var settings = await _db.Settings.AsNoTracking().OrderBy(s => s.Key).ToListAsync(ct);
        return Ok(settings.Select(s => new SettingDto(s.Key, s.Value, s.Description)).ToList());
    }

    [HttpPut("settings")]
    [Authorize(Policy = Permissions.SettingsWrite)]
    public async Task<IActionResult> SaveSettings(List<SettingDto> request, CancellationToken ct)
    {
        foreach (var item in request)
        {
            var setting = await _db.Settings.FirstOrDefaultAsync(s => s.Key == item.Key, ct);
            if (setting is null)
            {
                _db.Settings.Add(new Setting { Key = item.Key, Value = item.Value ?? string.Empty, Description = item.Description ?? string.Empty });
            }
            else
            {
                setting.Value = item.Value ?? string.Empty;
                if (!string.IsNullOrWhiteSpace(item.Description)) setting.Description = item.Description;
            }
        }

        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Settings saved." });
    }

    // ---------- Contact inbox ----------

    [HttpGet("messages")]
    [Authorize(Policy = Permissions.ContentView)]
    public async Task<ActionResult<IReadOnlyList<ContactMessageDto>>> Messages(CancellationToken ct)
    {
        var messages = await _db.ContactMessages.AsNoTracking()
            .OrderByDescending(m => m.CreatedAt).Take(500).ToListAsync(ct);

        return Ok(messages.Select(m => m.ToDto()).ToList());
    }

    [HttpPut("messages/{id:int}/read")]
    [Authorize(Policy = Permissions.ContentWrite)]
    public async Task<IActionResult> MarkRead(int id, CancellationToken ct)
    {
        var message = await _db.ContactMessages.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (message is null) return NotFound(new { message = "Message not found." });

        message.IsRead = true;
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Marked as read." });
    }

    [HttpDelete("messages/{id:int}")]
    [Authorize(Policy = Permissions.ContentWrite)]
    public async Task<IActionResult> DeleteMessage(int id, CancellationToken ct)
        => await RemoveAsync(_db.ContactMessages, id, "Message", ct);

    // ---------- helpers ----------

    private async Task<IActionResult> RemoveAsync<T>(DbSet<T> set, int id, string label, CancellationToken ct)
        where T : Domain.Common.BaseEntity
    {
        var entity = await set.FirstOrDefaultAsync(e => e.Id == id, ct);
        if (entity is null) return NotFound(new { message = $"{label} not found." });

        set.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = $"{label} deleted." });
    }

    private static void ApplySlide(HeroSlide slide, HeroSlideDto r)
    {
        slide.Eyebrow = r.Eyebrow ?? string.Empty;
        slide.Title = r.Title ?? string.Empty;
        slide.Subtitle = r.Subtitle ?? string.Empty;
        slide.ImageUrl = r.ImageUrl ?? string.Empty;
        slide.VideoUrl = r.VideoUrl ?? string.Empty;
        slide.CtaLabel = r.CtaLabel ?? string.Empty;
        slide.CtaUrl = r.CtaUrl ?? string.Empty;
        slide.SortOrder = r.SortOrder;
        slide.IsActive = r.IsActive;
    }

    private static void ApplyTestimonial(Testimonial testimonial, TestimonialDto r)
    {
        testimonial.GuestName = r.GuestName ?? string.Empty;
        testimonial.Country = r.Country ?? string.Empty;
        testimonial.Quote = r.Quote ?? string.Empty;
        testimonial.Rating = Math.Clamp(r.Rating, 1, 5);
        testimonial.AvatarUrl = r.AvatarUrl ?? string.Empty;
        testimonial.IsPublished = r.IsPublished;
        testimonial.DisplayOrder = r.DisplayOrder;
    }
}
