// <copyright file="AuthResponse.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Responses
{
    /// <summary>
    /// Response model for authentication operations.
    /// </summary>
    public class AuthResponse
    {
        /// <summary>
        /// Gets or sets the JWT token for authenticated requests.
        /// </summary>
        public string Token { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the user's email address.
        /// </summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the user's unique identifier.
        /// </summary>
        public Guid UserId { get; set; }

        /// <summary>
        /// Gets or sets the token expiration date.
        /// </summary>
        public DateTime ExpiresAt { get; set; }
    }
}
