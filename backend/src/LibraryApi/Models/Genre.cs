using System.ComponentModel.DataAnnotations;

namespace LibraryApi.Models;

/// <summary>
/// Represents a genre that can be associated with books.
/// </summary>
public class Genre
{
    /// <summary>
    /// Gets or sets the name of the genre (primary key).
    /// </summary>
    [Key]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets a value indicating whether this is a system-defined genre.
    /// </summary>
    public bool IsSystemGenre { get; set; }

    /// <summary>
    /// Gets or sets the timestamp when the genre was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the collection of books associated with this genre.
    /// </summary>
    public virtual ICollection<BookGenre> BookGenres { get; set; } = new List<BookGenre>();
}