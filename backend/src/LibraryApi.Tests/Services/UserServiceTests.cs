using FluentAssertions;
using LibraryApi.Models;
using LibraryApi.Repositories;
using LibraryApi.Requests;
using LibraryApi.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace LibraryApi.Tests.Services
{
    /// <summary>
    /// Comprehensive tests for UserService covering authentication and JWT functionality.
    /// </summary>
    public class UserServiceTests
    {
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly IConfiguration _configuration;
        private readonly Mock<ILogger<UserService>> _mockLogger;
        private readonly UserService _userService;

        public UserServiceTests()
        {
            _mockUserRepository = new Mock<IUserRepository>();
            _mockLogger = new Mock<ILogger<UserService>>();

            // Create real configuration instead of mocking it
            var configurationData = new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "YourSuperSecretKeyForJWTTokenGeneration12345678901234567890",
                ["JwtSettings:Issuer"] = "LibraryAPI",
                ["JwtSettings:Audience"] = "LibraryAPIUsers",
                ["JwtSettings:ExpirationHours"] = "24"
            };

            _configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(configurationData)
                .Build();

            _userService = new UserService(_mockUserRepository.Object, _configuration, _mockLogger.Object);
        }

        #region LoginAsync Tests

        [Fact]
        public async Task LoginAsync_WithValidCredentials_ReturnsAuthResponse()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "password123"
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                CreatedAt = DateTime.UtcNow
            };

            _mockUserRepository.Setup(x => x.GetByEmailAsync(loginRequest.Email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

            // Act
            var result = await _userService.LoginAsync(loginRequest);

            // Assert
            result.Should().NotBeNull();
            result!.Email.Should().Be(user.Email);
            result.UserId.Should().Be(user.Id);
            result.Token.Should().NotBeNullOrEmpty();
            result.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
        }

        [Fact]
        public async Task LoginAsync_WithInvalidEmail_ReturnsNull()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "nonexistent@example.com",
                Password = "password123"
            };

            _mockUserRepository.Setup(x => x.GetByEmailAsync(loginRequest.Email, It.IsAny<CancellationToken>()))
                .ReturnsAsync((User?)null);

            // Act
            var result = await _userService.LoginAsync(loginRequest);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task LoginAsync_WithInvalidPassword_ReturnsNull()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "wrongpassword"
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("correctpassword"),
                CreatedAt = DateTime.UtcNow
            };

            _mockUserRepository.Setup(x => x.GetByEmailAsync(loginRequest.Email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(user);

            // Act
            var result = await _userService.LoginAsync(loginRequest);

            // Assert
            result.Should().BeNull();
        }

        #endregion

        #region RegisterAsync Tests

        [Fact]
        public async Task RegisterAsync_WithValidRequest_ReturnsAuthResponse()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Email = "newuser@example.com",
                Password = "password123",
                ConfirmPassword = "password123"
            };

            var createdUser = new User
            {
                Id = Guid.NewGuid(),
                Email = registerRequest.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerRequest.Password),
                CreatedAt = DateTime.UtcNow
            };

            _mockUserRepository.Setup(x => x.ExistsByEmailAsync(registerRequest.Email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);
            _mockUserRepository.Setup(x => x.CreateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(createdUser);

            // Act
            var result = await _userService.RegisterAsync(registerRequest);

            // Assert
            result.Should().NotBeNull();
            result!.Email.Should().Be(registerRequest.Email);
            result.UserId.Should().Be(createdUser.Id);
            result.Token.Should().NotBeNullOrEmpty();
            result.ExpiresAt.Should().BeAfter(DateTime.UtcNow);
        }

        [Fact]
        public async Task RegisterAsync_WithExistingEmail_ReturnsNull()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Email = "existing@example.com",
                Password = "password123",
                ConfirmPassword = "password123"
            };

            _mockUserRepository.Setup(x => x.ExistsByEmailAsync(registerRequest.Email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            // Act
            var result = await _userService.RegisterAsync(registerRequest);

            // Assert
            result.Should().BeNull();
            _mockUserRepository.Verify(x => x.CreateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        #endregion

        #region GetUserByEmailAsync Tests

        [Fact]
        public async Task GetUserByEmailAsync_WithValidEmail_ReturnsUser()
        {
            // Arrange
            var email = "test@example.com";
            var expectedUser = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = "hashedpassword",
                CreatedAt = DateTime.UtcNow
            };

            _mockUserRepository.Setup(x => x.GetByEmailAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync(expectedUser);

            // Act
            var result = await _userService.GetUserByEmailAsync(email);

            // Assert
            result.Should().NotBeNull();
            result!.Email.Should().Be(email);
            result.Id.Should().Be(expectedUser.Id);
        }

        [Fact]
        public async Task GetUserByEmailAsync_WithInvalidEmail_ReturnsNull()
        {
            // Arrange
            var email = "nonexistent@example.com";

            _mockUserRepository.Setup(x => x.GetByEmailAsync(email, It.IsAny<CancellationToken>()))
                .ReturnsAsync((User?)null);

            // Act
            var result = await _userService.GetUserByEmailAsync(email);

            // Assert
            result.Should().BeNull();
        }

        #endregion

        #region GetUserByIdAsync Tests

        [Fact]
        public async Task GetUserByIdAsync_WithValidId_ReturnsUser()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var expectedUser = new User
            {
                Id = userId,
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                CreatedAt = DateTime.UtcNow
            };

            _mockUserRepository.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(expectedUser);

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(userId);
            result.Email.Should().Be(expectedUser.Email);
        }

        [Fact]
        public async Task GetUserByIdAsync_WithInvalidId_ReturnsNull()
        {
            // Arrange
            var userId = Guid.NewGuid();

            _mockUserRepository.Setup(x => x.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((User?)null);

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            result.Should().BeNull();
        }

        #endregion

        #region GenerateJwtToken Tests

        [Fact]
        public void GenerateJwtToken_WithValidUser_ReturnsValidToken()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                CreatedAt = DateTime.UtcNow
            };

            // Act
            var token = _userService.GenerateJwtToken(user);

            // Assert
            token.Should().NotBeNullOrEmpty();
            
            // Verify token structure (JWT has 3 parts separated by dots)
            var tokenParts = token.Split('.');
            tokenParts.Should().HaveCount(3);
        }

        [Fact]
        public void GenerateJwtToken_WithMissingConfiguration_ThrowsException()
        {
            // Arrange
            var configWithMissingKey = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["JwtSettings:Issuer"] = "LibraryAPI",
                    ["JwtSettings:Audience"] = "LibraryAPIUsers",
                    ["JwtSettings:ExpirationHours"] = "24"
                    // SecretKey is intentionally missing
                })
                .Build();
            
            var userServiceWithBadConfig = new UserService(_mockUserRepository.Object, configWithMissingKey, _mockLogger.Object);
            
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                CreatedAt = DateTime.UtcNow
            };

            // Act & Assert
            var exception = Assert.Throws<InvalidOperationException>(() => userServiceWithBadConfig.GenerateJwtToken(user));
            exception.Message.Should().Contain("JWT SecretKey is not configured");
        }

        #endregion
    }
}