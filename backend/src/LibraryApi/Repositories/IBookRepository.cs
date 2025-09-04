using LibraryApi.Models;

namespace LibraryApi.Repositories;

/// <summary>
/// Interface for book repository operations.
/// </summary>
public interface IBookRepository
{
    /// <summary>
    /// Gets all books with optional filtering and sorting.
    /// </summary>
    /// <param name="genres">Optional list of genres to filter by.</param>
    /// <param name="minRating">Optional minimum rating to filter by.</param>
    /// <param name="searchTerm">Optional search term for title/author.</param>
    /// <param name="sortBy">Optional field to sort by.</param>
    /// <param name="sortDirection">Optional sort direction.</param>
    /// <param name="page">Page number for pagination.</param>
    /// <param name="pageSize">Page size for pagination.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A tuple containing the books and total count.</returns>
    Task<(IEnumerable<Book> Books, int TotalCount)> GetBooksAsync(
        IEnumerable<string>? genres = null,
        int? minRating = null,
        string? searchTerm = null,
        string? sortBy = null,
        string? sortDirection = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a book by its identifier.
    /// </summary>
    /// <param name="id">The book identifier.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The book if found, null otherwise.</returns>
    Task<Book?> GetBookByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a book by its identifier for updating (with tracking enabled).
    /// </summary>
    /// <param name="id">The book identifier.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The book if found, null otherwise, with tracking enabled for updates.</returns>
    Task<Book?> GetBookForUpdateAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new book.
    /// </summary>
    /// <param name="book">The book to create.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The created book.</returns>
    Task<Book> CreateBookAsync(Book book, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing book.
    /// </summary>
    /// <param name="book">The book to update.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The updated book.</returns>
    Task<Book> UpdateBookAsync(Book book, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a book by its identifier.
    /// </summary>
    /// <param name="id">The book identifier.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>True if the book was deleted, false if not found.</returns>
    Task<bool> DeleteBookAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets books statistics for dashboard.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Statistics about books and genres.</returns>
    Task<(int TotalBooks, double AverageRating, IEnumerable<(string Genre, int Count, double AverageRating)> GenreStats)> GetBooksStatsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets recently added books.
    /// </summary>
    /// <param name="count">Number of recent books to retrieve.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Recently added books.</returns>
    Task<IEnumerable<Book>> GetRecentBooksAsync(int count = 5, CancellationToken cancellationToken = default);
}