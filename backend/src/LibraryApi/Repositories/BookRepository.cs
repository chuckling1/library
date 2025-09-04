using LibraryApi.Data;
using LibraryApi.Models;
using Microsoft.EntityFrameworkCore;

namespace LibraryApi.Repositories;

/// <summary>
/// Repository implementation for book operations.
/// </summary>
public class BookRepository : IBookRepository
{
    private readonly LibraryDbContext _context;
    private readonly ILogger<BookRepository> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="BookRepository"/> class.
    /// </summary>
    /// <param name="context">The database context.</param>
    /// <param name="logger">The logger.</param>
    public BookRepository(LibraryDbContext context, ILogger<BookRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<(IEnumerable<Book> Books, int TotalCount)> GetBooksAsync(
        IEnumerable<string>? genres = null,
        int? minRating = null,
        string? searchTerm = null,
        string? sortBy = null,
        string? sortDirection = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Books
            .Include(b => b.BookGenres)
            .ThenInclude(bg => bg.Genre)
            .AsNoTracking();

        // Apply filters
        if (genres != null && genres.Any())
        {
            query = query.Where(b => b.BookGenres.Any(bg => genres.Contains(bg.GenreName)));
        }

        if (minRating.HasValue)
        {
            query = query.Where(b => b.Rating >= minRating.Value);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(b => b.Title.ToLower().Contains(searchTerm.ToLower()) ||
                                   b.Author.ToLower().Contains(searchTerm.ToLower()));
        }

        // Apply sorting
        query = sortBy?.ToLower() switch
        {
            "title" => sortDirection == "desc" ? query.OrderByDescending(b => b.Title) : query.OrderBy(b => b.Title),
            "author" => sortDirection == "desc" ? query.OrderByDescending(b => b.Author) : query.OrderBy(b => b.Author),
            "publisheddate" => sortDirection == "desc" ? query.OrderByDescending(b => b.PublishedDate) : query.OrderBy(b => b.PublishedDate),
            "rating" => sortDirection == "desc" ? query.OrderByDescending(b => b.Rating) : query.OrderBy(b => b.Rating),
            "createdat" => sortDirection == "desc" ? query.OrderByDescending(b => b.CreatedAt) : query.OrderBy(b => b.CreatedAt),
            _ => query.OrderByDescending(b => b.CreatedAt) // Default sort
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var books = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (books, totalCount);
    }

    /// <inheritdoc/>
    public async Task<Book?> GetBookByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Books
            .Include(b => b.BookGenres)
            .ThenInclude(bg => bg.Genre)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    /// <summary>
    /// Gets a book by ID for updating (with tracking enabled).
    /// </summary>
    /// <param name="id">The book ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The book if found, with tracking enabled for updates.</returns>
    public async Task<Book?> GetBookForUpdateAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Books
            .Include(b => b.BookGenres)
            .ThenInclude(bg => bg.Genre)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<Book> CreateBookAsync(Book book, CancellationToken cancellationToken = default)
    {
        _context.Books.Add(book);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with genres
        return await GetBookByIdAsync(book.Id, cancellationToken) ?? book;
    }

    /// <inheritdoc/>
    public async Task<Book> UpdateBookAsync(Book book, CancellationToken cancellationToken = default)
    {
        _context.Books.Update(book);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with genres
        return await GetBookByIdAsync(book.Id, cancellationToken) ?? book;
    }

    /// <inheritdoc/>
    public async Task<bool> DeleteBookAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var book = await _context.Books.FindAsync(new object[] { id }, cancellationToken);
        if (book == null)
        {
            return false;
        }

        _context.Books.Remove(book);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <inheritdoc/>
    public async Task<(int TotalBooks, double AverageRating, IEnumerable<(string Genre, int Count, double AverageRating)> GenreStats)> GetBooksStatsAsync(CancellationToken cancellationToken = default)
    {
        var totalBooks = await _context.Books.CountAsync(cancellationToken);
        var averageRating = await _context.Books.AverageAsync(b => (double)b.Rating, cancellationToken);

        var genreStats = await _context.BookGenres
            .Include(bg => bg.Book)
            .GroupBy(bg => bg.GenreName)
            .Select(g => new
            {
                Genre = g.Key,
                Count = g.Count(),
                AverageRating = g.Average(bg => (double)bg.Book.Rating)
            })
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var genreStatsResult = genreStats.Select(gs => (gs.Genre, gs.Count, gs.AverageRating));

        return (totalBooks, averageRating, genreStatsResult);
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Book>> GetRecentBooksAsync(int count = 5, CancellationToken cancellationToken = default)
    {
        return await _context.Books
            .Include(b => b.BookGenres)
            .ThenInclude(bg => bg.Genre)
            .OrderByDescending(b => b.CreatedAt)
            .Take(count)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}