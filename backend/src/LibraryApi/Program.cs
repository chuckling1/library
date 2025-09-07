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
                ?? new[] { "http://localhost:3000", "http://localhost:5173" }; // Fallback for development

            options.AddPolicy("AllowReactApp", policy =>
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod());
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

        // Register validators
        builder.Services.AddValidatorsFromAssemblyContaining<LibraryApi.Validators.CreateBookRequestValidator>();

        // Configure JWT Authentication
        var jwtSettings = builder.Configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is not configured");
        var issuer = jwtSettings["Issuer"] ?? throw new InvalidOperationException("JWT Issuer is not configured");
        var audience = jwtSettings["Audience"] ?? throw new InvalidOperationException("JWT Audience is not configured");

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
