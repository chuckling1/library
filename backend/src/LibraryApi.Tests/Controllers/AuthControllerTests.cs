using FluentAssertions;
using LibraryApi.Controllers;
using LibraryApi.Requests;
using LibraryApi.Responses;
using LibraryApi.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace LibraryApi.Tests.Controllers
{
    /// <summary>
    /// Comprehensive tests for AuthController covering login and registration endpoints.
    /// </summary>
    public class AuthControllerTests
    {
        private readonly Mock<IUserService> _mockUserService;
        private readonly Mock<ILogger<AuthController>> _mockLogger;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            _mockUserService = new Mock<IUserService>();
            _mockLogger = new Mock<ILogger<AuthController>>();
            _controller = new AuthController(_mockUserService.Object, _mockLogger.Object);
        }

        #region Login Tests

        [Fact]
        public async Task Login_WithValidCredentials_ReturnsOkWithAuthResponse()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "password123"
            };

            var authResponse = new AuthResponse
            {
                Token = "valid-jwt-token",
                Email = loginRequest.Email,
                UserId = Guid.NewGuid(),
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            };

            _mockUserService.Setup(x => x.LoginAsync(loginRequest, It.IsAny<CancellationToken>()))
                .ReturnsAsync(authResponse);

            // Act
            var result = await _controller.Login(loginRequest);

            // Assert
            var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
            
            var returnedAuthResponse = okResult.Value.Should().BeOfType<AuthResponse>().Subject;
            returnedAuthResponse.Token.Should().Be(authResponse.Token);
            returnedAuthResponse.Email.Should().Be(authResponse.Email);
            returnedAuthResponse.UserId.Should().Be(authResponse.UserId);
        }

        [Fact]
        public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "wrongpassword"
            };

            _mockUserService.Setup(x => x.LoginAsync(loginRequest, It.IsAny<CancellationToken>()))
                .ReturnsAsync((AuthResponse?)null);

            // Act
            var result = await _controller.Login(loginRequest);

            // Assert
            var unauthorizedResult = result.Result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
            unauthorizedResult.StatusCode.Should().Be(StatusCodes.Status401Unauthorized);
            unauthorizedResult.Value.Should().Be("Invalid email or password");
        }

        [Fact]
        public async Task Login_WithInvalidModelState_ReturnsBadRequest()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "", // Invalid email
                Password = "password123"
            };

            _controller.ModelState.AddModelError("Email", "Email is required");

            // Act
            var result = await _controller.Login(loginRequest);

            // Assert
            var badRequestResult = result.Result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequestResult.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
            badRequestResult.Value.Should().BeOfType<SerializableError>();
        }

        #endregion

        #region Register Tests

        [Fact]
        public async Task Register_WithValidRequest_ReturnsCreatedWithAuthResponse()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Email = "newuser@example.com",
                Password = "password123",
                ConfirmPassword = "password123"
            };

            var authResponse = new AuthResponse
            {
                Token = "valid-jwt-token",
                Email = registerRequest.Email,
                UserId = Guid.NewGuid(),
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            };

            _mockUserService.Setup(x => x.RegisterAsync(registerRequest, It.IsAny<CancellationToken>()))
                .ReturnsAsync(authResponse);

            // Act
            var result = await _controller.Register(registerRequest);

            // Assert
            var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
            createdResult.StatusCode.Should().Be(StatusCodes.Status201Created);
            createdResult.ActionName.Should().Be(nameof(_controller.Register));
            
            var returnedAuthResponse = createdResult.Value.Should().BeOfType<AuthResponse>().Subject;
            returnedAuthResponse.Token.Should().Be(authResponse.Token);
            returnedAuthResponse.Email.Should().Be(authResponse.Email);
            returnedAuthResponse.UserId.Should().Be(authResponse.UserId);
        }

        [Fact]
        public async Task Register_WithExistingEmail_ReturnsConflict()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Email = "existing@example.com",
                Password = "password123",
                ConfirmPassword = "password123"
            };

            _mockUserService.Setup(x => x.RegisterAsync(registerRequest, It.IsAny<CancellationToken>()))
                .ReturnsAsync((AuthResponse?)null);

            // Act
            var result = await _controller.Register(registerRequest);

            // Assert
            var conflictResult = result.Result.Should().BeOfType<ConflictObjectResult>().Subject;
            conflictResult.StatusCode.Should().Be(StatusCodes.Status409Conflict);
            conflictResult.Value.Should().Be("A user with this email address already exists");
        }

        [Fact]
        public async Task Register_WithInvalidModelState_ReturnsBadRequest()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Email = "invalid-email", // Invalid email format
                Password = "password123",
                ConfirmPassword = "password123"
            };

            _controller.ModelState.AddModelError("Email", "Invalid email format");

            // Act
            var result = await _controller.Register(registerRequest);

            // Assert
            var badRequestResult = result.Result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequestResult.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
            badRequestResult.Value.Should().BeOfType<SerializableError>();
        }

        [Fact]
        public async Task Register_WithPasswordMismatch_ReturnsBadRequest()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Email = "test@example.com",
                Password = "password123",
                ConfirmPassword = "differentpassword"
            };

            _controller.ModelState.AddModelError("ConfirmPassword", "Password and confirmation do not match");

            // Act
            var result = await _controller.Register(registerRequest);

            // Assert
            var badRequestResult = result.Result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequestResult.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        }

        #endregion

        #region Integration Tests

        [Fact]
        public async Task Login_ServiceThrowsException_AllowsExceptionToBubbleUp()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "password123"
            };

            _mockUserService.Setup(x => x.LoginAsync(loginRequest, It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("Database connection failed"));

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => 
                _controller.Login(loginRequest));
            exception.Message.Should().Be("Database connection failed");
        }

        [Fact]
        public async Task Register_ServiceThrowsException_AllowsExceptionToBubbleUp()
        {
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Email = "test@example.com",
                Password = "password123",
                ConfirmPassword = "password123"
            };

            _mockUserService.Setup(x => x.RegisterAsync(registerRequest, It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("Database connection failed"));

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => 
                _controller.Register(registerRequest));
            exception.Message.Should().Be("Database connection failed");
        }

        #endregion
    }
}