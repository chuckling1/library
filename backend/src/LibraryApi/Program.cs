// <copyright file="Program.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi;

using System.Reflection;
using System.Text;
using FluentValidation;
using LibraryApi.Data;
using LibraryApi.Middleware;
using LibraryApi.Repositories;
using LibraryApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;

/// <summary>
/// Main program entry point for the Library API.
/// </summary>
public static class Program
{
    /// <summary>
    /// Main method to configure and run the application.
    /// </summary>
    /// <param name="args">Command line arguments.</param>
    /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Configure Serilog
        Log.Logger = new LoggerConfiguration()
            .WriteTo.Console()
            .WriteTo.File("logs/library-api-.log", rollingInterval: RollingInterval.Day)
            .CreateLogger();

        builder.Host.UseSerilog();

        // Add services to the container
        builder.Services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
                options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;

                // Configure DateTime serialization to use ISO 8601 format with 'Z' suffix per original spec
                // System.Text.Json defaults to ISO 8601 with 'Z' suffix, which matches "1999-10-30T00:00:00Z"
                options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
            });
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new() { Title = "Library API", Version = "v1" });
            var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (File.Exists(xmlPath))
            {
                c.IncludeXmlComments(xmlPath);
            }
        });

        // Configure Entity Framework
        builder.Services.AddDbContext<LibraryDbContext>(options =>
            options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

        // Configure CORS
        builder.Services.AddCors(options =>
        {
            // Get allowed origins from configuration (environment variables)
            var allowedOrigins = builder.Configuration.GetSection("CORS:AllowedOrigins").Get<string[]>()
                ?? new[] { "http://localhost:3000", "http://localhost:3001", "http://localhost:5173" }; // Fallback for development

            options.AddPolicy("AllowReactApp", policy =>
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials()); // Required for httpOnly cookies
        });

        // Register repositories (Interface-first design)
        builder.Services.AddScoped<IBookRepository, BookRepository>();
        builder.Services.AddScoped<IGenreRepository, GenreRepository>();
        builder.Services.AddScoped<IBulkImportRepository, BulkImportRepository>();
        builder.Services.AddScoped<IUserRepository, UserRepository>();

        // Register services (Interface-first design)
        builder.Services.AddScoped<IBookService, BookService>();
        builder.Services.AddScoped<IGenreService, GenreService>();
        builder.Services.AddScoped<IStatsService, StatsService>();
        builder.Services.AddScoped<IBulkImportService, BulkImportService>();
        builder.Services.AddScoped<IUserService, UserService>();
        builder.Services.AddScoped<ISecurityEventService, SecurityEventService>();

        // Register validators
        builder.Services.AddValidatorsFromAssemblyContaining<LibraryApi.Validators.CreateBookRequestValidator>();

        // Configure JWT Authentication with environment variables (security enhancement)
        var jwtSettings = builder.Configuration.GetSection("JwtSettings");

        // SECURITY: Use environment variables for JWT secret (never store in config files)
        var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");

        // Development fallback - only for local development, never in production
        if (string.IsNullOrEmpty(secretKey))
        {
            if (builder.Environment.IsDevelopment())
            {
                // DEVELOPMENT ONLY: Use a secure generated key for local development
                // In production, JWT_SECRET_KEY environment variable is required
                secretKey = "oXSGzdX7190XnmCTGOgMNbsyC6BBZaIeIAjhAJY9gPs=";
                Log.Warning("Using development JWT secret key. Set JWT_SECRET_KEY environment variable for production.");
            }
            else
            {
                throw new InvalidOperationException("JWT_SECRET_KEY environment variable is required in production. Generate with: openssl rand -base64 32");
            }
        }

        var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
            ?? jwtSettings["Issuer"]
            ?? throw new InvalidOperationException("JWT Issuer is not configured");

        var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
            ?? jwtSettings["Audience"]
            ?? throw new InvalidOperationException("JWT Audience is not configured");

        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = issuer,
                    ValidAudience = audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                    ClockSkew = TimeSpan.Zero,
                };

                // SECURITY ENHANCEMENT: Support JWT tokens from both Authorization headers and httpOnly cookies
                options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        // DEBUG: Log request details for troubleshooting
                        var logger = context.HttpContext.RequestServices.GetService<ILoggerFactory>()?.CreateLogger("JWTAuth");
                        var requestPath = context.Request.Path;
                        var hasCookie = context.Request.Cookies.ContainsKey("auth-token");
                        var hasAuthHeader = context.Request.Headers.Authorization.Any();

                        logger?.LogInformation(
                            "JWT OnMessageReceived - Path: {Path}, HasCookie: {HasCookie}, HasAuthHeader: {HasAuthHeader}",
                            requestPath,
                            hasCookie,
                            hasAuthHeader);

                        // First, try to get token from Authorization header (existing behavior)
                        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
                        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
                        {
                            context.Token = authHeader.Substring("Bearer ".Length).Trim();
                            logger?.LogInformation("JWT Token from Authorization header");
                        }

                        // If no Authorization header, check for httpOnly cookie (Phase 2 security enhancement)
                        else if (context.Request.Cookies.ContainsKey("auth-token"))
                        {
                            context.Token = context.Request.Cookies["auth-token"];
                            logger?.LogInformation("JWT Token from auth-token cookie");
                        }
                        else
                        {
                            logger?.LogInformation("No JWT token found in request");
                        }

                        return Task.CompletedTask;
                    },
                };
            });

        builder.Services.AddAuthorization();

        // Add health checks
        builder.Services.AddHealthChecks()
            .AddDbContextCheck<LibraryDbContext>("database")
            .AddCheck("self", () => Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy("API is running"));

        var app = builder.Build();

        // Configure the HTTP request pipeline
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        // Global exception handling middleware
        app.UseMiddleware<GlobalExceptionMiddleware>();

        // Security headers middleware (Phase 1 security hardening)
        app.Use(async (context, next) =>
        {
            // Prevent MIME sniffing attacks
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";

            // Prevent clickjacking attacks
            context.Response.Headers["X-Frame-Options"] = "DENY";

            // Enable XSS filtering (legacy support)
            context.Response.Headers["X-XSS-Protection"] = "1; mode=block";

            // Control referrer information
            context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

            // Content Security Policy (basic implementation)
            context.Response.Headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;";

            await next();
        });

        app.UseHttpsRedirection();
        app.UseCors("AllowReactApp");

        // Authentication must come before Authorization
        app.UseAuthentication();
        app.UseAuthorization();

        app.MapControllers();

        // Map health check endpoints
        app.MapHealthChecks("/health");
        app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions()
        {
            Predicate = check => check.Tags.Contains("ready"),
        });
        app.MapHealthChecks("/health/live", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions()
        {
            Predicate = check => check.Name.Equals("self"),
        });

        // Ensure database is created and migrated
        using (var scope = app.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<LibraryDbContext>();
            await context.Database.MigrateAsync();
        }

        Log.Information("Library API starting up");
        app.Run();
    }
}
