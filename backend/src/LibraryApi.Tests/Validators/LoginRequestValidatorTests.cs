using FluentAssertions;
using LibraryApi.Requests;
using System.ComponentModel.DataAnnotations;
using Xunit;

namespace LibraryApi.Tests.Validators
{
    /// <summary>
    /// Tests for LoginRequest model validation attributes.
    /// </summary>
    public class LoginRequestValidatorTests
    {
        #region Email Validation Tests

        [Fact]
        public void LoginRequest_WithValidEmail_PassesValidation()
        {
            // Arrange
            var request = new LoginRequest
            {
                Email = "test@example.com",
                Password = "password123"
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().BeEmpty();
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public void LoginRequest_WithEmptyEmail_FailsValidation(string? email)
        {
            // Arrange
            var request = new LoginRequest
            {
                Email = email!,
                Password = "password123"
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().ContainSingle()
                .Which.ErrorMessage.Should().Be("Email is required");
        }

        [Theory]
        [InlineData("invalid-email")]
        [InlineData("@example.com")]
        [InlineData("test@")]
        [InlineData("test.example.com")]
        public void LoginRequest_WithInvalidEmailFormat_FailsValidation(string email)
        {
            // Arrange
            var request = new LoginRequest
            {
                Email = email,
                Password = "password123"
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().ContainSingle()
                .Which.ErrorMessage.Should().Be("Invalid email format");
        }

        [Fact]
        public void LoginRequest_WithTooLongEmail_FailsValidation()
        {
            // Arrange
            var longEmail = new string('a', 250) + "@example.com"; // 261 chars total
            var request = new LoginRequest
            {
                Email = longEmail,
                Password = "password123"
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().ContainSingle()
                .Which.ErrorMessage.Should().Be("Email cannot exceed 255 characters");
        }

        #endregion

        #region Password Validation Tests

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public void LoginRequest_WithEmptyPassword_FailsValidation(string? password)
        {
            // Arrange
            var request = new LoginRequest
            {
                Email = "test@example.com",
                Password = password!
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().ContainSingle()
                .Which.ErrorMessage.Should().Be("Password is required");
        }

        [Theory]
        [InlineData("12345")] // 5 chars
        [InlineData("a")]     // 1 char
        [InlineData("")]      // 0 chars
        public void LoginRequest_WithShortPassword_FailsValidation(string password)
        {
            // Arrange
            var request = new LoginRequest
            {
                Email = "test@example.com",
                Password = password
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            var errorMessages = validationResults.Select(r => r.ErrorMessage).ToList();
            
            if (string.IsNullOrEmpty(password))
            {
                errorMessages.Should().Contain("Password is required");
            }
            else
            {
                errorMessages.Should().Contain("Password must be at least 6 characters");
            }
        }

        [Fact]
        public void LoginRequest_WithTooLongPassword_FailsValidation()
        {
            // Arrange
            var longPassword = new string('a', 101); // 101 chars
            var request = new LoginRequest
            {
                Email = "test@example.com",
                Password = longPassword
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().ContainSingle()
                .Which.ErrorMessage.Should().Be("Password cannot exceed 100 characters");
        }

        [Theory]
        [InlineData("password")]        // 8 chars
        [InlineData("123456")]         // 6 chars (minimum)
        [InlineData("a1b2c3d4e5")]     // 10 chars with numbers
        public void LoginRequest_WithValidPassword_PassesValidation(string password)
        {
            // Arrange
            var request = new LoginRequest
            {
                Email = "test@example.com",
                Password = password
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().BeEmpty();
        }

        #endregion

        #region Multiple Validation Errors Tests

        [Fact]
        public void LoginRequest_WithMultipleValidationErrors_ReturnsAllErrors()
        {
            // Arrange
            var request = new LoginRequest
            {
                Email = "", // Required error
                Password = "123" // Too short error
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().HaveCount(2);
            var errorMessages = validationResults.Select(r => r.ErrorMessage).ToList();
            errorMessages.Should().Contain("Email is required");
            errorMessages.Should().Contain("Password must be at least 6 characters");
        }

        #endregion

        #region Helper Methods

        private static List<ValidationResult> ValidateModel(object model)
        {
            var validationResults = new List<ValidationResult>();
            var context = new ValidationContext(model, null, null);
            Validator.TryValidateObject(model, context, validationResults, true);
            return validationResults;
        }

        #endregion
    }
}