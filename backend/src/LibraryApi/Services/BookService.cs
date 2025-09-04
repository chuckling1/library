using LibraryApi.Models;
using LibraryApi.Repositories;
using LibraryApi.Requests;
using LibraryApi.Responses;

namespace LibraryApi.Services;

/// <summary>
/// Service implementation for book business logic.
/// </summary>
public class BookService : IBookService
{
    private readonly IBookRepository _bookRepository;
    private readonly IGenreRepository _genreRepository;
    private readonly ILogger<BookService> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="BookService"/> class.
    /// </summary>
    /// <param name="bookRepository">The book repository.</param>
    /// <param name="genreRepository">The genre repository.</param>
    /// <param name="logger">The logger.</param>
    public BookService(
        IBookRepository bookRepository,
        IGenreRepository genreRepository,
        ILogger<BookService> logger)
    {
        _bookRepository = bookRepository;
        _genreRepository = genreRepository;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Book>> GetBooksAsync(
        string[]? genres = null,
        int? minRating = null,
        string? searchTerm = null,
        string? sortBy = null,
        string? sortDirection = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var (books, _) = await _bookRepository.GetBooksAsync(
            genres,
            minRating,
            searchTerm,
            sortBy,
            sortDirection,
            page,
            pageSize,
            cancellationToken);

        return books;
    }

    /// <inheritdoc/>
    public async Task<Book?> GetBookByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _bookRepository.GetBookByIdAsync(id, cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<Book> CreateBookAsync(CreateBookRequest request, CancellationToken cancellationToken = default)
    {
        // Ensure all genres exist
        var genres = await _genreRepository.EnsureGenresExistAsync(request.Genres, cancellationToken);

        var book = new Book
        {
            Title = request.Title,
            Author = request.Author,
            PublishedDate = request.PublishedDate,
            Rating = request.Rating,
            Edition = request.Edition,
            Isbn = request.Isbn
        };

        // Add genre relationships
        foreach (var genre in genres)
        {
            book.BookGenres.Add(new BookGenre
            {
                Book = book,
                GenreName = genre.Name
            });
        }

        return await _bookRepository.CreateBookAsync(book, cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<Book?> UpdateBookAsync(Guid id, UpdateBookRequest request, CancellationToken cancellationToken = default)
    {
        var existingBook = await _bookRepository.GetBookByIdAsync(id, cancellationToken);
        if (existingBook == null)
        {
            return null;
        }

        // Ensure all genres exist
        var genres = await _genreRepository.EnsureGenresExistAsync(request.Genres, cancellationToken);

        // Update book properties
        existingBook.Title = request.Title;
        existingBook.Author = request.Author;
        existingBook.PublishedDate = request.PublishedDate;
        existingBook.Rating = request.Rating;
        existingBook.Edition = request.Edition;
        existingBook.Isbn = request.Isbn;

        // Update genre relationships
        existingBook.BookGenres.Clear();
        foreach (var genre in genres)
        {
            existingBook.BookGenres.Add(new BookGenre
            {
                BookId = existingBook.Id,
                GenreName = genre.Name
            });
        }

        return await _bookRepository.UpdateBookAsync(existingBook, cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<bool> DeleteBookAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _bookRepository.DeleteBookAsync(id, cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<BookStatsResponse> GetBookStatsAsync(CancellationToken cancellationToken = default)
    {
        var (totalBooks, averageRating, genreStats) = await _bookRepository.GetBooksStatsAsync(cancellationToken);

        var response = new BookStatsResponse
        {
            TotalBooks = totalBooks,
            AverageRating = averageRating,
            GenreDistribution = genreStats.Select(gs => new GenreCount
            {
                Genre = gs.Genre,
                Count = gs.Count,
                AverageRating = gs.AverageRating
            }).ToList()
        };

        return response;
    }
}