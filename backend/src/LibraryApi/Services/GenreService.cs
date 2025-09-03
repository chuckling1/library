using LibraryApi.Models;
using LibraryApi.Repositories;

namespace LibraryApi.Services;

/// <summary>
/// Service implementation for genre business logic.
/// </summary>
public class GenreService : IGenreService
{
    private readonly IGenreRepository _genreRepository;
    private readonly ILogger<GenreService> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="GenreService"/> class.
    /// </summary>
    /// <param name="genreRepository">The genre repository.</param>
    /// <param name="logger">The logger.</param>
    public GenreService(IGenreRepository genreRepository, ILogger<GenreService> logger)
    {
        _genreRepository = genreRepository;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Genre>> GetGenresAsync(string? searchTerm = null, CancellationToken cancellationToken = default)
    {
        return await _genreRepository.GetGenresAsync(searchTerm, cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<Genre> CreateGenreAsync(string name, CancellationToken cancellationToken = default)
    {
        var genre = new Genre
        {
            Name = name.Trim(),
            IsSystemGenre = false,
            CreatedAt = DateTime.UtcNow
        };

        return await _genreRepository.CreateGenreAsync(genre, cancellationToken);
    }
}