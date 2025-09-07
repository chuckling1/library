// <copyright file="IBookRepository.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Repositories
{
    using LibraryApi.Models;

    /// <summary>
    /// Interface for book repository operations.
    /// </summary>
    public interface IBookRepository
    {
        /// <summary>
        /// Gets all books with optional filtering and sorting for a specific user.
        /// </summary>
        /// <param name="userId">The ID of the user whose books to retrieve.</param>
        /// <param name="genres">Optional list of genres to filter by.</param>
        /// <param name="rating">Optional exact rating to filter by.</param>
        /// <param name="searchTerm">Optional search term for title/author.</param>
        /// <param name="sortBy">Optional field to sort by.</param>
        /// <param name="sortDirection">Optional sort direction.</param>
        /// <param name="page">Page number for pagination.</param>
        /// <param name="pageSize">Page size for pagination.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>A tuple containing the books and total count.</returns>
        Task<(IEnumerable<Book> Books, int TotalCount)> GetBooksAsync(
            Guid userId,
            IEnumerable<string>? genres = null,
            int? rating = null,
            string? searchTerm = null,
            string? sortBy = null,
            string? sortDirection = null,
            int page = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a book by its identifier for a specific user.
        /// </summary>
        /// <param name="id">The book identifier.</param>
        /// <param name="userId">The ID of the user who should own the book.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The book if found and owned by user, null otherwise.</returns>
        Task<Book?> GetBookByIdAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a book by its identifier for updating (with tracking enabled) for a specific user.
        /// </summary>
        /// <param name="id">The book identifier.</param>
        /// <param name="userId">The ID of the user who should own the book.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The book if found and owned by user, null otherwise, with tracking enabled for updates.</returns>
        Task<Book?> GetBookForUpdateAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

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
        /// Deletes a book by its identifier for a specific user.
        /// </summary>
        /// <param name="id">The book identifier.</param>
        /// <param name="userId">The ID of the user who should own the book.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>True if the book was deleted, false if not found or not owned by user.</returns>
        Task<bool> DeleteBookAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets books statistics for dashboard for a specific user.
        /// </summary>
        /// <param name="userId">The ID of the user whose stats to retrieve.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Statistics about books and genres for the user.</returns>
        Task<(int TotalBooks, double AverageRating, IEnumerable<(string Genre, int Count, double AverageRating)> GenreStats)> GetBooksStatsAsync(Guid userId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets recently added books for a specific user.
        /// </summary>
        /// <param name="userId">The ID of the user whose recent books to retrieve.</param>
        /// <param name="count">Number of recent books to retrieve.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Recently added books for the user.</returns>
        Task<IEnumerable<Book>> GetRecentBooksAsync(Guid userId, int count = 5, CancellationToken cancellationToken = default);

        /// <summary>
        /// Creates multiple books in a single transaction with bulk optimization.
        /// </summary>
        /// <param name="books">The books to create.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The created books.</returns>
        Task<List<Book>> BulkCreateBooksAsync(List<Book> books, CancellationToken cancellationToken = default);

        /// <summary>
        /// Finds duplicate books by title and author combinations for a specific user.
        /// </summary>
        /// <param name="titleAuthorPairs">The title-author pairs to check for duplicates.</param>
        /// <param name="userId">The ID of the user to check duplicates for.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>A dictionary mapping "title|author" keys to existing Book entities.</returns>
        Task<Dictionary<string, Book>> FindDuplicateBooksByTitleAuthorAsync(
            List<(string Title, string Author)> titleAuthorPairs,
            Guid userId,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets all books with their genres for export for a specific user.
        /// </summary>
        /// <param name="userId">The ID of the user whose books to retrieve.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>All books in the user's library.</returns>
        Task<IEnumerable<Book>> GetAllBooksAsync(Guid userId, CancellationToken cancellationToken = default);
    }
}
