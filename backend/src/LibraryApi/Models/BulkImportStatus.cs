// <copyright file="BulkImportStatus.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Models
{
    /// <summary>
    /// Enumeration representing the status of a bulk import job.
    /// </summary>
    public enum BulkImportStatus
    {
        /// <summary>
        /// Import job is in progress.
        /// </summary>
        InProgress,

        /// <summary>
        /// Import job completed successfully.
        /// </summary>
        Completed,

        /// <summary>
        /// Import job failed with errors.
        /// </summary>
        Failed,

        /// <summary>
        /// Import job completed with some validation errors.
        /// </summary>
        CompletedWithErrors,
    }
}
