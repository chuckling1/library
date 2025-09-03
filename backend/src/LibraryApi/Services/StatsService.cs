using LibraryApi.Responses;

namespace LibraryApi.Services;

/// <summary>
/// Service implementation for statistics business logic.
/// </summary>
public class StatsService : IStatsService
{
    private readonly IBookService _bookService;
    private readonly ILogger<StatsService> _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="StatsService"/> class.
    /// </summary>
    /// <param name="bookService">The book service.</param>
    /// <param name="logger">The logger.</param>
    public StatsService(IBookService bookService, ILogger<StatsService> logger)
    {
        _bookService = bookService;
        _logger = logger;
    }

    /// <inheritdoc/>
    public async Task<BookStatsResponse> GetBookStatsAsync(CancellationToken cancellationToken = default)
    {
        return await _bookService.GetBookStatsAsync(cancellationToken);
    }
}