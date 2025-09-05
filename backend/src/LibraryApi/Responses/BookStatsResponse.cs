// <copyright file="BookStatsResponse.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Responses;

/// <summary>
/// Response model for book statistics.
/// </summary>
public class BookStatsResponse
{
    /// <summary>
    /// Gets or sets the total number of books.
    /// </summary>
    public int TotalBooks { get; set; }

    /// <summary>
    /// Gets or sets the distribution of books by genre.
    /// </summary>
    public List<GenreCount> GenreDistribution { get; set; } = new List<GenreCount>();

    /// <summary>
    /// Gets or sets the average rating across all books.
    /// </summary>
    public double AverageRating { get; set; }
}
