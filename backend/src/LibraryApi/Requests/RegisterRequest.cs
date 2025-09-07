// <copyright file="RegisterRequest.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Requests
{
    using System.ComponentModel.DataAnnotations;

    /// <summary>
    /// Request model for user registration.
    /// </summary>
    public class RegisterRequest
    {
        /// <summary>
        /// Gets or sets the user's email address.
        /// </summary>
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [MaxLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the user's password.
        /// </summary>
        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        [MaxLength(100, ErrorMessage = "Password cannot exceed 100 characters")]
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the password confirmation.
        /// </summary>
        [Required(ErrorMessage = "Password confirmation is required")]
        [Compare("Password", ErrorMessage = "Password and confirmation do not match")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
