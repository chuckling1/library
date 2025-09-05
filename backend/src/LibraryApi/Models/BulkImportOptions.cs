// <copyright file="BulkImportOptions.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Models
{
    /// <summary>
    /// Enumeration for duplicate handling strategies during bulk import.
    /// </summary>
    public enum DuplicateHandling
    {
        /// <summary>
        /// Skip duplicate books and continue with import.
        /// </summary>
        Skip,

        /// <summary>
        /// Fail the entire import operation if duplicates are found.
        /// </summary>
        Fail,

        /// <summary>
        /// Allow duplicate books to be imported.
        /// </summary>
        Allow,
    }

    /// <summary>
    /// Configuration options for bulk import operations.
    /// </summary>
    public class BulkImportOptions
    {
        /// <summary>
        /// Gets or sets the strategy for handling duplicate books.
        /// </summary>
        public DuplicateHandling DuplicateStrategy { get; set; } = DuplicateHandling.Skip;

        /// <summary>
        /// Gets or sets the maximum number of OpenLibrary API calls per batch.
        /// </summary>
        public int OpenLibraryBatchSize { get; set; } = 10;

        /// <summary>
        /// Gets or sets the delay between OpenLibrary API batches in milliseconds.
        /// </summary>
        public int OpenLibraryBatchDelay { get; set; } = 1000;
    }
}
