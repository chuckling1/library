// <copyright file="UserRepository.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Repositories;

using LibraryApi.Data;
using LibraryApi.Models;
using Microsoft.EntityFrameworkCore;

/// <summary>
/// Repository implementation for user operations.
/// </summary>
public class UserRepository : IUserRepository
{
    private readonly LibraryDbContext context;
    private readonly ILogger<UserRepository> logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="UserRepository"/> class.
    /// </summary>
    /// <param name="context">The database context.</param>
    /// <param name="logger">The logger.</param>
    public UserRepository(LibraryDbContext context, ILogger<UserRepository> logger)
    {
        this.context = context;
        this.logger = logger;
    }

    /// <inheritdoc/>
    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        this.logger.LogDebug("Getting user by email: {Email}", email);

        return await this.context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower(), cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        this.logger.LogDebug("Getting user by ID: {UserId}", id);

        return await this.context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    /// <inheritdoc/>
    public async Task<User> CreateAsync(User user, CancellationToken cancellationToken = default)
    {
        this.logger.LogDebug("Creating new user with email: {Email}", user.Email);

        // Check for existing email before creating
        var existingUser = await this.context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == user.Email.ToLower(), cancellationToken);

        if (existingUser != null)
        {
            throw new InvalidOperationException($"A user with email '{user.Email}' already exists.");
        }

        this.context.Users.Add(user);
        await this.context.SaveChangesAsync(cancellationToken);

        this.logger.LogInformation("Created new user with ID: {UserId}", user.Id);
        return user;
    }

    /// <inheritdoc/>
    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        this.logger.LogDebug("Checking if user exists with email: {Email}", email);

        return await this.context.Users
            .AsNoTracking()
            .AnyAsync(u => u.Email.ToLower() == email.ToLower(), cancellationToken);
    }
}
