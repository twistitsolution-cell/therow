using System.Text.Json.Serialization;
using Microsoft.Extensions.FileProviders;
using Microsoft.OpenApi.Models;
using TheRow.Application.Common.Interfaces;
using TheRow.Infrastructure;
using TheRow.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicy = "TheRowClients";

// Uploads live under the content root, not the build output — otherwise a rebuild wipes them.
// Resolved and created here so it exists before the static-file provider is wired up.
var uploadsRoot = builder.Configuration["Storage:RootPath"];
if (string.IsNullOrWhiteSpace(uploadsRoot))
{
    uploadsRoot = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads");
    builder.Configuration["Storage:RootPath"] = uploadsRoot;
}
Directory.CreateDirectory(uploadsRoot);

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddCors(options => options.AddPolicy(CorsPolicy, policy =>
{
    var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
    policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
}));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "The Row Residential Hotel API",
        Version = "v1",
        Description = "Public booking endpoints and the authenticated back-office API."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste the JWT returned by POST /api/auth/login."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "The Row API v1"));
}
else
{
    app.UseHsts();
}

// Serve the uploads directory explicitly rather than relying on wwwroot being present —
// a fresh clone or a publish without the folder would otherwise 404 every uploaded image.
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsRoot),
    RequestPath = builder.Configuration["Storage:PublicBaseUrl"]?.TrimEnd('/') is { Length: > 0 } publicPath
        ? publicPath
        : "/uploads",
});

app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", utc = DateTime.UtcNow }))
   .WithTags("System");

if (builder.Configuration.GetValue("Seed:Enabled", true))
{
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        var seedEmail = builder.Configuration["Seed:AdminEmail"];
        var seedPassword = builder.Configuration["Seed:AdminPassword"];

        // Refuse to invent a default. A fallback password here would silently create a
        // known-credential administrator on any environment that forgot to configure one.
        if (string.IsNullOrWhiteSpace(seedEmail) || string.IsNullOrWhiteSpace(seedPassword))
        {
            throw new InvalidOperationException(
                "Seed:AdminEmail and Seed:AdminPassword must be configured while Seed:Enabled is true. " +
                "Set them via user-secrets or environment variables, then restart.");
        }

        await DbSeeder.SeedAsync(db, hasher, seedEmail, seedPassword);
        logger.LogInformation("Database migrated and seeded.");
    }
    catch (Exception ex)
    {
        // A missing database should not stop the API from starting — surface it and carry on so
        // /health and Swagger remain reachable while the DBA sorts the connection out.
        logger.LogError(ex, "Database migration/seed failed. The API is running but data endpoints will fail.");
    }
}

app.Run();
