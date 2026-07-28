using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TheRow.Application.Common.Interfaces;
using TheRow.Application.DTOs;
using TheRow.Infrastructure.Mapping;
using TheRow.Infrastructure.Persistence;

namespace TheRow.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _tokens;

    public AuthController(AppDbContext db, IPasswordHasher hasher, IJwtTokenService tokens)
    {
        _db = db;
        _hasher = hasher;
        _tokens = tokens;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Email.ToLower() == email, ct);

        // Same message whether the account is missing or the password is wrong — no account enumeration.
        if (user is null || !_hasher.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Incorrect email or password." });

        if (!user.IsActive)
            return Unauthorized(new { message = "This account has been deactivated." });

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var (token, expiresAt) = _tokens.CreateToken(user);
        return Ok(new LoginResponse(token, expiresAt, user.ToAuthDto()));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthUserDto>> Me(CancellationToken ct)
    {
        var user = await CurrentUserAsync(ct);
        return user is null ? Unauthorized() : Ok(user.ToAuthDto());
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken ct)
    {
        if (request.NewPassword.Length < 8)
            return BadRequest(new { message = "The new password must be at least 8 characters." });

        var user = await CurrentUserAsync(ct);
        if (user is null) return Unauthorized();

        if (!_hasher.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Your current password is incorrect." });

        user.PasswordHash = _hasher.Hash(request.NewPassword);
        await _db.SaveChangesAsync(ct);
        return Ok(new { message = "Password updated." });
    }

    private async Task<Domain.Entities.AppUser?> CurrentUserAsync(CancellationToken ct)
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(id, out var userId)
            ? await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId, ct)
            : null;
    }
}
