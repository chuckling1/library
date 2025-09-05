// <copyright file="BulkImportController.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Controllers;

using LibraryApi.Models;
using LibraryApi.Responses;
using LibraryApi.Services;
using Microsoft.AspNetCore.Mvc;

/// <summary>
/// Controller for bulk import operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class BulkImportController : ControllerBase
{
    private readonly IBulkImportService bulkImportService;
    private readonly ILogger<BulkImportController> logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="BulkImportController"/> class.
    /// </summary>
    /// <param name="bulkImportService">The bulk import service.</param>
    /// <param name="logger">The logger.</param>
    public BulkImportController(IBulkImportService bulkImportService, ILogger<BulkImportController> logger)
    {
        this.bulkImportService = bulkImportService;
        this.logger = logger;
    }

    /// <summary>
    /// Imports books in bulk from a CSV file.
    /// </summary>
    /// <param name="file">The CSV file containing book data.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The result of the bulk import operation.</returns>
    [HttpPost("books")]
    [ProducesResponseType(typeof(BulkImportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<BulkImportResponse>> BulkImportBooks(
        IFormFile file,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
        {
            this.logger.LogWarning("Bulk import attempted with no file uploaded");
            return this.BadRequest("No file uploaded. Please select a CSV file to import.");
        }

        if (!this.IsValidFileType(file))
        {
            this.logger.LogWarning(
                "Invalid file type uploaded: {ContentType} for file: {FileName}",
                file.ContentType,
                file.FileName);
            return this.BadRequest("Invalid file type. Please upload a CSV file (.csv).");
        }

        const long maxFileSize = 10 * 1024 * 1024; // 10MB
        if (file.Length > maxFileSize)
        {
            this.logger.LogWarning(
                "File too large uploaded: {FileSize} bytes for file: {FileName}",
                file.Length,
                file.FileName);
            return this.StatusCode(
                StatusCodes.Status413PayloadTooLarge,
                "File too large. Maximum allowed size is 10MB.");
        }

        try
        {
            this.logger.LogInformation(
                "Starting bulk import for file: {FileName} ({FileSize} bytes)",
                file.FileName,
                file.Length);

            using var stream = file.OpenReadStream();
            var options = new BulkImportOptions
            {
                DuplicateStrategy = DuplicateHandling.Skip,
                OpenLibraryBatchSize = 10,
                OpenLibraryBatchDelay = 1000,
            };

            var result = await this.bulkImportService.ProcessBulkImportAsync(
                stream,
                file.FileName,
                options,
                cancellationToken);

            var response = new BulkImportResponse
            {
                JobId = result.Id,
                TotalRows = result.TotalRows,
                ValidRows = result.ValidRows,
                ErrorRows = result.ErrorRows,
                Status = result.Status.ToString(),
                ErrorSummary = this.GetErrorSummary(result),
            };

            this.logger.LogInformation(
                "Completed bulk import for file: {FileName}. Results: {ValidRows} successful, {ErrorRows} errors",
                file.FileName,
                result.ValidRows,
                result.ErrorRows);

            return this.Ok(response);
        }
        catch (Exception ex)
        {
            this.logger.LogError(ex, "Bulk import failed for file: {FileName}", file.FileName);
            return this.StatusCode(
                StatusCodes.Status500InternalServerError,
                "Import failed due to an internal error. Please check your file format and try again.");
        }
    }

    /// <summary>
    /// Gets the status of a bulk import job.
    /// </summary>
    /// <param name="jobId">The bulk import job identifier.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The current status of the import job.</returns>
    [HttpGet("jobs/{jobId}")]
    [ProducesResponseType(typeof(BulkImportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BulkImportResponse>> GetImportJobStatus(
        Guid jobId,
        CancellationToken cancellationToken = default)
    {
        var job = await this.bulkImportService.GetImportJobStatusAsync(jobId, cancellationToken);

        if (job == null)
        {
            return this.NotFound($"Import job with ID {jobId} not found.");
        }

        var response = new BulkImportResponse
        {
            JobId = job.Id,
            TotalRows = job.TotalRows,
            ValidRows = job.ValidRows,
            ErrorRows = job.ErrorRows,
            Status = job.Status.ToString(),
            ErrorSummary = this.GetErrorSummary(job),
        };

        return this.Ok(response);
    }

    /// <summary>
    /// Exports books to CSV format.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A CSV file containing all books or a template if no books exist.</returns>
    [HttpGet("export/books")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportBooks(CancellationToken cancellationToken = default)
    {
        try
        {
            this.logger.LogInformation("Starting book export to CSV");

            var csvContent = await this.bulkImportService.ExportBooksToCSVAsync(cancellationToken);
            var bytes = System.Text.Encoding.UTF8.GetBytes(csvContent);

            this.logger.LogInformation("Completed book export, size: {Size} bytes", bytes.Length);

            return this.File(
                bytes,
                "text/csv",
                $"library_export_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv");
        }
        catch (Exception ex)
        {
            this.logger.LogError(ex, "Failed to export books to CSV");
            return this.StatusCode(
                StatusCodes.Status500InternalServerError,
                "Export failed due to an internal error.");
        }
    }

    private bool IsValidFileType(IFormFile file)
    {
        // Check file extension
        var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant();
        if (extension != ".csv")
        {
            return false;
        }

        // Check MIME type
        var allowedMimeTypes = new[] { "text/csv", "application/csv", "text/plain" };
        return allowedMimeTypes.Contains(file.ContentType?.ToLowerInvariant());
    }

    private string? GetErrorSummary(BulkImportJob job)
    {
        if (job.ErrorRows == 0 || string.IsNullOrEmpty(job.ErrorSummaryJson))
        {
            return null;
        }

        // For now, return a simple summary
        // In production, you might want to parse the JSON and create a more user-friendly summary
        return job.ErrorRows == 1
            ? $"1 row had validation errors."
            : $"{job.ErrorRows} rows had validation errors.";
    }
}
