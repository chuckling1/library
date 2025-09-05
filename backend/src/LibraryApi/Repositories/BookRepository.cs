// <copyright file="BookRepository.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Repositories;

using LibraryApi.Data;
using LibraryApi.Models;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Repository implementation for book operations.
/// </summary>
public class BookRepository : IBookRepository
{
    private readonly LibraryDbContext context;
    private readonly ILogger<BookRepository> logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="BookRepository"/> class.
    /// </summary>
    /// <param name="context">The database context.</param>
    /// <param name="logger">The logger.</param>
    public BookRepository(LibraryDbContext context, ILogger<BookRepository> logger)
    {
        this.context = context;
        this.logger = logger;
    }

    /// <inheritdoc/>
    public async Task<(IEnumerable<Book> Books, int TotalCount)> GetBooksAsync(
        IEnumerable<string>? genres = null,
        int? rating = null,
        string? searchTerm = null,
        string? sortBy = null,
        string? sortDirection = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = this.context.Books
            .Include(b => b.BookGenres)
            .ThenInclude(bg => bg.Genre)
            .AsNoTracking();

        // Apply filters
        if (genres != null && genres.Any())
        {
            query = query.Where(b => b.BookGenres.Any(bg => genres.Contains(bg.GenreName)));
        }

        if (rating.HasValue)
        {
            query = query.Where(b => b.Rating == rating.Value);
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
            _ => query.OrderBy(b => b.Title), // Default sort by title
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
        return await this.context.Books
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
        return await this.context.Books
            .Include(b => b.BookGenres)
            .ThenInclude(bg => bg.Genre)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<Book> CreateBookAsync(Book book, CancellationToken cancellationToken = default)
    {
        this.context.Books.Add(book);
        await this.context.SaveChangesAsync(cancellationToken);

        // Reload with genres
        return await this.GetBookByIdAsync(book.Id, cancellationToken) ?? book;
    }

    /// <inheritdoc/>
    public async Task<Book> UpdateBookAsync(Book book, CancellationToken cancellationToken = default)
    {
        this.context.Books.Update(book);
        await this.context.SaveChangesAsync(cancellationToken);

        // Reload with genres
        return await this.GetBookByIdAsync(book.Id, cancellationToken) ?? book;
    }

    /// <inheritdoc/>
    public async Task<bool> DeleteBookAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var book = await this.context.Books.FindAsync(new object[] { id }, cancellationToken);
        if (book == null)
        {
            return false;
        }

        this.context.Books.Remove(book);
        await this.context.SaveChangesAsync(cancellationToken);
        return true;
    }

    /// <inheritdoc/>
    public async Task<(int TotalBooks, double AverageRating, IEnumerable<(string Genre, int Count, double AverageRating)> GenreStats)> GetBooksStatsAsync(CancellationToken cancellationToken = default)
    {
        var totalBooks = await this.context.Books.CountAsync(cancellationToken);
        var averageRating = await this.context.Books.AverageAsync(b => (double)b.Rating, cancellationToken);

        var genreStats = await this.context.BookGenres
            .Include(bg => bg.Book)
            .GroupBy(bg => bg.GenreName)
            .Select(g => new
            {
                Genre = g.Key,
                Count = g.Count(),
                AverageRating = g.Average(bg => (double)bg.Book.Rating),
            })
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var genreStatsResult = genreStats.Select(gs => (gs.Genre, gs.Count, gs.AverageRating));

        return (totalBooks, averageRating, genreStatsResult);
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Book>> GetRecentBooksAsync(int count = 5, CancellationToken cancellationToken = default)
    {
        return await this.context.Books
            .Include(b => b.BookGenres)
            .ThenInclude(bg => bg.Genre)
            .OrderByDescending(b => b.CreatedAt)
            .Take(count)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<List<Book>> BulkCreateBooksAsync(List<Book> books, CancellationToken cancellationToken = default)
    {
        using var transaction = await this.context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            this.logger.LogInformation("Starting bulk creation of {Count} books", books.Count);

            // Add all books to context
            this.context.Books.AddRange(books);

            // Save changes to get the bulk insert
            await this.context.SaveChangesAsync(cancellationToken);

            // Commit the transaction
            await transaction.CommitAsync(cancellationToken);

            this.logger.LogInformation("Successfully bulk created {Count} books", books.Count);
            return books;
        }
        catch (Exception ex)
        {
            this.logger.LogError(ex, "Failed to bulk create books");
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<Dictionary<string, Book>> FindDuplicateBooksByTitleAuthorAsync(
        List<(string Title, string Author)> titleAuthorPairs,
        CancellationToken cancellationToken = default)
    {
        if (!titleAuthorPairs.Any())
        {
            return new Dictionary<string, Book>();
        }

        var duplicates = new Dictionary<string, Book>();

        // Create a list of lowercase title|author combinations for matching
        var searchKeys = titleAuthorPairs
            .Select(pair => $"{pair.Title.ToLower()}|{pair.Author.ToLower()}")
            .ToList();

        // Query existing books and filter in memory (more SQLite-friendly)
        var allBooks = await this.context.Books
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var existingBooks = allBooks
            .Where(b => searchKeys.Contains($"{b.Title.ToLower()}|{b.Author.ToLower()}"))
            .ToList();

        // Build the dictionary with title|author keys
        foreach (var book in existingBooks)
        {
            var key = $"{book.Title}|{book.Author}";
            duplicates[key] = book;
        }

        this.logger.LogInformation(
            "Found {Count} duplicate books out of {TotalChecked} candidates",
            duplicates.Count,
            titleAuthorPairs.Count);

        return duplicates;
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Book>> GetAllBooksAsync(CancellationToken cancellationToken = default)
    {
        return await this.context.Books
            .Include(b => b.BookGenres)
                .ThenInclude(bg => bg.Genre)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }
}
