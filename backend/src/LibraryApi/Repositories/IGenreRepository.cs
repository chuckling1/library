// <copyright file="IGenreRepository.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Repositories
{
    using LibraryApi.Models;

    /// <summary>
    /// Interface for genre repository operations.
    /// </summary>
    public interface IGenreRepository
    {
        /// <summary>
        /// Gets all genres with optional search filtering.
        /// </summary>
        /// <param name="searchTerm">Optional search term for genre names.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>A list of genres matching the criteria.</returns>
        Task<IEnumerable<Genre>> GetGenresAsync(string? searchTerm = null, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a genre by its name.
        /// </summary>
        /// <param name="name">The genre name.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The genre if found, null otherwise.</returns>
        Task<Genre?> GetGenreByNameAsync(string name, CancellationToken cancellationToken = default);

        /// <summary>
        /// Creates a new genre if it doesn't already exist.
        /// </summary>
        /// <param name="genre">The genre to create.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The created or existing genre.</returns>
        Task<Genre> CreateGenreAsync(Genre genre, CancellationToken cancellationToken = default);

        /// <summary>
        /// Ensures that all specified genres exist, creating them if necessary.
        /// </summary>
        /// <param name="genreNames">The list of genre names to ensure exist.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The list of existing genres.</returns>
        Task<IEnumerable<Genre>> EnsureGenresExistAsync(IEnumerable<string> genreNames, CancellationToken cancellationToken = default);

        /// <summary>
        /// Bulk ensures that all specified genres exist with optimized batch processing.
        /// </summary>
        /// <param name="genreNames">The list of genre names to ensure exist.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The list of existing genres.</returns>
        Task<List<Genre>> BulkEnsureGenresExistAsync(IEnumerable<string> genreNames, CancellationToken cancellationToken = default);
    }
}
