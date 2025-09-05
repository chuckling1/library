// <copyright file="Book.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Models
{
    using System.ComponentModel.DataAnnotations;

    /// <summary>
    /// Represents a book in the library collection.
    /// </summary>
    public class Book
    {
        /// <summary>
        /// Gets or sets the unique identifier for the book.
        /// </summary>
        [Key]
        public Guid Id { get; set; }

        /// <summary>
        /// Gets or sets the title of the book.
        /// </summary>
        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the author of the book.
        /// </summary>
        [Required]
        [MaxLength(255)]
        public string Author { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the published date of the book as a string.
        /// Can be a year (e.g., "2020"), year-month (e.g., "2020-05"), or full date (e.g., "2020-05-15").
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string PublishedDate { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the user's rating of the book (1-5).
        /// </summary>
        [Range(1, 5)]
        public int Rating { get; set; }

        /// <summary>
        /// Gets or sets the edition information of the book.
        /// </summary>
        [MaxLength(100)]
        public string? Edition { get; set; }

        /// <summary>
        /// Gets or sets the ISBN of the book.
        /// </summary>
        [MaxLength(20)]
        public string? Isbn { get; set; }

        /// <summary>
        /// Gets or sets the timestamp when the book was created.
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Gets or sets the timestamp when the book was last updated.
        /// </summary>
        public DateTime UpdatedAt { get; set; }

        /// <summary>
        /// Gets or sets the collection of genres associated with this book.
        /// </summary>
        public virtual ICollection<BookGenre> BookGenres { get; set; } = new List<BookGenre>();
    }
}
