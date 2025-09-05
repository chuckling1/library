// <copyright file="IStatsService.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Services
{
    using LibraryApi.Responses;

    /// <summary>
    /// Interface for statistics business logic operations.
    /// </summary>
    public interface IStatsService
    {
        /// <summary>
        /// Gets comprehensive book collection statistics.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Statistics about the book collection.</returns>
        Task<BookStatsResponse> GetBookStatsAsync(CancellationToken cancellationToken = default);
    }
}
