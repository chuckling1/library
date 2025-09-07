using FluentAssertions;
using LibraryApi.Requests;
using System.ComponentModel.DataAnnotations;
using Xunit;

namespace LibraryApi.Tests.Validators
{
    /// <summary>
    /// Tests for RegisterRequest model validation attributes.
    /// </summary>
    public class RegisterRequestValidatorTests
    {
        #region Email Validation Tests

        [Fact]
        public void RegisterRequest_WithValidEmail_PassesValidation()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Email = "test@example.com",
                Password = "password123",
                ConfirmPassword = "password123"
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().BeEmpty();
        }

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public void RegisterRequest_WithEmptyEmail_FailsValidation(string? email)
        {
            // Arrange
            var request = new RegisterRequest
            {
                Email = email!,
                Password = "password123",
                ConfirmPassword = "password123"
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
        public void RegisterRequest_WithInvalidEmailFormat_FailsValidation(string email)
        {
            // Arrange
            var request = new RegisterRequest
            {
                Email = email,
                Password = "password123",
                ConfirmPassword = "password123"
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().ContainSingle()
                .Which.ErrorMessage.Should().Be("Invalid email format");
        }

        #endregion

        #region Password Validation Tests

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public void RegisterRequest_WithEmptyPassword_FailsValidation(string? password)
        {
            // Arrange
            var request = new RegisterRequest
            {
                Email = "test@example.com",
                Password = password!,
                ConfirmPassword = "password123"
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            var errorMessages = validationResults.Select(r => r.ErrorMessage).ToList();
            errorMessages.Should().Contain("Password is required");
        }

        [Theory]
        [InlineData("12345")] // 5 chars
        [InlineData("a")]     // 1 char
        public void RegisterRequest_WithShortPassword_FailsValidation(string password)
        {
            // Arrange
            var request = new RegisterRequest
            {
                Email = "test@example.com",
                Password = password,
                ConfirmPassword = password
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().ContainSingle()
                .Which.ErrorMessage.Should().Be("Password must be at least 6 characters");
        }

        [Fact]
        public void RegisterRequest_WithTooLongPassword_FailsValidation()
        {
            // Arrange
            var longPassword = new string('a', 101); // 101 chars
            var request = new RegisterRequest
            {
                Email = "test@example.com",
                Password = longPassword,
                ConfirmPassword = longPassword
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().ContainSingle()
                .Which.ErrorMessage.Should().Be("Password cannot exceed 100 characters");
        }

        #endregion

        #region ConfirmPassword Validation Tests

        [Theory]
        [InlineData("")]
        [InlineData(null)]
        public void RegisterRequest_WithEmptyConfirmPassword_FailsValidation(string? confirmPassword)
        {
            // Arrange
            var request = new RegisterRequest
            {
                Email = "test@example.com",
                Password = "password123",
                ConfirmPassword = confirmPassword!
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().ContainSingle()
                .Which.ErrorMessage.Should().Be("Password confirmation is required");
        }

        [Fact]
        public void RegisterRequest_WithMismatchedPasswords_FailsValidation()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Email = "test@example.com",
                Password = "password123",
                ConfirmPassword = "differentpassword"
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().ContainSingle()
                .Which.ErrorMessage.Should().Be("Password and confirmation do not match");
        }

        [Fact]
        public void RegisterRequest_WithMatchingPasswords_PassesValidation()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Email = "test@example.com",
                Password = "password123",
                ConfirmPassword = "password123"
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().BeEmpty();
        }

        #endregion

        #region Complex Validation Scenarios

        [Fact]
        public void RegisterRequest_WithAllValidFields_PassesValidation()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Email = "newuser@example.com",
                Password = "SecurePassword123!",
                ConfirmPassword = "SecurePassword123!"
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().BeEmpty();
        }

        [Fact]
        public void RegisterRequest_WithMultipleValidationErrors_ReturnsAllErrors()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Email = "invalid-email", // Invalid format
                Password = "123",        // Too short
                ConfirmPassword = ""     // Empty
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().HaveCount(3);
            var errorMessages = validationResults.Select(r => r.ErrorMessage).ToList();
            errorMessages.Should().Contain("Invalid email format");
            errorMessages.Should().Contain("Password must be at least 6 characters");
            errorMessages.Should().Contain("Password confirmation is required");
        }

        [Fact]
        public void RegisterRequest_WithPasswordTooShortAndMismatch_ReturnsRelevantErrors()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Email = "test@example.com",
                Password = "123",           // Too short
                ConfirmPassword = "456"     // Different but also too short
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().HaveCount(2);
            var errorMessages = validationResults.Select(r => r.ErrorMessage).ToList();
            errorMessages.Should().Contain("Password must be at least 6 characters");
            errorMessages.Should().Contain("Password and confirmation do not match");
        }

        [Theory]
        [InlineData("user@domain.co")]
        [InlineData("user.name@domain.com")]
        [InlineData("user+tag@domain.org")]
        [InlineData("user123@sub.domain.net")]
        public void RegisterRequest_WithVariousValidEmailFormats_PassesValidation(string email)
        {
            // Arrange
            var request = new RegisterRequest
            {
                Email = email,
                Password = "password123",
                ConfirmPassword = "password123"
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().BeEmpty();
        }

        [Theory]
        [InlineData("password")]           // 8 chars
        [InlineData("123456")]            // 6 chars (minimum)
        [InlineData("VeryLongPassword123456789")] // Long password
        [InlineData("P@ssw0rd!")]         // Special characters
        public void RegisterRequest_WithVariousValidPasswords_PassesValidation(string password)
        {
            // Arrange
            var request = new RegisterRequest
            {
                Email = "test@example.com",
                Password = password,
                ConfirmPassword = password
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().BeEmpty();
        }

        #endregion

        #region Edge Cases

        [Fact]
        public void RegisterRequest_WithMaxLengthEmail_PassesValidation()
        {
            // Arrange
            var maxLengthEmail = new string('a', 240) + "@example.com"; // 251 chars total (under 255 limit)
            var request = new RegisterRequest
            {
                Email = maxLengthEmail,
                Password = "password123",
                ConfirmPassword = "password123"
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().BeEmpty();
        }

        [Fact]
        public void RegisterRequest_WithMaxLengthPassword_PassesValidation()
        {
            // Arrange
            var maxLengthPassword = new string('a', 100); // 100 chars (at limit)
            var request = new RegisterRequest
            {
                Email = "test@example.com",
                Password = maxLengthPassword,
                ConfirmPassword = maxLengthPassword
            };

            // Act
            var validationResults = ValidateModel(request);

            // Assert
            validationResults.Should().BeEmpty();
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