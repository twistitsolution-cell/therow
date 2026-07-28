using Microsoft.EntityFrameworkCore;
using TheRow.Domain.Common;
using TheRow.Domain.Entities;

namespace TheRow.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<RoomType> RoomTypes => Set<RoomType>();
    public DbSet<RoomTypeImage> RoomTypeImages => Set<RoomTypeImage>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Amenity> Amenities => Set<Amenity>();
    public DbSet<RoomTypeAmenity> RoomTypeAmenities => Set<RoomTypeAmenity>();
    public DbSet<SeasonalRate> SeasonalRates => Set<SeasonalRate>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<HeroSlide> HeroSlides => Set<HeroSlide>();
    public DbSet<Testimonial> Testimonials => Set<Testimonial>();
    public DbSet<ContentBlock> ContentBlocks => Set<ContentBlock>();
    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<Setting> Settings => Set<Setting>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<AppRole> Roles => Set<AppRole>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<RoomType>(e =>
        {
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Slug).HasMaxLength(120).IsRequired();
            e.Property(x => x.Name).HasMaxLength(160).IsRequired();
            e.Property(x => x.ShortDescription).HasMaxLength(400);
            e.Property(x => x.BedConfiguration).HasMaxLength(160);
            e.Property(x => x.HeroImageUrl).HasMaxLength(500);
            e.Property(x => x.BasePriceEtb).HasPrecision(18, 2);
            e.HasMany(x => x.Images).WithOne(x => x.RoomType!).HasForeignKey(x => x.RoomTypeId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(x => x.SeasonalRates).WithOne(x => x.RoomType!).HasForeignKey(x => x.RoomTypeId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<RoomTypeImage>(e =>
        {
            e.Property(x => x.Url).HasMaxLength(500).IsRequired();
            e.Property(x => x.Caption).HasMaxLength(300);
        });

        b.Entity<Room>(e =>
        {
            e.HasIndex(x => x.RoomNumber).IsUnique();
            e.Property(x => x.RoomNumber).HasMaxLength(20).IsRequired();
            e.Property(x => x.Notes).HasMaxLength(1000);
            e.HasOne(x => x.RoomType).WithMany(x => x.Rooms).HasForeignKey(x => x.RoomTypeId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Amenity>(e =>
        {
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Slug).HasMaxLength(120).IsRequired();
            e.Property(x => x.Name).HasMaxLength(160).IsRequired();
            e.Property(x => x.Description).HasMaxLength(600);
            e.Property(x => x.Icon).HasMaxLength(60);
            e.Property(x => x.ImageUrl).HasMaxLength(500);
        });

        b.Entity<RoomTypeAmenity>(e =>
        {
            e.HasKey(x => new { x.RoomTypeId, x.AmenityId });
            e.HasOne(x => x.RoomType).WithMany(x => x.RoomTypeAmenities).HasForeignKey(x => x.RoomTypeId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Amenity).WithMany(x => x.RoomTypeAmenities).HasForeignKey(x => x.AmenityId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<SeasonalRate>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(160);
            e.Property(x => x.NightlyRateEtb).HasPrecision(18, 2);
            e.HasIndex(x => new { x.RoomTypeId, x.StartDate, x.EndDate });
        });

        b.Entity<Booking>(e =>
        {
            e.HasIndex(x => x.Reference).IsUnique();
            e.Property(x => x.Reference).HasMaxLength(20).IsRequired();
            e.Property(x => x.GuestFirstName).HasMaxLength(120).IsRequired();
            e.Property(x => x.GuestLastName).HasMaxLength(120).IsRequired();
            e.Property(x => x.GuestEmail).HasMaxLength(240).IsRequired();
            e.Property(x => x.GuestPhone).HasMaxLength(60);
            e.Property(x => x.GuestCountry).HasMaxLength(120);
            e.Property(x => x.SpecialRequests).HasMaxLength(2000);
            e.Property(x => x.CancellationReason).HasMaxLength(600);
            e.Property(x => x.DisplayCurrency).HasMaxLength(8);
            e.Property(x => x.NightlyRateEtb).HasPrecision(18, 2);
            e.Property(x => x.SubtotalEtb).HasPrecision(18, 2);
            e.Property(x => x.TaxEtb).HasPrecision(18, 2);
            e.Property(x => x.TotalEtb).HasPrecision(18, 2);
            e.Property(x => x.ExchangeRateUsed).HasPrecision(18, 6);
            e.Ignore(x => x.GuestFullName);

            // The availability query filters on these three columns on every search.
            e.HasIndex(x => new { x.RoomTypeId, x.CheckIn, x.CheckOut });
            e.HasIndex(x => x.Status);

            e.HasOne(x => x.RoomType).WithMany().HasForeignKey(x => x.RoomTypeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Room).WithMany().HasForeignKey(x => x.RoomId).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(x => x.Payments).WithOne(x => x.Booking!).HasForeignKey(x => x.BookingId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Payment>(e =>
        {
            e.Property(x => x.AmountEtb).HasPrecision(18, 2);
            e.Property(x => x.Reference).HasMaxLength(160);
            e.Property(x => x.Notes).HasMaxLength(1000);
        });

        b.Entity<HeroSlide>(e =>
        {
            e.Property(x => x.Title).HasMaxLength(240);
            e.Property(x => x.Subtitle).HasMaxLength(600);
            e.Property(x => x.Eyebrow).HasMaxLength(120);
            e.Property(x => x.ImageUrl).HasMaxLength(500);
            e.Property(x => x.VideoUrl).HasMaxLength(500);
            e.Property(x => x.CtaLabel).HasMaxLength(120);
            e.Property(x => x.CtaUrl).HasMaxLength(300);
        });

        b.Entity<Testimonial>(e =>
        {
            e.Property(x => x.GuestName).HasMaxLength(160).IsRequired();
            e.Property(x => x.Country).HasMaxLength(120);
            e.Property(x => x.Quote).HasMaxLength(2000).IsRequired();
            e.Property(x => x.AvatarUrl).HasMaxLength(500);
        });

        b.Entity<ContentBlock>(e =>
        {
            e.HasIndex(x => new { x.PageKey, x.SectionKey }).IsUnique();
            e.Property(x => x.PageKey).HasMaxLength(80).IsRequired();
            e.Property(x => x.SectionKey).HasMaxLength(80).IsRequired();
            e.Property(x => x.Title).HasMaxLength(300);
            e.Property(x => x.Subtitle).HasMaxLength(600);
            e.Property(x => x.ImageUrl).HasMaxLength(500);
        });

        b.Entity<MediaAsset>(e =>
        {
            e.Property(x => x.FileName).HasMaxLength(300).IsRequired();
            e.Property(x => x.Url).HasMaxLength(600).IsRequired();
            e.Property(x => x.Folder).HasMaxLength(120);
            e.Property(x => x.ContentType).HasMaxLength(160);
            e.Property(x => x.AltText).HasMaxLength(400);
            e.Property(x => x.UploadedBy).HasMaxLength(240);
        });

        b.Entity<ContactMessage>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(160).IsRequired();
            e.Property(x => x.Email).HasMaxLength(240).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(60);
            e.Property(x => x.Subject).HasMaxLength(300);
            e.Property(x => x.Message).HasMaxLength(4000).IsRequired();
        });

        b.Entity<Setting>(e =>
        {
            e.HasIndex(x => x.Key).IsUnique();
            e.Property(x => x.Key).HasMaxLength(120).IsRequired();
            e.Property(x => x.Value).HasMaxLength(2000);
            e.Property(x => x.Description).HasMaxLength(400);
        });

        b.Entity<AppUser>(e =>
        {
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Email).HasMaxLength(240).IsRequired();
            e.Property(x => x.FullName).HasMaxLength(200).IsRequired();
            e.Property(x => x.PasswordHash).HasMaxLength(400).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(60);
            e.HasOne(x => x.Role).WithMany(x => x.Users).HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<AppRole>(e =>
        {
            e.HasIndex(x => x.Name).IsUnique();
            e.Property(x => x.Name).HasMaxLength(120).IsRequired();
            e.Property(x => x.Description).HasMaxLength(400);
            e.Property(x => x.Permissions).HasMaxLength(2000);
            e.Ignore(x => x.PermissionList);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            else if (entry.State == EntityState.Modified) entry.Entity.UpdatedAt = now;
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
