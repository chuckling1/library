using LibraryApi.Models;
using LibraryApi.Repositories;
using LibraryApi.Requests;
using LibraryApi.Responses;
using LibraryApi.Services;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;
using Xunit;

namespace LibraryApi.Tests.Services;

public class BookServiceTests
{
    private readonly Mock<IBookRepository> _mockBookRepository;
    private readonly Mock<IGenreRepository> _mockGenreRepository;
    private readonly Mock<ILogger<BookService>> _mockLogger;
    private readonly BookService _service;
    private readonly CancellationToken _cancellationToken = CancellationToken.None;
    private readonly Guid _testUserId = Guid.NewGuid();

    public BookServiceTests()
    {
        _mockBookRepository = new Mock<IBookRepository>();
        _mockGenreRepository = new Mock<IGenreRepository>();
        _mockLogger = new Mock<ILogger<BookService>>();
        _service = new BookService(_mockBookRepository.Object, _mockGenreRepository.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetBooksAsync_WithNoFilters_ReturnsAllBooks()
    {
        // Arrange
        var expectedBooks = new List<Book>
        {
            new Book { Id = Guid.NewGuid(), Title = "Book 1", Author = "Author 1", Rating = 4, PublishedDate = "2023" },
            new Book { Id = Guid.NewGuid(), Title = "Book 2", Author = "Author 2", Rating = 5, PublishedDate = "2024" }
        };

        _mockBookRepository.Setup(x => x.GetBooksAsync(
            _testUserId,
            It.IsAny<IEnumerable<string>?>(),
            It.IsAny<int?>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<int>(),
            It.IsAny<int>(),
            _cancellationToken))
            .ReturnsAsync((expectedBooks, expectedBooks.Count));

        // Act
        var result = await _service.GetBooksAsync(_testUserId, cancellationToken: _cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().BeEquivalentTo(expectedBooks);
    }

    [Fact]
    public async Task GetBooksAsync_WithGenreFilter_CallsRepositoryWithCorrectParameters()
    {
        // Arrange
        var genres = new[] { "Fiction", "Science" };
        var expectedBooks = new List<Book>
        {
            new Book { Id = Guid.NewGuid(), Title = "Fiction Book", Author = "Author 1", Rating = 4, PublishedDate = "2023" }
        };

        _mockBookRepository.Setup(x => x.GetBooksAsync(
            _testUserId,
            genres,
            It.IsAny<int?>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<int>(),
            It.IsAny<int>(),
            _cancellationToken))
            .ReturnsAsync((expectedBooks, expectedBooks.Count));

        // Act
        var result = await _service.GetBooksAsync(_testUserId, genres: genres, cancellationToken: _cancellationToken);

        // Assert
        result.Should().HaveCount(1);
        _mockBookRepository.Verify(x => x.GetBooksAsync(
            _testUserId,
            genres,
            It.IsAny<int?>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            1,
            20,
            _cancellationToken), Times.Once);
    }

    [Fact]
    public async Task GetBooksAsync_WithAllFilters_PassesCorrectParameters()
    {
        // Arrange
        var genres = new[] { "Fiction" };
        var rating = 4;
        var searchTerm = "test";
        var sortBy = "Title";
        var sortDirection = "asc";
        var page = 2;
        var pageSize = 10;

        _mockBookRepository.Setup(x => x.GetBooksAsync(
            _testUserId,
            It.IsAny<IEnumerable<string>?>(),
            It.IsAny<int?>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<int>(),
            It.IsAny<int>(),
            _cancellationToken))
            .ReturnsAsync((new List<Book>(), 0));

        // Act
        await _service.GetBooksAsync(_testUserId, genres, rating, searchTerm, sortBy, sortDirection, page, pageSize, _cancellationToken);

        // Assert
        _mockBookRepository.Verify(x => x.GetBooksAsync(
            _testUserId,
            genres,
            rating,
            searchTerm,
            sortBy,
            sortDirection,
            page,
            pageSize,
            _cancellationToken), Times.Once);
    }

    [Fact]
    public async Task GetBookByIdAsync_WithValidId_ReturnsBook()
    {
        // Arrange
        var bookId = Guid.NewGuid();
        var expectedBook = new Book { Id = bookId, Title = "Test Book", Author = "Test Author", Rating = 3, PublishedDate = "2023" };

        _mockBookRepository.Setup(x => x.GetBookByIdAsync(bookId, _testUserId, _cancellationToken))
            .ReturnsAsync(expectedBook);

        // Act
        var result = await _service.GetBookByIdAsync(bookId, _testUserId, _cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEquivalentTo(expectedBook);
    }

    [Fact]
    public async Task GetBookByIdAsync_WithInvalidId_ReturnsNull()
    {
        // Arrange
        var bookId = Guid.NewGuid();

        _mockBookRepository.Setup(x => x.GetBookByIdAsync(bookId, _testUserId, _cancellationToken))
            .ReturnsAsync((Book?)null);

        // Act
        var result = await _service.GetBookByIdAsync(bookId, _testUserId, _cancellationToken);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateBookAsync_WithValidRequest_CreatesBookWithGenres()
    {
        // Arrange
        var request = new CreateBookRequest
        {
            Title = "New Book",
            Author = "New Author",
            PublishedDate = "2024",
            Rating = 5,
            Edition = "First Edition",
            Isbn = "1234567890",
            Genres = new List<string> { "Fiction", "Adventure" }
        };

        var genres = new List<Genre>
        {
            new Genre { Name = "Fiction", IsSystemGenre = true, CreatedAt = DateTime.UtcNow },
            new Genre { Name = "Adventure", IsSystemGenre = true, CreatedAt = DateTime.UtcNow }
        };

        var expectedBook = new Book
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Author = request.Author,
            PublishedDate = request.PublishedDate,
            Rating = request.Rating,
            Edition = request.Edition,
            Isbn = request.Isbn,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _mockGenreRepository.Setup(x => x.EnsureGenresExistAsync(request.Genres, _cancellationToken))
            .ReturnsAsync(genres);

        _mockBookRepository.Setup(x => x.CreateBookAsync(It.IsAny<Book>(), _cancellationToken))
            .ReturnsAsync(expectedBook);

        // Act
        var result = await _service.CreateBookAsync(request, _testUserId, _cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be(request.Title);
        result.Author.Should().Be(request.Author);
        result.PublishedDate.Should().Be(request.PublishedDate);
        result.Rating.Should().Be(request.Rating);
        result.Edition.Should().Be(request.Edition);
        result.Isbn.Should().Be(request.Isbn);

        _mockGenreRepository.Verify(x => x.EnsureGenresExistAsync(request.Genres, _cancellationToken), Times.Once);
        _mockBookRepository.Verify(x => x.CreateBookAsync(It.Is<Book>(b => 
            b.Title == request.Title && 
            b.Author == request.Author &&
            b.UserId == _testUserId &&
            b.BookGenres.Count == 2), _cancellationToken), Times.Once);
    }

    [Fact]
    public async Task UpdateBookAsync_WithValidIdAndRequest_UpdatesBook()
    {
        // Arrange
        var bookId = Guid.NewGuid();
        var request = new UpdateBookRequest
        {
            Title = "Updated Book",
            Author = "Updated Author",
            PublishedDate = "2024-updated",
            Rating = 4,
            Edition = "Second Edition",
            Isbn = "0987654321",
            Genres = new List<string> { "Science", "Technology" }
        };

        var existingBook = new Book
        {
            Id = bookId,
            Title = "Original Book",
            Author = "Original Author",
            PublishedDate = "2023",
            Rating = 3,
            BookGenres = new List<BookGenre>()
        };

        var genres = new List<Genre>
        {
            new Genre { Name = "Science", IsSystemGenre = true, CreatedAt = DateTime.UtcNow },
            new Genre { Name = "Technology", IsSystemGenre = true, CreatedAt = DateTime.UtcNow }
        };

        var updatedBook = new Book
        {
            Id = bookId,
            Title = request.Title,
            Author = request.Author,
            PublishedDate = request.PublishedDate,
            Rating = request.Rating,
            Edition = request.Edition,
            Isbn = request.Isbn
        };

        _mockBookRepository.Setup(x => x.GetBookForUpdateAsync(bookId, _testUserId, _cancellationToken))
            .ReturnsAsync(existingBook);

        _mockGenreRepository.Setup(x => x.EnsureGenresExistAsync(request.Genres, _cancellationToken))
            .ReturnsAsync(genres);

        _mockBookRepository.Setup(x => x.UpdateBookAsync(existingBook, _cancellationToken))
            .ReturnsAsync(updatedBook);

        // Act
        var result = await _service.UpdateBookAsync(bookId, request, _testUserId, _cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result!.Title.Should().Be(request.Title);
        result!.Author.Should().Be(request.Author);
        result!.Rating.Should().Be(request.Rating);

        _mockBookRepository.Verify(x => x.GetBookForUpdateAsync(bookId, _testUserId, _cancellationToken), Times.Once);
        _mockGenreRepository.Verify(x => x.EnsureGenresExistAsync(request.Genres, _cancellationToken), Times.Once);
        _mockBookRepository.Verify(x => x.UpdateBookAsync(existingBook, _cancellationToken), Times.Once);

        // Verify genre relationships were updated
        existingBook.BookGenres.Should().HaveCount(2);
        existingBook.BookGenres.Should().Contain(bg => bg.GenreName == "Science");
        existingBook.BookGenres.Should().Contain(bg => bg.GenreName == "Technology");
    }

    [Fact]
    public async Task UpdateBookAsync_WithInvalidId_ReturnsNull()
    {
        // Arrange
        var bookId = Guid.NewGuid();
        var request = new UpdateBookRequest
        {
            Title = "Updated Book",
            Author = "Updated Author",
            PublishedDate = "2024",
            Rating = 4,
            Genres = new List<string> { "Fiction" }
        };

        _mockBookRepository.Setup(x => x.GetBookForUpdateAsync(bookId, _testUserId, _cancellationToken))
            .ReturnsAsync((Book?)null);

        // Act
        var result = await _service.UpdateBookAsync(bookId, request, _testUserId, _cancellationToken);

        // Assert
        result.Should().BeNull();
        _mockBookRepository.Verify(x => x.GetBookForUpdateAsync(bookId, _testUserId, _cancellationToken), Times.Once);
        _mockGenreRepository.Verify(x => x.EnsureGenresExistAsync(It.IsAny<List<string>>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockBookRepository.Verify(x => x.UpdateBookAsync(It.IsAny<Book>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteBookAsync_WithValidId_ReturnsTrue()
    {
        // Arrange
        var bookId = Guid.NewGuid();

        _mockBookRepository.Setup(x => x.DeleteBookAsync(bookId, _testUserId, _cancellationToken))
            .ReturnsAsync(true);

        // Act
        var result = await _service.DeleteBookAsync(bookId, _testUserId, _cancellationToken);

        // Assert
        result.Should().BeTrue();
        _mockBookRepository.Verify(x => x.DeleteBookAsync(bookId, _testUserId, _cancellationToken), Times.Once);
    }

    [Fact]
    public async Task DeleteBookAsync_WithInvalidId_ReturnsFalse()
    {
        // Arrange
        var bookId = Guid.NewGuid();

        _mockBookRepository.Setup(x => x.DeleteBookAsync(bookId, _testUserId, _cancellationToken))
            .ReturnsAsync(false);

        // Act
        var result = await _service.DeleteBookAsync(bookId, _testUserId, _cancellationToken);

        // Assert
        result.Should().BeFalse();
        _mockBookRepository.Verify(x => x.DeleteBookAsync(bookId, _testUserId, _cancellationToken), Times.Once);
    }

    [Fact]
    public async Task GetBookStatsAsync_ReturnsCorrectStats()
    {
        // Arrange
        var genreStats = new List<(string Genre, int Count, double AverageRating)>
        {
            ("Fiction", 10, 4.2),
            ("Science", 5, 4.8),
            ("Biography", 3, 3.9)
        };

        _mockBookRepository.Setup(x => x.GetBooksStatsAsync(_testUserId, _cancellationToken))
            .ReturnsAsync((25, 4.3, genreStats));

        // Act
        var result = await _service.GetBookStatsAsync(_testUserId, _cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result.TotalBooks.Should().Be(25);
        result.AverageRating.Should().Be(4.3);
        result.GenreDistribution.Should().HaveCount(3);
        result.GenreDistribution.Should().Contain(g => g.Genre == "Fiction" && g.Count == 10 && g.AverageRating == 4.2);
        result.GenreDistribution.Should().Contain(g => g.Genre == "Science" && g.Count == 5 && g.AverageRating == 4.8);
        result.GenreDistribution.Should().Contain(g => g.Genre == "Biography" && g.Count == 3 && g.AverageRating == 3.9);

        _mockBookRepository.Verify(x => x.GetBooksStatsAsync(_testUserId, _cancellationToken), Times.Once);
    }

    [Fact]
    public async Task GetBooksPaginatedAsync_WithNoFilters_ReturnsPaginatedResponse()
    {
        // Arrange
        var expectedBooks = new List<Book>
        {
            new Book { Id = Guid.NewGuid(), Title = "Book 1", Author = "Author 1", Rating = 4, PublishedDate = "2023", UserId = _testUserId },
            new Book { Id = Guid.NewGuid(), Title = "Book 2", Author = "Author 2", Rating = 5, PublishedDate = "2024", UserId = _testUserId }
        };

        _mockBookRepository.Setup(x => x.GetBooksAsync(
            _testUserId,
            It.IsAny<IEnumerable<string>?>(),
            It.IsAny<int?>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<int>(),
            It.IsAny<int>(),
            _cancellationToken))
            .ReturnsAsync((expectedBooks, expectedBooks.Count));

        // Act
        var result = await _service.GetBooksPaginatedAsync(_testUserId, cancellationToken: _cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(2);
        result.Items.Should().BeEquivalentTo(expectedBooks);
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(20);
        result.TotalItems.Should().Be(2);
    }
}