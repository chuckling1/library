using Microsoft.EntityFrameworkCore;

namespace LibraryApi.Tests.Data;

/// <summary>
/// Comprehensive tests for LibraryDbContext functionality.
/// </summary>
public class LibraryDbContextTests : IDisposable
{
    private readonly LibraryDbContext _context;
    private readonly DbContextOptions<LibraryDbContext> _options;

    /// <summary>
    /// Initializes a new instance of the <see cref="LibraryDbContextTests"/> class.
    /// </summary>
    public LibraryDbContextTests()
    {
        _options = new DbContextOptionsBuilder<LibraryDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new LibraryDbContext(_options);
        _context.Database.EnsureCreated();
    }

    [Fact]
    public void DbContext_WhenInitialized_SetsDbSetsCorrectly()
    {
        // Act & Assert
        _context.Books.Should().NotBeNull();
        _context.Genres.Should().NotBeNull();
        _context.BookGenres.Should().NotBeNull();
    }

    [Fact]
    public void DbContext_WhenCreated_SeedsSystemGenres()
    {
        // Act
        var seededGenres = _context.Genres.Where(g => g.IsSystemGenre).ToList();

        // Assert
        seededGenres.Should().NotBeEmpty();
        seededGenres.Should().HaveCount(10);
        
        var expectedGenres = new[] 
        { 
            "Fiction", "Non-Fiction", "Science", "Technology", "Biography", 
            "History", "Romance", "Mystery", "Fantasy", "Self-Help" 
        };
        
        var actualGenreNames = seededGenres.Select(g => g.Name).ToList();
        actualGenreNames.Should().BeEquivalentTo(expectedGenres);
        
        seededGenres.Should().OnlyContain(g => g.IsSystemGenre);
        seededGenres.Should().OnlyContain(g => g.CreatedAt == new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public async Task SaveChangesAsync_WhenAddingNewBook_SetsCreatedAtAndId()
    {
        // Arrange
        var book = new Book
        {
            Title = "Test Book",
            Author = "Test Author",
            Rating = 4
        };

        // Act
        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        // Assert
        book.Id.Should().NotBe(Guid.Empty);
        book.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        book.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task SaveChangesAsync_WhenModifyingExistingBook_UpdatesUpdatedAt()
    {
        // Arrange
        var book = new Book
        {
            Title = "Original Title",
            Author = "Test Author",
            Rating = 3
        };
        
        _context.Books.Add(book);
        await _context.SaveChangesAsync();
        
        var originalCreatedAt = book.CreatedAt;
        var originalUpdatedAt = book.UpdatedAt;

        // Wait a moment to ensure different timestamps
        await Task.Delay(100);

        // Act
        book.Title = "Modified Title";
        _context.Books.Update(book);
        await _context.SaveChangesAsync();

        // Assert
        book.CreatedAt.Should().Be(originalCreatedAt); // Should not change
        book.UpdatedAt.Should().BeAfter(originalUpdatedAt);
        book.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task SaveChangesAsync_WhenAddingNewGenre_SetsCreatedAt()
    {
        // Arrange
        var genre = new Genre
        {
            Name = "New Custom Genre",
            IsSystemGenre = false
        };

        // Act
        _context.Genres.Add(genre);
        await _context.SaveChangesAsync();

        // Assert
        genre.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        genre.IsSystemGenre.Should().BeFalse();
    }

    [Fact]
    public async Task BookGenreRelationship_WhenConfigured_WorksCorrectly()
    {
        // Arrange
        var book = new Book
        {
            Title = "Test Book",
            Author = "Test Author",
            Rating = 4
        };

        var genre = new Genre
        {
            Name = "Test Genre",
            IsSystemGenre = false
        };

        _context.Books.Add(book);
        _context.Genres.Add(genre);
        await _context.SaveChangesAsync();

        var bookGenre = new BookGenre
        {
            BookId = book.Id,
            GenreName = genre.Name,
            Book = book,
            Genre = genre
        };

        // Act
        _context.BookGenres.Add(bookGenre);
        await _context.SaveChangesAsync();

        // Assert
        var retrievedBookGenre = await _context.BookGenres
            .Include(bg => bg.Book)
            .Include(bg => bg.Genre)
            .FirstAsync(bg => bg.BookId == book.Id && bg.GenreName == genre.Name);

        retrievedBookGenre.Should().NotBeNull();
        retrievedBookGenre.Book.Should().NotBeNull();
        retrievedBookGenre.Book.Title.Should().Be("Test Book");
        retrievedBookGenre.Genre.Should().NotBeNull();
        retrievedBookGenre.Genre.Name.Should().Be("Test Genre");
    }

    [Fact]
    public async Task BookGenreRelationship_WhenBookDeleted_CascadeDeletesBookGenres()
    {
        // Arrange
        var book = new Book
        {
            Title = "Test Book",
            Author = "Test Author",
            Rating = 4
        };

        var genre = await _context.Genres.FirstAsync(g => g.Name == "Fiction");

        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        var bookGenre = new BookGenre
        {
            BookId = book.Id,
            GenreName = genre.Name
        };

        _context.BookGenres.Add(bookGenre);
        await _context.SaveChangesAsync();

        var bookGenreCount = await _context.BookGenres
            .CountAsync(bg => bg.BookId == book.Id);
        bookGenreCount.Should().Be(1);

        // Act
        _context.Books.Remove(book);
        await _context.SaveChangesAsync();

        // Assert
        var remainingBookGenres = await _context.BookGenres
            .CountAsync(bg => bg.BookId == book.Id);
        remainingBookGenres.Should().Be(0);
    }

    [Fact]
    public void ModelConfiguration_BookEntity_HasCorrectConstraints()
    {
        // Act & Assert - These assertions verify the entity configuration
        var bookEntityType = _context.Model.FindEntityType(typeof(Book));
        bookEntityType.Should().NotBeNull();

        var titleProperty = bookEntityType!.FindProperty(nameof(Book.Title));
        titleProperty.Should().NotBeNull();
        titleProperty!.IsNullable.Should().BeFalse();
        titleProperty.GetMaxLength().Should().Be(255);

        var authorProperty = bookEntityType.FindProperty(nameof(Book.Author));
        authorProperty.Should().NotBeNull();
        authorProperty!.IsNullable.Should().BeFalse();
        authorProperty.GetMaxLength().Should().Be(255);

        var isbnProperty = bookEntityType.FindProperty(nameof(Book.Isbn));
        isbnProperty.Should().NotBeNull();
        isbnProperty!.GetMaxLength().Should().Be(20);

        var editionProperty = bookEntityType.FindProperty(nameof(Book.Edition));
        editionProperty.Should().NotBeNull();
        editionProperty!.GetMaxLength().Should().Be(100);

        var ratingProperty = bookEntityType.FindProperty(nameof(Book.Rating));
        ratingProperty.Should().NotBeNull();
        ratingProperty!.GetDefaultValue().Should().Be(1);
    }

    [Fact]
    public void ModelConfiguration_GenreEntity_HasCorrectConstraints()
    {
        // Act & Assert
        var genreEntityType = _context.Model.FindEntityType(typeof(Genre));
        genreEntityType.Should().NotBeNull();

        var nameProperty = genreEntityType!.FindProperty(nameof(Genre.Name));
        nameProperty.Should().NotBeNull();
        nameProperty!.GetMaxLength().Should().Be(50);

        var isSystemGenreProperty = genreEntityType.FindProperty(nameof(Genre.IsSystemGenre));
        isSystemGenreProperty.Should().NotBeNull();
        isSystemGenreProperty!.GetDefaultValue().Should().Be(false);

        // Check that Name is the primary key
        var primaryKey = genreEntityType.FindPrimaryKey();
        primaryKey.Should().NotBeNull();
        primaryKey!.Properties.Should().HaveCount(1);
        primaryKey.Properties.First().Name.Should().Be(nameof(Genre.Name));
    }

    [Fact]
    public void ModelConfiguration_BookGenreEntity_HasCorrectCompositeKey()
    {
        // Act & Assert
        var bookGenreEntityType = _context.Model.FindEntityType(typeof(BookGenre));
        bookGenreEntityType.Should().NotBeNull();

        var primaryKey = bookGenreEntityType!.FindPrimaryKey();
        primaryKey.Should().NotBeNull();
        primaryKey!.Properties.Should().HaveCount(2);
        
        var keyPropertyNames = primaryKey.Properties.Select(p => p.Name).ToList();
        keyPropertyNames.Should().Contain(nameof(BookGenre.BookId));
        keyPropertyNames.Should().Contain(nameof(BookGenre.GenreName));

        // Check foreign key relationships
        var foreignKeys = bookGenreEntityType.GetForeignKeys().ToList();
        foreignKeys.Should().HaveCount(2);

        var bookForeignKey = foreignKeys.FirstOrDefault(fk => 
            fk.PrincipalEntityType.ClrType == typeof(Book));
        bookForeignKey.Should().NotBeNull();
        bookForeignKey!.DeleteBehavior.Should().Be(DeleteBehavior.Cascade);

        var genreForeignKey = foreignKeys.FirstOrDefault(fk => 
            fk.PrincipalEntityType.ClrType == typeof(Genre));
        genreForeignKey.Should().NotBeNull();
        genreForeignKey!.DeleteBehavior.Should().Be(DeleteBehavior.Cascade);
    }

    /// <summary>
    /// Disposes the test context.
    /// </summary>
    public void Dispose()
    {
        _context.Dispose();
    }
}