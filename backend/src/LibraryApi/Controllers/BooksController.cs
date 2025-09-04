using LibraryApi.Models;
using LibraryApi.Requests;
using LibraryApi.Responses;
using LibraryApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace LibraryApi.Controllers;

/// <summary>
/// Controller for managing books in the library.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class BooksController : ControllerBase
{
    private readonly IBookService _bookService;
    private readonly ILogger<BooksController> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="BooksController"/> class.
    /// </summary>
    /// <param name="bookService">The book service.</param>
    /// <param name="logger">The logger.</param>
    public BooksController(IBookService bookService, ILogger<BooksController> logger)
    {
        _bookService = bookService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all books with optional filtering and pagination.
    /// </summary>
    /// <param name="genres">Optional list of genres to filter by.</param>
    /// <param name="rating">Optional exact rating to filter by.</param>
    /// <param name="search">Optional search term for title/author.</param>
    /// <param name="sortBy">Optional field to sort by.</param>
    /// <param name="sortDirection">Optional sort direction (asc/desc).</param>
    /// <param name="page">Page number (default: 1).</param>
    /// <param name="pageSize">Page size (default: 20, max: 100).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A list of books matching the criteria.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Book>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IEnumerable<Book>>> GetBooks(
        [FromQuery] string[]? genres = null,
        [FromQuery] int? rating = null,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = "asc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (pageSize > 100)
        {
            return BadRequest("Page size cannot exceed 100");
        }

        var books = await _bookService.GetBooksAsync(
            genres,
            rating,
            search,
            sortBy,
            sortDirection,
            page,
            pageSize,
            cancellationToken);

        return Ok(books);
    }

    /// <summary>
    /// Gets a specific book by its ID.
    /// </summary>
    /// <param name="id">The book ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The book if found.</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Book), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Book>> GetBook(Guid id, CancellationToken cancellationToken = default)
    {
        var book = await _bookService.GetBookByIdAsync(id, cancellationToken);
        if (book == null)
        {
            return NotFound();
        }

        return Ok(book);
    }

    /// <summary>
    /// Creates a new book.
    /// </summary>
    /// <param name="request">The book creation request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The created book.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(Book), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Book>> CreateBook(CreateBookRequest request, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var book = await _bookService.CreateBookAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetBook), new { id = book.Id }, book);
    }

    /// <summary>
    /// Updates an existing book.
    /// </summary>
    /// <param name="id">The book ID.</param>
    /// <param name="request">The book update request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The updated book.</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Book), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Book>> UpdateBook(Guid id, UpdateBookRequest request, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var book = await _bookService.UpdateBookAsync(id, request, cancellationToken);
        if (book == null)
        {
            return NotFound();
        }

        return Ok(book);
    }

    /// <summary>
    /// Deletes a book by its ID.
    /// </summary>
    /// <param name="id">The book ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>No content if successful.</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteBook(Guid id, CancellationToken cancellationToken = default)
    {
        var deleted = await _bookService.DeleteBookAsync(id, cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }

    /// <summary>
    /// Gets statistics about the book collection.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Book collection statistics.</returns>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(BookStatsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<BookStatsResponse>> GetBookStats(CancellationToken cancellationToken = default)
    {
        var stats = await _bookService.GetBookStatsAsync(cancellationToken);
        return Ok(stats);
    }
}