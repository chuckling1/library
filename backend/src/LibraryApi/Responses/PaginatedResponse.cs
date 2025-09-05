// <copyright file="PaginatedResponse.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Responses
{
    /// <summary>
    /// Represents a paginated response containing data and pagination metadata.
    /// </summary>
    /// <typeparam name="T">The type of data being paginated.</typeparam>
    public class PaginatedResponse<T>
    {
        /// <summary>
        /// Gets or sets the items for the current page.
        /// </summary>
        public IEnumerable<T> Items { get; set; } = new List<T>();

        /// <summary>
        /// Gets or sets the current page number (1-based).
        /// </summary>
        public int Page { get; set; }

        /// <summary>
        /// Gets or sets the number of items per page.
        /// </summary>
        public int PageSize { get; set; }

        /// <summary>
        /// Gets or sets the total number of items across all pages.
        /// </summary>
        public int TotalItems { get; set; }

        /// <summary>
        /// Gets the total number of pages.
        /// </summary>
        public int TotalPages => (int)Math.Ceiling((double)this.TotalItems / this.PageSize);

        /// <summary>
        /// Gets a value indicating whether there is a previous page.
        /// </summary>
        public bool HasPreviousPage => this.Page > 1;

        /// <summary>
        /// Gets a value indicating whether there is a next page.
        /// </summary>
        public bool HasNextPage => this.Page < this.TotalPages;
    }
}
