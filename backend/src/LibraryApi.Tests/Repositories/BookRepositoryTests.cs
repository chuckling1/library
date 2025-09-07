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
    private readonly Guid _testUserId1 = Guid.NewGuid();
    private readonly Guid _testUserId2 = Guid.NewGuid();

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
                PublishedDate = "1925-04-10",
                Rating = 4,
                UserId = _testUserId1,
                CreatedAt = DateTime.UtcNow.AddDays(-10),
                UpdatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new Book
            {
                Id = Guid.NewGuid(),
                Title = "A Brief History of Time",
                Author = "Stephen Hawking",
                PublishedDate = "1988-04-01",
                Rating = 5,
                UserId = _testUserId1,
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                UpdatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new Book
            {
                Id = Guid.NewGuid(),
                Title = "Steve Jobs",
                Author = "Walter Isaacson",
                PublishedDate = "2011-10-24",
                Rating = 4,
                Edition = "First Edition",
                Isbn = "978-1451648539",
                UserId = _testUserId2,
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
        var (books, totalCount) = await _repository.GetBooksAsync(_testUserId1);

        // Assert
        books.Should().HaveCount(2); // Only user1's books
        totalCount.Should().Be(2);
    }

    [Fact]
    public async Task GetBooksAsync_WithGenreFilter_ShouldReturnFilteredBooks()
    {
        // Arrange
        var genreFilter = new[] { "Fiction" };

        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(_testUserId1, genres: genreFilter);

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Title.Should().Be("The Great Gatsby");
    }

    [Fact]
    public async Task GetBooksAsync_WithExactRatingFilter_ShouldReturnFilteredBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(_testUserId1, rating: 5);

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Title.Should().Be("A Brief History of Time");
    }

    [Fact]
    public async Task GetBooksAsync_WithSearchTerm_ShouldReturnMatchingBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(_testUserId1, searchTerm: "Great");

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Title.Should().Be("The Great Gatsby");
    }

    [Fact]
    public async Task GetBooksAsync_WithLowercaseSearchTerm_ShouldReturnMatchingBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(_testUserId1, searchTerm: "great");

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Title.Should().Be("The Great Gatsby");
    }

    [Fact]
    public async Task GetBooksAsync_WithUppercaseSearchTerm_ShouldReturnMatchingBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(_testUserId1, searchTerm: "GREAT");

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Title.Should().Be("The Great Gatsby");
    }

    [Fact]
    public async Task GetBooksAsync_WithMixedCaseSearchTerm_ShouldReturnMatchingBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(_testUserId1, searchTerm: "gReAt");

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Title.Should().Be("The Great Gatsby");
    }

    [Fact]
    public async Task GetBooksAsync_WithCaseInsensitiveAuthorSearch_ShouldReturnMatchingBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(_testUserId1, searchTerm: "stephen hawking");

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Author.Should().Be("Stephen Hawking");
    }

    [Fact]
    public async Task GetBooksAsync_WithCaseInsensitiveAuthorSearchUppercase_ShouldReturnMatchingBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(_testUserId1, searchTerm: "STEPHEN");

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Author.Should().Be("Stephen Hawking");
    }

    [Fact]
    public async Task GetBooksAsync_WithPartialTitleSearch_ShouldReturnMatchingBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(_testUserId2, searchTerm: "steve");

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Title.Should().Be("Steve Jobs");
    }

    [Fact]
    public async Task GetBooksAsync_WithPartialAuthorSearch_ShouldReturnMatchingBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(_testUserId2, searchTerm: "isaacson");

        // Assert
        books.Should().HaveCount(1);
        totalCount.Should().Be(1);
        books.First().Author.Should().Be("Walter Isaacson");
    }

    [Fact]
    public async Task GetBooksAsync_WithCaseInsensitiveNonMatchingSearch_ShouldReturnNoResults()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(_testUserId1, searchTerm: "nonexistent");

        // Assert
        books.Should().BeEmpty();
        totalCount.Should().Be(0);
    }

    [Fact]
    public async Task GetBooksAsync_WithPagination_ShouldReturnPagedResults()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(_testUserId1, page: 1, pageSize: 2);

        // Assert
        books.Should().HaveCount(2); // User1 has 2 books total
        totalCount.Should().Be(2);
    }

    [Fact]
    public async Task GetBooksAsync_WithSorting_ShouldReturnSortedBooks()
    {
        // Act
        var (books, totalCount) = await _repository.GetBooksAsync(_testUserId1, sortBy: "title", sortDirection: "asc");

        // Assert
        books.Should().HaveCount(2); // User1 has 2 books
        totalCount.Should().Be(2);
        var bookList = books.ToList();
        bookList[0].Title.Should().Be("A Brief History of Time");
        bookList[1].Title.Should().Be("The Great Gatsby");
    }

    [Fact]
    public async Task GetBookByIdAsync_WithValidId_ShouldReturnBook()
    {
        // Arrange
        var existingBook = _context.Books.First();

        // Act
        var book = await _repository.GetBookByIdAsync(existingBook.Id, existingBook.UserId);

        // Assert
        book.Should().NotBeNull();
        book!.Title.Should().Be(existingBook.Title);
    }

    [Fact]
    public async Task GetBookByIdAsync_WithInvalidId_ShouldReturnNull()
    {
        // Act
        var book = await _repository.GetBookByIdAsync(Guid.NewGuid(), _testUserId1);

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
            PublishedDate = "2024",
            Rating = 3,
            UserId = _testUserId1
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
        var result = await _repository.DeleteBookAsync(existingBook.Id, existingBook.UserId);

        // Assert
        result.Should().BeTrue();
        var deletedBook = await _context.Books.FindAsync(existingBook.Id);
        deletedBook.Should().BeNull();
    }

    [Fact]
    public async Task DeleteBookAsync_WithInvalidId_ShouldReturnFalse()
    {
        // Act
        var result = await _repository.DeleteBookAsync(Guid.NewGuid(), _testUserId1);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetBooksStatsAsync_ShouldReturnCorrectStats()
    {
        // Act - Test user1's stats (2 books: rating 4 and 5)
        var (totalBooks, averageRating, genreStats) = await _repository.GetBooksStatsAsync(_testUserId1);

        // Assert
        totalBooks.Should().Be(2);
        averageRating.Should().BeApproximately(4.5, 0.01); // (4+5)/2 = 4.5
        genreStats.Should().HaveCount(2);

        var genreStatsList = genreStats.ToList();
        genreStatsList.Should().Contain(g => g.Genre == "Fiction" && g.Count == 1);
        genreStatsList.Should().Contain(g => g.Genre == "Science" && g.Count == 1);
    }

    [Fact]
    public async Task GetBooksStatsAsync_WithEmptyDatabase_ShouldReturnZeroStats()
    {
        // Arrange - Create a new repository with empty database
        var options = new DbContextOptionsBuilder<LibraryDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var emptyContext = new LibraryDbContext(options);
        var emptyRepository = new BookRepository(emptyContext, Mock.Of<ILogger<BookRepository>>());

        // Act
        var (totalBooks, averageRating, genreStats) = await emptyRepository.GetBooksStatsAsync(_testUserId1);

        // Assert
        totalBooks.Should().Be(0);
        averageRating.Should().Be(0.0);
        genreStats.Should().BeEmpty();
    }

    [Fact]
    public async Task GetRecentBooksAsync_ShouldReturnBooksOrderedByCreatedDate()
    {
        // Act - Get recent books for user1 (has 2 books)
        var recentBooks = await _repository.GetRecentBooksAsync(_testUserId1, count: 2);

        // Assert
        var bookList = recentBooks.ToList();
        bookList.Should().HaveCount(2);
        bookList[0].Title.Should().Be("A Brief History of Time"); // Most recent for user1
        bookList[1].Title.Should().Be("The Great Gatsby"); // Oldest for user1
    }

    [Fact]
    public async Task GetBookByIdAsync_WithWrongUserId_ShouldReturnNull()
    {
        // Arrange
        var user2Book = _context.Books.First(b => b.UserId == _testUserId2);

        // Act - Try to get user2's book using user1's ID
        var book = await _repository.GetBookByIdAsync(user2Book.Id, _testUserId1);

        // Assert
        book.Should().BeNull(); // User isolation should prevent access
    }

    [Fact]
    public async Task DeleteBookAsync_WithWrongUserId_ShouldReturnFalse()
    {
        // Arrange
        var user2Book = _context.Books.First(b => b.UserId == _testUserId2);

        // Act - Try to delete user2's book using user1's ID
        var result = await _repository.DeleteBookAsync(user2Book.Id, _testUserId1);

        // Assert
        result.Should().BeFalse(); // User isolation should prevent deletion
        var bookStillExists = await _context.Books.FindAsync(user2Book.Id);
        bookStillExists.Should().NotBeNull(); // Book should still exist
    }

    [Fact]
    public async Task GetBooksAsync_WithDifferentUsers_ShouldReturnSeparateCollections()
    {
        // Act
        var (user1Books, user1Count) = await _repository.GetBooksAsync(_testUserId1);
        var (user2Books, user2Count) = await _repository.GetBooksAsync(_testUserId2);

        // Assert
        user1Books.Should().HaveCount(2);
        user1Count.Should().Be(2);
        user2Books.Should().HaveCount(1);
        user2Count.Should().Be(1);

        // Verify no overlap in book collections
        var user1BookIds = user1Books.Select(b => b.Id).ToList();
        var user2BookIds = user2Books.Select(b => b.Id).ToList();
        user1BookIds.Should().NotIntersectWith(user2BookIds);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}