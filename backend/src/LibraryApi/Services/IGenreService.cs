// <copyright file="IGenreService.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Services
{
    using LibraryApi.Models;

    /// <summary>
    /// Interface for genre business logic operations.
    /// </summary>
    public interface IGenreService
    {
        /// <summary>
        /// Gets all genres with optional search filtering.
        /// </summary>
        /// <param name="searchTerm">Optional search term for genre names.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>A list of genres matching the criteria.</returns>
        Task<IEnumerable<Genre>> GetGenresAsync(string? searchTerm = null, CancellationToken cancellationToken = default);

        /// <summary>
        /// Creates a new genre.
        /// </summary>
        /// <param name="name">The genre name.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The created genre.</returns>
        Task<Genre> CreateGenreAsync(string name, CancellationToken cancellationToken = default);
    }
}
