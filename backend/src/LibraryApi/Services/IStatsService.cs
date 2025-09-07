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
        /// Gets comprehensive book collection statistics for a specific user.
        /// </summary>
        /// <param name="userId">The ID of the user whose stats to retrieve.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Statistics about the user's book collection.</returns>
        Task<BookStatsResponse> GetBookStatsAsync(Guid userId, CancellationToken cancellationToken = default);
    }
}
