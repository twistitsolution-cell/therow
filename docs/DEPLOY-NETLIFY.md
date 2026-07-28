# Deploying to Netlify

## Read this first: Netlify hosts the frontend only

Netlify serves static files. It cannot run the .NET API or SQL Server. Deploying to Netlify alone
gives you a **live, browsable brochure site with a non-functional booking engine**:

| Works without an API | Needs the API hosted somewhere |
| --- | --- |
| Every page, all imagery, gallery, lightbox | Live availability search |
| Room pages, carousels, comparison | Taking a booking |
| Offers, FAQ, map, WhatsApp, contact form UI | Contact form actually sending |
| Currency and language switches | The entire admin panel |

This is handled deliberately, not accidentally. With no API reachable the site renders
`web/src/data/fallbackSite.js` — a bundled mirror of the seeded content — shows a one-line notice,
and the booking search fails to *"We cannot reach live availability right now. Please call
reservations…"* with the phone number. All of that is verified below.

To make booking work, host the API somewhere that runs .NET 8 (Azure App Service, Railway, Render,
Fly.io, or an IIS/VPS box — see [DEPLOYMENT.md](DEPLOYMENT.md)) and set `VITE_API_BASE_URL`.

## What is already prepared

- `netlify.toml` at the repo root — public website
- `admin/netlify.toml` — admin panel, as a second site
- Git repository initialised, one commit, no secrets (verified — see below)
- Production bundles build clean and were tested against a Netlify-equivalent static host

## Step 1 — push to GitHub

The repo exists locally with a commit but **no remote**. Create one and push:

```bash
cd C:/Twist/Development/therowresidentialhotelandappartment
git remote add origin https://github.com/<your-org>/therow-hotel.git
git push -u origin main
```

**Make it private unless you have a reason not to.** Nothing secret is committed, but the seeded
content, rates and photography are the client's.

## Step 2 — create the site on Netlify

In [the twistitsolution team](https://app.netlify.com/teams/twistitsolution/projects):
**Add new project → Import an existing project → GitHub →** pick the repo.

Netlify reads `netlify.toml` and fills these in automatically. Confirm they match:

| Field | Value |
| --- | --- |
| Base directory | `web` |
| Build command | `npm run build` |
| Publish directory | `dist` |

> `publish` is resolved **relative to `base`**. `dist` here means `web/dist`. Writing `web/dist`
> resolves to `web/web/dist` and fails the deploy — a common and confusing mistake.

## Step 3 — environment variables

**The brief's `REACT_APP_API_URL` does nothing here.** That prefix is Create React App. This is
Vite, which only exposes variables prefixed `VITE_`. The correct name is:

| Key | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://api.your-domain.com` — the API origin, no trailing slash |

Set it under **Site configuration → Environment variables**, then redeploy — Vite inlines it at
**build** time, so changing it does not take effect until the next build.

Leave it unset to ship the brochure-only site described above. That is a valid interim state.

## Step 4 — the admin panel (optional, second site)

Add another project from the same repository with **Base directory `admin`**. It needs
`VITE_API_BASE_URL` to be of any use at all.

Its `netlify.toml` sets `X-Robots-Tag: noindex, nofollow` and `X-Frame-Options: DENY`. Consider
putting Netlify password protection or Identity in front of it as well.

## Step 5 — CORS

Once both are live, add the Netlify URLs to the API's allowed origins or every request fails
preflight:

```
Cors__AllowedOrigins__0=https://your-site.netlify.app
Cors__AllowedOrigins__1=https://admin-your-site.netlify.app
```

## Verified before deploy

The production bundle was served through a host that mirrors `netlify.toml` — file if it exists,
otherwise `index.html` with a 200:

| Check | Result |
| --- | --- |
| `/`, `/rooms`, `/rooms/apartment`, `/booking`, `/gallery`, `/about`, `/services`, `/contact` | all **200 text/html** |
| Unknown route `/this-route-does-not-exist` | **200 + index.html** (SPA fallback, not a hard 404) |
| Hashed JS/CSS in `/assets` | all **200** |
| Images | **34 on the homepage, 0 broken** |
| Homepage render | **5,677 characters** — not the classic blank page |
| Hero image | `/images/hero/entrance.webp` at **1800px** |
| Deep-link refresh on `/rooms/apartment` | renders fully, 32 images, 0 broken, correct rate |
| No API reachable | banner shown, all 5 room categories from bundled fallback |
| Booking search with no API | graceful message + phone number, **no crash** |

## Secrets removed before the repo existed

`appsettings.json` previously carried a JWT signing key and the seed administrator password. Both
are now empty strings in the committed file, and `Program.cs` no longer falls back to a hardcoded
password — it throws if `Seed:AdminPassword` is unset while seeding is enabled, so no environment
can quietly come up with a known-credential admin.

Local development values moved to `appsettings.Development.json`, which is git-ignored.

**Set these as environment variables wherever the API is hosted:**

```
ConnectionStrings__DefaultConnection=<connection string>
Jwt__Key=<64+ random characters>
Seed__AdminEmail=<email>
Seed__AdminPassword=<strong password>
```

Generate a key with `openssl rand -base64 48`. The app refuses to start if `Jwt:Key` is under 32
characters — deliberately, rather than signing tokens with a weak key.

## After the first deploy

- [ ] Homepage loads, hero slider advances
- [ ] Refresh on `/rooms/apartment` — no 404
- [ ] Images load (check the Network tab for 404s)
- [ ] Mobile and 1024×768
- [ ] HTTPS active (Netlify provisions automatically)
- [ ] If the API is live: run a date search and confirm real availability
- [ ] Change the seeded admin password, then set `Seed__Enabled=false`
