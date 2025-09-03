using LibraryApi.Responses;

namespace LibraryApi.Services;

/// <summary>
/// Interface for statistics business logic operations.
/// </summary>
public interface IStatsService
{
    /// <summary>
    /// Gets comprehensive book collection statistics.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Statistics about the book collection.</returns>
    Task<BookStatsResponse> GetBookStatsAsync(CancellationToken cancellationToken = default);
}