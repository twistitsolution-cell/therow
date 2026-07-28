using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TheRow.Application.DTOs;
using TheRow.Domain.Entities;
using TheRow.Domain.Enums;
using TheRow.Infrastructure;
using TheRow.Infrastructure.Mapping;
using TheRow.Infrastructure.Persistence;

namespace TheRow.API.Controllers;

[ApiController]
[Route("api/amenities")]
[Authorize]
public class AmenitiesController : ControllerBase
{
    private readonly AppDbContext _db;

    public AmenitiesController(AppDbContext db) => _db = db;

    [HttpGet]
    [Authorize(Policy = Permissions.RoomsView)]
    public async Task<ActionResult<IReadOnlyList<AmenityDto>>> All(CancellationToken ct)
    {
        var amenities = await _db.Amenities.AsNoTracking()
            .OrderBy(a => a.Category).ThenBy(a => a.DisplayOrder).ToListAsync(ct);

        return Ok(amenities.Select(a => a.ToDto()).ToList());
    }

    [HttpPost]
    [Authorize(Policy = Permissions.RoomsWrite)]
    public async Task<ActionResult<AmenityDto>> Create(SaveAmenityRequest request, CancellationToken ct)
    {
        var slug = Slugify(request.Slug, request.Name);
        if (await _db.Amenities.AnyAsync(a => a.Slug == slug, ct))
            return BadRequest(new { message = $"An amenity with the slug '{slug}' already exists." });

        var amenity = new Amenity { Slug = slug };
        Apply(amenity, request);

        _db.Amenities.Add(amenity);
        await _db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(All), null, amenity.ToDto());
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Permissions.RoomsWrite)]
    public async Task<ActionResult<AmenityDto>> Update(int id, SaveAmenityRequest request, CancellationToken ct)
    {
        var amenity = await _db.Amenities.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (amenity is null) return NotFound(new { message = "Amenity not found." });

        var slug = Slugify(request.Slug, request.Name);
        if (await _db.Amenities.AnyAsync(a => a.Slug == slug && a.Id != id, ct))
            return BadRequest(new { message = $"An amenity with the slug '{slug}' already exists." });

        amenity.Slug = slug;
        Apply(amenity, request);

        await _db.SaveChangesAsync(ct);
        return Ok(amenity.ToDto());
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = Permissions.RoomsWrite)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var amenity = await _db.Amenities.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (amenity is null) return NotFound(new { message = "Amenity not found." });

        // The join rows cascade, so removing an amenity simply drops it from every room type.
        _db.Amenities.Remove(amenity);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Amenity deleted." });
    }

    private static void Apply(Amenity amenity, SaveAmenityRequest r)
    {
        amenity.Name = r.Name.Trim();
        amenity.Description = r.Description ?? string.Empty;
        amenity.Icon = r.Icon ?? string.Empty;
        amenity.ImageUrl = r.ImageUrl ?? string.Empty;
        amenity.IsFeatured = r.IsFeatured;
        amenity.DisplayOrder = r.DisplayOrder;
        amenity.IsActive = r.IsActive;
        if (Enum.TryParse<AmenityCategory>(r.Category, true, out var category)) amenity.Category = category;
    }

    private static string Slugify(string? slug, string name)
    {
        var source = string.IsNullOrWhiteSpace(slug) ? name : slug;
        var chars = source.Trim().ToLowerInvariant()
            .Select(c => char.IsLetterOrDigit(c) ? c : '-')
            .ToArray();

        return string.Join('-', new string(chars).Split('-', StringSplitOptions.RemoveEmptyEntries));
    }
}
