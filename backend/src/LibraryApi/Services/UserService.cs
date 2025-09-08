// <copyright file="UserService.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Services
{
    using System.IdentityModel.Tokens.Jwt;
    using System.Security.Claims;
    using System.Security.Cryptography;
    using System.Text;
    using LibraryApi.Models;
    using LibraryApi.Repositories;
    using LibraryApi.Requests;
    using LibraryApi.Responses;
    using Microsoft.IdentityModel.Tokens;

    /// <summary>
    /// Service implementation for user authentication and management.
    /// </summary>
    public class UserService : IUserService
    {
        private readonly IUserRepository userRepository;
        private readonly IConfiguration configuration;
        private readonly ILogger<UserService> logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="UserService"/> class.
        /// </summary>
        /// <param name="userRepository">The user repository.</param>
        /// <param name="configuration">The application configuration.</param>
        /// <param name="logger">The logger.</param>
        public UserService(
            IUserRepository userRepository,
            IConfiguration configuration,
            ILogger<UserService> logger)
        {
            this.userRepository = userRepository;
            this.configuration = configuration;
            this.logger = logger;
        }

        /// <inheritdoc/>
        public async Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
        {
            this.logger.LogDebug("Attempting login for user: {Email}", request.Email);

            var user = await this.userRepository.GetByEmailAsync(request.Email, cancellationToken);
            if (user == null)
            {
                this.logger.LogWarning("Login failed: User not found with email: {Email}", request.Email);
                return null;
            }

            if (!this.VerifyPassword(request.Password, user.PasswordHash))
            {
                this.logger.LogWarning("Login failed: Invalid password for user: {Email}", request.Email);
                return null;
            }

            this.logger.LogInformation("=== TOKEN GENERATION DEBUG (LOGIN) ===");
            this.logger.LogInformation("Generating token for User: {UserId} - {Email}", user.Id, user.Email);

            var token = this.GenerateJwtToken(user);

            // Decode and verify the token we just generated
            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadJwtToken(token);
            this.logger.LogInformation(
                "Generated login token claims: {@Claims}",
                jsonToken.Claims.Select(c => new { Type = c.Type, Value = c.Value }).ToList());

            var expirationHours = this.configuration.GetValue<int>("JwtSettings:ExpirationHours");

            this.logger.LogInformation("User logged in successfully: {Email}", request.Email);

            return new AuthResponse
            {
                Token = token,
                Email = user.Email,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddHours(expirationHours),
            };
        }

        /// <inheritdoc/>
        public async Task<AuthResponse?> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
        {
            this.logger.LogDebug("Attempting registration for user: {Email}", request.Email);

            // Check if user already exists
            if (await this.userRepository.ExistsByEmailAsync(request.Email, cancellationToken))
            {
                this.logger.LogWarning("Registration failed: User already exists with email: {Email}", request.Email);
                return null;
            }

            // Create new user
            var user = new User
            {
                Email = request.Email,
                PasswordHash = this.HashPassword(request.Password),
            };

            var createdUser = await this.userRepository.CreateAsync(user, cancellationToken);

            this.logger.LogInformation("=== TOKEN GENERATION DEBUG (REGISTER) ===");
            this.logger.LogInformation("Generating token for User: {UserId} - {Email}", createdUser.Id, createdUser.Email);

            var token = this.GenerateJwtToken(createdUser);

            // Decode and verify the token we just generated
            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadJwtToken(token);
            this.logger.LogInformation(
                "Generated register token claims: {@Claims}",
                jsonToken.Claims.Select(c => new { Type = c.Type, Value = c.Value }).ToList());

            var expirationHours = this.configuration.GetValue<int>("JwtSettings:ExpirationHours");

            this.logger.LogInformation("User registered successfully: {Email}", request.Email);

            return new AuthResponse
            {
                Token = token,
                Email = createdUser.Email,
                UserId = createdUser.Id,
                ExpiresAt = DateTime.UtcNow.AddHours(expirationHours),
            };
        }

        /// <inheritdoc/>
        public async Task<User?> GetUserByEmailAsync(string email, CancellationToken cancellationToken = default)
        {
            return await this.userRepository.GetByEmailAsync(email, cancellationToken);
        }

        /// <inheritdoc/>
        public async Task<User?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await this.userRepository.GetByIdAsync(id, cancellationToken);
        }

        /// <inheritdoc/>
        public string GenerateJwtToken(User user)
        {
            var jwtSettings = this.configuration.GetSection("JwtSettings");

            // SECURITY: Use environment variables for JWT secret (consistent with Program.cs)
            var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
                ?? jwtSettings["SecretKey"]
                ?? throw new InvalidOperationException("JWT SecretKey is not configured");

            var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
                ?? jwtSettings["Issuer"]
                ?? throw new InvalidOperationException("JWT Issuer is not configured");

            var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
                ?? jwtSettings["Audience"]
                ?? throw new InvalidOperationException("JWT Audience is not configured");

            var expirationHours = jwtSettings.GetValue<int>("ExpirationHours");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(expirationHours),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        /// <summary>
        /// Hashes a password using BCrypt.
        /// </summary>
        /// <param name="password">The plain text password.</param>
        /// <returns>The hashed password.</returns>
        private string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password, 12);
        }

        /// <summary>
        /// Verifies a password against its hash.
        /// </summary>
        /// <param name="password">The plain text password.</param>
        /// <param name="hash">The password hash to verify against.</param>
        /// <returns>True if the password is valid, false otherwise.</returns>
        private bool VerifyPassword(string password, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
    }
}
