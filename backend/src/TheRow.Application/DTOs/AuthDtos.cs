namespace TheRow.Application.DTOs;

public record LoginRequest(string Email, string Password);

public record AuthUserDto(
    int Id,
    string Email,
    string FullName,
    string Phone,
    string RoleName,
    IReadOnlyList<string> Permissions,
    bool IsActive,
    DateTime? LastLoginAt);

public record LoginResponse(string Token, DateTime ExpiresAt, AuthUserDto User);

public record SaveUserRequest(
    string Email,
    string FullName,
    string Phone,
    int RoleId,
    bool IsActive,
    string? Password);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record RoleDto(int Id, string Name, string Description, IReadOnlyList<string> Permissions, bool IsSystem, int UserCount);

public record SaveRoleRequest(string Name, string Description, List<string> Permissions);
