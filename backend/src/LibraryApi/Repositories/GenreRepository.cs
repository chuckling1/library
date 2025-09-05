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

        /// <inheritdoc/>
        public async Task<List<Genre>> BulkEnsureGenresExistAsync(IEnumerable<string> genreNames, CancellationToken cancellationToken = default)
        {
            var normalizedNames = genreNames.Select(name => name.Trim())
                .Where(name => !string.IsNullOrEmpty(name))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (!normalizedNames.Any())
            {
                return new List<Genre>();
            }

            this.logger.LogDebug("Bulk ensuring {Count} genres exist", normalizedNames.Count);

            // Get all existing genres in one query
            var existingGenres = await this.context.Genres
                .Where(g => normalizedNames.Contains(g.Name))
                .ToListAsync(cancellationToken);

            var existingGenreNames = existingGenres.Select(g => g.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var newGenreNames = normalizedNames.Where(name => !existingGenreNames.Contains(name)).ToList();

            // Create new genres if any are missing
            if (newGenreNames.Any())
            {
                var newGenres = newGenreNames.Select(name => new Genre
                {
                    Name = name,
                    IsSystemGenre = false,
                    CreatedAt = DateTime.UtcNow,
                }).ToList();

                this.context.Genres.AddRange(newGenres);
                await this.context.SaveChangesAsync(cancellationToken);

                existingGenres.AddRange(newGenres);
                this.logger.LogInformation("Created {Count} new genres during bulk operation", newGenres.Count);
            }

            return existingGenres.OrderBy(g => g.Name).ToList();
        }
    }
}
