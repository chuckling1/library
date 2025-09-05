// <copyright file="BulkImportResponse.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Responses
{
    /// <summary>
    /// Response model for bulk import operations.
    /// </summary>
    public class BulkImportResponse
    {
        /// <summary>
        /// Gets or sets the unique identifier of the import job.
        /// </summary>
        public Guid JobId { get; set; }

        /// <summary>
        /// Gets or sets the total number of rows in the import file.
        /// </summary>
        public int TotalRows { get; set; }

        /// <summary>
        /// Gets or sets the number of valid rows that were successfully imported.
        /// </summary>
        public int ValidRows { get; set; }

        /// <summary>
        /// Gets or sets the number of rows that had validation errors.
        /// </summary>
        public int ErrorRows { get; set; }

        /// <summary>
        /// Gets or sets the current status of the import operation.
        /// </summary>
        public string Status { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets a summary of validation errors, if any occurred.
        /// </summary>
        public string? ErrorSummary { get; set; }
    }
}
