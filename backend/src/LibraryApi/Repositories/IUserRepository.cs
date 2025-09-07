// <copyright file="IUserRepository.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Repositories
{
    using LibraryApi.Models;

    /// <summary>
    /// Interface for user repository operations.
    /// </summary>
    public interface IUserRepository
    {
        /// <summary>
        /// Gets a user by their email address.
        /// </summary>
        /// <param name="email">The user's email address.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The user if found, null otherwise.</returns>
        Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a user by their unique identifier.
        /// </summary>
        /// <param name="id">The user's unique identifier.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The user if found, null otherwise.</returns>
        Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

        /// <summary>
        /// Creates a new user.
        /// </summary>
        /// <param name="user">The user to create.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>The created user.</returns>
        Task<User> CreateAsync(User user, CancellationToken cancellationToken = default);

        /// <summary>
        /// Checks if a user with the specified email already exists.
        /// </summary>
        /// <param name="email">The email address to check.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>True if a user with the email exists, false otherwise.</returns>
        Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default);
    }
}
