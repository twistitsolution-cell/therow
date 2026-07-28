using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TheRow.Application.Common.Interfaces;
using TheRow.Application.DTOs;
using TheRow.Domain.Entities;
using TheRow.Infrastructure.Mapping;
using TheRow.Infrastructure.Persistence;

namespace TheRow.API.Controllers;

/// <summary>
/// Everything the marketing website calls. Entirely anonymous — no endpoint here exposes
/// guest data, and booking lookups require the confirmation reference.
/// </summary>
[ApiController]
[Route("api/public")]
[AllowAnonymous]
public class PublicController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAvailabilityService _availability;
    private readonly IBookingService _bookings;

    public PublicController(AppDbContext db, IAvailabilityService availability, IBookingService bookings)
    {
        _db = db;
        _availability = availability;
        _bookings = bookings;
    }

    /// <summary>One call that hydrates the entire public site: slides, copy, rooms, amenities and settings.</summary>
    [HttpGet("site")]
    public async Task<ActionResult<SiteContentDto>> Site(CancellationToken ct)
    {
        var slides = await _db.HeroSlides.AsNoTracking()
            .Where(h => h.IsActive).OrderBy(h => h.SortOrder).ToListAsync(ct);

        var testimonials = await _db.Testimonials.AsNoTracking()
            .Where(t => t.IsPublished).OrderBy(t => t.DisplayOrder).ToListAsync(ct);

        var blocks = await _db.ContentBlocks.AsNoTracking()
            .Where(c => c.IsActive).OrderBy(c => c.PageKey).ThenBy(c => c.SortOrder).ToListAsync(ct);

        var featured = await _db.Amenities.AsNoTracking()
            .Where(a => a.IsActive && a.IsFeatured).OrderBy(a => a.DisplayOrder).ToListAsync(ct);

        var roomTypes = await LoadRoomTypesAsync(ct);

        var settings = await _db.Settings.AsNoTracking().ToDictionaryAsync(s => s.Key, s => s.Value, ct);

        return Ok(new SiteContentDto(
            slides.Select(s => s.ToDto()).ToList(),
            testimonials.Select(t => t.ToDto()).ToList(),
            blocks.Select(b => b.ToDto()).ToList(),
            featured.Select(a => a.ToDto()).ToList(),
            roomTypes.Select(rt => rt.ToDto()).ToList(),
            settings));
    }

    [HttpGet("room-types")]
    public async Task<ActionResult<IReadOnlyList<RoomTypeDto>>> RoomTypes(CancellationToken ct)
    {
        var roomTypes = await LoadRoomTypesAsync(ct);
        return Ok(roomTypes.Select(rt => rt.ToDto()).ToList());
    }

    [HttpGet("room-types/{slug}")]
    public async Task<ActionResult<RoomTypeDto>> RoomType(string slug, CancellationToken ct)
    {
        var roomType = await _db.RoomTypes.AsNoTracking()
            .Include(rt => rt.Images)
            .Include(rt => rt.Rooms)
            .Include(rt => rt.RoomTypeAmenities).ThenInclude(rta => rta.Amenity)
            .FirstOrDefaultAsync(rt => rt.Slug == slug && rt.IsActive, ct);

        return roomType is null ? NotFound(new { message = "Room type not found." }) : Ok(roomType.ToDto());
    }

    [HttpGet("amenities")]
    public async Task<ActionResult<IReadOnlyList<AmenityDto>>> Amenities(CancellationToken ct)
    {
        var amenities = await _db.Amenities.AsNoTracking()
            .Where(a => a.IsActive).OrderBy(a => a.DisplayOrder).ToListAsync(ct);

        return Ok(amenities.Select(a => a.ToDto()).ToList());
    }

    /// <summary>Live availability and an exact quote for a given stay.</summary>
    [HttpGet("availability")]
    public async Task<ActionResult<IReadOnlyList<AvailabilityDto>>> Availability(
        [FromQuery] DateTime checkIn,
        [FromQuery] DateTime checkOut,
        [FromQuery] int adults = 1,
        [FromQuery] int children = 0,
        [FromQuery] int? roomTypeId = null,
        CancellationToken ct = default)
    {
        var result = await _availability.GetAvailabilityAsync(
            new AvailabilityQuery(checkIn, checkOut, adults, children, roomTypeId), ct);

        return result.Succeeded ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    [HttpPost("bookings")]
    public async Task<ActionResult<BookingDto>> CreateBooking(CreateBookingRequest request, CancellationToken ct)
    {
        var result = await _bookings.CreateAsync(request, ct);
        return result.Succeeded
            ? CreatedAtAction(nameof(LookupBooking), new { reference = result.Value!.Reference }, result.Value)
            : BadRequest(new { message = result.Error });
    }

    /// <summary>Guest-facing booking lookup. The reference is the shared secret.</summary>
    [HttpGet("bookings/{reference}")]
    public async Task<ActionResult<BookingDto>> LookupBooking(string reference, CancellationToken ct)
    {
        var booking = await _bookings.GetByReferenceAsync(reference, ct);
        return booking is null ? NotFound(new { message = "No booking matches that reference." }) : Ok(booking);
    }

    [HttpPost("contact")]
    public async Task<IActionResult> Contact(CreateContactMessageRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { message = "Name, email and message are required." });

        _db.ContactMessages.Add(new ContactMessage
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            Phone = request.Phone?.Trim() ?? string.Empty,
            Subject = request.Subject?.Trim() ?? string.Empty,
            Message = request.Message.Trim()
        });

        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Thank you — our team will be in touch shortly." });
    }

    private Task<List<RoomType>> LoadRoomTypesAsync(CancellationToken ct) =>
        _db.RoomTypes.AsNoTracking()
            .Include(rt => rt.Images)
            .Include(rt => rt.Rooms)
            .Include(rt => rt.RoomTypeAmenities).ThenInclude(rta => rta.Amenity)
            .Where(rt => rt.IsActive)
            .OrderBy(rt => rt.DisplayOrder)
            .ToListAsync(ct);
}
