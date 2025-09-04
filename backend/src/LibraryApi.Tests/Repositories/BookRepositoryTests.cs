using LibraryApi.Data;
using LibraryApi.Models;
using LibraryApi.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;

namespace LibraryApi.Tests.Repositories;

public class BookRepositoryTests : IDisposable
{
    private readonly LibraryDbContext _context;
    private readonly BookRepository _repository;

    public BookRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<LibraryDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new LibraryDbContext(options);
        _repository = new BookRepository(_context, Mock.Of<ILogger<BookRepository>>());

        SeedTestData();
    }

    private void SeedTestData()
    {
        var genres = new[]
        {
            new Genre { Name = "Fiction", IsSystemGenre = true, CreatedAt = DateTime.UtcNow },
            new Genre { Name = "Science", IsSystemGenre = true, CreatedAt = DateTime.UtcNow },
            new Genre { Name = "Biography", IsSystemGenre = true, CreatedAt = DateTime.UtcNow }
        };

        _context.Genres.AddRange(genres);

        var books = new[]
        {
            new Book
            {
                Id = Guid.NewGuid(),
                Title = "The Great Gatsby",
                Author = "F. Scott Fitzgerald",
                PublishedDate = new DateTime(1925, 4, 10),
                Rating = 4,
                CreatedAt = DateTime.UtcNow.AddDays(-10),
                UpdatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new Book
            {
                Id = Guid.NewGuid(),
                Title = "A Brief History of Time",
                Author = "Stephen Hawking",
                PublishedDate = new DateTime(1988, 4, 1),
                Rating = 5,
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                UpdatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new Book
            {
                Id = Guid.NewGuid(),
                Title = "Steve Jobs",
                Author = "Walter Isaacson",
                PublishedDate = new DateTime(2011, 10, 24),
                Rating = 4,
                Edition = "First Edition",
                Isbn = "978-1451648539",
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            }
        };

        _context.Books.AddRange(books);

        var bookGenres = new[]
        {
            new BookGenre { BookId = books[0].Id, GenreName = "Fiction" },
            new BookGenre { BookId = books[1].Id, GenreName = "Science" },
            new BookGenre { BookId = books[2].Id, GenreName = "Biography" }
        };

        _context.BookGenres.AddRange(bookGenres);
        _context.SaveChanges();
    }

    [Fact]
    public async Task GetBooksAsync_WithNoFilters_ShouldReturnAllBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync();

        // Assert
        books.Should().HaveCount(3);
        totalCount.Should().Be(3);
    }

    [Fact]
    public async Task GetBooksAsync_WithGenreFilter_ShouldReturnFilteredBooks()
    {
        // Arrange
        var genreFilter = new[] { "Fiction" };

        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(genres: genreFilter);

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Title.Should().Be("The Great Gatsby");
    }

    [Fact]
    public async Task GetBooksAsync_WithMinRatingFilter_ShouldReturnFilteredBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(minRating: 5);

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Title.Should().Be("A Brief History of Time");
    }

    [Fact]
    public async Task GetBooksAsync_WithSearchTerm_ShouldReturnMatchingBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(searchTerm: "Great");

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Title.Should().Be("The Great Gatsby");
    }

    [Fact]
    public async Task GetBooksAsync_WithLowercaseSearchTerm_ShouldReturnMatchingBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(searchTerm: "great");

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Title.Should().Be("The Great Gatsby");
    }

    [Fact]
    public async Task GetBooksAsync_WithUppercaseSearchTerm_ShouldReturnMatchingBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(searchTerm: "GREAT");

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Title.Should().Be("The Great Gatsby");
    }

    [Fact]
    public async Task GetBooksAsync_WithMixedCaseSearchTerm_ShouldReturnMatchingBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(searchTerm: "gReAt");

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Title.Should().Be("The Great Gatsby");
    }

    [Fact]
    public async Task GetBooksAsync_WithCaseInsensitiveAuthorSearch_ShouldReturnMatchingBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(searchTerm: "stephen hawking");

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Author.Should().Be("Stephen Hawking");
    }

    [Fact]
    public async Task GetBooksAsync_WithCaseInsensitiveAuthorSearchUppercase_ShouldReturnMatchingBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(searchTerm: "STEPHEN");

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Author.Should().Be("Stephen Hawking");
    }

    [Fact]
    public async Task GetBooksAsync_WithPartialTitleSearch_ShouldReturnMatchingBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(searchTerm: "steve");

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Title.Should().Be("Steve Jobs");
    }

    [Fact]
    public async Task GetBooksAsync_WithPartialAuthorSearch_ShouldReturnMatchingBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(searchTerm: "isaacson");

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Author.Should().Be("Walter Isaacson");
    }

    [Fact]
    public async Task GetBooksAsync_WithCaseInsensitiveNonMatchingSearch_ShouldReturnNoResults()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(searchTerm: "nonexistent");

        // Assert
        books.Should().BeEmpty();
        totalCount.Should().Be(0);
    }

    [Fact]
    public async Task GetBooksAsync_WithPagination_ShouldReturnPagedResults()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(page: 1, pageSize: 2);

        // Assert
        books.Should().HaveCount(2);
        totalCount.Should().Be(3);
    }

    [Fact]
    public async Task GetBooksAsync_WithSorting_ShouldReturnSortedBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(sortBy: "title", sortDirection: "asc");

        // Assert
        books.Should().HaveCount(3);
        var bookList = books.ToList();
        bookList[0].Title.Should().Be("A Brief History of Time");
        bookList[1].Title.Should().Be("Steve Jobs");
        bookList[2].Title.Should().Be("The Great Gatsby");
    }

    [Fact]
    public async Task GetBookByIdAsync_WithValidId_ShouldReturnBook()
    {
        // Arrange
        var existingBook = _context.Books.First();

        // Act
        var book = await _repository.GetBookByIdAsync(existingBook.Id);

        // Assert
        book.Should().NotBeNull();
        book!.Title.Should().Be(existingBook.Title);
    }

    [Fact]
    public async Task GetBookByIdAsync_WithInvalidId_ShouldReturnNull()
    {
        // Act
        var book = await _repository.GetBookByIdAsync(Guid.NewGuid());

        // Assert
        book.Should().BeNull();
    }

    [Fact]
    public async Task CreateBookAsync_WithValidBook_ShouldCreateBook()
    {
        // Arrange
        var newBook = new Book
        {
            Title = "New Test Book",
            Author = "Test Author",
            PublishedDate = new DateTime(2024, 1, 1),
            Rating = 3
        };

        // Act
        var createdBook = await _repository.CreateBookAsync(newBook);

        // Assert
        createdBook.Should().NotBeNull();
        createdBook.Id.Should().NotBe(Guid.Empty);
        createdBook.Title.Should().Be("New Test Book");
        createdBook.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, precision: TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task UpdateBookAsync_WithValidBook_ShouldUpdateBook()
    {
        // Arrange
        var existingBook = _context.Books.First();
        existingBook.Title = "Updated Title";
        existingBook.Rating = 5;

        // Act
        var updatedBook = await _repository.UpdateBookAsync(existingBook);

        // Assert
        updatedBook.Should().NotBeNull();
        updatedBook.Title.Should().Be("Updated Title");
        updatedBook.Rating.Should().Be(5);
        updatedBook.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, precision: TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task DeleteBookAsync_WithValidId_ShouldDeleteBook()
    {
        // Arrange
        var existingBook = _context.Books.First();

        // Act
        var result = await _repository.DeleteBookAsync(existingBook.Id);

        // Assert
        result.Should().BeTrue();
        var deletedBook = await _context.Books.FindAsync(existingBook.Id);
        deletedBook.Should().BeNull();
    }

    [Fact]
    public async Task DeleteBookAsync_WithInvalidId_ShouldReturnFalse()
    {
        // Act
        var result = await _repository.DeleteBookAsync(Guid.NewGuid());

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetBooksStatsAsync_ShouldReturnCorrectStats()
    {
        // Act
        var (totalBooks, averageRating, genreStats) = await _repository.GetBooksStatsAsync();

        // Assert
        totalBooks.Should().Be(3);
        averageRating.Should().BeApproximately(4.33, 0.01);
        genreStats.Should().HaveCount(3);

        var genreStatsList = genreStats.ToList();
        genreStatsList.Should().Contain(g => g.Genre == "Fiction" && g.Count == 1);
        genreStatsList.Should().Contain(g => g.Genre == "Science" && g.Count == 1);
        genreStatsList.Should().Contain(g => g.Genre == "Biography" && g.Count == 1);
    }

    [Fact]
    public async Task GetRecentBooksAsync_ShouldReturnBooksOrderedByCreatedDate()
    {
        // Act
        var recentBooks = await _repository.GetRecentBooksAsync(count: 2);

        // Assert
        var bookList = recentBooks.ToList();
        bookList.Should().HaveCount(2);
        bookList[0].Title.Should().Be("Steve Jobs"); // Most recent
        bookList[1].Title.Should().Be("A Brief History of Time"); // Second most recent
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}