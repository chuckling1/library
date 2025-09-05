// <copyright file="BulkImportJob.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Models
{
    using System.ComponentModel.DataAnnotations;

    /// <summary>
    /// Represents a bulk import job for tracking import operations.
    /// </summary>
    public class BulkImportJob
    {
        /// <summary>
        /// Gets or sets the unique identifier for the import job.
        /// </summary>
        [Key]
        public Guid Id { get; set; }

        /// <summary>
        /// Gets or sets the name of the uploaded file.
        /// </summary>
        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the current status of the import job.
        /// </summary>
        public BulkImportStatus Status { get; set; }

        /// <summary>
        /// Gets or sets the total number of rows in the import file.
        /// </summary>
        public int TotalRows { get; set; }

        /// <summary>
        /// Gets or sets the number of valid rows that were successfully processed.
        /// </summary>
        public int ValidRows { get; set; }

        /// <summary>
        /// Gets or sets the number of rows that had validation errors.
        /// </summary>
        public int ErrorRows { get; set; }

        /// <summary>
        /// Gets or sets the number of rows that were processed.
        /// </summary>
        public int ProcessedRows { get; set; }

        /// <summary>
        /// Gets or sets the JSON serialized error summary for failed validations.
        /// </summary>
        public string? ErrorSummaryJson { get; set; }

        /// <summary>
        /// Gets or sets the timestamp when the import job was created.
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Gets or sets the timestamp when the import job was completed.
        /// </summary>
        public DateTime? CompletedAt { get; set; }
    }
}
