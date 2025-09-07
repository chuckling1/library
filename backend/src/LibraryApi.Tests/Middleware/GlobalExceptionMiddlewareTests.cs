using System.Globalization;
using System.Net;
using System.Text.Json;
using FluentAssertions;
using LibraryApi.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace LibraryApi.Tests.Middleware
{
    /// <summary>
    /// Comprehensive tests for GlobalExceptionMiddleware covering all exception handling scenarios.
    /// </summary>
    public class GlobalExceptionMiddlewareTests
    {
        private readonly Mock<RequestDelegate> _mockNext;
        private readonly Mock<ILogger<GlobalExceptionMiddleware>> _mockLogger;
        private readonly GlobalExceptionMiddleware _middleware;
        private readonly DefaultHttpContext _httpContext;

        public GlobalExceptionMiddlewareTests()
        {
            _mockNext = new Mock<RequestDelegate>();
            _mockLogger = new Mock<ILogger<GlobalExceptionMiddleware>>();
            _middleware = new GlobalExceptionMiddleware(_mockNext.Object, _mockLogger.Object);
            _httpContext = new DefaultHttpContext();
            _httpContext.Response.Body = new MemoryStream();
        }

        [Fact]
        public async Task InvokeAsync_WhenNoException_CallsNextMiddleware()
        {
            // Arrange
            _mockNext.Setup(next => next(_httpContext)).Returns(Task.CompletedTask);

            // Act
            await _middleware.InvokeAsync(_httpContext);

            // Assert
            _mockNext.Verify(next => next(_httpContext), Times.Once);
            _httpContext.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
        }

        [Theory]
        [InlineData(typeof(ArgumentException), HttpStatusCode.BadRequest)]
        [InlineData(typeof(KeyNotFoundException), HttpStatusCode.NotFound)]
        [InlineData(typeof(UnauthorizedAccessException), HttpStatusCode.Unauthorized)]
        [InlineData(typeof(InvalidOperationException), HttpStatusCode.InternalServerError)]
        [InlineData(typeof(Exception), HttpStatusCode.InternalServerError)]
        public async Task InvokeAsync_WhenExceptionThrown_ReturnsCorrectStatusCodeAndResponse(Type exceptionType, HttpStatusCode expectedStatusCode)
        {
            // Arrange
            var exception = (Exception)Activator.CreateInstance(exceptionType, "Test exception message")!;
            _mockNext.Setup(next => next(_httpContext)).ThrowsAsync(exception);

            // Act
            await _middleware.InvokeAsync(_httpContext);

            // Assert
            _httpContext.Response.StatusCode.Should().Be((int)expectedStatusCode);
            _httpContext.Response.ContentType.Should().Be("application/json");

            // Verify response content
            _httpContext.Response.Body.Position = 0;
            using var reader = new StreamReader(_httpContext.Response.Body);
            var responseBody = await reader.ReadToEndAsync();
            responseBody.Should().NotBeEmpty();

            // Parse and verify JSON structure
            var responseObject = JsonSerializer.Deserialize<JsonElement>(responseBody);
            responseObject.GetProperty("success").GetBoolean().Should().BeFalse();
            responseObject.GetProperty("error").GetProperty("message").GetString()
                .Should().Be("An error occurred while processing your request.");
            responseObject.GetProperty("error").GetProperty("traceId").GetString()
                .Should().Be(_httpContext.TraceIdentifier);
            responseObject.GetProperty("error").GetProperty("timestamp").GetString().Should().NotBeEmpty();
        }

        [Fact]
        public async Task InvokeAsync_WhenExceptionThrown_LogsErrorWithCorrectDetails()
        {
            // Arrange
            var exception = new ArgumentException("Test argument exception");
            _mockNext.Setup(next => next(_httpContext)).ThrowsAsync(exception);

            // Act
            await _middleware.InvokeAsync(_httpContext);

            // Assert
            _mockLogger.Verify(
                logger => logger.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("An unhandled exception occurred")),
                    exception,
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task InvokeAsync_WhenExceptionThrown_ResponseContainsCorrectTimestampFormat()
        {
            // Arrange
            var exception = new Exception("Test exception");
            _mockNext.Setup(next => next(_httpContext)).ThrowsAsync(exception);
            var beforeExecution = DateTime.UtcNow;

            // Act
            await _middleware.InvokeAsync(_httpContext);

            // Assert
            _httpContext.Response.Body.Position = 0;
            using var reader = new StreamReader(_httpContext.Response.Body);
            var responseBody = await reader.ReadToEndAsync();

            var responseObject = JsonSerializer.Deserialize<JsonElement>(responseBody);
            var timestampString = responseObject.GetProperty("error").GetProperty("timestamp").GetString();
            timestampString.Should().NotBeEmpty();

            // Verify timestamp format and is recent (allow for timezone differences)
            var timestamp = DateTime.ParseExact(timestampString!, "yyyy-MM-ddTHH:mm:ss.fffZ", null, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal);
            timestamp.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(10));
            
            // Verify ISO 8601 format with milliseconds and Z suffix
            timestampString.Should().MatchRegex(@"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z");
        }
    }
}