// <copyright file="ISecurityEventService.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Services
{
    /// <summary>
    /// Interface for security event logging and monitoring.
    /// Provides structured logging for security-related events during the security hardening transition.
    /// </summary>
    public interface ISecurityEventService
    {
        /// <summary>
        /// Logs a security event with structured data for monitoring and alerting.
        /// </summary>
        /// <param name="eventType">Type of security event (e.g., "JWT_SECRET_UPDATED", "TOKEN_VALIDATION_FAILED").</param>
        /// <param name="message">Human-readable message describing the event.</param>
        /// <param name="payload">Additional structured data for the event.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        Task LogSecurityEventAsync(string eventType, string message, object? payload = null, CancellationToken cancellationToken = default);

        /// <summary>
        /// Logs a critical security event that requires immediate attention.
        /// </summary>
        /// <param name="eventType">Type of critical security event.</param>
        /// <param name="message">Human-readable message describing the critical event.</param>
        /// <param name="payload">Additional structured data for the event.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        Task LogCriticalSecurityEventAsync(string eventType, string message, object? payload = null, CancellationToken cancellationToken = default);
    }
}
