// <copyright file="SecurityEventService.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Services
{
    /// <summary>
    /// Service implementation for security event logging and monitoring.
    /// Provides structured logging for security-related events with JSON format for AI-assisted debugging.
    /// </summary>
    public class SecurityEventService : ISecurityEventService
    {
        private readonly ILogger<SecurityEventService> logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="SecurityEventService"/> class.
        /// </summary>
        /// <param name="logger">The logger instance.</param>
        public SecurityEventService(ILogger<SecurityEventService> logger)
        {
            this.logger = logger;
        }

        /// <inheritdoc/>
        public async Task LogSecurityEventAsync(string eventType, string message, object? payload = null, CancellationToken cancellationToken = default)
        {
            var securityEvent = new
            {
                timestamp = DateTimeOffset.UtcNow,
                level = "INFO",
                appLayer = "Backend-API",
                sourceContext = nameof(SecurityEventService),
                functionName = nameof(this.LogSecurityEventAsync),
                eventType = eventType,
                message = message,
                payload = payload ?? new { },
            };

            this.logger.LogInformation(
                "SECURITY_EVENT: {EventType} - {Message} {@SecurityEvent}",
                eventType,
                message,
                securityEvent);

            await Task.CompletedTask;
        }

        /// <inheritdoc/>
        public async Task LogCriticalSecurityEventAsync(string eventType, string message, object? payload = null, CancellationToken cancellationToken = default)
        {
            var securityEvent = new
            {
                timestamp = DateTimeOffset.UtcNow,
                level = "CRITICAL",
                appLayer = "Backend-API",
                sourceContext = nameof(SecurityEventService),
                functionName = nameof(this.LogCriticalSecurityEventAsync),
                eventType = eventType,
                message = message,
                payload = payload ?? new { },
            };

            this.logger.LogCritical(
                "CRITICAL_SECURITY_EVENT: {EventType} - {Message} {@SecurityEvent}",
                eventType,
                message,
                securityEvent);

            await Task.CompletedTask;
        }
    }
}
