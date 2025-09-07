// <copyright file="BooksController.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Controllers;

using System.Security.Claims;
using LibraryApi.Models;
using LibraryApi.Requests;
using LibraryApi.Responses;
using LibraryApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Controller for managing books in the library.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
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
        this.logger.LogInformation("=== GET BOOKS REQUEST DEBUG ===");
        this.logger.LogInformation("Request from IP: {IP}", this.HttpContext.Connection.RemoteIpAddress);
        this.logger.LogInformation("Authorization Header: {AuthHeader}", 
            this.HttpContext.Request.Headers["Authorization"].FirstOrDefault()?.Substring(0, 50) + "...");
        
        if (pageSize > 100)
        {
            return this.BadRequest("Page size cannot exceed 100");
        }

        var userId = this.GetCurrentUserId();
        this.logger.LogInformation("Processing GetBooks request for UserId: {UserId}", userId);
        
        var paginatedBooks = await this.bookService.GetBooksPaginatedAsync(
            userId,
            genres,
            rating,
            search,
            sortBy,
            sortDirection,
            page,
            pageSize,
            cancellationToken);

        this.logger.LogInformation("Returning {BookCount} books for UserId: {UserId}", 
            paginatedBooks.Items?.Count() ?? 0, userId);

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
        var userId = this.GetCurrentUserId();
        var book = await this.bookService.GetBookByIdAsync(id, userId, cancellationToken);
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

        var userId = this.GetCurrentUserId();
        var book = await this.bookService.CreateBookAsync(request, userId, cancellationToken);
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

        var userId = this.GetCurrentUserId();
        var book = await this.bookService.UpdateBookAsync(id, request, userId, cancellationToken);
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
        var userId = this.GetCurrentUserId();
        var deleted = await this.bookService.DeleteBookAsync(id, userId, cancellationToken);
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
        var userId = this.GetCurrentUserId();
        var stats = await this.bookService.GetBookStatsAsync(userId, cancellationToken);
        return this.Ok(stats);
    }

    /// <summary>
    /// TEMP DEBUG: Shows current user from JWT token.
    /// </summary>
    [HttpGet("debug/whoami")]
    [AllowAnonymous]
    public string WhoAmI()
    {
        var html = "<html><body style='font-family: Arial;'>";
        html += "<h1>Current User Debug</h1>";
        
        if (!this.User.Identity?.IsAuthenticated ?? true)
        {
            html += "<p><strong>Status:</strong> NOT AUTHENTICATED</p>";
            html += "<p>You need to be logged in to see JWT claims.</p>";
        }
        else
        {
            try 
            {
                var userIdClaim = this.User.FindFirst(ClaimTypes.NameIdentifier);
                var allClaims = this.User.Claims.Select(c => new { c.Type, c.Value }).ToList();
                
                html += "<p><strong>Status:</strong> AUTHENTICATED</p>";
                html += $"<p><strong>NameIdentifier Claim:</strong> <code>{userIdClaim?.Value ?? "NULL"}</code></p>";
                
                if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
                {
                    html += $"<p><strong>Extracted UserId:</strong> <code>{userId}</code></p>";
                }
                else
                {
                    html += "<p><strong>ERROR:</strong> Could not extract valid UserId from token!</p>";
                }
                
                html += "<h3>All JWT Claims:</h3><ul>";
                foreach (var claim in allClaims)
                    html += $"<li><strong>{claim.Type}:</strong> {claim.Value}</li>";
                html += "</ul>";
            }
            catch (Exception ex)
            {
                html += $"<p><strong>ERROR:</strong> {ex.Message}</p>";
            }
        }
        
        html += "</body></html>";
        return html;
    }

    /// <summary>
    /// TEMP DEBUG: Shows raw database state for debugging.
    /// </summary>
    [HttpGet("debug/inspect")]
    [AllowAnonymous]
    public string GetDatabaseInspection()
    {
        try 
        {
            using var scope = this.HttpContext.RequestServices.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<Data.LibraryDbContext>();
            
            var users = context.Users.Select(u => new { u.Id, u.Email }).ToList();
            var books = context.Books.Select(b => new { b.Id, b.Title, b.UserId }).ToList();
            
            var html = "<html><body style='font-family: Arial;'>";
            html += "<h1>Database Inspection (DEBUG)</h1>";
            
            html += "<h2>Users:</h2><ul>";
            foreach (var user in users)
                html += $"<li><code>{user.Email}</code> - ID: <code>{user.Id}</code></li>";
            html += "</ul>";
            
            html += "<h2>Books:</h2><ul>";
            foreach (var book in books)
                html += $"<li><strong>{book.Title}</strong> - UserId: <code>{book.UserId}</code></li>";
            html += "</ul>";
            
            html += "<h2>Analysis:</h2>";
            html += $"<p><strong>Total Users:</strong> {users.Count}</p>";
            html += $"<p><strong>Total Books:</strong> {books.Count}</p>";
            
            if (books.Any())
            {
                var booksByUser = books.GroupBy(b => b.UserId).ToList();
                html += "<h3>Books per User:</h3><ul>";
                foreach (var group in booksByUser)
                {
                    var user = users.FirstOrDefault(u => u.Id == group.Key);
                    var userEmail = user?.Email ?? "UNKNOWN USER";
                    html += $"<li><code>{userEmail}</code>: {group.Count()} books</li>";
                }
                html += "</ul>";
            }
            
            html += "</body></html>";
            return html;
        }
        catch (Exception ex)
        {
            return $"<html><body><h1>Error</h1><pre>{ex}</pre></body></html>";
        }
    }


    /// <summary>
    /// Gets the current user's ID from JWT claims.
    /// </summary>
    /// <returns>The current user's ID.</returns>
    private Guid GetCurrentUserId()
    {
        Console.WriteLine("=== USER ID EXTRACTION DEBUG ===");
        Console.WriteLine($"Request Path: {this.HttpContext.Request.Path}");
        Console.WriteLine($"User IsAuthenticated: {this.User.Identity?.IsAuthenticated}");
        
        var allClaims = this.User.Claims.Select(c => new { Type = c.Type, Value = c.Value }).ToList();
        Console.WriteLine($"All Claims Count: {allClaims.Count}");
        foreach (var claim in allClaims)
        {
            Console.WriteLine($"  Claim: {claim.Type} = {claim.Value}");
        }
        
        var userIdClaim = this.User.FindFirst(ClaimTypes.NameIdentifier);
        Console.WriteLine($"NameIdentifier Claim: {userIdClaim?.Value ?? "NULL"}");
        
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            Console.WriteLine($"ERROR: Failed to extract userId from token. UserIdClaim: {userIdClaim?.Value ?? "NULL"}");
            throw new UnauthorizedAccessException("Invalid user token");
        }

        Console.WriteLine($"EXTRACTED UserId: {userId}");
        Console.WriteLine("=== END USER ID EXTRACTION ===");
        return userId;
    }
}
