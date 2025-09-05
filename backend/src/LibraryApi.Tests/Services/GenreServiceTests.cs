using Microsoft.Extensions.Logging;

namespace LibraryApi.Tests.Services;

public class GenreServiceTests
{
    private readonly Mock<IGenreRepository> _mockGenreRepository;
    private readonly Mock<ILogger<GenreService>> _mockLogger;
    private readonly GenreService _service;
    private readonly CancellationToken _cancellationToken = CancellationToken.None;

    public GenreServiceTests()
    {
        _mockGenreRepository = new Mock<IGenreRepository>();
        _mockLogger = new Mock<ILogger<GenreService>>();
        _service = new GenreService(_mockGenreRepository.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetGenresAsync_WithNoSearchTerm_ReturnsAllGenres()
    {
        // Arrange
        var expectedGenres = new List<Genre>
        {
            new Genre { Name = "Fiction", IsSystemGenre = true, CreatedAt = DateTime.UtcNow.AddDays(-10) },
            new Genre { Name = "Science", IsSystemGenre = true, CreatedAt = DateTime.UtcNow.AddDays(-5) },
            new Genre { Name = "Biography", IsSystemGenre = false, CreatedAt = DateTime.UtcNow.AddDays(-1) }
        };

        _mockGenreRepository.Setup(x => x.GetGenresAsync(null, _cancellationToken))
            .ReturnsAsync(expectedGenres);

        // Act
        var result = await _service.GetGenresAsync(cancellationToken: _cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(3);
        result.Should().BeEquivalentTo(expectedGenres);
        _mockGenreRepository.Verify(x => x.GetGenresAsync(null, _cancellationToken), Times.Once);
    }

    [Fact]
    public async Task GetGenresAsync_WithSearchTerm_ReturnsFilteredGenres()
    {
        // Arrange
        var searchTerm = "Fic";
        var expectedGenres = new List<Genre>
        {
            new Genre { Name = "Fiction", IsSystemGenre = true, CreatedAt = DateTime.UtcNow.AddDays(-10) },
            new Genre { Name = "Science Fiction", IsSystemGenre = false, CreatedAt = DateTime.UtcNow.AddDays(-3) }
        };

        _mockGenreRepository.Setup(x => x.GetGenresAsync(searchTerm, _cancellationToken))
            .ReturnsAsync(expectedGenres);

        // Act
        var result = await _service.GetGenresAsync(searchTerm, _cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().BeEquivalentTo(expectedGenres);
        _mockGenreRepository.Verify(x => x.GetGenresAsync(searchTerm, _cancellationToken), Times.Once);
    }

    [Fact]
    public async Task GetGenresAsync_WithEmptySearchTerm_ReturnsAllGenres()
    {
        // Arrange
        var emptySearchTerm = string.Empty;
        var expectedGenres = new List<Genre>
        {
            new Genre { Name = "Fiction", IsSystemGenre = true, CreatedAt = DateTime.UtcNow },
            new Genre { Name = "Non-Fiction", IsSystemGenre = true, CreatedAt = DateTime.UtcNow }
        };

        _mockGenreRepository.Setup(x => x.GetGenresAsync(emptySearchTerm, _cancellationToken))
            .ReturnsAsync(expectedGenres);

        // Act
        var result = await _service.GetGenresAsync(emptySearchTerm, _cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().BeEquivalentTo(expectedGenres);
        _mockGenreRepository.Verify(x => x.GetGenresAsync(emptySearchTerm, _cancellationToken), Times.Once);
    }

    [Fact]
    public async Task GetGenresAsync_RepositoryReturnsEmpty_ReturnsEmptyCollection()
    {
        // Arrange
        var searchTerm = "NonexistentGenre";
        var emptyGenres = new List<Genre>();

        _mockGenreRepository.Setup(x => x.GetGenresAsync(searchTerm, _cancellationToken))
            .ReturnsAsync(emptyGenres);

        // Act
        var result = await _service.GetGenresAsync(searchTerm, _cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
        _mockGenreRepository.Verify(x => x.GetGenresAsync(searchTerm, _cancellationToken), Times.Once);
    }

    [Fact]
    public async Task CreateGenreAsync_WithValidName_CreatesGenre()
    {
        // Arrange
        var genreName = "Mystery";
        var expectedGenre = new Genre 
        { 
            Name = genreName, 
            IsSystemGenre = false, 
            CreatedAt = DateTime.UtcNow 
        };

        _mockGenreRepository.Setup(x => x.CreateGenreAsync(It.IsAny<Genre>(), _cancellationToken))
            .ReturnsAsync(expectedGenre);

        // Act
        var result = await _service.CreateGenreAsync(genreName, _cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(genreName);
        result.IsSystemGenre.Should().BeFalse();
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(10));

        _mockGenreRepository.Verify(x => x.CreateGenreAsync(It.Is<Genre>(g => 
            g.Name == genreName && 
            !g.IsSystemGenre && 
            g.CreatedAt <= DateTime.UtcNow), _cancellationToken), Times.Once);
    }

    [Fact]
    public async Task CreateGenreAsync_WithNameHavingWhitespace_TrimsName()
    {
        // Arrange
        var genreNameWithWhitespace = "  Horror  ";
        var trimmedGenreName = "Horror";
        var expectedGenre = new Genre 
        { 
            Name = trimmedGenreName, 
            IsSystemGenre = false, 
            CreatedAt = DateTime.UtcNow 
        };

        _mockGenreRepository.Setup(x => x.CreateGenreAsync(It.IsAny<Genre>(), _cancellationToken))
            .ReturnsAsync(expectedGenre);

        // Act
        var result = await _service.CreateGenreAsync(genreNameWithWhitespace, _cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(trimmedGenreName);
        result.IsSystemGenre.Should().BeFalse();

        _mockGenreRepository.Verify(x => x.CreateGenreAsync(It.Is<Genre>(g => 
            g.Name == trimmedGenreName && 
            !g.IsSystemGenre), _cancellationToken), Times.Once);
    }

    [Fact]
    public async Task CreateGenreAsync_SetsCorrectProperties()
    {
        // Arrange
        var genreName = "Romance";
        var capturedGenre = new Genre();
        var expectedGenre = new Genre 
        { 
            Name = genreName, 
            IsSystemGenre = false, 
            CreatedAt = DateTime.UtcNow 
        };

        _mockGenreRepository.Setup(x => x.CreateGenreAsync(It.IsAny<Genre>(), _cancellationToken))
            .Callback<Genre, CancellationToken>((g, ct) => 
            {
                capturedGenre = g;
            })
            .ReturnsAsync(expectedGenre);

        // Act
        var result = await _service.CreateGenreAsync(genreName, _cancellationToken);

        // Assert
        capturedGenre.Should().NotBeNull();
        capturedGenre.Name.Should().Be(genreName);
        capturedGenre.IsSystemGenre.Should().BeFalse();
        capturedGenre.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(10));

        result.Should().BeEquivalentTo(expectedGenre);
    }

    [Fact]
    public async Task CreateGenreAsync_WithSpecialCharacters_PreservesSpecialCharacters()
    {
        // Arrange
        var genreName = "Sci-Fi & Fantasy";
        var expectedGenre = new Genre 
        { 
            Name = genreName, 
            IsSystemGenre = false, 
            CreatedAt = DateTime.UtcNow 
        };

        _mockGenreRepository.Setup(x => x.CreateGenreAsync(It.IsAny<Genre>(), _cancellationToken))
            .ReturnsAsync(expectedGenre);

        // Act
        var result = await _service.CreateGenreAsync(genreName, _cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(genreName);
        result.IsSystemGenre.Should().BeFalse();

        _mockGenreRepository.Verify(x => x.CreateGenreAsync(It.Is<Genre>(g => 
            g.Name == genreName && 
            !g.IsSystemGenre), _cancellationToken), Times.Once);
    }
}