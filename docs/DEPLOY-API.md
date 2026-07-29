# Hosting TheRow.API

The website and admin panel are live on Netlify. Neither can sign in, take a booking or show
real availability until this API is running somewhere, because Netlify serves static files only.

Once it is up, two settings connect everything and no code changes:

| Where | Setting | Value |
| --- | --- | --- |
| Netlify | `VITE_API_BASE_URL` | the API's origin, no trailing slash |
| API host | `Cors__AllowedOrigins__0` | `https://tangerine-praline-6a73c5.netlify.app` |

`VITE_API_BASE_URL` is inlined by Vite at **build** time, so setting it requires a redeploy —
changing the variable alone does nothing.

## Recommended: Azure App Service + Azure SQL

Chosen because it needs **no code change**. The API already targets SQL Server and is tested
against it; local and production stay identical, so a bug you see in one you can reproduce in the
other. Both services have free tiers.

### 1. Database

Azure Portal → **Create a resource → Azure SQL → Single database**.

- Database name: `TheRowHotel`
- Under **Compute + storage → Configure**, pick the **General Purpose Serverless** free offer
- Networking → **Allow Azure services to access this server: Yes**

Copy the ADO.NET connection string and put your password into it.

### 2. API

**Create a resource → Web App**:

- Publish: **Code**, Runtime: **.NET 8 (LTS)**, OS: **Linux**
- Plan: **F1 free**

Deployment Center → **GitHub** → `twistitsolution-cell/therow`, branch `main`.
Set the build path to `backend/src/TheRow.API` so it does not try to build the frontends.

### 3. Configuration

Web App → **Settings → Environment variables**. Nothing below has a default; the API refuses to
start with a weak or missing signing key, and refuses to seed without an explicit password.

```
ConnectionStrings__DefaultConnection = <the ADO.NET string from step 1>
Jwt__Key                             = <64+ random characters>
Seed__AdminEmail                     = <your email>
Seed__AdminPassword                  = <a strong password>
Cors__AllowedOrigins__0              = https://tangerine-praline-6a73c5.netlify.app
ASPNETCORE_ENVIRONMENT               = Production
```

Generate the key with `openssl rand -base64 48`. Do not reuse the development one — it is in the
public repository's history.

### 4. Connect the frontend

Netlify → **Site configuration → Environment variables** → add
`VITE_API_BASE_URL = https://<your-app>.azurewebsites.net` → **Trigger deploy**.

### 5. Verify

```bash
curl https://<your-app>.azurewebsites.net/health
curl https://<your-app>.azurewebsites.net/api/public/site | head -c 200
```

Then sign in at `/admin` on the live site, change the seeded password under **Settings**, and set
`Seed__Enabled=false` so the account cannot be recreated.

## Any Docker host

`backend/Dockerfile` is a standard two-stage .NET 8 build and runs anywhere: Azure Container
Apps, Railway, Fly.io, or your own VPS.

```bash
cd backend
docker build -t therow-api .
docker run -p 8080:8080 \
  -e ConnectionStrings__DefaultConnection="..." \
  -e Jwt__Key="$(openssl rand -base64 48)" \
  -e Seed__AdminEmail="you@example.com" \
  -e Seed__AdminPassword="..." \
  therow-api
```

**Mount a volume at `/app/uploads`.** Without one, every image uploaded through the media manager
disappears the next time the container is replaced.

## Render, and why it is not the default

Render's free tier is the closest thing to the Netlify workflow you already have, and it would
build the Dockerfile directly from GitHub. It does not offer managed SQL Server — only
PostgreSQL — so taking it means moving the database.

That move is mechanical but not free: the EF Core provider changes to Npgsql and every migration
is regenerated. The schema uses decimal precision, unique filtered indexes and serializable
transactions in the availability path, all of which need verifying against a real PostgreSQL
instance rather than assumed.

It was not done because there is no PostgreSQL instance or Docker daemon on the machine this was
built on, so the regenerated migrations could not be run even once. Shipping untested database
code is worse than the extra portal steps Azure costs you. If you want this path, say so and it
should be done against a live Postgres you can point at.

## Free-tier caveats worth knowing

- **Azure F1** allows 60 CPU-minutes per day. Fine for a brochure site with light booking
  traffic; it will throttle under real load. Move to B1 when that starts to bite.
- **Azure SQL serverless free offer** pauses when idle, so the first request after a quiet spell
  can take several seconds. The frontend degrades rather than breaking, but it is noticeable.
- Neither is suitable as-is for a property genuinely taking reservations at volume. They are the
  right place to start, not the right place to stay.
