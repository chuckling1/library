// <copyright file="IBookService.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Services
{
    using LibraryApi.Models;
    using LibraryApi.Requests;
    using LibraryApi.Responses;

    /// <summary>
    /// Interface for book business logic operations.
    /// </summary>
    public interface IBookService
    {
        /// <summary>
        /// Gets all books with optional filtering, sorting, and pagination.
        /// </summary>
        /// <param name="genres">Optional list of genres to filter by.</param>
        /// <param name="rating">Optional exact rating to filter by.</param>
        /// <param name="searchTerm">Optional search term for title/author.</param>
        /// <param name="sortBy">Optional field to sort by.</param>
        /// <param name="sortDirection">Optional sort direction.</param>
        /// <param name="page">Page number for pagination.</param>
        /// <param name="pageSize">Page size for pagination.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>A list of books matching the criteria.</returns>
        Task<IEnumerable<Book>> GetBooksAsync(
            string[]? genres = null,
            int? rating = null,
            string? searchTerm = null,
            string? sortBy = null,
            string? sortDirection = null,
            int page = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets books with pagination metadata for UI display.
        /// </summary>
        /// <param name="genres">Optional list of genres to filter by.</param>
        /// <param name="rating">Optional exact rating to filter by.</param>
        /// <param name="searchTerm">Optional search term for title/author.</param>
        /// <param name="sortBy">Optional field to sort by.</param>
        /// <param name="sortDirection">Optional sort direction.</param>
        /// <param name="page">Page number for pagination.</param>
        /// <param name="pageSize">Page size for pagination.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>A paginated response with books and metadata.</returns>
        Task<PaginatedResponse<Book>> GetBooksPaginatedAsync(
            string[]? genres = null,
            int? rating = null,
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
        /// Creates a new book from a request.
        /// </summary>
        /// <param name="request">The book creation request.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The created book.</returns>
        Task<Book> CreateBookAsync(CreateBookRequest request, CancellationToken cancellationToken = default);

        /// <summary>
        /// Updates an existing book.
        /// </summary>
        /// <param name="id">The book identifier.</param>
        /// <param name="request">The book update request.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The updated book if found, null otherwise.</returns>
        Task<Book?> UpdateBookAsync(Guid id, UpdateBookRequest request, CancellationToken cancellationToken = default);

        /// <summary>
        /// Deletes a book by its identifier.
        /// </summary>
        /// <param name="id">The book identifier.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>True if the book was deleted, false if not found.</returns>
        Task<bool> DeleteBookAsync(Guid id, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets book collection statistics.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Statistics about the book collection.</returns>
        Task<BookStatsResponse> GetBookStatsAsync(CancellationToken cancellationToken = default);
    }
}
