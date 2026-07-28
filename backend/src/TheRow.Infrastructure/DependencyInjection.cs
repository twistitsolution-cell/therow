using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using TheRow.Application.Common.Interfaces;
using TheRow.Infrastructure.Identity;
using TheRow.Infrastructure.Persistence;
using TheRow.Infrastructure.Services;

namespace TheRow.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                sql => sql.EnableRetryOnFailure(3)));

        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAvailabilityService, AvailabilityService>();
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IFileStorage, LocalFileStorage>();

        var jwt = configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
            });

        services.AddAuthorization(options =>
        {
            // Each policy passes when the token carries either the exact permission or the "*" wildcard.
            foreach (var permission in Permissions.All)
            {
                options.AddPolicy(permission, policy =>
                    policy.RequireAssertion(context =>
                        context.User.HasClaim("permission", "*") ||
                        context.User.HasClaim("permission", permission)));
            }
        });

        return services;
    }
}

/// <summary>Canonical permission keys. Kept in one place so roles, policies and the admin UI agree.</summary>
public static class Permissions
{
    public const string DashboardView = "dashboard.view";
    public const string BookingsView = "bookings.view";
    public const string BookingsWrite = "bookings.write";
    public const string RoomsView = "rooms.view";
    public const string RoomsWrite = "rooms.write";
    public const string ContentView = "content.view";
    public const string ContentWrite = "content.write";
    public const string MediaView = "media.view";
    public const string MediaWrite = "media.write";
    public const string PaymentsView = "payments.view";
    public const string PaymentsWrite = "payments.write";
    public const string UsersView = "users.view";
    public const string UsersWrite = "users.write";
    public const string ReportsView = "reports.view";
    public const string SettingsWrite = "settings.write";

    public static readonly string[] All =
    {
        DashboardView, BookingsView, BookingsWrite, RoomsView, RoomsWrite,
        ContentView, ContentWrite, MediaView, MediaWrite,
        PaymentsView, PaymentsWrite, UsersView, UsersWrite, ReportsView, SettingsWrite
    };
}
