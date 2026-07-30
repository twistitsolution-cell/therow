# The Row Residential Hotel & Apartment

Website, booking engine and back-office for the property at Bole, in front of Millennium Hall,
Addis Ababa — 41 rooms and apartments across five categories.

```
therowresidentialhotelandappartment/
├── backend/          .NET 8 API (clean architecture, EF Core, SQL Server)
│   ├── TheRow.sln
│   └── src/
│       ├── TheRow.Domain/          entities and enums, no dependencies
│       ├── TheRow.Application/     DTOs and service contracts
│       ├── TheRow.Infrastructure/  EF Core, JWT, availability, bookings, reports, storage
│       └── TheRow.API/             controllers, Swagger, seeding
├── web/              Public website — React 18 + Vite + Tailwind + Framer Motion
├── admin/            Back-office panel — React 18 + Vite + Tailwind
├── docs/             Architecture, database and deployment guides
└── booking.com phto/ Original photography (source of every image in the site)
```

## Quick start

Three terminals. The API must be running for live availability; the website falls back to
bundled content if it is not (see “Offline resilience” below).

**1 — API** (creates and seeds the database on first run)

```bash
cd backend && dotnet run --project src/TheRow.API --urls http://localhost:5080
```

**2 — Website** → http://localhost:5173

```bash
cd web && npm install && npm run dev
```

**3 — Admin panel** → http://localhost:5174

```bash
cd admin && npm install && npm run dev
```

Both frontends proxy `/api` and `/uploads` to `localhost:5080` in development, so there is no
CORS preflight during local work.

### Default administrator

Seeded on first run from `appsettings.json` → `Seed`:

| Field | Value |
| --- | --- |
| Email | `admin@therowresidentialhotel.com` |
| Password | `TheRow@2026` |

**Change this before the site is reachable from outside the building.** Sign in, open
**Settings → Change my password**, then set `Seed:Enabled` to `false`.

### Database

`appsettings.Development.json` points at `.\SQLEXPRESS`. Change the connection string there for
local work, or in `appsettings.json` for a server. The schema is created by EF Core migrations on
startup — there is no SQL script to run by hand.

```bash
# after changing an entity
cd backend
dotnet ef migrations add <Name> --project src/TheRow.Infrastructure --startup-project src/TheRow.API --output-dir Persistence/Migrations
```

## What is built

### Website (`web/`)

| Page | Notes |
| --- | --- |
| Home | Hero slider (fade + slow zoom + parallax), quick booking, featured rooms, experiences, testimonials, location |
| About | Story, mission, vision, values — all editable from the admin panel |
| Rooms | Live filtering by party size, rate ceiling and sort order |
| Room detail | Large carousel, thumbnail rail, amenities, full gallery, sticky rate panel |
| Booking | Four-step flow: dates → live availability → guest details → confirmation with reference |
| Experiences | Dining, business and transport, with a filterable amenity grid |
| Gallery | Masonry layout, category filter, keyboard-driven lightbox |
| Contact | Details, form, embedded Google map |

Also: sticky booking bar on scroll, floating WhatsApp button, concierge placeholder, ETB/USD
currency switch, and an EN/አማርኛ language switch.

### Admin panel (`admin/`)

Dashboard (occupancy, revenue, ADR, arrivals/departures), bookings with status/room/payment
workflow, room types, rooms, amenities, CMS (hero slides, testimonials, page copy, enquiry
inbox), media manager with drag-and-drop upload, reports, users and roles, and site settings.

Access is permission-gated: the sidebar and every route render only what the signed-in role
grants. Four roles are seeded — Administrator, Front Desk, Marketing and Finance.

## Design system

One **soft luxury** palette drives both apps — warm off-white surfaces, muted gold, Playfair
Display headings over Inter body text.

| | Token | Value |
| --- | --- | --- |
| Page base | `background-warm` | `#F2EDE6` |
| Cards / raised panels | `background` | `#F8F6F2` |
| Bands, sidebar, table heads | `background-deep` | `#EFE8DD` |
| Chrome on photos only | `background-soft` | `#FAF7F3` |
| Type | `text-primary` / `-secondary` | `#2E2E2E` / `#676767` |
| Gold | `brand` / `-hover` / `-bronze` | `#C6A96B` / `#B89658` / `#B08D57` |
| Gold for type | `brand-ink` | `#7E5F2C` |

**Pure `#FFFFFF` and `#000000` cannot be used.** Both Tailwind configs replace `theme.colors`
instead of extending it, so `bg-white` and `text-black` do not exist — a stray one breaks the
build rather than shipping. Tailwind's own `#fff` ring-offset and black default shadows are
overridden too; the compiled CSS of both apps contains neither.

Three constraints the palette forces, all verified by measuring every text/background pair in
both apps (zero WCAG AA failures across all 16 routes):

- Gold never carries small text except `brand-ink` — the other three tones sit at 2.1–2.9:1.
- Gold fills carry `text-primary`, never a light tone (6.0:1).
- `text-muted` (`#9A9A9A`, 2.6:1) is decorative only: placeholders, dividers, disabled glyphs.

`text-secondary` is `#676767` rather than `#6B6B6B`. At `#6B6B6B` it measures 4.38:1 over the
warm sections — just under AA. The shift is visually indistinguishable and clears 4.5:1
everywhere. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full rationale.

## Two decisions worth knowing about

**Rates are stored only in ETB.** USD is derived at render time from
`currency.etb_per_usd` in Settings, so the two prices can never drift apart in the database.
Each booking also records the rate it was quoted at, so confirmations reprint faithfully.

**Offline resilience.** The website is the property's shopfront, so a database outage must not
turn it into a blank page. If `GET /api/public/site` fails, the site renders
`web/src/data/fallbackSite.js` — a static mirror of the seeded content — and shows a single line
explaining that live availability is temporarily unavailable. Keep that file in step with the
seeder when content changes materially.

## Documentation

| Document | Covers |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers, availability and pricing rules, auth, design system |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema, relationships, indexes, seed data |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | IIS and VPS deployment, TLS, backups, go-live checklist |

## Content that still needs the property's input

- **Testimonials** are plausible placeholders. Replace them with verified guest reviews in
  **Admin → Content → Testimonials** before launch.
- **Amharic copy** covers navigation and the booking chrome only, and is a first pass — it
  should be reviewed by a native speaker before the language switch is promoted.
- **Guest rating.** The site previously showed an invented "4.6 / 5". That has been removed — the
  hero now carries only verifiable facts (41 rooms, 5 minutes from the airport, 24-hour front
  desk). Expedia lists **7.4/10 from 3 reviews**, which is too thin a sample to display well. Add
  a real rating once there is review volume to support it.
- **One Expedia image is held back.** `assets/expedia/UNVERIFIED-atrium-lobby.jpg` shows a
  double-height white atrium with a grand piano. It does not match any local photograph of this
  property and could not be confirmed as this building — **confirm it is yours before publishing**.
- **Rates** (ETB 6,500–15,500) are realistic for the market but are placeholders. Set the real
  ones in **Admin → Room Types**.
- **Room categories** are the property's real five — Standard, Twin, Family, Junior Suite and
  One Bedroom Apartment — with the property's real inventory (13 / 2 / 1 / 3 / 22, totalling 41)
  and real capacities. Add or rename categories in **Admin → Room Types** at any time.
- **La Nouvelle Restaurant is next door to the hotel, not inside it** — the copy says so. It has
  its own photography, as does the meeting hall.
- **There is no gym and no sauna**, and **Telebirr is not accepted.** All three were assumptions
  in an earlier draft and have been removed from the seed, the booking flow and the site copy.
