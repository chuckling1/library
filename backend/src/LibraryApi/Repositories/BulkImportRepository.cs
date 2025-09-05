// <copyright file="BulkImportRepository.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Repositories
{
    using LibraryApi.Data;
    using LibraryApi.Models;
    using Microsoft.EntityFrameworkCore;

    /// <summary>
    /// Repository implementation for bulk import job operations.
    /// </summary>
    public class BulkImportRepository : IBulkImportRepository
    {
        private readonly LibraryDbContext context;
        private readonly ILogger<BulkImportRepository> logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="BulkImportRepository"/> class.
        /// </summary>
        /// <param name="context">The database context.</param>
        /// <param name="logger">The logger.</param>
        public BulkImportRepository(LibraryDbContext context, ILogger<BulkImportRepository> logger)
        {
            this.context = context;
            this.logger = logger;
        }

        /// <inheritdoc/>
        public async Task<BulkImportJob> CreateJobAsync(BulkImportJob job, CancellationToken cancellationToken = default)
        {
            this.context.BulkImportJobs.Add(job);
            await this.context.SaveChangesAsync(cancellationToken);

            this.logger.LogInformation("Created bulk import job {JobId} for file {FileName}", job.Id, job.FileName);
            return job;
        }

        /// <inheritdoc/>
        public async Task<BulkImportJob?> GetJobAsync(Guid jobId, CancellationToken cancellationToken = default)
        {
            return await this.context.BulkImportJobs
                .AsNoTracking()
                .FirstOrDefaultAsync(j => j.Id == jobId, cancellationToken);
        }

        /// <inheritdoc/>
        public async Task<BulkImportJob> UpdateJobAsync(BulkImportJob job, CancellationToken cancellationToken = default)
        {
            this.context.BulkImportJobs.Update(job);
            await this.context.SaveChangesAsync(cancellationToken);

            this.logger.LogDebug("Updated bulk import job {JobId} status to {Status}", job.Id, job.Status);
            return job;
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<BulkImportJob>> GetRecentJobsAsync(int count = 10, CancellationToken cancellationToken = default)
        {
            return await this.context.BulkImportJobs
                .OrderByDescending(j => j.CreatedAt)
                .Take(count)
                .AsNoTracking()
                .ToListAsync(cancellationToken);
        }
    }
}
