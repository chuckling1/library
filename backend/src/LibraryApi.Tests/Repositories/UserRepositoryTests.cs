using FluentAssertions;
using LibraryApi.Data;
using LibraryApi.Models;
using LibraryApi.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace LibraryApi.Tests.Repositories
{
    /// <summary>
    /// Comprehensive tests for UserRepository covering all CRUD operations.
    /// </summary>
    public class UserRepositoryTests : IDisposable
    {
        private readonly LibraryDbContext _context;
        private readonly Mock<ILogger<UserRepository>> _mockLogger;
        private readonly UserRepository _repository;
        private readonly string _databaseName;

        public UserRepositoryTests()
        {
            _databaseName = $"TestDb_{Guid.NewGuid()}";
            var options = new DbContextOptionsBuilder<LibraryDbContext>()
                .UseInMemoryDatabase(databaseName: _databaseName)
                .Options;

            _context = new LibraryDbContext(options);
            _mockLogger = new Mock<ILogger<UserRepository>>();
            _repository = new UserRepository(_context, _mockLogger.Object);

            // Ensure database is created
            _context.Database.EnsureCreated();
        }

        #region GetByEmailAsync Tests

        [Fact]
        public async Task GetByEmailAsync_WithExistingEmail_ReturnsUser()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByEmailAsync("test@example.com");

            // Assert
            result.Should().NotBeNull();
            result!.Email.Should().Be("test@example.com");
            result.Id.Should().Be(user.Id);
            result.PasswordHash.Should().Be(user.PasswordHash);
        }

        [Fact]
        public async Task GetByEmailAsync_WithNonExistentEmail_ReturnsNull()
        {
            // Arrange
            var existingUser = new User
            {
                Id = Guid.NewGuid(),
                Email = "existing@example.com",
                PasswordHash = "hashedpassword",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(existingUser);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByEmailAsync("nonexistent@example.com");

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetByEmailAsync_IsCaseInsensitive_ReturnsUser()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "Test@Example.Com",
                PasswordHash = "hashedpassword",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByEmailAsync("test@example.com");

            // Assert
            result.Should().NotBeNull();
            result!.Email.Should().Be("Test@Example.Com");
        }

        #endregion

        #region GetByIdAsync Tests

        [Fact]
        public async Task GetByIdAsync_WithExistingId_ReturnsUser()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByIdAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(userId);
            result.Email.Should().Be("test@example.com");
            result.PasswordHash.Should().Be(user.PasswordHash);
        }

        [Fact]
        public async Task GetByIdAsync_WithNonExistentId_ReturnsNull()
        {
            // Arrange
            var existingUser = new User
            {
                Id = Guid.NewGuid(),
                Email = "existing@example.com",
                PasswordHash = "hashedpassword",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(existingUser);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByIdAsync(Guid.NewGuid());

            // Assert
            result.Should().BeNull();
        }

        #endregion

        #region CreateAsync Tests

        [Fact]
        public async Task CreateAsync_WithValidUser_ReturnsCreatedUser()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "newuser@example.com",
                PasswordHash = "hashedpassword",
                CreatedAt = DateTime.UtcNow
            };

            // Act
            var result = await _repository.CreateAsync(user);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(user.Id);
            result.Email.Should().Be(user.Email);
            result.PasswordHash.Should().Be(user.PasswordHash);

            // Verify user is in database
            var dbUser = await _context.Users.FindAsync(user.Id);
            dbUser.Should().NotBeNull();
            dbUser!.Email.Should().Be(user.Email);
        }

        [Fact]
        public async Task CreateAsync_AutoGeneratesIdAndCreatedAt()
        {
            // Arrange
            var user = new User
            {
                Email = "newuser@example.com",
                PasswordHash = "hashedpassword"
            };

            // Act
            var result = await _repository.CreateAsync(user);

            // Assert
            result.Id.Should().NotBeEmpty();
            result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        }

        [Fact]
        public async Task CreateAsync_WithDuplicateEmail_ThrowsException()
        {
            // Arrange
            var existingUser = new User
            {
                Id = Guid.NewGuid(),
                Email = "duplicate@example.com",
                PasswordHash = "hashedpassword1",
                CreatedAt = DateTime.UtcNow
            };

            var duplicateUser = new User
            {
                Id = Guid.NewGuid(),
                Email = "duplicate@example.com", // Same email
                PasswordHash = "hashedpassword2",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(existingUser);
            await _context.SaveChangesAsync();

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => 
                _repository.CreateAsync(duplicateUser));
            
            // The exact exception type may vary depending on the database provider
            // but there should be some form of constraint violation
        }

        #endregion

        #region ExistsByEmailAsync Tests

        [Fact]
        public async Task ExistsByEmailAsync_WithExistingEmail_ReturnsTrue()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "existing@example.com",
                PasswordHash = "hashedpassword",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.ExistsByEmailAsync("existing@example.com");

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task ExistsByEmailAsync_WithNonExistentEmail_ReturnsFalse()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "existing@example.com",
                PasswordHash = "hashedpassword",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.ExistsByEmailAsync("nonexistent@example.com");

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task ExistsByEmailAsync_IsCaseInsensitive_ReturnsTrue()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "Test@Example.Com",
                PasswordHash = "hashedpassword",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.ExistsByEmailAsync("test@example.com");

            // Assert
            result.Should().BeTrue();
        }

        #endregion

        #region Integration Tests

        [Fact]
        public async Task Repository_WithMultipleOperations_WorksCorrectly()
        {
            // Arrange
            var user1 = new User
            {
                Email = "user1@example.com",
                PasswordHash = "hash1"
            };

            var user2 = new User
            {
                Email = "user2@example.com",
                PasswordHash = "hash2"
            };

            // Act & Assert - Create users
            var createdUser1 = await _repository.CreateAsync(user1);
            var createdUser2 = await _repository.CreateAsync(user2);

            createdUser1.Id.Should().NotBeEmpty();
            createdUser2.Id.Should().NotBeEmpty();

            // Act & Assert - Check existence
            var exists1 = await _repository.ExistsByEmailAsync("user1@example.com");
            var exists2 = await _repository.ExistsByEmailAsync("user2@example.com");
            var existsNon = await _repository.ExistsByEmailAsync("nonexistent@example.com");

            exists1.Should().BeTrue();
            exists2.Should().BeTrue();
            existsNon.Should().BeFalse();

            // Act & Assert - Get by email
            var retrievedUser1 = await _repository.GetByEmailAsync("user1@example.com");
            retrievedUser1.Should().NotBeNull();
            retrievedUser1!.Email.Should().Be("user1@example.com");

            // Act & Assert - Get by ID
            var retrievedUser2 = await _repository.GetByIdAsync(createdUser2.Id);
            retrievedUser2.Should().NotBeNull();
            retrievedUser2!.Email.Should().Be("user2@example.com");
        }

        #endregion

        public void Dispose()
        {
            _context?.Database.EnsureDeleted();
            _context?.Dispose();
        }
    }
}