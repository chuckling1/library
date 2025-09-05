namespace LibraryApi.Requests
{
    using System.ComponentModel.DataAnnotations;

/// <summary>
/// Request model for updating an existing book.
/// </summary>
public class UpdateBookRequest
{
    /// <summary>
    /// Gets or sets the title of the book.
    /// </summary>
    [Required(ErrorMessage = "Title is required")]
    [MaxLength(255, ErrorMessage = "Title cannot exceed 255 characters")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the author of the book.
    /// </summary>
    [Required(ErrorMessage = "Author is required")]
    [MaxLength(255, ErrorMessage = "Author cannot exceed 255 characters")]
    public string Author { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the list of genres for the book.
    /// </summary>
    [Required(ErrorMessage = "At least one genre is required")]
    [MinLength(1, ErrorMessage = "At least one genre is required")]
    public List<string> Genres { get; set; } = new List<string>();

    /// <summary>
    /// Gets or sets the published date of the book as a string.
    /// Can be a year (e.g., "2020"), year-month (e.g., "2020-05"), or full date (e.g., "2020-05-15").
    /// </summary>
    [Required(ErrorMessage = "Published date is required")]
    [MaxLength(50, ErrorMessage = "Published date cannot exceed 50 characters")]
    public string PublishedDate { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the user's rating of the book.
    /// </summary>
    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
    public int Rating { get; set; }

    /// <summary>
    /// Gets or sets the edition of the book.
    /// </summary>
    [MaxLength(100, ErrorMessage = "Edition cannot exceed 100 characters")]
    public string? Edition { get; set; }

    /// <summary>
    /// Gets or sets the ISBN of the book.
    /// </summary>
    [MaxLength(20, ErrorMessage = "ISBN cannot exceed 20 characters")]
    public string? Isbn { get; set; }
}
}