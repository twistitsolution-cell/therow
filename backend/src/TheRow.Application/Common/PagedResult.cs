namespace TheRow.Application.Common;

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public int TotalCount { get; init; }

    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
}

/// <summary>
/// Uniform envelope for operations that can fail for business reasons (no availability,
/// bad credentials) as opposed to programming errors, which still throw.
/// </summary>
public class Result<T>
{
    public bool Succeeded { get; private init; }
    public T? Value { get; private init; }
    public string Error { get; private init; } = string.Empty;

    public static Result<T> Success(T value) => new() { Succeeded = true, Value = value };
    public static Result<T> Failure(string error) => new() { Succeeded = false, Error = error };
}
