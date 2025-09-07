using LibraryApi.Responses;
using LibraryApi.Services;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;
using Xunit;

namespace LibraryApi.Tests.Services;

/// <summary>
/// Comprehensive tests for StatsService functionality.
/// </summary>
public class StatsServiceTests
{
    private readonly Mock<IBookService> _mockBookService;
    private readonly Mock<ILogger<StatsService>> _mockLogger;
    private readonly StatsService _statsService;
    private readonly Guid _testUserId = Guid.NewGuid();

    /// <summary>
    /// Initializes a new instance of the <see cref="StatsServiceTests"/> class.
    /// </summary>
    public StatsServiceTests()
    {
        _mockBookService = new Mock<IBookService>();
        _mockLogger = new Mock<ILogger<StatsService>>();
        _statsService = new StatsService(_mockBookService.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetBookStatsAsync_WhenCalled_CallsBookServiceGetBookStatsAsync()
    {
        // Arrange
        var expectedStats = new BookStatsResponse
        {
            TotalBooks = 5,
            AverageRating = 4.2,
            GenreDistribution = new List<GenreCount>
            {
                new GenreCount { Genre = "Fiction", Count = 3, AverageRating = 4.0 },
                new GenreCount { Genre = "Science", Count = 2, AverageRating = 4.5 }
            }
        };

        _mockBookService
            .Setup(x => x.GetBookStatsAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _statsService.GetBookStatsAsync(_testUserId);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEquivalentTo(expectedStats);
        _mockBookService.Verify(x => x.GetBookStatsAsync(_testUserId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetBookStatsAsync_WithCancellationToken_PassesTokenToBookService()
    {
        // Arrange
        var expectedStats = new BookStatsResponse { TotalBooks = 0, AverageRating = 0 };
        var cancellationToken = new CancellationToken();

        _mockBookService
            .Setup(x => x.GetBookStatsAsync(_testUserId, cancellationToken))
            .ReturnsAsync(expectedStats);

        // Act
        var result = await _statsService.GetBookStatsAsync(_testUserId, cancellationToken);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEquivalentTo(expectedStats);
        _mockBookService.Verify(x => x.GetBookStatsAsync(_testUserId, cancellationToken), Times.Once);
    }

    [Fact]
    public async Task GetBookStatsAsync_WhenBookServiceReturnsEmptyStats_ReturnsEmptyStats()
    {
        // Arrange
        var emptyStats = new BookStatsResponse
        {
            TotalBooks = 0,
            AverageRating = 0,
            GenreDistribution = new List<GenreCount>()
        };

        _mockBookService
            .Setup(x => x.GetBookStatsAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptyStats);

        // Act
        var result = await _statsService.GetBookStatsAsync(_testUserId);

        // Assert
        result.Should().NotBeNull();
        result.TotalBooks.Should().Be(0);
        result.AverageRating.Should().Be(0);
        result.GenreDistribution.Should().BeEmpty();
        _mockBookService.Verify(x => x.GetBookStatsAsync(_testUserId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetBookStatsAsync_WhenBookServiceThrowsException_PropagatesException()
    {
        // Arrange
        var expectedException = new InvalidOperationException("Database connection failed");
        
        _mockBookService
            .Setup(x => x.GetBookStatsAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(expectedException);

        // Act
        var act = async () => await _statsService.GetBookStatsAsync(_testUserId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Database connection failed");
        _mockBookService.Verify(x => x.GetBookStatsAsync(_testUserId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetBookStatsAsync_WithComplexGenreDistribution_ReturnsCorrectData()
    {
        // Arrange
        var complexStats = new BookStatsResponse
        {
            TotalBooks = 15,
            AverageRating = 3.8,
            GenreDistribution = new List<GenreCount>
            {
                new GenreCount { Genre = "Fiction", Count = 7, AverageRating = 4.1 },
                new GenreCount { Genre = "Non-Fiction", Count = 4, AverageRating = 3.6 },
                new GenreCount { Genre = "Science", Count = 2, AverageRating = 4.5 },
                new GenreCount { Genre = "Mystery", Count = 2, AverageRating = 3.0 }
            }
        };

        _mockBookService
            .Setup(x => x.GetBookStatsAsync(_testUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(complexStats);

        // Act
        var result = await _statsService.GetBookStatsAsync(_testUserId);

        // Assert
        result.Should().NotBeNull();
        result.TotalBooks.Should().Be(15);
        result.AverageRating.Should().Be(3.8);
        result.GenreDistribution.Should().HaveCount(4);
        
        var fictionGenre = result.GenreDistribution.First(g => g.Genre == "Fiction");
        fictionGenre.Count.Should().Be(7);
        fictionGenre.AverageRating.Should().Be(4.1);
        
        var scienceGenre = result.GenreDistribution.First(g => g.Genre == "Science");
        scienceGenre.Count.Should().Be(2);
        scienceGenre.AverageRating.Should().Be(4.5);

        _mockBookService.Verify(x => x.GetBookStatsAsync(_testUserId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetBookStatsAsync_WhenTaskIsCancelled_ThrowsTaskCancelledException()
    {
        // Arrange
        var cancellationTokenSource = new CancellationTokenSource();
        cancellationTokenSource.Cancel();
        var cancellationToken = cancellationTokenSource.Token;

        _mockBookService
            .Setup(x => x.GetBookStatsAsync(_testUserId, cancellationToken))
            .ThrowsAsync(new TaskCanceledException("The operation was canceled."));

        // Act
        var act = async () => await _statsService.GetBookStatsAsync(_testUserId, cancellationToken);

        // Assert
        await act.Should().ThrowAsync<TaskCanceledException>()
            .WithMessage("The operation was canceled.");
        _mockBookService.Verify(x => x.GetBookStatsAsync(_testUserId, cancellationToken), Times.Once);
    }
}