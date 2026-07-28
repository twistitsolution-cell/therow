using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheRow.Application.Common;
using TheRow.Application.Common.Interfaces;
using TheRow.Application.DTOs;
using TheRow.Infrastructure;

namespace TheRow.API.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookings;

    public BookingsController(IBookingService bookings) => _bookings = bookings;

    [HttpGet]
    [Authorize(Policy = Permissions.BookingsView)]
    public async Task<ActionResult<PagedResult<BookingDto>>> Search([FromQuery] BookingFilter filter, CancellationToken ct)
        => Ok(await _bookings.SearchAsync(filter, ct));

    [HttpGet("{id:int}")]
    [Authorize(Policy = Permissions.BookingsView)]
    public async Task<ActionResult<BookingDto>> Get(int id, CancellationToken ct)
    {
        var booking = await _bookings.GetAsync(id, ct);
        return booking is null ? NotFound(new { message = "Booking not found." }) : Ok(booking);
    }

    /// <summary>Creates a reservation on behalf of a guest (phone, walk-in or agent).</summary>
    [HttpPost]
    [Authorize(Policy = Permissions.BookingsWrite)]
    public async Task<ActionResult<BookingDto>> Create(CreateBookingRequest request, CancellationToken ct)
    {
        var result = await _bookings.CreateAsync(request, ct);
        return result.Succeeded
            ? CreatedAtAction(nameof(Get), new { id = result.Value!.Id }, result.Value)
            : BadRequest(new { message = result.Error });
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Policy = Permissions.BookingsWrite)]
    public async Task<ActionResult<BookingDto>> UpdateStatus(int id, UpdateBookingStatusRequest request, CancellationToken ct)
    {
        var result = await _bookings.UpdateStatusAsync(id, request, ct);
        return result.Succeeded ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    [HttpPut("{id:int}/room")]
    [Authorize(Policy = Permissions.BookingsWrite)]
    public async Task<ActionResult<BookingDto>> AssignRoom(int id, AssignRoomRequest request, CancellationToken ct)
    {
        var result = await _bookings.AssignRoomAsync(id, request.RoomId, ct);
        return result.Succeeded ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    [HttpPost("{id:int}/payments")]
    [Authorize(Policy = Permissions.PaymentsWrite)]
    public async Task<ActionResult<BookingDto>> RecordPayment(int id, RecordPaymentRequest request, CancellationToken ct)
    {
        var result = await _bookings.RecordPaymentAsync(id, request, ct);
        return result.Succeeded ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }
}
