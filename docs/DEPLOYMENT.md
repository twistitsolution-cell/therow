# Deployment

Three artefacts: the API (a .NET 8 app), and two static bundles (website and admin panel). They
can live on one server or three.

Suggested layout:

| Host | Serves |
| --- | --- |
| `therowresidentialhotel.com` | `web/dist` |
| `admin.therowresidentialhotel.com` | `admin/dist` |
| `api.therowresidentialhotel.com` | `TheRow.API` |

## 1. Build

```bash
# API — self-contained publish output
cd backend
dotnet publish src/TheRow.API -c Release -o ./publish

# Website
cd ../web
npm ci
VITE_API_BASE_URL=https://api.therowresidentialhotel.com npm run build

# Admin panel
cd ../admin
npm ci
VITE_API_BASE_URL=https://api.therowresidentialhotel.com npm run build
```

On Windows PowerShell, set the variable first:

```powershell
$env:VITE_API_BASE_URL = "https://api.therowresidentialhotel.com"; npm run build
```

`VITE_API_BASE_URL` is baked in at build time. Leave it empty only if the frontend is served from
the same origin as the API.

## 2. Configure the API

Never edit secrets into `appsettings.json`. Set them as environment variables on the server —
`__` maps to configuration nesting:

```
ConnectionStrings__DefaultConnection=Server=<host>;Database=TheRowHotel;User Id=therow;Password=<pw>;TrustServerCertificate=True;MultipleActiveResultSets=True
Jwt__Key=<64+ random characters>
Seed__AdminPassword=<a strong password>
Cors__AllowedOrigins__0=https://therowresidentialhotel.com
Cors__AllowedOrigins__1=https://www.therowresidentialhotel.com
Cors__AllowedOrigins__2=https://admin.therowresidentialhotel.com
ASPNETCORE_ENVIRONMENT=Production
```

`Jwt:Key` must be at least 32 characters — the app refuses to start otherwise, deliberately,
rather than signing tokens with a weak key.

Generate one:

```bash
openssl rand -base64 48
```

After the first successful start, set `Seed__Enabled=false` so the seeder never runs again.

## 3a. Deploy on IIS (Windows Server)

**Prerequisites** — [.NET 8 Hosting Bundle](https://dotnet.microsoft.com/download/dotnet/8.0)
(installs the ASP.NET Core Module) and the URL Rewrite module. Restart IIS after installing:
`iisreset`.

**API site**

1. Copy `backend/publish` to `C:\inetpub\therow\api`.
2. New site → binding `api.therowresidentialhotel.com` → physical path that folder.
3. Set its application pool to **No Managed Code**, and its identity to an account that can reach
   SQL Server.
4. Grant that identity **Modify** on `api\wwwroot\uploads` — the media manager writes there.
5. Add the environment variables above to the app pool (or use `web.config`
   `<environmentVariables>`).

**Frontend sites**

Copy `web/dist` and `admin/dist` to their own folders and point a site at each. Both are SPAs, so
every deep link must fall back to `index.html`. Put this `web.config` in each folder:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA fallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api|uploads)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <remove fileExtension=".webp" />
      <mimeMap fileExtension=".webp" mimeType="image/webp" />
      <remove fileExtension=".avif" />
      <mimeMap fileExtension=".avif" mimeType="image/avif" />
      <!-- Hashed asset filenames change on every build, so they can be cached hard. -->
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
    </staticContent>
    <httpProtocol>
      <customHeaders>
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

Do not let `index.html` itself be cached for a year — it must be revalidated so new builds are
picked up. Override it if your `clientCache` rule is broad.

## 3b. Deploy on a Linux VPS (nginx + systemd)

```bash
sudo mkdir -p /var/www/therow/{api,web,admin}
# copy backend/publish → /var/www/therow/api, web/dist → web, admin/dist → admin
```

`/etc/systemd/system/therow-api.service`:

```ini
[Unit]
Description=The Row API
After=network.target

[Service]
WorkingDirectory=/var/www/therow/api
ExecStart=/usr/bin/dotnet /var/www/therow/api/TheRow.API.dll --urls http://127.0.0.1:5080
Restart=always
RestartSec=10
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
EnvironmentFile=/etc/therow/api.env

[Install]
WantedBy=multi-user.target
```

Put the environment variables from step 2 in `/etc/therow/api.env`, then:

```bash
sudo chmod 600 /etc/therow/api.env
sudo chown -R www-data:www-data /var/www/therow/api/wwwroot/uploads
sudo systemctl enable --now therow-api
```

nginx:

```nginx
server {
    server_name therowresidentialhotel.com www.therowresidentialhotel.com;
    root /var/www/therow/web;
    index index.html;

    location / { try_files $uri $uri/ /index.html; }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/css application/javascript image/svg+xml application/json;
}

server {
    server_name admin.therowresidentialhotel.com;
    root /var/www/therow/admin;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}

server {
    server_name api.therowresidentialhotel.com;
    client_max_body_size 26M;   # matches the 25 MB upload limit

    location / {
        proxy_pass http://127.0.0.1:5080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

TLS:

```bash
sudo certbot --nginx -d therowresidentialhotel.com -d www.therowresidentialhotel.com \
                     -d admin.therowresidentialhotel.com -d api.therowresidentialhotel.com
```

## 4. Verify

```bash
curl https://api.therowresidentialhotel.com/health
curl https://api.therowresidentialhotel.com/api/public/room-types
```

Then in a browser: load the website, run a date search, confirm rooms come back with live counts,
and sign in to the admin panel.

## Backups

Bookings are the irreplaceable data. Nightly full backup plus transaction-log backups:

```sql
BACKUP DATABASE TheRowHotel
TO DISK = 'D:\backups\TheRowHotel.bak'
WITH FORMAT, COMPRESSION, CHECKSUM;
```

Back up `wwwroot/uploads` on the same schedule — those files are referenced by URL from the
database and are not recoverable from it. **Test a restore before go-live**, not after.

## Go-live checklist

- [ ] `Jwt__Key` set to a fresh 64-character secret, never the value in source control
- [ ] Administrator password changed, `Seed__Enabled=false`
- [ ] `Cors__AllowedOrigins` lists only the real domains
- [ ] TLS on all three hosts, HTTP redirecting to HTTPS
- [ ] SQL Server not reachable from the public internet
- [ ] `uploads` writable by the app pool / service user, and included in backups
- [ ] Backups scheduled **and a restore rehearsed**
- [ ] Real rates entered in Admin → Room Types
- [ ] `currency.etb_per_usd` set to the current rate, with an owner for keeping it current
- [ ] Placeholder testimonials replaced with verified reviews
- [ ] Real photography supplied for restaurant, wellness, fitness and meeting hall
- [ ] Amharic copy reviewed by a native speaker before promoting the language switch
