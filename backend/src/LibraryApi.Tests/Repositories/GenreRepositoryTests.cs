using LibraryApi.Data;
using LibraryApi.Models;
using LibraryApi.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LibraryApi.Tests.Repositories;

public class GenreRepositoryTests : IDisposable
{
    private readonly LibraryDbContext _context;
    private readonly GenreRepository _repository;

    public GenreRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<LibraryDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new LibraryDbContext(options);
        _repository = new GenreRepository(_context, Mock.Of<ILogger<GenreRepository>>());

        SeedTestData();
    }

    private void SeedTestData()
    {
        var genres = new[]
        {
            new Genre { Name = "Fiction", IsSystemGenre = true, CreatedAt = DateTime.UtcNow.AddDays(-30) },
            new Genre { Name = "Science Fiction", IsSystemGenre = true, CreatedAt = DateTime.UtcNow.AddDays(-25) },
            new Genre { Name = "Mystery", IsSystemGenre = true, CreatedAt = DateTime.UtcNow.AddDays(-20) },
            new Genre { Name = "Romance", IsSystemGenre = true, CreatedAt = DateTime.UtcNow.AddDays(-15) },
            new Genre { Name = "Custom Genre", IsSystemGenre = false, CreatedAt = DateTime.UtcNow.AddDays(-5) }
        };

        _context.Genres.AddRange(genres);
        _context.SaveChanges();
    }

    [Fact]
    public async Task GetGenresAsync_WithNoFilter_ShouldReturnAllGenres()
    {
        // Act
        var genres = await _repository.GetGenresAsync();

        // Assert
        genres.Should().HaveCount(5);
        genres.Should().Contain(g => g.Name == "Fiction");
        genres.Should().Contain(g => g.Name == "Science Fiction");
        genres.Should().Contain(g => g.Name == "Mystery");
        genres.Should().Contain(g => g.Name == "Romance");
        genres.Should().Contain(g => g.Name == "Custom Genre");
    }

    [Fact]
    public async Task GetGenresAsync_WithSearchTerm_ShouldReturnFilteredGenres()
    {
        // Act
        var genres = await _repository.GetGenresAsync("Science");

        // Assert
        genres.Should().HaveCount(1);
        genres.First().Name.Should().Be("Science Fiction");
    }

    [Fact]
    public async Task GetGenresAsync_WithCaseInsensitiveSearch_ShouldReturnFilteredGenres()
    {
        // Act
        var genres = await _repository.GetGenresAsync("fiction");

        // Assert
        genres.Should().HaveCount(2); // "Fiction" and "Science Fiction"
        genres.Should().Contain(g => g.Name == "Fiction");
        genres.Should().Contain(g => g.Name == "Science Fiction");
    }

    [Fact]
    public async Task GetGenresAsync_WithNonMatchingSearch_ShouldReturnEmpty()
    {
        // Act
        var genres = await _repository.GetGenresAsync("NonExistentGenre");

        // Assert
        genres.Should().BeEmpty();
    }

    [Fact]
    public async Task GetGenreByNameAsync_WithValidName_ShouldReturnGenre()
    {
        // Act
        var genre = await _repository.GetGenreByNameAsync("Fiction");

        // Assert
        genre.Should().NotBeNull();
        genre!.Name.Should().Be("Fiction");
        genre.IsSystemGenre.Should().BeTrue();
    }

    [Fact]
    public async Task GetGenreByNameAsync_WithInvalidName_ShouldReturnNull()
    {
        // Act
        var genre = await _repository.GetGenreByNameAsync("NonExistentGenre");

        // Assert
        genre.Should().BeNull();
    }

    [Fact]
    public async Task GetGenreByNameAsync_WithCaseInsensitiveName_ShouldReturnGenre()
    {
        // Act
        var genre = await _repository.GetGenreByNameAsync("FICTION");

        // Assert
        genre.Should().NotBeNull();
        genre!.Name.Should().Be("Fiction");
    }

    [Fact]
    public async Task CreateGenreAsync_WithNewGenre_ShouldCreateGenre()
    {
        // Arrange
        var newGenre = new Genre
        {
            Name = "New Test Genre",
            IsSystemGenre = false
        };

        // Act
        var createdGenre = await _repository.CreateGenreAsync(newGenre);

        // Assert
        createdGenre.Should().NotBeNull();
        createdGenre.Name.Should().Be("New Test Genre");
        createdGenre.IsSystemGenre.Should().BeFalse();
        createdGenre.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, precision: TimeSpan.FromSeconds(5));

        // Verify it was saved to database
        var savedGenre = await _context.Genres.FindAsync("New Test Genre");
        savedGenre.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateGenreAsync_WithExistingGenre_ShouldReturnExistingGenre()
    {
        // Arrange
        var existingGenre = new Genre
        {
            Name = "Fiction", // Already exists
            IsSystemGenre = false
        };

        // Act
        var result = await _repository.CreateGenreAsync(existingGenre);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("Fiction");
        result.IsSystemGenre.Should().BeTrue(); // Should return the existing one with original properties
    }

    [Fact]
    public async Task CreateGenreAsync_WithDuplicateName_ShouldHandleGracefully()
    {
        // Arrange
        var genre1 = new Genre { Name = "Duplicate Test", IsSystemGenre = false };
        var genre2 = new Genre { Name = "Duplicate Test", IsSystemGenre = false };

        // Act
        var result1 = await _repository.CreateGenreAsync(genre1);
        var result2 = await _repository.CreateGenreAsync(genre2);

        // Assert
        result1.Should().NotBeNull();
        result2.Should().NotBeNull();
        result1.Name.Should().Be(result2.Name);
        
        // Verify only one exists in database
        var genresInDb = await _context.Genres.Where(g => g.Name == "Duplicate Test").ToListAsync();
        genresInDb.Should().HaveCount(1);
    }

    [Fact]
    public async Task EnsureGenresExistAsync_WithNewGenres_ShouldCreateMissingGenres()
    {
        // Arrange
        var genreNames = new[] { "Fiction", "New Genre 1", "New Genre 2", "Mystery" };

        // Act
        var result = await _repository.EnsureGenresExistAsync(genreNames);

        // Assert
        result.Should().HaveCount(4);
        result.Should().Contain(g => g.Name == "Fiction" && g.IsSystemGenre);
        result.Should().Contain(g => g.Name == "New Genre 1" && !g.IsSystemGenre);
        result.Should().Contain(g => g.Name == "New Genre 2" && !g.IsSystemGenre);
        result.Should().Contain(g => g.Name == "Mystery" && g.IsSystemGenre);

        // Verify new genres were saved to database
        var newGenre1 = await _context.Genres.FindAsync("New Genre 1");
        var newGenre2 = await _context.Genres.FindAsync("New Genre 2");
        
        newGenre1.Should().NotBeNull();
        newGenre2.Should().NotBeNull();
    }

    [Fact]
    public async Task EnsureGenresExistAsync_WithAllExistingGenres_ShouldReturnExistingGenres()
    {
        // Arrange
        var genreNames = new[] { "Fiction", "Mystery", "Romance" };

        // Act
        var result = await _repository.EnsureGenresExistAsync(genreNames);

        // Assert
        result.Should().HaveCount(3);
        result.Should().OnlyContain(g => g.IsSystemGenre);
        
        // Verify no new genres were created (should still have 5 total)
        var totalGenres = await _context.Genres.CountAsync();
        totalGenres.Should().Be(5);
    }

    [Fact]
    public async Task EnsureGenresExistAsync_WithEmptyList_ShouldReturnEmpty()
    {
        // Arrange
        var genreNames = Array.Empty<string>();

        // Act
        var result = await _repository.EnsureGenresExistAsync(genreNames);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task EnsureGenresExistAsync_WithDuplicateNames_ShouldReturnUniqueGenres()
    {
        // Arrange
        var genreNames = new[] { "Fiction", "Fiction", "Mystery", "Mystery" };

        // Act
        var result = await _repository.EnsureGenresExistAsync(genreNames);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(g => g.Name == "Fiction");
        result.Should().Contain(g => g.Name == "Mystery");
    }

    [Fact]
    public async Task EnsureGenresExistAsync_WithCaseVariations_ShouldHandleCorrectly()
    {
        // Arrange
        var genreNames = new[] { "FICTION", "mystery", "New Case Test" };

        // Act
        var result = await _repository.EnsureGenresExistAsync(genreNames);

        // Assert
        result.Should().HaveCount(3);
        result.Should().Contain(g => g.Name == "Fiction"); // Should find existing despite case difference
        result.Should().Contain(g => g.Name == "Mystery"); // Should find existing despite case difference
        result.Should().Contain(g => g.Name == "New Case Test"); // Should create new with exact casing
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}