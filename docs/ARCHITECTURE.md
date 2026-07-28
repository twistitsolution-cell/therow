# Architecture

## Layers

The backend follows clean architecture: dependencies point inward, and the domain knows nothing
about EF Core, ASP.NET or JSON.

```
TheRow.API            controllers, Swagger, CORS, static uploads, startup seeding
      ↓
TheRow.Infrastructure EF Core DbContext, JWT, PBKDF2 hashing, availability,
                      bookings, reports, local file storage, entity→DTO mapping
      ↓
TheRow.Application    DTOs (records) and service interfaces
      ↓
TheRow.Domain         entities, enums, BaseEntity — zero package references
```

Two deliberate simplifications, both to keep the codebase legible for a single-property system:

- **No repository layer.** Services use `AppDbContext` directly. A repository over EF Core is an
  abstraction over an abstraction; it would add files without adding seams anyone will use.
- **No AutoMapper.** `MappingExtensions` holds hand-written projections. The shapes are stable,
  the mapping is explicit, and there is no reflection cost on the availability path.

## Availability and pricing

`AvailabilityService` is the single source of truth for what can be sold and what it costs. The
booking flow, the admin panel and the website all read from it — a rate is never calculated in
two places.

**Inventory.** Sellable rooms are those that are active and not in `Maintenance` or
`OutOfService`. A room type's availability is `sellable rooms − overlapping bookings`.

**Overlap.** A booking conflicts when `existing.CheckIn < query.CheckOut && existing.CheckOut >
query.CheckIn`. Same-day turnover (one guest leaves the morning another arrives) is therefore not
a conflict, which is how a hotel actually works.

**Blocking states.** Only `Pending`, `Confirmed` and `CheckedIn` hold inventory. Cancelled,
checked-out and no-show bookings release it.

**Rates.** Each night is priced independently: the highest-priority `SeasonalRate` covering that
night wins, otherwise `RoomType.BasePriceEtb`. Nightly rates are summed across the stay, so a
booking spanning a rate change is priced correctly rather than at a single flat rate.

**Tax.** 15% VAT plus 10% service charge, both read from `Settings` (`booking.vat_rate`,
`booking.service_charge_rate`) rather than hard-coded, so Finance can change them without a
deploy.

### Double-booking

`BookingService.CreateAsync` runs the availability read and the insert inside one `Serializable`
transaction, so two guests racing for the last room cannot both succeed. Because the connection
is configured with `EnableRetryOnFailure`, that transaction runs inside
`Database.CreateExecutionStrategy()` — EF refuses a user-initiated transaction otherwise, and a
retry correctly replays the whole read-then-insert block.

Client-supplied prices are never trusted: totals are always recalculated server-side from the
availability service before the row is written.

## Authentication and permissions

JWT bearer tokens, twelve-hour expiry. Passwords are PBKDF2-SHA256, 120,000 iterations, with a
per-password random salt, stored as `iterations.salt.hash`. This is used rather than a BCrypt
package so the solution restores from the .NET runtime alone.

Permissions travel *in the token* as `permission` claims, so `[Authorize(Policy = …)]` resolves
without a database hit per request. A role holding `*` passes every policy. The canonical key
list lives in `Permissions.All` — roles, ASP.NET policies and the admin UI all read from it, so
they cannot drift apart.

Two guardrails: the built-in Administrator role cannot be edited or deleted, and the last active
administrator account cannot be deleted. Between them the system always has a way back in.

Guests are not users. Reservations are keyed by email on the booking row and looked up by
confirmation reference, so the user table stays small and entirely privileged.

## Frontend

Both apps are React 18 + Vite + Tailwind, route-split with `React.lazy`, with vendor chunks
split out so the hotel's copy can change without invalidating the React bundle.

**Website state.** `SiteContext` fetches `/api/public/site` once and exposes room types, CMS
blocks, settings, the money formatter, and the language/currency switches. One round trip
hydrates the whole site.

**Admin state.** `AuthContext` restores the session from a stored token on first paint. Any 401
from any request clears the session immediately through an `onUnauthorized` subscription, rather
than leaving a dead UI behind.

## Design system

A single **soft luxury** palette drives both the website and the admin panel: warm off-white
surfaces, muted gold accents, low-opacity warm shadows, and photography doing the selling.

**Pure `#FFFFFF` and `#000000` are unreachable.** Both Tailwind configs *replace* `theme.colors`
rather than extending it, so `bg-white`, `text-black` and the default grey ramp do not exist in
the build. A stray `bg-white` fails loudly at build time instead of quietly shipping.

| Role | Token | Value |
| --- | --- | --- |
| Page base | `background` | `#F4EFEA` |
| Cards / raised panels | `background-soft` | `#F7F3EE` |
| Contrast sections | `background-warm` | `#EAE3D9` |
| Cool break section | `background-mist` | `#E5E5E5` |
| Primary type | `text-primary` | `#2E2E2E` — 12.6:1 on base |
| Body type | `text-secondary` | `#676767` |
| Decorative only | `text-muted` | `#9A9A9A` — 2.6:1 |
| Gold fill | `brand` | `#C6A96B` |
| Gold hover | `brand-hover` | `#B89658` |
| Bronze (icons, rules) | `brand-bronze` | `#B08D57` |
| Gold for type | `brand-ink` | `#7E5F2C` |
| Hairline | `line` | `#E4DCCE` |

Type: **Playfair Display** for headings, **Inter** for body.
Shadows: `soft` and `luxury`, both warm-tinted (`rgba(46,46,46,…)`) rather than neutral black.

### Photography pipeline

Two sources, in priority order:

1. **`assets/expedia`** — three frames pulled from the property's Expedia listing at **2000×1333**.
   These are the only images in the entire set that are *downscaled* rather than upscaled, so
   they carry the hero. See `assets/expedia/README.md` for how each was verified as this property.
2. **`booking.com phto`** — the local folder. Best frame is 1360×907; most are 1024×683.

Nothing is used raw. `tools/images` measures every frame (dimensions, mean brightness, tonal
spread, Shannon entropy), then grades and right-sizes a curated subset into `web/public/images`.

**There is no video.** The local folder holds 50 JPG, 20 WebP and one JPEG — zero motion files of
any kind. The Expedia page references a video thumbnail, but the video itself is Expedia-hosted
and hot-linking it would be both fragile and legally questionable. Per the brief's own fallback
rule, the hero is therefore a cinematic image slider with Ken Burns. `HeroSlide.VideoUrl` already
exists on the entity and `Hero.jsx` already renders `<video muted loop playsInline>` when it is
set — supply a file and it takes over with no code change.

```bash
cd tools/images && npm install
npm run analyse   # audit the source folder
npm run build     # write the graded, resized WebP set
```

**Curation.** The manifest excludes what the measurements condemn: the night signage
(brightness 33, entropy 5.8 — it renders as a black rectangle), five frames at 141–512px wide,
one flat detail-free shot, one underexposed frame, and every byte-identical duplicate. Anything
under ~600px is barred from hero and header roles outright.

**Grading** is per-frame and driven by that frame's own statistics rather than a blanket filter:
exposure is pulled toward a target band (140 for hero and feature roles, which sit under a scrim;
132 elsewhere), tonal range is widened only where the frame is genuinely flat, saturation lifts
12%, and a light unsharp mask recovers detail lost to upscaling.

Note that exposure uses `modulate()`, **not** `gamma()`. sharp's `gamma()` converts *from* the
supplied encoding to 2.2, so any value below 2.2 darkens the image — the opposite of the
intuitive reading, and a mistake worth not repeating.

Representative results:

| Output | Before (bright / contrast / entropy) | After |
| --- | --- | --- |
| `hero/lobby.webp` | 95.6 / 52.6 / 7.31 | **123.7 / 69.8 / 7.65** |
| `feature/bathroom.webp` | 86.0 / 53.8 / 7.34 | **109.0 / 70.2 / 7.56** |
| `rooms/family-3.webp` | 86.4 / 37.9 / 7.03 | **112.9 / 55.4 / 7.52** |
| `rooms/standard-4.webp` (hot) | 183.6 / 48.9 / 6.90 | **168.0 / 46.0 / 6.75** |

46 images, 3.4 MB total, all WebP.

### Hero slider

Eight slides — arrival, lobby, rooms, apartments, suites, dining, bathrooms, family rooms — so
the loop never repeats within a visit.

| Setting | Value | Why |
| --- | --- | --- |
| Autoplay | 4000 ms | The readable end of the 3–4s band. The crossfade eats the first second, leaving ~3s to take in a headline and its line of copy. At 3s the type changes before it can be read. |
| Crossfade | 1000 ms, `ease-in-out` | CSS opacity on a fixed stack, not mount/unmount |
| Copy transition | 550 ms | Keyed remount, no exit animation |
| Loading | first 2 eager, rest lazy | The opening transition never lands on an empty frame |

Controls: arrows (desktop), dots, pause on hover, pause on tab-hidden, and swipe with a 50px
threshold so a tap is never read as a drag.

**Two failure modes this design avoids**, both found by testing:

1. *Stacked frames.* Every image stays mounted and only opacity changes. An enter/exit approach
   leaves frames piled up whenever a transition is interrupted or outlives the autoplay tick —
   at a 4s cadence that happens constantly.
2. *Stale headline.* The copy uses a **keyed remount, not `AnimatePresence mode="wait"`**. That
   mode holds the incoming child until the outgoing exit animation finishes, and framer drives
   exits on `requestAnimationFrame` — which is frozen while the tab is hidden. The result was a
   headline stuck on slide 1 while the images kept advancing.

Measured across all eight slides: cream type reaches 5.65:1 at worst (on the brightest frame) and
13.9:1 at best, while the photograph retains **78–82%** of its brightness throughout.

### Hero scrims — why the photograph stays visible

An earlier build washed heroes with a near-opaque **cream** gradient. It kept type legible but
bleached the photograph until the subject was unreadable — the opposite of an image-first site.

The scrim is now dark, layered and deliberately light-handed:

| Layer | Purpose | Density |
| --- | --- | --- |
| `.scrim` | flat hold-down across the frame | 26% |
| `.scrim-side` | density behind the headline | 62% → 0 across 72% of the width |
| `.scrim-foot` | density behind the booking bar | 72% → 0 across 55% of the height |

Measured on the real composited pixels of the live hero: cream type reaches **10.8:1** at the far
left, **7.3:1** midway and **4.5:1** past the gradient, while the photograph **retains 79.8%** of
its original brightness. Page headers measure 11.6:1 with 78.7% retained.

The rule that follows: any type over a photograph uses `text-background-soft` with
`eyebrow-on-dark` and `btn-outline-on-dark`; `brand-onDark` (`#E0C48A`) replaces `brand-ink`,
because the relationship inverts on a dark ground.

### Why the page sits on the warm tone

The first build put the page on `#F8F6F2` and cards on `#FAF7F3` — the two lightest tones in the
system. Because most sections carried no background of their own, the result was a single
uninterrupted near-white expanse with cards that were *lighter than the page behind them*, which
inverts the usual depth cue and reads as glare over a long scroll.

The fix was structural, not a tint:

- The page base is `background-warm`; raised panels step **up** to `background`, and bands step
  **down** to `background-deep`. Depth now runs in the expected direction.
- `background-soft` (`#FAF7F3`) is reserved for small chrome sitting on photographs — carousel
  arrows, counters, lightbox buttons — where it must stay bright to be legible.
- No two adjacent sections share a tone. The home page runs
  deep → light → deep → warm → photograph → light → deep → warm.
- The hero scrims resolve to the warm base, so a hero fades into the section beneath it instead
  of leaving a bright seam.

Mean surface luminance across the home page dropped from 0.923 to 0.868, and all 18 routes across
both apps still measure zero WCAG AA failures.

### Three rules the palette forces

Every text/background pair in both apps was measured; all clear WCAG AA. Three constraints came
out of that measurement and must hold:

1. **Gold never carries small text except `brand-ink`.** The specified accents land at 2.09:1
   (`#C6A96B`), 2.58:1 (`#B89658`) and 2.86:1 (`#B08D57`) on the page base — all below AA. They
   are fills, icons and rules only.
2. **Gold fills carry `text-primary`, never a light tone.** `#2E2E2E` on `#C6A96B` is 6.0:1.
3. **`text-muted` is decorative.** At 2.6:1 it is legal for placeholders, dividers and disabled
   glyphs, and nothing else. `text-secondary` is the floor for anything readable.

`text-secondary` is `#676767` rather than the originally specified `#6B6B6B`: at `#6B6B6B` it
measures 4.38:1 over the warm sections, just under AA. The four-point shift is visually
indistinguishable and clears 4.5:1 on every surface in the system.

Photography rules: heroes and page headers use only the bright, high-resolution interiors. The
night signage and low-light shots appear in the gallery, where they read as atmosphere rather
than as a dark hero. The only deliberately dimmed surfaces are the lightbox backdrop and the
gallery caption gradient, both of which a photograph needs.

**Motion.** Scroll reveals fire once, never on every pass — re-animating makes long pages feel
restless. Parallax is `background-attachment: fixed` where possible, with a documented fallback
for iOS Safari, and everything collapses under `prefers-reduced-motion`.

**Carousels** keep every frame mounted and cross-fade opacity rather than mounting and unmounting
per slide. An enter/exit approach leaves frames stacked whenever a transition is interrupted or
outlives the autoplay tick.

Photography rules: heroes and page headers use only the bright, high-resolution interiors. The
night signage and low-light shots appear in the gallery, where they read as atmosphere rather
than as a dark hero. The one intentionally dimmed surface in the whole site is the lightbox
backdrop, which a photograph needs.

**Motion.** Scroll reveals fire once, never on every pass — re-animating makes long pages feel
restless. Parallax is `background-attachment: fixed` where possible, with a documented fallback
for iOS Safari, and everything collapses under `prefers-reduced-motion`.

**Carousels** keep every frame mounted and cross-fade opacity rather than mounting and unmounting
per slide. An enter/exit approach leaves frames stacked whenever a transition is interrupted or
outlives the autoplay tick.

### Admin charts

Hand-rolled SVG — no chart library. Colours were validated against the light chart surface
`#FAF7F3`:

- **Single-series** marks use `#96700F`. The brand golds sit at 2.1–2.9:1 on this surface, and
  `brand-ink` (`#7E5F2C`) falls below the chroma floor and reads grey. `#96700F` is the nearest
  tone that clears the lightness band, the chroma floor *and* 3:1 contrast.
- **Categorical** encoding uses a fixed five-slot order — `#2a78d6`, `#eb6834`, `#1baf7a`,
  `#eda100`, `#e87ba4` — assigned by position and never cycled. It passes the lightness band,
  chroma floor, CVD separation and the normal-vision floor.
- Four categorical slots sit under 3:1 against this light surface, so the **relief rule** applies:
  every categorical row carries a visible direct value label, and identity never depends on colour
  alone.
- Ranked magnitude (revenue by room type) is single-hue, not categorical — colour there would
  encode rank, which changes as data changes.
- `state` colours (success/warning/danger/info) are reserved and never reused as a series.

Charts are not dual-axis anywhere: two measures of different scale get two charts.
