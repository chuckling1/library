// <copyright file="GenreRepository.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Repositories
{
    using LibraryApi.Data;
    using LibraryApi.Models;
    using Microsoft.EntityFrameworkCore;

    /// <summary>
    /// Repository implementation for genre operations.
    /// </summary>
    public class GenreRepository : IGenreRepository
    {
        private readonly LibraryDbContext context;
        private readonly ILogger<GenreRepository> logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="GenreRepository"/> class.
        /// </summary>
        /// <param name="context">The database context.</param>
        /// <param name="logger">The logger.</param>
        public GenreRepository(LibraryDbContext context, ILogger<GenreRepository> logger)
        {
            this.context = context;
            this.logger = logger;
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<Genre>> GetGenresAsync(string? searchTerm = null, CancellationToken cancellationToken = default)
        {
            var query = this.context.Genres.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(g => EF.Functions.Like(g.Name.ToLower(), $"%{searchTerm.ToLower()}%"));
            }

            return await query.OrderBy(g => g.Name).ToListAsync(cancellationToken);
        }

        /// <inheritdoc/>
        public async Task<Genre?> GetGenreByNameAsync(string name, CancellationToken cancellationToken = default)
        {
            return await this.context.Genres
                .AsNoTracking()
                .FirstOrDefaultAsync(g => g.Name.ToLower() == name.ToLower(), cancellationToken);
        }

        /// <inheritdoc/>
        public async Task<Genre> CreateGenreAsync(Genre genre, CancellationToken cancellationToken = default)
        {
            var existing = await this.GetGenreByNameAsync(genre.Name, cancellationToken);
            if (existing != null)
            {
                return existing;
            }

            this.context.Genres.Add(genre);
            await this.context.SaveChangesAsync(cancellationToken);
            return genre;
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<Genre>> EnsureGenresExistAsync(IEnumerable<string> genreNames, CancellationToken cancellationToken = default)
        {
            var genres = new List<Genre>();
            var processedNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var genreName in genreNames)
            {
                var normalizedName = genreName.Trim();

                // Skip duplicates (case-insensitive)
                if (!processedNames.Add(normalizedName))
                {
                    continue;
                }

                var existing = await this.GetGenreByNameAsync(normalizedName, cancellationToken);

                if (existing != null)
                {
                    genres.Add(existing);
                }
                else
                {
                    var newGenre = new Genre
                    {
                        Name = normalizedName,
                        IsSystemGenre = false,
                        CreatedAt = DateTime.UtcNow,
                    };

                    var created = await this.CreateGenreAsync(newGenre, cancellationToken);
                    genres.Add(created);
                }
            }

            return genres;
        }
    }
}
