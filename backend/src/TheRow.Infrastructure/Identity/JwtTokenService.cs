using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TheRow.Application.Common.Interfaces;
using TheRow.Domain.Entities;

namespace TheRow.Infrastructure.Identity;

public class JwtSettings
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "TheRow.API";
    public string Audience { get; set; } = "TheRow.Admin";
    public int ExpiryHours { get; set; } = 12;
}

public class JwtTokenService : IJwtTokenService
{
    private readonly JwtSettings _settings;

    public JwtTokenService(IConfiguration configuration)
    {
        _settings = configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();

        if (string.IsNullOrWhiteSpace(_settings.Key) || _settings.Key.Length < 32)
        {
            throw new InvalidOperationException(
                "Jwt:Key must be configured with at least 32 characters. Set it via user-secrets or environment variables in production.");
        }
    }

    public (string Token, DateTime ExpiresAt) CreateToken(AppUser user)
    {
        var expiresAt = DateTime.UtcNow.AddHours(_settings.ExpiryHours);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, user.Role?.Name ?? "Staff")
        };

        // Permissions travel in the token so [Authorize] policies resolve without a DB hit per request.
        foreach (var permission in user.Role?.PermissionList ?? Enumerable.Empty<string>())
        {
            claims.Add(new Claim("permission", permission));
        }

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
