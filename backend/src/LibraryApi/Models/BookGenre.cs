// <copyright file="BookGenre.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Models
{
    using Microsoft.EntityFrameworkCore;

    /// <summary>
    /// Junction table for the many-to-many relationship between books and genres.
    /// </summary>
    [PrimaryKey(nameof(BookId), nameof(GenreName))]
    public class BookGenre
    {
        /// <summary>
        /// Gets or sets the book identifier.
        /// </summary>
        public Guid BookId { get; set; }

        /// <summary>
        /// Gets or sets the genre name.
        /// </summary>
        public string GenreName { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the navigation property to the book.
        /// </summary>
        public virtual Book Book { get; set; } = null!;

        /// <summary>
        /// Gets or sets the navigation property to the genre.
        /// </summary>
        public virtual Genre Genre { get; set; } = null!;
    }
}
