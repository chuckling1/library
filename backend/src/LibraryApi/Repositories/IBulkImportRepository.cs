// <copyright file="IBulkImportRepository.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Repositories
{
    using LibraryApi.Models;

    /// <summary>
    /// Interface for bulk import job repository operations.
    /// </summary>
    public interface IBulkImportRepository
    {
        /// <summary>
        /// Creates a new bulk import job.
        /// </summary>
        /// <param name="job">The bulk import job to create.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The created bulk import job.</returns>
        Task<BulkImportJob> CreateJobAsync(BulkImportJob job, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a bulk import job by its identifier.
        /// </summary>
        /// <param name="jobId">The job identifier.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The bulk import job if found, null otherwise.</returns>
        Task<BulkImportJob?> GetJobAsync(Guid jobId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Updates an existing bulk import job.
        /// </summary>
        /// <param name="job">The bulk import job to update.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The updated bulk import job.</returns>
        Task<BulkImportJob> UpdateJobAsync(BulkImportJob job, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets recent bulk import jobs for tracking purposes.
        /// </summary>
        /// <param name="count">Number of recent jobs to retrieve.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Recent bulk import jobs.</returns>
        Task<IEnumerable<BulkImportJob>> GetRecentJobsAsync(int count = 10, CancellationToken cancellationToken = default);
    }
}
