// <copyright file="IUserService.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Services
{
    using LibraryApi.Models;
    using LibraryApi.Requests;
    using LibraryApi.Responses;

    /// <summary>
    /// Interface for user authentication and management operations.
    /// </summary>
    public interface IUserService
    {
        /// <summary>
        /// Authenticates a user with email and password.
        /// </summary>
        /// <param name="request">The login request containing email and password.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Authentication response with token and user info, or null if authentication failed.</returns>
        Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);

        /// <summary>
        /// Registers a new user account.
        /// </summary>
        /// <param name="request">The registration request containing user details.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Authentication response with token and user info, or null if registration failed.</returns>
        Task<AuthResponse?> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a user by their email address.
        /// </summary>
        /// <param name="email">The user's email address.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The user if found, null otherwise.</returns>
        Task<User?> GetUserByEmailAsync(string email, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a user by their unique identifier.
        /// </summary>
        /// <param name="id">The user's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The user if found, null otherwise.</returns>
        Task<User?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default);

        /// <summary>
        /// Generates a JWT token for the specified user.
        /// </summary>
        /// <param name="user">The user to generate a token for.</param>
        /// <returns>JWT token string.</returns>
        string GenerateJwtToken(User user);
    }
}
