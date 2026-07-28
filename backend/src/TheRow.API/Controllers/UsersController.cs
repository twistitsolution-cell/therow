using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TheRow.Application.Common.Interfaces;
using TheRow.Application.DTOs;
using TheRow.Domain.Entities;
using TheRow.Infrastructure;
using TheRow.Infrastructure.Mapping;
using TheRow.Infrastructure.Persistence;

namespace TheRow.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _hasher;

    public UsersController(AppDbContext db, IPasswordHasher hasher)
    {
        _db = db;
        _hasher = hasher;
    }

    [HttpGet]
    [Authorize(Policy = Permissions.UsersView)]
    public async Task<ActionResult<IReadOnlyList<AuthUserDto>>> All(CancellationToken ct)
    {
        var users = await _db.Users.AsNoTracking().Include(u => u.Role).OrderBy(u => u.FullName).ToListAsync(ct);
        return Ok(users.Select(u => u.ToAuthDto()).ToList());
    }

    [HttpPost]
    [Authorize(Policy = Permissions.UsersWrite)]
    public async Task<ActionResult<AuthUserDto>> Create(SaveUserRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email.ToLower() == email, ct))
            return BadRequest(new { message = "That email address is already registered." });

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            return BadRequest(new { message = "A password of at least 8 characters is required." });

        if (!await _db.Roles.AnyAsync(r => r.Id == request.RoleId, ct))
            return BadRequest(new { message = "Unknown role." });

        var user = new AppUser
        {
            Email = email,
            FullName = request.FullName.Trim(),
            Phone = request.Phone?.Trim() ?? string.Empty,
            RoleId = request.RoleId,
            IsActive = request.IsActive,
            PasswordHash = _hasher.Hash(request.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        var created = await _db.Users.AsNoTracking().Include(u => u.Role).FirstAsync(u => u.Id == user.Id, ct);
        return Ok(created.ToAuthDto());
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Permissions.UsersWrite)]
    public async Task<ActionResult<AuthUserDto>> Update(int id, SaveUserRequest request, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return NotFound(new { message = "User not found." });

        var email = request.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email.ToLower() == email && u.Id != id, ct))
            return BadRequest(new { message = "That email address is already registered." });

        user.Email = email;
        user.FullName = request.FullName.Trim();
        user.Phone = request.Phone?.Trim() ?? string.Empty;
        user.RoleId = request.RoleId;
        user.IsActive = request.IsActive;

        // Password is only touched when a new one is supplied.
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            if (request.Password.Length < 8)
                return BadRequest(new { message = "The password must be at least 8 characters." });

            user.PasswordHash = _hasher.Hash(request.Password);
        }

        await _db.SaveChangesAsync(ct);
        var updated = await _db.Users.AsNoTracking().Include(u => u.Role).FirstAsync(u => u.Id == id, ct);
        return Ok(updated.ToAuthDto());
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = Permissions.UsersWrite)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var user = await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return NotFound(new { message = "User not found." });

        // Never allow the last active administrator to be removed — that would lock everyone out.
        if (user.Role?.Permissions == "*")
        {
            var remainingAdmins = await _db.Users
                .CountAsync(u => u.Id != id && u.IsActive && u.Role!.Permissions == "*", ct);

            if (remainingAdmins == 0)
                return BadRequest(new { message = "This is the last active administrator and cannot be deleted." });
        }

        _db.Users.Remove(user);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "User deleted." });
    }
}

[ApiController]
[Route("api/roles")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly AppDbContext _db;

    public RolesController(AppDbContext db) => _db = db;

    [HttpGet]
    [Authorize(Policy = Permissions.UsersView)]
    public async Task<ActionResult<IReadOnlyList<RoleDto>>> All(CancellationToken ct)
    {
        var roles = await _db.Roles.AsNoTracking().Include(r => r.Users).OrderBy(r => r.Name).ToListAsync(ct);
        return Ok(roles.Select(r => r.ToDto()).ToList());
    }

    /// <summary>The permission keys the admin UI renders as checkboxes.</summary>
    [HttpGet("permissions")]
    [Authorize(Policy = Permissions.UsersView)]
    public ActionResult<IReadOnlyList<string>> AvailablePermissions() => Ok(Permissions.All);

    [HttpPost]
    [Authorize(Policy = Permissions.UsersWrite)]
    public async Task<ActionResult<RoleDto>> Create(SaveRoleRequest request, CancellationToken ct)
    {
        var name = request.Name.Trim();
        if (await _db.Roles.AnyAsync(r => r.Name == name, ct))
            return BadRequest(new { message = "A role with that name already exists." });

        var role = new AppRole
        {
            Name = name,
            Description = request.Description ?? string.Empty,
            Permissions = string.Join(',', request.Permissions ?? new List<string>())
        };

        _db.Roles.Add(role);
        await _db.SaveChangesAsync(ct);
        return Ok(role.ToDto());
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Permissions.UsersWrite)]
    public async Task<ActionResult<RoleDto>> Update(int id, SaveRoleRequest request, CancellationToken ct)
    {
        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (role is null) return NotFound(new { message = "Role not found." });

        // The built-in Administrator role keeps its wildcard so the system always has a way in.
        if (role.IsSystem)
            return BadRequest(new { message = "The built-in Administrator role cannot be modified." });

        var name = request.Name.Trim();
        if (await _db.Roles.AnyAsync(r => r.Name == name && r.Id != id, ct))
            return BadRequest(new { message = "A role with that name already exists." });

        role.Name = name;
        role.Description = request.Description ?? string.Empty;
        role.Permissions = string.Join(',', request.Permissions ?? new List<string>());

        await _db.SaveChangesAsync(ct);
        return Ok(role.ToDto());
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = Permissions.UsersWrite)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var role = await _db.Roles.Include(r => r.Users).FirstOrDefaultAsync(r => r.Id == id, ct);
        if (role is null) return NotFound(new { message = "Role not found." });
        if (role.IsSystem) return BadRequest(new { message = "The built-in Administrator role cannot be deleted." });
        if (role.Users.Count > 0) return BadRequest(new { message = "Reassign the users on this role before deleting it." });

        _db.Roles.Remove(role);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Role deleted." });
    }
}
