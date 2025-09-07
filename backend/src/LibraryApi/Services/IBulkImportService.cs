// <copyright file="IBulkImportService.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Services
{
    using LibraryApi.Models;

    /// <summary>
    /// Interface for bulk import operations with comprehensive validation and OpenLibrary enrichment.
    /// </summary>
    public interface IBulkImportService
    {
        /// <summary>
        /// Processes a bulk import operation from a CSV file stream.
        /// </summary>
        /// <param name="fileStream">The CSV file stream to process.</param>
        /// <param name="fileName">The name of the uploaded file.</param>
        /// <param name="options">Configuration options for the import operation.</param>
        /// <param name="userId">The ID of the user who owns the imported books.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The completed bulk import job with results.</returns>
        Task<BulkImportJob> ProcessBulkImportAsync(
            Stream fileStream,
            string fileName,
            BulkImportOptions options,
            Guid userId,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Parses and validates CSV data into book import candidates.
        /// </summary>
        /// <param name="fileStream">The CSV file stream to parse.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>A tuple containing validated candidates and any parse errors.</returns>
        Task<(List<BookImportCandidate> Candidates, List<BulkImportValidationError> Errors)> ParseAndValidateAsync(
            Stream fileStream,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Enriches book candidates with data from OpenLibrary API.
        /// </summary>
        /// <param name="candidates">The book candidates to enrich.</param>
        /// <param name="options">Import options containing batch size and delay settings.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The enriched book candidates with OpenLibrary data.</returns>
        Task<List<BookImportCandidate>> EnrichWithOpenLibraryAsync(
            List<BookImportCandidate> candidates,
            BulkImportOptions options,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Executes the bulk database import operation with transaction management.
        /// </summary>
        /// <param name="jobId">The import job identifier for tracking.</param>
        /// <param name="candidates">The validated and enriched book candidates.</param>
        /// <param name="options">Import options containing duplicate handling strategy.</param>
        /// <param name="userId">The ID of the user who owns the imported books.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The updated bulk import job with final results.</returns>
        Task<BulkImportJob> ExecuteBulkImportAsync(
            Guid jobId,
            List<BookImportCandidate> candidates,
            BulkImportOptions options,
            Guid userId,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the status of a bulk import job.
        /// </summary>
        /// <param name="jobId">The import job identifier.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The current status of the import job.</returns>
        Task<BulkImportJob?> GetImportJobStatusAsync(Guid jobId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Exports all books for the specified user to CSV format.
        /// </summary>
        /// <param name="userId">The ID of the user whose books to export.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>CSV content as a string.</returns>
        Task<string> ExportBooksToCSVAsync(Guid userId, CancellationToken cancellationToken = default);
    }
}
