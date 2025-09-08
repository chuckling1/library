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
    private readonly ISecurityEventService securityEventService;
    private readonly ILogger<AuthController> logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="AuthController"/> class.
    /// </summary>
    /// <param name="userService">The user service.</param>
    /// <param name="securityEventService">The security event service.</param>
    /// <param name="logger">The logger.</param>
    public AuthController(
        IUserService userService,
        ISecurityEventService securityEventService,
        ILogger<AuthController> logger)
    {
        this.userService = userService;
        this.securityEventService = securityEventService;
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

        // SECURITY ENHANCEMENT: Set httpOnly cookie for secure token storage (Phase 2)
        this.SetSecureAuthCookie(authResponse.Token);
        await this.securityEventService.LogSecurityEventAsync(
            "LOGIN_SUCCESS",
            "User login successful with secure cookie set",
            new { email = request.Email, cookieSet = true });

        this.logger.LogInformation("Login successful for user: {Email}", request.Email);

        // SECURITY: Don't expose token in response body - it's secure in httpOnly cookie
        return this.Ok(new { email = authResponse.Email, message = "Login successful" });
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

        // SECURITY ENHANCEMENT: Set httpOnly cookie for secure token storage (Phase 2)
        this.SetSecureAuthCookie(authResponse.Token);
        await this.securityEventService.LogSecurityEventAsync(
            "REGISTER_SUCCESS",
            "User registration successful with secure cookie set",
            new { email = request.Email, cookieSet = true });

        this.logger.LogInformation("Registration successful for user: {Email}", request.Email);

        // SECURITY: Don't expose token in response body - it's secure in httpOnly cookie
        return this.CreatedAtAction(nameof(this.Register), new { email = authResponse.Email, message = "Registration successful" });
    }

    /// <summary>
    /// Logs out the current user by clearing the authentication cookie.
    /// </summary>
    /// <returns>Success response.</returns>
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> Logout()
    {
        // SECURITY ENHANCEMENT: Clear httpOnly authentication cookie
        this.Response.Cookies.Delete("auth-token", new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Lax,
            Path = "/",
        });

        await this.securityEventService.LogSecurityEventAsync(
            "LOGOUT_SUCCESS",
            "User logout successful - secure cookie cleared",
            new { cookieCleared = true });

        this.logger.LogInformation("User logout successful");
        return this.Ok(new { message = "Logout successful" });
    }

    /// <summary>
    /// Gets the current authenticated user's information.
    /// Used to verify authentication status via httpOnly cookies.
    /// </summary>
    /// <returns>Current user information.</returns>
    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult GetCurrentUser()
    {
        // Extract email from JWT claims (from httpOnly cookie)
        var email = this.User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value
                    ?? this.User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

        if (string.IsNullOrEmpty(email))
        {
            return this.Unauthorized("Invalid authentication state");
        }

        return this.Ok(new { email });
    }

    /// <summary>
    /// Sets a secure httpOnly authentication cookie with the JWT token.
    /// </summary>
    /// <param name="token">The JWT token to store in the cookie.</param>
    private void SetSecureAuthCookie(string token)
    {
        this.Response.Cookies.Append("auth-token", token, new CookieOptions
        {
            HttpOnly = true,        // Prevents JavaScript access (XSS protection)
            Secure = false,         // Allow HTTP for development (Docker localhost setup)
            SameSite = SameSiteMode.Lax,  // Allow same-site requests (changed from None for HTTP development)
            Path = "/",             // Available for all paths
            Expires = DateTimeOffset.UtcNow.AddHours(24), // Same as JWT expiration
        });
    }
}
