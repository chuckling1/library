// <copyright file="BulkImportValidationError.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Models
{
    /// <summary>
    /// Represents a validation error that occurred during bulk import processing.
    /// </summary>
    public class BulkImportValidationError
    {
        /// <summary>
        /// Gets or sets the row number where the validation error occurred.
        /// </summary>
        public int RowNumber { get; set; }

        /// <summary>
        /// Gets or sets the field name that failed validation.
        /// </summary>
        public string Field { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the validation error message.
        /// </summary>
        public string ErrorMessage { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the original value that caused the validation error.
        /// </summary>
        public string? OriginalValue { get; set; }
    }
}
