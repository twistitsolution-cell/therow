using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TheRow.Application.DTOs;
using TheRow.Domain.Entities;
using TheRow.Infrastructure;
using TheRow.Infrastructure.Mapping;
using TheRow.Infrastructure.Persistence;

namespace TheRow.API.Controllers;

[ApiController]
[Route("api/room-types")]
[Authorize]
public class RoomTypesController : ControllerBase
{
    private readonly AppDbContext _db;

    public RoomTypesController(AppDbContext db) => _db = db;

    [HttpGet]
    [Authorize(Policy = Permissions.RoomsView)]
    public async Task<ActionResult<IReadOnlyList<RoomTypeDto>>> All(CancellationToken ct)
    {
        var roomTypes = await Query().OrderBy(rt => rt.DisplayOrder).ToListAsync(ct);
        return Ok(roomTypes.Select(rt => rt.ToDto()).ToList());
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = Permissions.RoomsView)]
    public async Task<ActionResult<RoomTypeDto>> Get(int id, CancellationToken ct)
    {
        var roomType = await Query().FirstOrDefaultAsync(rt => rt.Id == id, ct);
        return roomType is null ? NotFound(new { message = "Room type not found." }) : Ok(roomType.ToDto());
    }

    [HttpPost]
    [Authorize(Policy = Permissions.RoomsWrite)]
    public async Task<ActionResult<RoomTypeDto>> Create(SaveRoomTypeRequest request, CancellationToken ct)
    {
        var slug = Slugify(request.Slug, request.Name);
        if (await _db.RoomTypes.AnyAsync(rt => rt.Slug == slug, ct))
            return BadRequest(new { message = $"A room type with the slug '{slug}' already exists." });

        var roomType = new RoomType { Slug = slug };
        Apply(roomType, request);
        ReplaceImages(roomType, request.ImageUrls);
        ReplaceAmenities(roomType, request.AmenityIds);

        _db.RoomTypes.Add(roomType);
        await _db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(Get), new { id = roomType.Id }, (await Query().FirstAsync(rt => rt.Id == roomType.Id, ct)).ToDto());
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Permissions.RoomsWrite)]
    public async Task<ActionResult<RoomTypeDto>> Update(int id, SaveRoomTypeRequest request, CancellationToken ct)
    {
        var roomType = await _db.RoomTypes
            .Include(rt => rt.Images)
            .Include(rt => rt.RoomTypeAmenities)
            .FirstOrDefaultAsync(rt => rt.Id == id, ct);

        if (roomType is null) return NotFound(new { message = "Room type not found." });

        var slug = Slugify(request.Slug, request.Name);
        if (await _db.RoomTypes.AnyAsync(rt => rt.Slug == slug && rt.Id != id, ct))
            return BadRequest(new { message = $"A room type with the slug '{slug}' already exists." });

        roomType.Slug = slug;
        Apply(roomType, request);
        ReplaceImages(roomType, request.ImageUrls);
        ReplaceAmenities(roomType, request.AmenityIds);

        await _db.SaveChangesAsync(ct);
        return Ok((await Query().FirstAsync(rt => rt.Id == id, ct)).ToDto());
    }

    /// <summary>
    /// Deactivates rather than deletes when rooms or bookings reference the type, so historical
    /// reservations keep their category name.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = Permissions.RoomsWrite)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var roomType = await _db.RoomTypes.FirstOrDefaultAsync(rt => rt.Id == id, ct);
        if (roomType is null) return NotFound(new { message = "Room type not found." });

        var inUse = await _db.Rooms.AnyAsync(r => r.RoomTypeId == id, ct)
                    || await _db.Bookings.AnyAsync(b => b.RoomTypeId == id, ct);

        if (inUse)
        {
            roomType.IsActive = false;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Room type has rooms or bookings attached, so it was deactivated instead of deleted." });
        }

        _db.RoomTypes.Remove(roomType);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Room type deleted." });
    }

    private IQueryable<RoomType> Query() => _db.RoomTypes.AsNoTracking()
        .Include(rt => rt.Images)
        .Include(rt => rt.Rooms)
        .Include(rt => rt.RoomTypeAmenities).ThenInclude(rta => rta.Amenity);

    private static void Apply(RoomType roomType, SaveRoomTypeRequest r)
    {
        roomType.Name = r.Name.Trim();
        roomType.ShortDescription = r.ShortDescription ?? string.Empty;
        roomType.Description = r.Description ?? string.Empty;
        roomType.BasePriceEtb = r.BasePriceEtb;
        roomType.MaxAdults = Math.Max(1, r.MaxAdults);
        roomType.MaxChildren = Math.Max(0, r.MaxChildren);
        roomType.SizeSqm = r.SizeSqm;
        roomType.BedConfiguration = r.BedConfiguration ?? string.Empty;
        roomType.HeroImageUrl = r.HeroImageUrl ?? string.Empty;
        roomType.DisplayOrder = r.DisplayOrder;
        roomType.IsActive = r.IsActive;
    }

    private void ReplaceImages(RoomType roomType, List<string>? urls)
    {
        if (urls is null) return;

        _db.RoomTypeImages.RemoveRange(roomType.Images);
        roomType.Images.Clear();

        for (var i = 0; i < urls.Count; i++)
        {
            if (!string.IsNullOrWhiteSpace(urls[i]))
                roomType.Images.Add(new RoomTypeImage { Url = urls[i].Trim(), Caption = roomType.Name, SortOrder = i });
        }
    }

    private void ReplaceAmenities(RoomType roomType, List<int>? amenityIds)
    {
        if (amenityIds is null) return;

        _db.RoomTypeAmenities.RemoveRange(roomType.RoomTypeAmenities);
        roomType.RoomTypeAmenities.Clear();

        foreach (var amenityId in amenityIds.Distinct())
            roomType.RoomTypeAmenities.Add(new RoomTypeAmenity { AmenityId = amenityId });
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
