using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using FluentAssertions;
using LibraryApi.Controllers;
using LibraryApi.Models;
using LibraryApi.Requests;
using LibraryApi.Responses;
using LibraryApi.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace LibraryApi.Tests.Controllers
{
    /// <summary>
    /// Comprehensive tests for BooksController covering all endpoints and scenarios.
    /// </summary>
    public class BooksControllerTests
    {
        private readonly Mock<IBookService> _mockBookService;
        private readonly Mock<ILogger<BooksController>> _mockLogger;
        private readonly BooksController _controller;
        private readonly Guid _testUserId = Guid.NewGuid();

        public BooksControllerTests()
        {
            _mockBookService = new Mock<IBookService>();
            _mockLogger = new Mock<ILogger<BooksController>>();
            _controller = new BooksController(_mockBookService.Object, _mockLogger.Object);
            
            // Setup JWT authentication mock
            SetupUserContext();
        }
        
        private void SetupUserContext()
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, _testUserId.ToString())
            }));
            
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        #region GetBooks Tests

        [Fact]
        public async Task GetBooks_WhenValidRequest_ReturnsOkWithBooks()
        {
            // Arrange
            var books = new List<Book>
            {
                new Book { Id = Guid.NewGuid(), Title = "Test Book 1", Author = "Author 1", Rating = 4, PublishedDate = "2023" },
                new Book { Id = Guid.NewGuid(), Title = "Test Book 2", Author = "Author 2", Rating = 5, PublishedDate = "2022" }
            };
            _mockBookService.Setup(s => s.GetBooksPaginatedAsync(
                _testUserId, It.IsAny<string[]>(), It.IsAny<int?>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new PaginatedResponse<Book>
                {
                    Items = books,
                    Page = 1,
                    PageSize = 20,
                    TotalItems = books.Count()
                });

            // Act
            var result = await _controller.GetBooks();

            // Assert
            result.Should().NotBeNull();
            var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
            var paginatedResponse = okResult.Value.Should().BeOfType<PaginatedResponse<Book>>().Subject;
            paginatedResponse.Items.Should().HaveCount(2);
            paginatedResponse.Items.Should().BeEquivalentTo(books);
            paginatedResponse.TotalItems.Should().Be(2);
        }

        [Fact]
        public async Task GetBooks_WithFiltersAndPagination_CallsServiceWithCorrectParameters()
        {
            // Arrange
            var genres = new[] { "Fiction", "Mystery" };
            var rating = 4;
            var search = "test";
            var sortBy = "Title";
            var sortDirection = "desc";
            var page = 2;
            var pageSize = 10;
            var books = new List<Book>();

            _mockBookService.Setup(s => s.GetBooksPaginatedAsync(
                _testUserId, genres, rating, search, sortBy, sortDirection, page, pageSize, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new PaginatedResponse<Book>
                {
                    Items = books,
                    Page = page,
                    PageSize = pageSize,
                    TotalItems = books.Count()
                });

            // Act
            var result = await _controller.GetBooks(genres, rating, search, sortBy, sortDirection, page, pageSize);

            // Assert
            _mockBookService.Verify(s => s.GetBooksPaginatedAsync(
                _testUserId, genres, rating, search, sortBy, sortDirection, page, pageSize, It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task GetBooks_WhenPageSizeExceeds100_ReturnsBadRequest()
        {
            // Arrange
            var pageSize = 150;

            // Act
            var result = await _controller.GetBooks(pageSize: pageSize);

            // Assert
            result.Should().NotBeNull();
            var badRequestResult = result.Result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequestResult.Value.Should().Be("Page size cannot exceed 100");
            _mockBookService.Verify(s => s.GetBooksPaginatedAsync(
                It.IsAny<Guid>(), It.IsAny<string[]>(), It.IsAny<int?>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        [Fact]
        public async Task GetBooks_WithCancellationToken_PassesTokernToService()
        {
            // Arrange
            using var cancellationTokenSource = new CancellationTokenSource();
            var cancellationToken = cancellationTokenSource.Token;
            var books = new List<Book>();

            _mockBookService.Setup(s => s.GetBooksPaginatedAsync(
                _testUserId, It.IsAny<string[]>(), It.IsAny<int?>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>(), cancellationToken))
                .ReturnsAsync(new PaginatedResponse<Book>
                {
                    Items = books,
                    Page = 1,
                    PageSize = 20,
                    TotalItems = books.Count()
                });

            // Act
            var result = await _controller.GetBooks(cancellationToken: cancellationToken);

            // Assert
            _mockBookService.Verify(s => s.GetBooksPaginatedAsync(
                _testUserId, It.IsAny<string[]>(), It.IsAny<int?>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int>(), cancellationToken),
                Times.Once);
        }

        #endregion

        #region GetBook Tests

        [Fact]
        public async Task GetBook_WhenBookExists_ReturnsOkWithBook()
        {
            // Arrange
            var bookId = Guid.NewGuid();
            var book = new Book { Id = bookId, Title = "Test Book", Author = "Test Author", Rating = 4, PublishedDate = "2023" };
            _mockBookService.Setup(s => s.GetBookByIdAsync(bookId, _testUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(book);

            // Act
            var result = await _controller.GetBook(bookId);

            // Assert
            result.Should().NotBeNull();
            var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
            var returnedBook = okResult.Value.Should().BeOfType<Book>().Subject;
            returnedBook.Should().BeEquivalentTo(book);
        }

        [Fact]
        public async Task GetBook_WhenBookDoesNotExist_ReturnsNotFound()
        {
            // Arrange
            var bookId = Guid.NewGuid();
            _mockBookService.Setup(s => s.GetBookByIdAsync(bookId, _testUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Book?)null);

            // Act
            var result = await _controller.GetBook(bookId);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<NotFoundResult>();
        }

        #endregion

        #region CreateBook Tests

        [Fact]
        public async Task CreateBook_WhenValidRequest_ReturnsCreatedAtAction()
        {
            // Arrange
            var request = new CreateBookRequest
            {
                Title = "New Book",
                Author = "New Author",
                Genres = new List<string> { "Fiction" },
                PublishedDate = "2023",
                Rating = 4,
                Edition = "First Edition",
                Isbn = "1234567890"
            };
            var createdBook = new Book
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                Author = request.Author,
                PublishedDate = request.PublishedDate,
                Rating = request.Rating,
                Edition = request.Edition,
                Isbn = request.Isbn
            };

            _mockBookService.Setup(s => s.CreateBookAsync(request, _testUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(createdBook);

            // Act
            var result = await _controller.CreateBook(request);

            // Assert
            result.Should().NotBeNull();
            var createdAtActionResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
            createdAtActionResult.ActionName.Should().Be(nameof(BooksController.GetBook));
            createdAtActionResult.RouteValues.Should().ContainKey("id");
            createdAtActionResult.RouteValues!["id"].Should().Be(createdBook.Id);
            var returnedBook = createdAtActionResult.Value.Should().BeOfType<Book>().Subject;
            returnedBook.Should().BeEquivalentTo(createdBook);
        }

        [Fact]
        public async Task CreateBook_WhenModelStateInvalid_ReturnsBadRequest()
        {
            // Arrange
            var request = new CreateBookRequest(); // Invalid request with missing required fields
            _controller.ModelState.AddModelError("Title", "Title is required");

            // Act
            var result = await _controller.CreateBook(request);

            // Assert
            result.Should().NotBeNull();
            var badRequestResult = result.Result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequestResult.Value.Should().BeOfType<SerializableError>();
            _mockBookService.Verify(s => s.CreateBookAsync(It.IsAny<CreateBookRequest>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        #endregion

        #region UpdateBook Tests

        [Fact]
        public async Task UpdateBook_WhenValidRequestAndBookExists_ReturnsOkWithUpdatedBook()
        {
            // Arrange
            var bookId = Guid.NewGuid();
            var request = new UpdateBookRequest
            {
                Title = "Updated Book",
                Author = "Updated Author",
                Genres = new List<string> { "Fiction" },
                PublishedDate = "2023",
                Rating = 5
            };
            var updatedBook = new Book
            {
                Id = bookId,
                Title = request.Title,
                Author = request.Author,
                PublishedDate = request.PublishedDate,
                Rating = request.Rating
            };

            _mockBookService.Setup(s => s.UpdateBookAsync(bookId, request, _testUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(updatedBook);

            // Act
            var result = await _controller.UpdateBook(bookId, request);

            // Assert
            result.Should().NotBeNull();
            var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
            var returnedBook = okResult.Value.Should().BeOfType<Book>().Subject;
            returnedBook.Should().BeEquivalentTo(updatedBook);
        }

        [Fact]
        public async Task UpdateBook_WhenBookDoesNotExist_ReturnsNotFound()
        {
            // Arrange
            var bookId = Guid.NewGuid();
            var request = new UpdateBookRequest
            {
                Title = "Updated Book",
                Author = "Updated Author",
                Genres = new List<string> { "Fiction" },
                PublishedDate = "2023",
                Rating = 5
            };

            _mockBookService.Setup(s => s.UpdateBookAsync(bookId, request, _testUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Book?)null);

            // Act
            var result = await _controller.UpdateBook(bookId, request);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task UpdateBook_WhenModelStateInvalid_ReturnsBadRequest()
        {
            // Arrange
            var bookId = Guid.NewGuid();
            var request = new UpdateBookRequest(); // Invalid request
            _controller.ModelState.AddModelError("Title", "Title is required");

            // Act
            var result = await _controller.UpdateBook(bookId, request);

            // Assert
            result.Should().NotBeNull();
            var badRequestResult = result.Result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequestResult.Value.Should().BeOfType<SerializableError>();
            _mockBookService.Verify(s => s.UpdateBookAsync(It.IsAny<Guid>(), It.IsAny<UpdateBookRequest>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
                Times.Never);
        }

        #endregion

        #region DeleteBook Tests

        [Fact]
        public async Task DeleteBook_WhenBookExists_ReturnsNoContent()
        {
            // Arrange
            var bookId = Guid.NewGuid();
            _mockBookService.Setup(s => s.DeleteBookAsync(bookId, _testUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.DeleteBook(bookId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<NoContentResult>();
        }

        [Fact]
        public async Task DeleteBook_WhenBookDoesNotExist_ReturnsNotFound()
        {
            // Arrange
            var bookId = Guid.NewGuid();
            _mockBookService.Setup(s => s.DeleteBookAsync(bookId, _testUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.DeleteBook(bookId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeOfType<NotFoundResult>();
        }

        #endregion

        #region GetBookStats Tests

        [Fact]
        public async Task GetBookStats_WhenCalled_ReturnsOkWithStats()
        {
            // Arrange
            var stats = new BookStatsResponse
            {
                TotalBooks = 100,
                AverageRating = 4.2,
                GenreDistribution = new List<GenreCount>
                {
                    new GenreCount { Genre = "Fiction", Count = 50, AverageRating = 4.1 },
                    new GenreCount { Genre = "Non-Fiction", Count = 30, AverageRating = 4.3 },
                    new GenreCount { Genre = "Mystery", Count = 20, AverageRating = 4.0 }
                }
            };

            _mockBookService.Setup(s => s.GetBookStatsAsync(_testUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(stats);

            // Act
            var result = await _controller.GetBookStats();

            // Assert
            result.Should().NotBeNull();
            var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
            var returnedStats = okResult.Value.Should().BeOfType<BookStatsResponse>().Subject;
            returnedStats.Should().BeEquivalentTo(stats);
            returnedStats.GenreDistribution.Should().HaveCount(3);
        }

        #endregion
    }
}