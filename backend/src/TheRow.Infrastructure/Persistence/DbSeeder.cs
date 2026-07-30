using Microsoft.EntityFrameworkCore;
using TheRow.Application.Common.Interfaces;
using TheRow.Domain.Entities;
using TheRow.Domain.Enums;

namespace TheRow.Infrastructure.Persistence;

/// <summary>
/// Idempotent seed of the property's real configuration: 41 rooms across five categories,
/// amenities, CMS copy and the initial administrator. Safe to run on every startup — each
/// section is skipped when its table already has rows.
/// </summary>
public static class DbSeeder
{
    /// <summary>Rooms allocated per floor before the numbering rolls over.</summary>
    private const int RoomsPerFloor = 8;

    public static async Task SeedAsync(AppDbContext db, IPasswordHasher hasher, string adminEmail, string adminPassword)
    {
        await db.Database.MigrateAsync();

        await SeedRolesAndAdminAsync(db, hasher, adminEmail, adminPassword);
        await SeedSettingsAsync(db);
        await SeedAmenitiesAsync(db);
        await SeedRoomTypesAndRoomsAsync(db);
        await SeedContentAsync(db);
    }

    private static async Task SeedRolesAndAdminAsync(AppDbContext db, IPasswordHasher hasher, string adminEmail, string adminPassword)
    {
        if (!await db.Roles.AnyAsync())
        {
            db.Roles.AddRange(
                new AppRole
                {
                    Name = "Administrator",
                    Description = "Unrestricted access to every module.",
                    Permissions = "*",
                    IsSystem = true
                },
                new AppRole
                {
                    Name = "Front Desk",
                    Description = "Day-to-day reservations, arrivals and departures.",
                    Permissions = "dashboard.view,bookings.view,bookings.write,rooms.view,guests.view"
                },
                new AppRole
                {
                    Name = "Marketing",
                    Description = "Website content, media library and testimonials.",
                    Permissions = "dashboard.view,content.view,content.write,media.view,media.write,rooms.view"
                },
                new AppRole
                {
                    Name = "Finance",
                    Description = "Payments, invoices and revenue reporting.",
                    Permissions = "dashboard.view,bookings.view,payments.view,payments.write,reports.view"
                });

            await db.SaveChangesAsync();
        }

        if (!await db.Users.AnyAsync())
        {
            var adminRole = await db.Roles.FirstAsync(r => r.Name == "Administrator");
            db.Users.Add(new AppUser
            {
                Email = adminEmail,
                FullName = "The Row Administrator",
                PasswordHash = hasher.Hash(adminPassword),
                RoleId = adminRole.Id,
                Phone = "+251956000055",
                IsActive = true
            });
            await db.SaveChangesAsync();
        }
    }

    private static async Task SeedSettingsAsync(AppDbContext db)
    {
        if (await db.Settings.AnyAsync()) return;

        db.Settings.AddRange(
            new Setting { Key = "site.name", Value = "The Row Residential Hotel", Description = "Property name used in titles and emails." },
            new Setting { Key = "site.tagline", Value = "Unwind in luxury at The Row Residential Hotel", Description = "Primary marketing tagline." },
            new Setting { Key = "contact.phone", Value = "+251116662130", Description = "Front desk landline." },
            new Setting { Key = "contact.mobile", Value = "+251956000055", Description = "Reservations mobile." },
            new Setting { Key = "contact.mobile_alt", Value = "+251941900009", Description = "Secondary reservations mobile." },
            new Setting { Key = "contact.email", Value = "marketing@therowresidentialhotel.com", Description = "Public enquiries inbox." },
            new Setting { Key = "contact.whatsapp", Value = "251956000055", Description = "WhatsApp number in international format, no plus sign." },
            new Setting { Key = "contact.address", Value = "Bole, in front of Millennium Hall, Addis Ababa, Ethiopia", Description = "Street address." },
            new Setting { Key = "contact.map_query", Value = "The Row Residential Hotel, Bole, Addis Ababa, Ethiopia", Description = "Place search used by the map embed. Google resolves this to the business listing, so the pin carries the hotel's name. Preferred over raw coordinates — clear it to fall back to map_lat/map_lng." },
            new Setting { Key = "contact.map_lat", Value = "8.9925902", Description = "Fallback latitude, used only when map_query is blank. Resolved from Google's own listing for this hotel and cross-checked: ~330m from Millennium Hall, which matches the property's stated location. Booking aggregators list 8.98311/38.81009, which is 2.4km away and wrong." },
            new Setting { Key = "contact.map_lng", Value = "38.7885403", Description = "Fallback longitude, used only when map_query is blank. See map_lat." },
            new Setting { Key = "social.instagram", Value = "https://www.instagram.com/therowresidentialhoteladdis", Description = "Instagram profile." },
            new Setting { Key = "currency.etb_per_usd", Value = "158.00", Description = "ETB per 1 USD. Update to change displayed USD prices." },
            new Setting { Key = "booking.vat_rate", Value = "0.15", Description = "Ethiopian VAT applied to room revenue." },
            new Setting { Key = "booking.service_charge_rate", Value = "0.10", Description = "Service charge applied to room revenue." },
            new Setting { Key = "booking.check_in_time", Value = "14:00", Description = "Standard check-in time." },
            new Setting { Key = "booking.check_out_time", Value = "12:00", Description = "Standard check-out time." });

        await db.SaveChangesAsync();
    }

    private static async Task SeedAmenitiesAsync(AppDbContext db)
    {
        if (await db.Amenities.AnyAsync()) return;

        db.Amenities.AddRange(
            // In-room features, taken from the property's published room description.
            New("comfortable-beds", "Comfortable Beds", "Deep, hotel-grade mattresses dressed in crisp white linen.", "bed", AmenityCategory.Room, 1),
            New("led-tv", "LED TV & Streaming", "Wall-mounted LED televisions with multimedia connectivity and Netflix.", "tv", AmenityCategory.Room, 2),
            New("fast-wifi", "High-Speed Wi-Fi", "Complimentary fibre internet throughout the building.", "wifi", AmenityCategory.Room, 3, featured: true),
            New("mini-fridge", "Mini Refrigerator", "In-room refrigerator kept stocked on request.", "refrigerator", AmenityCategory.Room, 4),
            New("kettle", "Tea & Coffee Kettle", "Electric kettle with a daily-replenished tea and coffee tray.", "coffee", AmenityCategory.Room, 5),
            New("writing-desk", "Writing Desk", "A proper desk and task chair for guests working from the room.", "pen-tool", AmenityCategory.Room, 6),
            New("safety-box", "In-Room Safe", "Digital safety box sized for a laptop.", "lock", AmenityCategory.Room, 7),
            New("telephone", "Front Desk Telephone", "An internal handset connected to the 24-hour front desk. It does not dial external numbers.", "phone", AmenityCategory.Room, 8),
            New("iron", "Iron & Ironing Board", "Provided in every room and apartment.", "shirt", AmenityCategory.Room, 9),
            New("housekeeping", "Daily Housekeeping", "Full servicing every day, turndown on request.", "sparkles", AmenityCategory.Room, 10),
            New("private-bathroom", "Private Bathroom", "Walk-in rain shower, hot water around the clock and premium toiletries.", "shower-head", AmenityCategory.Room, 11),
            New("kitchenette", "Fitted Kitchen", "Full kitchen with refrigerator, microwave, hob and extractor.", "chef-hat", AmenityCategory.Room, 12),

            // Hotel-wide services.
            New("front-desk-24-7", "24/7 Front Desk", "A manned reception at any hour, every day of the year.", "concierge-bell", AmenityCategory.Hotel, 20, featured: true),
            New("room-service", "Room Service", "In-room dining served around the clock.", "utensils", AmenityCategory.Hotel, 21, featured: true),
            New("parking", "Secure Parking", "On-site guest parking monitored by CCTV.", "car", AmenityCategory.Hotel, 22),
            New("cctv", "24-Hour Security", "CCTV coverage of all public areas and a permanent security presence.", "shield-check", AmenityCategory.Hotel, 23),
            New("atm", "ATM & Currency Exchange", "On-site ATM and foreign exchange desk.", "banknote", AmenityCategory.Hotel, 24, featured: true),
            New("laundry", "Laundry & Dry Cleaning", "Same-day laundry and pressing service.", "washing-machine", AmenityCategory.Hotel, 25),
            New("elevator", "Lift Access", "Every floor served by passenger lifts.", "move-vertical", AmenityCategory.Hotel, 26),


            New("la-nouvelle", "La Nouvelle Restaurant", "Next door to the hotel. A wide variety of international cuisines, prepared by experienced chefs using high-quality ingredients.", "chef-hat", AmenityCategory.Dining, 40, featured: true, image: "/images/feature/restaurant.webp"),
            New("bar-lounge", "Bar & Lounge", "Cocktails, Ethiopian single-origin coffee and a quiet place to sit.", "wine", AmenityCategory.Dining, 41, image: "/images/gallery/restaurant-a.webp"),
            New("breakfast", "Daily Breakfast", "Hot and continental breakfast served each morning.", "croissant", AmenityCategory.Dining, 42, image: "/images/feature/restaurant-food.webp"),

            New("meeting-hall", "Meeting Hall", "A configurable hall for conferences, training and private events.", "presentation", AmenityCategory.Business, 50, featured: true, image: "/images/feature/meeting.webp"),
            New("business-center", "Business Services", "Printing, scanning and secretarial support on request.", "printer", AmenityCategory.Business, 51),

            New("airport-shuttle", "Airport Shuttle", "Five minutes from Bole International Airport, with transfers on request.", "plane", AmenityCategory.Transport, 60, featured: true),
            New("car-rental", "Car Hire & Driver", "Chauffeured vehicles arranged through the front desk.", "car-front", AmenityCategory.Transport, 61));

        await db.SaveChangesAsync();

        static Amenity New(string slug, string name, string description, string icon, AmenityCategory category,
            int order, bool featured = false, string image = "") =>
            new()
            {
                Slug = slug, Name = name, Description = description, Icon = icon,
                Category = category, DisplayOrder = order, IsFeatured = featured, IsActive = true,
                ImageUrl = image
            };
    }

    private static async Task SeedRoomTypesAndRoomsAsync(AppDbContext db)
    {
        if (await db.RoomTypes.AnyAsync()) return;

        var amenities = await db.Amenities.ToDictionaryAsync(a => a.Slug, a => a.Id);

        // Every room gets these; category-specific extras are added below.
        var baseRoom = new[]
        {
            "comfortable-beds", "led-tv", "fast-wifi", "mini-fridge", "kettle",
            "writing-desk", "safety-box", "telephone", "iron", "housekeeping", "private-bathroom"
        };

        var definitions = new[]
        {
            new RoomTypeSeed(
                "standard-room", "Standard Room",
                "A calm, light-filled room with a king bed, work desk and city outlook.",
                "Our Standard Room is the quiet default of the house — 28 square metres of soft neutrals, a king bed dressed in white cotton, and a proper desk beneath the window. Blackout curtains and double glazing keep Bole's traffic where it belongs. The marble bathroom carries a walk-in rain shower and full-size toiletries.",
                6500m, 2, 0, 28, "1 King bed",
                "/images/rooms/standard-1.webp",
                new[] { "/images/rooms/standard-1.webp", "/images/rooms/standard-2.webp", "/images/rooms/standard-3.webp", "/images/bath/bath-1.webp" },
                Array.Empty<string>(), 13, 1),

            new RoomTypeSeed(
                "twin-room", "Twin Room",
                "Two full-size beds, generous floor space and a dedicated work corner.",
                "Built for colleagues travelling together or friends who would rather not share. Two full-size beds sit under a panelled headboard, with a writing desk, lounge chair and wide wardrobe. The layout keeps both beds clear of the walkway, so neither guest is climbing over luggage at midnight.",
                7200m, 2, 0, 32, "2 Twin beds",
                "/images/rooms/twin-1.webp",
                new[] { "/images/rooms/twin-1.webp", "/images/rooms/twin-2.webp", "/images/rooms/twin-3.webp", "/images/rooms/twin-4.webp" },
                Array.Empty<string>(), 2, 2),

            new RoomTypeSeed(
                "family-room", "Family Room",
                "Two separate bedrooms, each with its own king bed and bathroom.",
                "The Family Room is two proper bedrooms rather than one large one. Each has its own king-size bed and its own bathroom, so two couples — or parents and older children — get real privacy instead of a folding bed at the end of someone else's room. There is one of these in the building, so it goes early.",
                9500m, 4, 0, 42, "2 Bedrooms · 2 King beds · 2 bathrooms",
                "/images/rooms/family-1.webp",
                new[] { "/images/rooms/family-1.webp", "/images/rooms/family-2.webp", "/images/rooms/family-3.webp", "/images/bath/bath-2.webp" },
                new[] { "room-service" }, 1, 3),

            new RoomTypeSeed(
                "junior-suite", "Junior Suite",
                "An open suite pairing a king bedroom with its own seating salon.",
                "Our Junior Suite opens into a lounge before it reaches the bed — armchairs, a low table and a second television, set apart from the sleeping area by the room's own geometry rather than a door. At 55 square metres it is the right room for a long stay, a working trip, or an evening when you would rather receive guests than meet them in the lobby.",
                12000m, 2, 0, 55, "1 King bed + lounge salon",
                "/images/rooms/junior-suite-1.webp",
                new[] { "/images/rooms/junior-suite-1.webp", "/images/rooms/junior-suite-2.webp", "/images/rooms/junior-suite-3.webp", "/images/rooms/junior-suite-4.webp", "/images/rooms/junior-suite-5.webp" },
                new[] { "room-service", "laundry" }, 3, 4),

            new RoomTypeSeed(
                "apartment", "One Bedroom Apartment",
                "A one-bedroom residence with a full fitted kitchen and separate living room.",
                "The Apartment is what gives the property its name. A separate bedroom, a living room with proper sofas, and a fully fitted kitchen — refrigerator, microwave, hob, extractor and everything needed to cook a real meal. Guests stay here for weeks rather than nights, and the layout is built for it: laundry service, daily housekeeping, and the whole hotel downstairs when you would rather not cook at all.",
                15500m, 2, 0, 78, "1 King bed + living room + fitted kitchen",
                "/images/apartment/salon-1.webp",
                new[] { "/images/apartment/salon-1.webp", "/images/apartment/salon-2.webp", "/images/apartment/salon-3.webp", "/images/apartment/kitchen-1.webp", "/images/apartment/kitchen-2.webp", "/images/apartment/kitchen-3.webp" },
                new[] { "kitchenette", "room-service", "laundry" }, 22, 5)
        };

        var roomNumber = 101;
        var floor = 1;
        var roomsOnFloor = 0;

        foreach (var d in definitions)
        {
            var roomType = new RoomType
            {
                Slug = d.Slug,
                Name = d.Name,
                ShortDescription = d.ShortDescription,
                Description = d.Description,
                BasePriceEtb = d.BasePriceEtb,
                MaxAdults = d.MaxAdults,
                MaxChildren = d.MaxChildren,
                SizeSqm = d.SizeSqm,
                BedConfiguration = d.BedConfiguration,
                HeroImageUrl = d.HeroImageUrl,
                DisplayOrder = d.DisplayOrder,
                IsActive = true
            };

            for (var i = 0; i < d.ImageUrls.Length; i++)
            {
                roomType.Images.Add(new RoomTypeImage { Url = d.ImageUrls[i], Caption = d.Name, SortOrder = i });
            }

            foreach (var slug in baseRoom.Concat(d.ExtraAmenities).Distinct())
            {
                if (amenities.TryGetValue(slug, out var amenityId))
                    roomType.RoomTypeAmenities.Add(new RoomTypeAmenity { AmenityId = amenityId });
            }

            // Each category starts on a fresh floor. Filling floors sequentially across
            // categories produced runs like "Junior Suite 301-303, Apartment 304-…", which is
            // not how a property numbers itself and makes the housekeeping list hard to read.
            if (roomsOnFloor > 0)
            {
                floor++;
                roomsOnFloor = 0;
            }
            roomNumber = floor * 100 + 1;

            for (var i = 0; i < d.RoomCount; i++)
            {
                if (roomsOnFloor == RoomsPerFloor)
                {
                    floor++;
                    roomsOnFloor = 0;
                    roomNumber = floor * 100 + 1;
                }

                roomType.Rooms.Add(new Room
                {
                    RoomNumber = roomNumber.ToString(),
                    Floor = floor,
                    Status = RoomStatus.Available,
                    IsActive = true
                });

                roomNumber++;
                roomsOnFloor++;
            }

            db.RoomTypes.Add(roomType);
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedContentAsync(AppDbContext db)
    {
        if (!await db.HeroSlides.AnyAsync())
        {
            // Eight slides covering arrival, lobby, rooms, apartments, suites, dining and
            // bathrooms — enough variety that the loop never feels repetitive. The first three
            // are the 2000px Expedia originals, the only frames in the set that are downscaled
            // rather than upscaled.
            db.HeroSlides.AddRange(
                new HeroSlide
                {
                    Eyebrow = "Bole, Addis Ababa",
                    Title = "Unwind in luxury at The Row",
                    Subtitle = "Forty-one residences and suites, five minutes from Bole International.",
                    ImageUrl = "/images/hero/entrance.webp",
                    CtaLabel = "Book Your Stay", CtaUrl = "/booking", SortOrder = 1, IsActive = true
                },
                new HeroSlide
                {
                    Eyebrow = "Arrive well",
                    Title = "A lobby that sets the tone",
                    Subtitle = "Double-height ceilings and a front desk that never closes.",
                    ImageUrl = "/images/hero/lobby.webp",
                    CtaLabel = "Explore the Hotel", CtaUrl = "/services", SortOrder = 2, IsActive = true
                },
                new HeroSlide
                {
                    Eyebrow = "Sleep properly",
                    Title = "Rooms built for rest",
                    Subtitle = "Deep mattresses, blackout curtains, and genuine quiet.",
                    ImageUrl = "/images/hero/king-suite.webp",
                    CtaLabel = "View Rooms", CtaUrl = "/rooms", SortOrder = 3, IsActive = true
                },
                new HeroSlide
                {
                    Eyebrow = "Stay longer",
                    Title = "Apartments with real kitchens",
                    Subtitle = "Separate living rooms and daily housekeeping, by the week or the month.",
                    ImageUrl = "/images/hero/salon.webp",
                    CtaLabel = "View Apartments", CtaUrl = "/rooms/apartment", SortOrder = 4, IsActive = true
                },
                new HeroSlide
                {
                    Eyebrow = "Room to breathe",
                    Title = "Suites with their own salon",
                    Subtitle = "Fifty-five square metres, and a desk you can actually work at.",
                    ImageUrl = "/images/hero/suite.webp",
                    CtaLabel = "View Suites", CtaUrl = "/rooms/junior-suite", SortOrder = 5, IsActive = true
                },
                new HeroSlide
                {
                    Eyebrow = "All-day dining",
                    Title = "La Nouvelle",
                    Subtitle = "A wide variety of international cuisines, next door to the hotel.",
                    ImageUrl = "/images/feature/restaurant.webp",
                    CtaLabel = "Our Restaurant", CtaUrl = "/services", SortOrder = 6, IsActive = true
                },
                new HeroSlide
                {
                    Eyebrow = "In the detail",
                    Title = "Stone, steam and quiet",
                    Subtitle = "A walk-in rain shower in every room, hot water around the clock.",
                    ImageUrl = "/images/feature/bathroom.webp",
                    CtaLabel = "View Rooms", CtaUrl = "/rooms", SortOrder = 7, IsActive = true
                },
                new HeroSlide
                {
                    Eyebrow = "Space to spread out",
                    Title = "Family rooms and twins",
                    Subtitle = "Forty-two square metres for when one room is not enough.",
                    ImageUrl = "/images/hero/king.webp",
                    CtaLabel = "View Rooms", CtaUrl = "/rooms", SortOrder = 8, IsActive = true
                });
        }

        if (!await db.Testimonials.AnyAsync())
        {
            // NOTE: sample copy for launch. Replace with verified guest reviews before go-live.
            db.Testimonials.AddRange(
                new Testimonial
                {
                    GuestName = "Selamawit T.", Country = "Ethiopia", Rating = 5, DisplayOrder = 1,
                    Quote = "We booked an apartment for a month while our house was being finished. Having a real kitchen and a living room made all the difference, and the housekeeping team were faultless."
                },
                new Testimonial
                {
                    GuestName = "Daniel M.", Country = "United Kingdom", Rating = 5, DisplayOrder = 2,
                    Quote = "Five minutes from the airport, which after a night flight is worth more than any amenity. The room was silent, the bed was excellent, and the front desk was genuinely awake at 3am."
                },
                new Testimonial
                {
                    GuestName = "Amina H.", Country = "Kenya", Rating = 5, DisplayOrder = 3,
                    Quote = "I stay here every time I am in Addis for work. The Junior Suite has a proper desk and a sitting area, so I can take calls without perching on the end of a bed."
                },
                new Testimonial
                {
                    GuestName = "Jean-Pierre L.", Country = "France", Rating = 4, DisplayOrder = 4,
                    Quote = "Very comfortable, spotlessly clean and well located opposite Millennium Hall. The restaurant handled a late arrival without any fuss."
                });
        }

        if (!await db.ContentBlocks.AnyAsync())
        {
            db.ContentBlocks.AddRange(
                new ContentBlock
                {
                    PageKey = "home", SectionKey = "intro",
                    Title = "Reliable. Luxurious. Trustworthy.",
                    Subtitle = "The values the house is run on",
                    Body = "The Row Residential Hotel sits in Bole, directly in front of Millennium Hall and five minutes from Bole International Airport. Forty-one rooms and apartments, a 24-hour front desk, room service, on-site ATM and currency exchange — and a team that has learned what guests staying a month need that guests staying a night do not.",
                    ImageUrl = "/images/hero/lobby.webp", SortOrder = 1
                },
                new ContentBlock
                {
                    PageKey = "about", SectionKey = "story",
                    Title = "Our story",
                    Subtitle = "A residential hotel, not simply a hotel",
                    Body = "We built The Row for the guest who arrives with more than a weekend bag. Our stylish and iconic rooms come in a variety of layouts to suit the needs of our guests — from a single quiet night in a Standard Room to a season in a one-bedroom Apartment with its own kitchen. What does not vary is the service underneath: a front desk staffed around the clock, housekeeping every day, and a building watched over by security and CCTV at all hours.",
                    ImageUrl = "/images/feature/facade.webp", SortOrder = 1
                },
                new ContentBlock
                {
                    PageKey = "about", SectionKey = "mission",
                    Title = "Mission",
                    Body = "To give every guest in Addis Ababa a place that works as well on the thirtieth night as it does on the first — comfortable, secure, and staffed by people who remember your name.",
                    SortOrder = 2
                },
                new ContentBlock
                {
                    PageKey = "about", SectionKey = "vision",
                    Title = "Vision",
                    Body = "To be the address international travellers and Ethiopian families both name first when they need to stay in Bole for longer than a night.",
                    SortOrder = 3
                },
                new ContentBlock
                {
                    PageKey = "about", SectionKey = "values",
                    Title = "Values",
                    Body = "Reliable, luxurious and trustworthy — in that order. Luxury that cannot be relied upon is decoration.",
                    MetadataJson = """{"items":["Reliable","Luxurious","Trustworthy"]}""",
                    SortOrder = 4
                },
                new ContentBlock
                {
                    PageKey = "contact", SectionKey = "intro",
                    Title = "Talk to us",
                    Subtitle = "Reservations answer around the clock",
                    Body = "Call the front desk, send a message, or simply walk in. We are directly in front of Millennium Hall in Bole, five minutes from the airport.",
                    SortOrder = 1
                });
        }

        await db.SaveChangesAsync();
    }

    private sealed record RoomTypeSeed(
        string Slug,
        string Name,
        string ShortDescription,
        string Description,
        decimal BasePriceEtb,
        int MaxAdults,
        int MaxChildren,
        int SizeSqm,
        string BedConfiguration,
        string HeroImageUrl,
        string[] ImageUrls,
        string[] ExtraAmenities,
        int RoomCount,
        int DisplayOrder);
}
