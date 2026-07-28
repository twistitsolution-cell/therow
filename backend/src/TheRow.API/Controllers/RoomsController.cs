using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TheRow.Application.DTOs;
using TheRow.Domain.Entities;
using TheRow.Domain.Enums;
using TheRow.Infrastructure;
using TheRow.Infrastructure.Mapping;
using TheRow.Infrastructure.Persistence;
using TheRow.Infrastructure.Services;

namespace TheRow.API.Controllers;

[ApiController]
[Route("api/rooms")]
[Authorize]
public class RoomsController : ControllerBase
{
    private readonly AppDbContext _db;

    public RoomsController(AppDbContext db) => _db = db;

    [HttpGet]
    [Authorize(Policy = Permissions.RoomsView)]
    public async Task<ActionResult<IReadOnlyList<RoomDto>>> All(
        [FromQuery] int? roomTypeId, [FromQuery] string? status, CancellationToken ct = default)
    {
        var query = _db.Rooms.AsNoTracking().Include(r => r.RoomType).AsQueryable();

        if (roomTypeId is int typeId) query = query.Where(r => r.RoomTypeId == typeId);
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<RoomStatus>(status, true, out var parsed))
            query = query.Where(r => r.Status == parsed);

        var rooms = await query.OrderBy(r => r.Floor).ThenBy(r => r.RoomNumber).ToListAsync(ct);
        return Ok(rooms.Select(r => r.ToDto()).ToList());
    }

    /// <summary>Rooms of a booking's type that are free for its dates — powers the room-assignment picker.</summary>
    [HttpGet("assignable")]
    [Authorize(Policy = Permissions.BookingsView)]
    public async Task<ActionResult<IReadOnlyList<RoomDto>>> Assignable(
        [FromQuery] int bookingId, CancellationToken ct)
    {
        var booking = await _db.Bookings.AsNoTracking().FirstOrDefaultAsync(b => b.Id == bookingId, ct);
        if (booking is null) return NotFound(new { message = "Booking not found." });

        var clashing = await _db.Bookings.AsNoTracking()
            .Where(b => b.Id != bookingId
                        && b.RoomId != null
                        && AvailabilityService.BlockingStatuses.Contains(b.Status)
                        && b.CheckIn < booking.CheckOut
                        && b.CheckOut > booking.CheckIn)
            .Select(b => b.RoomId!.Value)
            .ToListAsync(ct);

        var rooms = await _db.Rooms.AsNoTracking()
            .Include(r => r.RoomType)
            .Where(r => r.RoomTypeId == booking.RoomTypeId
                        && r.IsActive
                        && r.Status != RoomStatus.Maintenance
                        && r.Status != RoomStatus.OutOfService
                        && !clashing.Contains(r.Id))
            .OrderBy(r => r.Floor).ThenBy(r => r.RoomNumber)
            .ToListAsync(ct);

        return Ok(rooms.Select(r => r.ToDto()).ToList());
    }

    [HttpPost]
    [Authorize(Policy = Permissions.RoomsWrite)]
    public async Task<ActionResult<RoomDto>> Create(SaveRoomRequest request, CancellationToken ct)
    {
        var number = request.RoomNumber.Trim();
        if (await _db.Rooms.AnyAsync(r => r.RoomNumber == number, ct))
            return BadRequest(new { message = $"Room {number} already exists." });

        if (!await _db.RoomTypes.AnyAsync(rt => rt.Id == request.RoomTypeId, ct))
            return BadRequest(new { message = "Unknown room type." });

        var room = new Room { RoomNumber = number };
        Apply(room, request);

        _db.Rooms.Add(room);
        await _db.SaveChangesAsync(ct);

        var created = await _db.Rooms.AsNoTracking().Include(r => r.RoomType).FirstAsync(r => r.Id == room.Id, ct);
        return CreatedAtAction(nameof(All), new { roomTypeId = room.RoomTypeId }, created.ToDto());
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Permissions.RoomsWrite)]
    public async Task<ActionResult<RoomDto>> Update(int id, SaveRoomRequest request, CancellationToken ct)
    {
        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (room is null) return NotFound(new { message = "Room not found." });

        var number = request.RoomNumber.Trim();
        if (await _db.Rooms.AnyAsync(r => r.RoomNumber == number && r.Id != id, ct))
            return BadRequest(new { message = $"Room {number} already exists." });

        room.RoomNumber = number;
        Apply(room, request);

        await _db.SaveChangesAsync(ct);
        var updated = await _db.Rooms.AsNoTracking().Include(r => r.RoomType).FirstAsync(r => r.Id == id, ct);
        return Ok(updated.ToDto());
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = Permissions.RoomsWrite)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (room is null) return NotFound(new { message = "Room not found." });

        // Bookings reference rooms historically; retire the room rather than orphan them.
        if (await _db.Bookings.AnyAsync(b => b.RoomId == id, ct))
        {
            room.IsActive = false;
            room.Status = RoomStatus.OutOfService;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Room has booking history, so it was retired instead of deleted." });
        }

        _db.Rooms.Remove(room);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Room deleted." });
    }

    private static void Apply(Room room, SaveRoomRequest r)
    {
        room.RoomTypeId = r.RoomTypeId;
        room.Floor = r.Floor;
        room.Notes = r.Notes ?? string.Empty;
        room.IsActive = r.IsActive;
        if (Enum.TryParse<RoomStatus>(r.Status, true, out var status)) room.Status = status;
    }
}
