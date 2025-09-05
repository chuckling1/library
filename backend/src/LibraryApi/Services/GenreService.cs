// <copyright file="GenreService.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Services
{
    using LibraryApi.Models;
    using LibraryApi.Repositories;

    /// <summary>
    /// Service implementation for genre business logic.
    /// </summary>
    public class GenreService : IGenreService
    {
        private readonly IGenreRepository genreRepository;
        private readonly ILogger<GenreService> logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="GenreService"/> class.
        /// </summary>
        /// <param name="genreRepository">The genre repository.</param>
        /// <param name="logger">The logger.</param>
        public GenreService(IGenreRepository genreRepository, ILogger<GenreService> logger)
        {
            this.genreRepository = genreRepository;
            this.logger = logger;
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<Genre>> GetGenresAsync(string? searchTerm = null, CancellationToken cancellationToken = default)
        {
            return await this.genreRepository.GetGenresAsync(searchTerm, cancellationToken);
        }

        /// <inheritdoc/>
        public async Task<Genre> CreateGenreAsync(string name, CancellationToken cancellationToken = default)
        {
            var genre = new Genre
            {
                Name = name.Trim(),
                IsSystemGenre = false,
                CreatedAt = DateTime.UtcNow,
            };

            return await this.genreRepository.CreateGenreAsync(genre, cancellationToken);
        }
    }
}
