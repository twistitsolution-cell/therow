using TheRow.Domain.Common;

namespace TheRow.Domain.Entities;

/// <summary>
/// A back-office operator. Guests are not users — reservations are keyed by email on
/// <see cref="Booking"/>, so this table stays small and privileged.
/// </summary>
public class AppUser : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;

    /// <summary>PBKDF2-SHA256, stored as "iterations.salt.hash" (base64 parts).</summary>
    public string PasswordHash { get; set; } = string.Empty;

    public int RoleId { get; set; }
    public AppRole? Role { get; set; }

    public string Phone { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
}

/// <summary>
/// A named permission set. <see cref="Permissions"/> is a comma-separated list of keys
/// such as "bookings.write" — a single wildcard "*" grants everything.
/// </summary>
public class AppRole : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Permissions { get; set; } = string.Empty;
    public bool IsSystem { get; set; }

    public ICollection<AppUser> Users { get; set; } = new List<AppUser>();

    public IEnumerable<string> PermissionList =>
        Permissions.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    public bool Grants(string permission) =>
        PermissionList.Any(p => p == "*" || p.Equals(permission, StringComparison.OrdinalIgnoreCase));
}
