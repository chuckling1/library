// <copyright file="StatsService.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Services
{
    using LibraryApi.Responses;

    /// <summary>
    /// Service implementation for statistics business logic.
    /// </summary>
    public class StatsService : IStatsService
    {
        private readonly IBookService bookService;
        private readonly ILogger<StatsService> logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="StatsService"/> class.
        /// </summary>
        /// <param name="bookService">The book service.</param>
        /// <param name="logger">The logger.</param>
        public StatsService(IBookService bookService, ILogger<StatsService> logger)
        {
            this.bookService = bookService;
            this.logger = logger;
        }

        /// <inheritdoc/>
        public async Task<BookStatsResponse> GetBookStatsAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return await this.bookService.GetBookStatsAsync(userId, cancellationToken);
        }
    }
}
