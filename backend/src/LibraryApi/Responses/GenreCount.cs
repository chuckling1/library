// <copyright file="GenreCount.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Responses;

/// <summary>
/// Represents the count and statistics for a specific genre.
/// </summary>
public class GenreCount
{
    /// <summary>
    /// Gets or sets the genre name.
    /// </summary>
    public string Genre { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the count of books in this genre.
    /// </summary>
    public int Count { get; set; }

    /// <summary>
    /// Gets or sets the average rating for books in this genre.
    /// </summary>
    public double AverageRating { get; set; }
}
