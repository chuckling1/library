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