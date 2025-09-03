using LibraryApi.Data;
using LibraryApi.Models;
using Microsoft.EntityFrameworkCore;

namespace LibraryApi.Repositories;

/// <summary>
/// Repository implementation for genre operations.
/// </summary>
public class GenreRepository : IGenreRepository
{
    private readonly LibraryDbContext _context;
    private readonly ILogger<GenreRepository> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="GenreRepository"/> class.
    /// </summary>
    /// <param name="context">The database context.</param>
    /// <param name="logger">The logger.</param>
    public GenreRepository(LibraryDbContext context, ILogger<GenreRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Genre>> GetGenresAsync(string? searchTerm = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Genres.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(g => g.Name.Contains(searchTerm));
        }

        return await query.OrderBy(g => g.Name).ToListAsync(cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<Genre?> GetGenreByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await _context.Genres
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Name == name, cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<Genre> CreateGenreAsync(Genre genre, CancellationToken cancellationToken = default)
    {
        var existing = await GetGenreByNameAsync(genre.Name, cancellationToken);
        if (existing != null)
        {
            return existing;
        }

        _context.Genres.Add(genre);
        await _context.SaveChangesAsync(cancellationToken);
        return genre;
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Genre>> EnsureGenresExistAsync(IEnumerable<string> genreNames, CancellationToken cancellationToken = default)
    {
        var genres = new List<Genre>();
        
        foreach (var genreName in genreNames)
        {
            var normalizedName = genreName.Trim();
            var existing = await GetGenreByNameAsync(normalizedName, cancellationToken);
            
            if (existing != null)
            {
                genres.Add(existing);
            }
            else
            {
                var newGenre = new Genre
                {
                    Name = normalizedName,
                    IsSystemGenre = false,
                    CreatedAt = DateTime.UtcNow
                };
                
                var created = await CreateGenreAsync(newGenre, cancellationToken);
                genres.Add(created);
            }
        }

        return genres;
    }
}