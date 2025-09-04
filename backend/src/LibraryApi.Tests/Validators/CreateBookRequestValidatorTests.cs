using FluentValidation.TestHelper;
using LibraryApi.Requests;
using LibraryApi.Validators;
using Xunit;

namespace LibraryApi.Tests.Validators;

/// <summary>
/// Unit tests for CreateBookRequestValidator.
/// </summary>
public class CreateBookRequestValidatorTests
{
    private readonly CreateBookRequestValidator _validator;

    /// <summary>
    /// Initializes a new instance of the <see cref="CreateBookRequestValidatorTests"/> class.
    /// </summary>
    public CreateBookRequestValidatorTests()
    {
        _validator = new CreateBookRequestValidator();
    }

    [Fact]
    public void PublishedDate_WhenEmpty_ShouldHaveValidationError()
    {
        // Arrange
        var request = new CreateBookRequest
        {
            Title = "Test Book",
            Author = "Test Author",
            Genres = new List<string> { "Fiction" },
            PublishedDate = "",
            Rating = 5
        };

        // Act & Assert
        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.PublishedDate)
            .WithErrorMessage("Published date is required");
    }

    [Fact]
    public void PublishedDate_WhenNull_ShouldHaveValidationError()
    {
        // Arrange
        var request = new CreateBookRequest
        {
            Title = "Test Book",
            Author = "Test Author", 
            Genres = new List<string> { "Fiction" },
            PublishedDate = null!,
            Rating = 5
        };

        // Act & Assert
        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.PublishedDate)
            .WithErrorMessage("Published date is required");
    }

    [Theory]
    [InlineData("invalid-date")]
    [InlineData("2023-13-01")]  // Invalid month
    [InlineData("2023-02-30")]  // Invalid day for February
    [InlineData("not-a-date")]
    [InlineData("32/12/2023")]  // Wrong format
    [InlineData("2023/15/40")]  // Invalid date components
    public void PublishedDate_WhenInvalidDate_ShouldHaveValidationError(string invalidDate)
    {
        // Arrange
        var request = new CreateBookRequest
        {
            Title = "Test Book",
            Author = "Test Author",
            Genres = new List<string> { "Fiction" },
            PublishedDate = invalidDate,
            Rating = 5
        };

        // Act & Assert
        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.PublishedDate)
            .WithErrorMessage("Published date must be a valid date in ISO format (YYYY-MM-DD)");
    }

    [Fact]
    public void PublishedDate_WhenFutureDate_ShouldHaveValidationError()
    {
        // Arrange
        var futureDate = DateTime.Today.AddDays(1).ToString("yyyy-MM-dd");
        var request = new CreateBookRequest
        {
            Title = "Test Book",
            Author = "Test Author",
            Genres = new List<string> { "Fiction" },
            PublishedDate = futureDate,
            Rating = 5
        };

        // Act & Assert
        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.PublishedDate)
            .WithErrorMessage("Published date cannot be in the future");
    }

    [Theory]
    [InlineData("2023-01-01")]       // Standard ISO format
    [InlineData("2023-12-31")]       // End of year
    [InlineData("2020-02-29")]       // Leap year
    [InlineData("1900-01-01")]       // Historical date
    public void PublishedDate_WhenValidPastDate_ShouldNotHaveValidationError(string validDate)
    {
        // Arrange
        var request = new CreateBookRequest
        {
            Title = "Test Book",
            Author = "Test Author",
            Genres = new List<string> { "Fiction" },
            PublishedDate = validDate,
            Rating = 5
        };

        // Act & Assert
        var result = _validator.TestValidate(request);
        result.ShouldNotHaveValidationErrorFor(x => x.PublishedDate);
    }

    [Fact]
    public void PublishedDate_WhenToday_ShouldNotHaveValidationError()
    {
        // Arrange
        var today = DateTime.Today.ToString("yyyy-MM-dd");
        var request = new CreateBookRequest
        {
            Title = "Test Book",
            Author = "Test Author",
            Genres = new List<string> { "Fiction" },
            PublishedDate = today,
            Rating = 5
        };

        // Act & Assert
        var result = _validator.TestValidate(request);
        result.ShouldNotHaveValidationErrorFor(x => x.PublishedDate);
    }

    [Fact]
    public void PublishedDate_WhenISODateTime_ShouldNotHaveValidationError()
    {
        // Arrange
        var isoDateTime = DateTime.Today.AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
        var request = new CreateBookRequest
        {
            Title = "Test Book",
            Author = "Test Author",
            Genres = new List<string> { "Fiction" },
            PublishedDate = isoDateTime,
            Rating = 5
        };

        // Act & Assert
        var result = _validator.TestValidate(request);
        result.ShouldNotHaveValidationErrorFor(x => x.PublishedDate);
    }

    [Fact]
    public void PublishedDate_WhenTooLong_ShouldHaveValidationError()
    {
        // Arrange
        var tooLongDate = new string('a', 51); // Exceeds 50 character limit
        var request = new CreateBookRequest
        {
            Title = "Test Book",
            Author = "Test Author",
            Genres = new List<string> { "Fiction" },
            PublishedDate = tooLongDate,
            Rating = 5
        };

        // Act & Assert
        var result = _validator.TestValidate(request);
        result.ShouldHaveValidationErrorFor(x => x.PublishedDate)
            .WithErrorMessage("Published date cannot exceed 50 characters");
    }

    [Fact]
    public void ValidRequest_ShouldNotHaveAnyValidationErrors()
    {
        // Arrange
        var request = new CreateBookRequest
        {
            Title = "Valid Book Title",
            Author = "Valid Author Name",
            Genres = new List<string> { "Fiction", "Drama" },
            PublishedDate = "2023-01-01",
            Rating = 4,
            Edition = "First Edition",
            Isbn = "978-0123456789"
        };

        // Act & Assert
        var result = _validator.TestValidate(request);
        result.ShouldNotHaveAnyValidationErrors();
    }
}