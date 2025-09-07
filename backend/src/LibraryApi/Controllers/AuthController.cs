// <copyright file="AuthController.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Controllers;

using LibraryApi.Requests;
using LibraryApi.Responses;
using LibraryApi.Services;
using Microsoft.AspNetCore.Mvc;

/// <summary>
/// Controller for user authentication operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IUserService userService;
    private readonly ILogger<AuthController> logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="AuthController"/> class.
    /// </summary>
    /// <param name="userService">The user service.</param>
    /// <param name="logger">The logger.</param>
    public AuthController(IUserService userService, ILogger<AuthController> logger)
    {
        this.userService = userService;
        this.logger = logger;
    }

    /// <summary>
    /// Authenticates a user with email and password.
    /// </summary>
    /// <param name="request">The login request containing email and password.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Authentication response with JWT token and user info.</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        this.logger.LogInformation("Login attempt for user: {Email}", request.Email);

        if (!this.ModelState.IsValid)
        {
            return this.BadRequest(this.ModelState);
        }

        var authResponse = await this.userService.LoginAsync(request, cancellationToken);
        if (authResponse == null)
        {
            this.logger.LogWarning("Login failed for user: {Email}", request.Email);
            return this.Unauthorized("Invalid email or password");
        }

        this.logger.LogInformation("Login successful for user: {Email}", request.Email);
        return this.Ok(authResponse);
    }

    /// <summary>
    /// Registers a new user account.
    /// </summary>
    /// <param name="request">The registration request containing user details.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Authentication response with JWT token and user info.</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponse>> Register(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        this.logger.LogInformation("Registration attempt for user: {Email}", request.Email);

        if (!this.ModelState.IsValid)
        {
            return this.BadRequest(this.ModelState);
        }

        var authResponse = await this.userService.RegisterAsync(request, cancellationToken);
        if (authResponse == null)
        {
            this.logger.LogWarning("Registration failed for user: {Email} - User already exists", request.Email);
            return this.Conflict("A user with this email address already exists");
        }

        this.logger.LogInformation("Registration successful for user: {Email}", request.Email);
        return this.CreatedAtAction(nameof(this.Register), authResponse);
    }
}
