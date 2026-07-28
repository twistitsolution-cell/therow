using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TheRow.Application.Common.Interfaces;
using TheRow.Application.DTOs;
using TheRow.Infrastructure;
using TheRow.Infrastructure.Mapping;
using TheRow.Infrastructure.Persistence;

namespace TheRow.API.Controllers;

[ApiController]
[Route("api/media")]
[Authorize]
public class MediaController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IFileStorage _storage;

    public MediaController(AppDbContext db, IFileStorage storage)
    {
        _db = db;
        _storage = storage;
    }

    [HttpGet]
    [Authorize(Policy = Permissions.MediaView)]
    public async Task<ActionResult<IReadOnlyList<MediaAssetDto>>> All([FromQuery] string? folder, CancellationToken ct)
    {
        var query = _db.MediaAssets.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(folder)) query = query.Where(m => m.Folder == folder);

        var assets = await query.OrderByDescending(m => m.CreatedAt).ToListAsync(ct);
        return Ok(assets.Select(m => m.ToDto()).ToList());
    }

    [HttpGet("folders")]
    [Authorize(Policy = Permissions.MediaView)]
    public async Task<ActionResult<IReadOnlyList<object>>> Folders(CancellationToken ct)
    {
        var folders = await _db.MediaAssets.AsNoTracking()
            .GroupBy(m => m.Folder)
            .Select(g => new { folder = g.Key, count = g.Count() })
            .OrderBy(x => x.folder)
            .ToListAsync(ct);

        return Ok(folders);
    }

    [HttpPost("upload")]
    [Authorize(Policy = Permissions.MediaWrite)]
    [RequestSizeLimit(26 * 1024 * 1024)]
    public async Task<ActionResult<IReadOnlyList<MediaAssetDto>>> Upload(
        [FromForm] List<IFormFile> files, [FromForm] string folder = "general", CancellationToken ct = default)
    {
        if (files is null || files.Count == 0)
            return BadRequest(new { message = "Select at least one file to upload." });

        var uploadedBy = User.FindFirstValue(ClaimTypes.Name) ?? "unknown";
        var saved = new List<MediaAssetDto>();

        foreach (var file in files.Where(f => f.Length > 0))
        {
            await using var stream = file.OpenReadStream();
            try
            {
                saved.Add(await _storage.SaveAsync(stream, file.FileName, file.ContentType, folder, uploadedBy, ct));
            }
            catch (InvalidOperationException ex)
            {
                // One bad file should not discard the rest of the batch.
                return BadRequest(new { message = ex.Message, uploaded = saved });
            }
        }

        return Ok(saved);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Permissions.MediaWrite)]
    public async Task<ActionResult<MediaAssetDto>> Update(int id, [FromBody] MediaAssetDto request, CancellationToken ct)
    {
        var asset = await _db.MediaAssets.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (asset is null) return NotFound(new { message = "Asset not found." });

        asset.AltText = request.AltText ?? string.Empty;
        await _db.SaveChangesAsync(ct);
        return Ok(asset.ToDto());
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = Permissions.MediaWrite)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var deleted = await _storage.DeleteAsync(id, ct);
        return deleted ? Ok(new { message = "Asset deleted." }) : NotFound(new { message = "Asset not found." });
    }
}
