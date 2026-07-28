namespace TheRow.Domain.Common;

/// <summary>
/// Base for every persisted aggregate. Audit stamps are maintained centrally by
/// <c>AppDbContext.SaveChangesAsync</c> so individual services never set them by hand.
/// </summary>
public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
