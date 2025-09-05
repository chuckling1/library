// <copyright file="BookImportCandidate.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Models
{
    /// <summary>
    /// Represents a book candidate for bulk import with validation state and OpenLibrary enrichment.
    /// </summary>
    public class BookImportCandidate
    {
        /// <summary>
        /// Gets or sets the row number in the source file.
        /// </summary>
        public int RowNumber { get; set; }

        /// <summary>
        /// Gets or sets the title of the book.
        /// </summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the author of the book.
        /// </summary>
        public string Author { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the list of genres for the book.
        /// </summary>
        public List<string> Genres { get; set; } = new List<string>();

        /// <summary>
        /// Gets or sets the published date of the book as a string.
        /// </summary>
        public string PublishedDate { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the user's rating of the book.
        /// </summary>
        public int Rating { get; set; }

        /// <summary>
        /// Gets or sets the edition of the book.
        /// </summary>
        public string? Edition { get; set; }

        /// <summary>
        /// Gets or sets the ISBN of the book.
        /// </summary>
        public string? Isbn { get; set; }

        /// <summary>
        /// Gets or sets the OpenLibrary identifier for enrichment data.
        /// </summary>
        public string? OpenLibraryId { get; set; }

        /// <summary>
        /// Gets or sets the cover image URL from OpenLibrary.
        /// </summary>
        public string? CoverImageUrl { get; set; }

        /// <summary>
        /// Gets or sets the book description from OpenLibrary.
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Gets or sets the page count from OpenLibrary.
        /// </summary>
        public int? PageCount { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether this candidate passed all validations.
        /// </summary>
        public bool IsValid { get; set; }

        /// <summary>
        /// Gets or sets the list of validation errors for this candidate.
        /// </summary>
        public List<BulkImportValidationError> ValidationErrors { get; set; } = new List<BulkImportValidationError>();
    }
}
