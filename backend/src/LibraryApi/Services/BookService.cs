// <copyright file="BookService.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Services
{
    using LibraryApi.Models;
    using LibraryApi.Repositories;
    using LibraryApi.Requests;
    using LibraryApi.Responses;

    /// <summary>
    /// Service implementation for book business logic.
    /// </summary>
    public class BookService : IBookService
    {
        private readonly IBookRepository bookRepository;
        private readonly IGenreRepository genreRepository;
        private readonly ILogger<BookService> logger;

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
            this.bookRepository = bookRepository;
            this.genreRepository = genreRepository;
            this.logger = logger;
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<Book>> GetBooksAsync(
            Guid userId,
            string[]? genres = null,
            int? rating = null,
            string? searchTerm = null,
            string? sortBy = null,
            string? sortDirection = null,
            int page = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            var (books, _) = await this.bookRepository.GetBooksAsync(
                userId,
                genres,
                rating,
                searchTerm,
                sortBy,
                sortDirection,
                page,
                pageSize,
                cancellationToken);

            return books;
        }

        /// <inheritdoc/>
        public async Task<PaginatedResponse<Book>> GetBooksPaginatedAsync(
            Guid userId,
            string[]? genres = null,
            int? rating = null,
            string? searchTerm = null,
            string? sortBy = null,
            string? sortDirection = null,
            int page = 1,
            int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            var (books, totalCount) = await this.bookRepository.GetBooksAsync(
                userId,
                genres,
                rating,
                searchTerm,
                sortBy,
                sortDirection,
                page,
                pageSize,
                cancellationToken);

            return new PaginatedResponse<Book>
            {
                Items = books,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalCount,
            };
        }

        /// <inheritdoc/>
        public async Task<Book?> GetBookByIdAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
        {
            return await this.bookRepository.GetBookByIdAsync(id, userId, cancellationToken);
        }

        /// <inheritdoc/>
        public async Task<Book> CreateBookAsync(CreateBookRequest request, Guid userId, CancellationToken cancellationToken = default)
        {
            // Ensure all genres exist
            var genres = await this.genreRepository.EnsureGenresExistAsync(request.Genres, cancellationToken);

            var book = new Book
            {
                Title = request.Title,
                Author = request.Author,
                PublishedDate = request.PublishedDate,
                Rating = request.Rating,
                Edition = request.Edition,
                Isbn = request.Isbn,
                UserId = userId,
            };

            // Add genre relationships
            foreach (var genre in genres)
            {
                book.BookGenres.Add(new BookGenre
                {
                    Book = book,
                    GenreName = genre.Name,
                });
            }

            return await this.bookRepository.CreateBookAsync(book, cancellationToken);
        }

        /// <inheritdoc/>
        public async Task<Book?> UpdateBookAsync(Guid id, UpdateBookRequest request, Guid userId, CancellationToken cancellationToken = default)
        {
            var existingBook = await this.bookRepository.GetBookForUpdateAsync(id, userId, cancellationToken);
            if (existingBook == null)
            {
                return null;
            }

            // Ensure all genres exist
            var genres = await this.genreRepository.EnsureGenresExistAsync(request.Genres, cancellationToken);

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
                    GenreName = genre.Name,
                });
            }

            return await this.bookRepository.UpdateBookAsync(existingBook, cancellationToken);
        }

        /// <inheritdoc/>
        public async Task<bool> DeleteBookAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
        {
            return await this.bookRepository.DeleteBookAsync(id, userId, cancellationToken);
        }

        /// <inheritdoc/>
        public async Task<BookStatsResponse> GetBookStatsAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            var (totalBooks, averageRating, genreStats) = await this.bookRepository.GetBooksStatsAsync(userId, cancellationToken);

            var response = new BookStatsResponse
            {
                TotalBooks = totalBooks,
                AverageRating = averageRating,
                GenreDistribution = genreStats.Select(gs => new GenreCount
                {
                    Genre = gs.Genre,
                    Count = gs.Count,
                    AverageRating = gs.AverageRating,
                }).ToList(),
            };

            return response;
        }
    }
}
