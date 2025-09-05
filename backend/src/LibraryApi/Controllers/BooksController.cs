// <copyright file="BooksController.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Controllers;

using LibraryApi.Models;
using LibraryApi.Requests;
using LibraryApi.Responses;
using LibraryApi.Services;
using Microsoft.AspNetCore.Mvc;

/// <summary>
/// Controller for managing books in the library.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class BooksController : ControllerBase
{
    private readonly IBookService bookService;
    private readonly ILogger<BooksController> logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="BooksController"/> class.
    /// </summary>
    /// <param name="bookService">The book service.</param>
    /// <param name="logger">The logger.</param>
    public BooksController(IBookService bookService, ILogger<BooksController> logger)
    {
        this.bookService = bookService;
        this.logger = logger;
    }

    /// <summary>
    /// Gets all books with optional filtering and pagination (returns paginated response with metadata).
    /// </summary>
    /// <param name="genres">Optional list of genres to filter by.</param>
    /// <param name="rating">Optional exact rating to filter by.</param>
    /// <param name="search">Optional search term for title/author.</param>
    /// <param name="sortBy">Optional field to sort by.</param>
    /// <param name="sortDirection">Optional sort direction (asc/desc).</param>
    /// <param name="page">Page number (default: 1).</param>
    /// <param name="pageSize">Page size (default: 20, max: 100).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A paginated response with books and metadata.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<Book>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PaginatedResponse<Book>>> GetBooks(
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
            return this.BadRequest("Page size cannot exceed 100");
        }

        var paginatedBooks = await this.bookService.GetBooksPaginatedAsync(
            genres,
            rating,
            search,
            sortBy,
            sortDirection,
            page,
            pageSize,
            cancellationToken);

        return this.Ok(paginatedBooks);
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
        var book = await this.bookService.GetBookByIdAsync(id, cancellationToken);
        if (book == null)
        {
            return this.NotFound();
        }

        return this.Ok(book);
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
        if (!this.ModelState.IsValid)
        {
            return this.BadRequest(this.ModelState);
        }

        var book = await this.bookService.CreateBookAsync(request, cancellationToken);
        return this.CreatedAtAction(nameof(this.GetBook), new { id = book.Id }, book);
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
        if (!this.ModelState.IsValid)
        {
            return this.BadRequest(this.ModelState);
        }

        var book = await this.bookService.UpdateBookAsync(id, request, cancellationToken);
        if (book == null)
        {
            return this.NotFound();
        }

        return this.Ok(book);
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
        var deleted = await this.bookService.DeleteBookAsync(id, cancellationToken);
        if (!deleted)
        {
            return this.NotFound();
        }

        return this.NoContent();
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
        var stats = await this.bookService.GetBookStatsAsync(cancellationToken);
        return this.Ok(stats);
    }
}
