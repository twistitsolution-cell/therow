using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheRow.Application.Common.Interfaces;
using TheRow.Application.DTOs;
using TheRow.Infrastructure;

namespace TheRow.API.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reports;

    public ReportsController(IReportService reports) => _reports = reports;

    [HttpGet("dashboard")]
    [Authorize(Policy = Permissions.DashboardView)]
    public async Task<ActionResult<DashboardStatsDto>> Dashboard(CancellationToken ct)
        => Ok(await _reports.GetDashboardAsync(ct));

    /// <summary>Revenue, occupancy, room-type performance and source mix. Defaults to the last 90 days.</summary>
    [HttpGet]
    [Authorize(Policy = Permissions.ReportsView)]
    public async Task<ActionResult<ReportsDto>> Reports(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
    {
        var end = to ?? DateTime.UtcNow.Date;
        var start = from ?? end.AddDays(-90);
        return Ok(await _reports.GetReportsAsync(start, end, ct));
    }
}
