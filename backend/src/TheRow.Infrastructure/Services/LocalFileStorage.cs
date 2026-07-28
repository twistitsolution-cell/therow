using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TheRow.Application.Common.Interfaces;
using TheRow.Application.DTOs;
using TheRow.Domain.Entities;
using TheRow.Infrastructure.Mapping;
using TheRow.Infrastructure.Persistence;

namespace TheRow.Infrastructure.Services;

/// <summary>
/// Stores uploads on the web server's disk under wwwroot/uploads and records them in the
/// media library. Swap this implementation for S3/Azure Blob without touching the controllers.
/// </summary>
public class LocalFileStorage : IFileStorage
{
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".mp4", ".webm" };
    private const long MaxSizeBytes = 25 * 1024 * 1024;

    private readonly AppDbContext _db;
    private readonly string _rootPath;
    private readonly string _publicBaseUrl;

    public LocalFileStorage(AppDbContext db, IConfiguration configuration)
    {
        _db = db;
        _rootPath = configuration["Storage:RootPath"] is { Length: > 0 } configured
            ? configured
            : Path.Combine(AppContext.BaseDirectory, "wwwroot", "uploads");
        _publicBaseUrl = (configuration["Storage:PublicBaseUrl"] ?? "/uploads").TrimEnd('/');
    }

    public async Task<MediaAssetDto> SaveAsync(
        Stream content, string fileName, string contentType, string folder, string uploadedBy, CancellationToken ct = default)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            throw new InvalidOperationException($"File type '{extension}' is not allowed.");

        // Folder comes from the client — strip any path separators so it cannot escape the root.
        var safeFolder = string.Concat((folder ?? "general")
            .Where(c => char.IsLetterOrDigit(c) || c is '-' or '_'))
            .ToLowerInvariant();
        if (safeFolder.Length == 0) safeFolder = "general";

        var storedName = $"{Guid.NewGuid():N}{extension}";
        var directory = Path.Combine(_rootPath, safeFolder);
        Directory.CreateDirectory(directory);

        var fullPath = Path.Combine(directory, storedName);
        long written;
        await using (var file = File.Create(fullPath))
        {
            await content.CopyToAsync(file, ct);
            written = file.Length;
        }

        if (written > MaxSizeBytes)
        {
            File.Delete(fullPath);
            throw new InvalidOperationException("File exceeds the 25 MB upload limit.");
        }

        var asset = new MediaAsset
        {
            FileName = Path.GetFileName(fileName),
            Url = $"{_publicBaseUrl}/{safeFolder}/{storedName}",
            Folder = safeFolder,
            ContentType = contentType,
            SizeBytes = written,
            AltText = Path.GetFileNameWithoutExtension(fileName),
            UploadedBy = uploadedBy
        };

        _db.MediaAssets.Add(asset);
        await _db.SaveChangesAsync(ct);
        return asset.ToDto();
    }

    public async Task<bool> DeleteAsync(int mediaAssetId, CancellationToken ct = default)
    {
        var asset = await _db.MediaAssets.FirstOrDefaultAsync(m => m.Id == mediaAssetId, ct);
        if (asset is null) return false;

        var relative = asset.Url.StartsWith(_publicBaseUrl, StringComparison.OrdinalIgnoreCase)
            ? asset.Url[_publicBaseUrl.Length..].TrimStart('/')
            : null;

        if (relative is not null)
        {
            var fullPath = Path.Combine(_rootPath, relative.Replace('/', Path.DirectorySeparatorChar));
            if (File.Exists(fullPath)) File.Delete(fullPath);
        }

        _db.MediaAssets.Remove(asset);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
