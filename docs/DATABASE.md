# Database

SQL Server, created and migrated by EF Core on API startup. There is no SQL script to run by
hand — `DbSeeder.SeedAsync` calls `Database.MigrateAsync()` first.

## Schema

```
AppRoles ──< AppUsers

RoomTypes ──< RoomTypeImages
          ──< Rooms
          ──< SeasonalRates
          ──< RoomTypeAmenities >── Amenities

Bookings ──> RoomTypes  (Restrict)
         ──> Rooms      (SetNull)
         ──< Payments

HeroSlides    Testimonials    ContentBlocks
MediaAssets   ContactMessages Settings
```

### Inventory

| Table | Purpose | Key columns |
| --- | --- | --- |
| `RoomTypes` | Sellable category and its marketing copy | `Slug` (unique), `BasePriceEtb` (18,2), `MaxAdults`, `MaxChildren`, `SizeSqm`, `IsActive` |
| `Rooms` | A physical, numbered room — the unit of availability | `RoomNumber` (unique), `RoomTypeId`, `Floor`, `Status`, `IsActive` |
| `RoomTypeImages` | Ordered gallery per category | `Url`, `SortOrder` |
| `Amenities` | Services and in-room features | `Slug` (unique), `Category`, `Icon`, `IsFeatured` |
| `RoomTypeAmenities` | Join table | Composite PK `(RoomTypeId, AmenityId)`, both sides cascade |
| `SeasonalRates` | Date-ranged price override | `StartDate`, `EndDate`, `NightlyRateEtb`, `Priority` |

`Rooms → RoomTypes` is `Restrict`, so a category with rooms attached cannot be deleted out from
under them; the API deactivates it instead.

### Reservations

| Table | Purpose |
| --- | --- |
| `Bookings` | One reservation for one room type across a date range |
| `Payments` | Money received against a booking, one row per transaction |

`Bookings.RoomId` is nullable and `SetNull` on delete: a booking is held against a *category*
and only assigned a specific room at check-in, so retiring a room never orphans history.

All money is `decimal(18,2)` and stored in **ETB**. `DisplayCurrency` and `ExchangeRateUsed`
record what the guest was quoted in so a confirmation can be reprinted faithfully years later.

Indexes carrying the load:

- `Bookings (RoomTypeId, CheckIn, CheckOut)` — the availability overlap query hits this on every
  search, which is the hottest path in the system.
- `Bookings (Status)` — dashboard and blocking-status filters.
- `Bookings (Reference)` unique — guest-facing lookup.
- `SeasonalRates (RoomTypeId, StartDate, EndDate)` — rate resolution per night.

### Content and configuration

| Table | Purpose |
| --- | --- |
| `HeroSlides` | Homepage slider; supports a still image or a looping video |
| `Testimonials` | Guest reviews, publish flag and display order |
| `ContentBlocks` | Generic CMS block keyed by `(PageKey, SectionKey)` — unique together |
| `MediaAssets` | Uploaded files tracked by the media manager |
| `ContactMessages` | Contact-form inbox |
| `Settings` | Key/value site configuration, `Key` unique |

`ContentBlocks.MetadataJson` carries section-specific structured fields (for example the values
list on the About page) so a new section rarely needs a migration.

### Identity

| Table | Purpose |
| --- | --- |
| `AppUsers` | Back-office operators. `PasswordHash` is PBKDF2 `iterations.salt.hash` |
| `AppRoles` | `Permissions` is a comma-separated key list; a single `*` grants everything |

## Auditing

Every entity inherits `BaseEntity` (`Id`, `CreatedAt`, `UpdatedAt`). Stamps are applied centrally
in `AppDbContext.SaveChangesAsync`, so no service sets them by hand and none can forget.

## Seed data

Idempotent — each section is skipped when its table already has rows, so it is safe on every
startup. Seeded content:

- **4 roles** — Administrator (`*`), Front Desk, Marketing, Finance
- **1 administrator** from `Seed:AdminEmail` / `Seed:AdminPassword`
- **16 settings** — contact details, map coordinates, VAT and service rates, exchange rate,
  check-in/out times
- **28 amenities** across Room, Hotel, Wellness, Dining, Business and Transport
- **5 room types and 41 rooms**, allocated 8 per floor from room 101:

  | Category | Rooms | Rate (ETB) | Size | Sleeps |
  | --- | --- | --- | --- | --- |
  | Standard Room | 16 | 6,500 | 28 m² | 2 + 1 |
  | Twin Room | 10 | 7,200 | 32 m² | 2 + 1 |
  | Family Room | 6 | 9,500 | 42 m² | 2 + 2 |
  | Junior Suite | 5 | 12,000 | 55 m² | 2 + 2 |
  | Apartment | 4 | 15,500 | 78 m² | 3 + 2 |

- **3 hero slides**, **4 testimonials** and **6 content blocks**

### Resetting the development database

```bash
cd backend
dotnet ef database drop -f --project src/TheRow.Infrastructure --startup-project src/TheRow.API
dotnet run --project src/TheRow.API
```

Do not run this against production — it drops the database, bookings included.
