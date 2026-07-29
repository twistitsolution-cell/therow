# Container for TheRow.API. Works on any host that accepts a Dockerfile — Render, Railway,
# Fly.io, Azure Container Apps, or a plain VPS.
#
# Build from the `backend` directory:
#   docker build -t therow-api .
#   docker run -p 8080:8080 \
#     -e ConnectionStrings__DefaultConnection="..." \
#     -e Jwt__Key="$(openssl rand -base64 48)" \
#     -e Seed__AdminEmail="you@example.com" -e Seed__AdminPassword="..." \
#     therow-api

# ---------- build ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore against the project files alone first, so a source-only change does not invalidate
# the restore layer. This is the difference between a 10-second rebuild and a 2-minute one.
COPY TheRow.sln ./
COPY src/TheRow.Domain/TheRow.Domain.csproj src/TheRow.Domain/
COPY src/TheRow.Application/TheRow.Application.csproj src/TheRow.Application/
COPY src/TheRow.Infrastructure/TheRow.Infrastructure.csproj src/TheRow.Infrastructure/
COPY src/TheRow.API/TheRow.API.csproj src/TheRow.API/
RUN dotnet restore TheRow.sln

COPY . .
RUN dotnet publish src/TheRow.API/TheRow.API.csproj -c Release -o /app/publish --no-restore

# ---------- runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Most PaaS hosts inject the port to listen on. Default to 8080 for the ones that do not.
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}
ENV ASPNETCORE_ENVIRONMENT=Production

# Uploads must survive a redeploy: mount a persistent volume here, or the media library loses
# every file each time the container is replaced.
ENV Storage__RootPath=/app/uploads
RUN mkdir -p /app/uploads

# Run as the non-root user the base image already provides.
USER $APP_UID

COPY --from=build /app/publish .

EXPOSE 8080
ENTRYPOINT ["dotnet", "TheRow.API.dll"]
