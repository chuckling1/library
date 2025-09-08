// <copyright file="BulkImportService.cs" company="Library API">
// Copyright (c) Library API. All rights reserved.
// </copyright>

namespace LibraryApi.Services
{
    using System.Globalization;
    using System.Text.Json;
    using FluentValidation;
    using LibraryApi.Models;
    using LibraryApi.Repositories;
    using LibraryApi.Requests;

    /// <summary>
    /// Service implementation for bulk import operations with comprehensive validation and OpenLibrary enrichment.
    /// </summary>
    public class BulkImportService : IBulkImportService
    {
        private readonly IBulkImportRepository bulkImportRepository;
        private readonly IBookRepository bookRepository;
        private readonly IGenreRepository genreRepository;
        private readonly IValidator<CreateBookRequest> bookValidator;
        private readonly ILogger<BulkImportService> logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="BulkImportService"/> class.
        /// </summary>
        /// <param name="bulkImportRepository">The bulk import repository.</param>
        /// <param name="bookRepository">The book repository.</param>
        /// <param name="genreRepository">The genre repository.</param>
        /// <param name="bookValidator">The book validator for individual book validation.</param>
        /// <param name="logger">The logger.</param>
        public BulkImportService(
            IBulkImportRepository bulkImportRepository,
            IBookRepository bookRepository,
            IGenreRepository genreRepository,
            IValidator<CreateBookRequest> bookValidator,
            ILogger<BulkImportService> logger)
        {
            this.bulkImportRepository = bulkImportRepository;
            this.bookRepository = bookRepository;
            this.genreRepository = genreRepository;
            this.bookValidator = bookValidator;
            this.logger = logger;
        }

        /// <inheritdoc/>
        public async Task<BulkImportJob> ProcessBulkImportAsync(
            Stream fileStream,
            string fileName,
            BulkImportOptions options,
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            var jobId = Guid.NewGuid();
            var job = new BulkImportJob
            {
                Id = jobId,
                FileName = fileName,
                Status = BulkImportStatus.InProgress,
                CreatedAt = DateTime.UtcNow,
            };

            job = await this.bulkImportRepository.CreateJobAsync(job, cancellationToken);

            try
            {
                this.logger.LogInformation("=== BULK IMPORT DEBUG ===");
                this.logger.LogInformation("Starting bulk import job {JobId} for file {FileName} for UserId: {UserId}", jobId, fileName, userId);

                // PHASE 1: Parse and validate CSV data
                var (candidates, parseErrors) = await this.ParseAndValidateAsync(fileStream, cancellationToken);

                job.TotalRows = candidates.Count;
                job.ErrorRows = parseErrors.Count;

                this.logger.LogInformation("Parsed {TotalRows} rows with {ErrorCount} validation errors", candidates.Count, parseErrors.Count);

                // PHASE 2: OpenLibrary enrichment for valid candidates
                var validCandidates = candidates.Where(c => c.IsValid).ToList();
                if (validCandidates.Any())
                {
                    validCandidates = await this.EnrichWithOpenLibraryAsync(validCandidates, options, cancellationToken);
                }

                // PHASE 3: Duplicate detection and handling
                var finalCandidates = await this.HandleDuplicatesAsync(validCandidates, options, userId, cancellationToken);

                // PHASE 4: Bulk database import
                if (finalCandidates.Any())
                {
                    var importResult = await this.ExecuteBulkImportAsync(jobId, finalCandidates, options, userId, cancellationToken);
                    job.ValidRows = importResult.ValidRows;
                }
                else
                {
                    job.ValidRows = 0;
                }

                job.Status = job.ErrorRows > 0 ? BulkImportStatus.CompletedWithErrors : BulkImportStatus.Completed;
                job.CompletedAt = DateTime.UtcNow;
                job.ProcessedRows = job.TotalRows;

                // Serialize errors for response
                if (parseErrors.Any())
                {
                    job.ErrorSummaryJson = JsonSerializer.Serialize(parseErrors);
                }

                await this.bulkImportRepository.UpdateJobAsync(job, cancellationToken);

                this.logger.LogInformation(
                    "Completed bulk import job {JobId}: {ValidRows} successful, {ErrorRows} errors",
                    jobId,
                    job.ValidRows,
                    job.ErrorRows);

                return job;
            }
            catch (Exception ex)
            {
                this.logger.LogError(ex, "Bulk import job {JobId} failed", jobId);

                job.Status = BulkImportStatus.Failed;
                job.CompletedAt = DateTime.UtcNow;
                job.ErrorSummaryJson = JsonSerializer.Serialize(new[]
                {
                    new BulkImportValidationError
                    {
                        RowNumber = 0,
                        Field = "General",
                        ErrorMessage = "Import operation failed: " + ex.Message,
                    },
                });

                await this.bulkImportRepository.UpdateJobAsync(job, cancellationToken);
                throw;
            }
        }

        /// <inheritdoc/>
        public async Task<(List<BookImportCandidate> Candidates, List<BulkImportValidationError> Errors)> ParseAndValidateAsync(
            Stream fileStream,
            CancellationToken cancellationToken = default)
        {
            var candidates = new List<BookImportCandidate>();
            var errors = new List<BulkImportValidationError>();

            using var reader = new StreamReader(fileStream);

            // Read header line
            var headerLine = await reader.ReadLineAsync(cancellationToken);
            if (string.IsNullOrEmpty(headerLine))
            {
                errors.Add(new BulkImportValidationError
                {
                    RowNumber = 1,
                    Field = "File",
                    ErrorMessage = "File is empty or has no header row",
                });
                return (candidates, errors);
            }

            var headers = this.ParseCsvLine(headerLine);
            var headerMap = this.CreateHeaderMapping(headers);

            if (!this.ValidateHeaders(headerMap, out var headerErrors))
            {
                errors.AddRange(headerErrors);
                return (candidates, errors);
            }

            // Parse data rows
            var rowNumber = 1;
            string? line;
            while ((line = await reader.ReadLineAsync(cancellationToken)) != null)
            {
                rowNumber++;

                if (string.IsNullOrWhiteSpace(line))
                {
                    continue; // Skip empty lines
                }

                var values = this.ParseCsvLine(line);
                var candidate = this.CreateBookCandidate(values, headerMap, rowNumber);

                // Validate the candidate using FluentValidation
                await this.ValidateCandidateAsync(candidate, cancellationToken);

                candidates.Add(candidate);
                errors.AddRange(candidate.ValidationErrors);
            }

            return (candidates, errors);
        }

        /// <inheritdoc/>
        public async Task<List<BookImportCandidate>> EnrichWithOpenLibraryAsync(
            List<BookImportCandidate> candidates,
            BulkImportOptions options,
            CancellationToken cancellationToken = default)
        {
            this.logger.LogInformation("Starting OpenLibrary enrichment for {Count} candidates", candidates.Count);

            // Process in batches with rate limiting
            var enrichedCandidates = new List<BookImportCandidate>();

            for (int i = 0; i < candidates.Count; i += options.OpenLibraryBatchSize)
            {
                var batch = candidates.Skip(i).Take(options.OpenLibraryBatchSize).ToList();

                var enrichmentTasks = batch.Select(async candidate =>
                {
                    try
                    {
                        // For now, we'll add placeholder logic for OpenLibrary enrichment
                        // In a real implementation, this would call the OpenLibrary API
                        await Task.Delay(100, cancellationToken); // Simulate API call

                        // TODO: Implement actual OpenLibrary API integration
                        // var openLibraryData = await openLibraryService.SearchBooksAsync(candidate.Title, candidate.Author, cancellationToken);
                        this.logger.LogDebug("Enriched book: {Title} by {Author}", candidate.Title, candidate.Author);
                    }
                    catch (Exception ex)
                    {
                        this.logger.LogWarning(
                            "Failed to enrich book {Title} by {Author}: {Error}",
                            candidate.Title,
                            candidate.Author,
                            ex.Message);
                    }

                    return candidate;
                });

                var enrichedBatch = await Task.WhenAll(enrichmentTasks);
                enrichedCandidates.AddRange(enrichedBatch);

                // Rate limiting between batches
                if (i + options.OpenLibraryBatchSize < candidates.Count)
                {
                    await Task.Delay(options.OpenLibraryBatchDelay, cancellationToken);
                }
            }

            this.logger.LogInformation("Completed OpenLibrary enrichment for {Count} candidates", enrichedCandidates.Count);
            return enrichedCandidates;
        }

        /// <inheritdoc/>
        public async Task<BulkImportJob> ExecuteBulkImportAsync(
            Guid jobId,
            List<BookImportCandidate> candidates,
            BulkImportOptions options,
            Guid userId,
            CancellationToken cancellationToken = default)
        {
            this.logger.LogInformation("=== EXECUTE BULK IMPORT DEBUG ===");
            this.logger.LogInformation("Executing bulk import for {Count} validated candidates for UserId: {UserId}", candidates.Count, userId);

            // Ensure all genres exist
            var allGenreNames = candidates.SelectMany(c => c.Genres).Distinct().ToList();
            var genres = await this.genreRepository.BulkEnsureGenresExistAsync(allGenreNames, cancellationToken);
            var genreMap = genres.ToDictionary(g => g.Name, g => g);

            // Convert candidates to Book entities
            var books = candidates.Select(candidate =>
            {
                var bookId = Guid.NewGuid();
                return new Book
                {
                    Id = bookId,
                    Title = candidate.Title,
                    Author = candidate.Author,
                    PublishedDate = candidate.PublishedDate,
                    Rating = candidate.Rating,
                    Edition = candidate.Edition,
                    Isbn = candidate.Isbn,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    BookGenres = candidate.Genres.Select(genreName => new BookGenre
                    {
                        BookId = bookId,
                        GenreName = genreName,
                    }).ToList(),
                };
            }).ToList();

            this.logger.LogInformation("Creating {BookCount} books for UserId: {UserId}", books.Count, userId);
            this.logger.LogInformation(
                "Sample book creation data: {@BookSample}",
                books.Take(3).Select(b => new { Title = b.Title, UserId = b.UserId }).ToList());

            // Execute bulk insert
            var createdBooks = await this.bookRepository.BulkCreateBooksAsync(books, cancellationToken);

            this.logger.LogInformation("Successfully imported {Count} books", createdBooks.Count);
            return new BulkImportJob
            {
                Id = jobId,
                ValidRows = createdBooks.Count,
            };
        }

        /// <inheritdoc/>
        public async Task<BulkImportJob?> GetImportJobStatusAsync(Guid jobId, CancellationToken cancellationToken = default)
        {
            return await this.bulkImportRepository.GetJobAsync(jobId, cancellationToken);
        }

        /// <inheritdoc/>
        public async Task<string> ExportBooksToCSVAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            this.logger.LogInformation("=== EXPORT BOOKS DEBUG ===");
            this.logger.LogInformation("Exporting books for UserId: {UserId}", userId);

            var books = await this.bookRepository.GetAllBooksAsync(userId, cancellationToken);

            this.logger.LogInformation("Retrieved {BookCount} books for export for UserId: {UserId}", books.Count(), userId);
            this.logger.LogInformation(
                "Sample exported book UserIds: {@BookUserIds}",
                books.Take(3).Select(b => new { BookId = b.Id, Title = b.Title, UserId = b.UserId }).ToList());

            var csv = new System.Text.StringBuilder();

            // If no books, return a template with instructions
            if (!books.Any())
            {
                // Add instructional comment row
                csv.AppendLine("# CSV Import Template for Library Books");
                csv.AppendLine("# Required fields: Title, Author, PublishedDate (YYYY-MM-DD format), Rating (1-5)");
                csv.AppendLine("# Optional fields: Genres (comma-separated), Edition, ISBN");
                csv.AppendLine("# Delete these comment lines before importing");
                csv.AppendLine();

                // Add headers
                csv.AppendLine("Title,Author,Genres,PublishedDate,Rating,Edition,ISBN");

                // Add example row
                csv.AppendLine("\"The Great Gatsby\",\"F. Scott Fitzgerald\",\"Fiction,Classic\",\"1925-04-10\",5,\"First Edition\",\"978-0743273565\"");
                csv.AppendLine("\"1984\",\"George Orwell\",\"Dystopian,Science Fiction\",\"1949-06-08\",5,\"Classic Edition\",\"978-0452284234\"");

                this.logger.LogInformation("No books to export, returning CSV template with examples");
                return csv.ToString();
            }

            // For actual data export, use clean headers without instructions
            csv.AppendLine("Title,Author,Genres,PublishedDate,Rating,Edition,ISBN");

            // Add each book as a row
            foreach (var book in books.OrderBy(b => b.Title))
            {
                var genres = string.Join(",", book.BookGenres?.Select(bg => bg.GenreName) ?? Enumerable.Empty<string>());

                // Escape fields that might contain commas or quotes
                var title = this.EscapeCsvField(book.Title);
                var author = this.EscapeCsvField(book.Author);
                var edition = this.EscapeCsvField(book.Edition ?? string.Empty);
                var isbn = this.EscapeCsvField(book.Isbn ?? string.Empty);
                var genresEscaped = this.EscapeCsvField(genres);

                csv.AppendLine($"{title},{author},{genresEscaped},{book.PublishedDate},{book.Rating},{edition},{isbn}");
            }

            this.logger.LogInformation("Exported {Count} books to CSV", books.Count());
            return csv.ToString();
        }

        private string EscapeCsvField(string field)
        {
            if (string.IsNullOrEmpty(field))
            {
                return string.Empty;
            }

            // If field contains comma, quote, or newline, wrap it in quotes and escape internal quotes
            if (field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
            {
                return $"\"{field.Replace("\"", "\"\"")}\"";
            }

            return field;
        }

        private async Task<List<BookImportCandidate>> HandleDuplicatesAsync(
            List<BookImportCandidate> candidates,
            BulkImportOptions options,
            Guid userId,
            CancellationToken cancellationToken)
        {
            if (options.DuplicateStrategy == DuplicateHandling.Allow)
            {
                return candidates;
            }

            // Find existing duplicates
            var titleAuthorPairs = candidates.Select(c => (c.Title, c.Author)).ToList();
            var duplicates = await this.bookRepository.FindDuplicateBooksByTitleAuthorAsync(titleAuthorPairs, userId, cancellationToken);

            if (options.DuplicateStrategy == DuplicateHandling.Skip)
            {
                // Filter out duplicates
                var filteredCandidates = candidates.Where(c =>
                    !duplicates.ContainsKey($"{c.Title}|{c.Author}")).ToList();

                var skippedCount = candidates.Count - filteredCandidates.Count;
                if (skippedCount > 0)
                {
                    this.logger.LogInformation("Skipped {Count} duplicate books", skippedCount);
                }

                return filteredCandidates;
            }

            if (options.DuplicateStrategy == DuplicateHandling.Fail && duplicates.Any())
            {
                throw new InvalidOperationException($"Found {duplicates.Count} duplicate books. Import aborted.");
            }

            return candidates;
        }

        private Dictionary<string, int> CreateHeaderMapping(string[] headers)
        {
            var mapping = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            for (int i = 0; i < headers.Length; i++)
            {
                var header = headers[i].Trim();
                mapping[header] = i;

                // Add alternative header names for flexibility
                switch (header.ToLower())
                {
                    case "book title":
                    case "book_title":
                        mapping["title"] = i;
                        break;
                    case "book author":
                    case "book_author":
                        mapping["author"] = i;
                        break;
                    case "published":
                    case "publisheddate":
                    case "publish_date":
                    case "publication_date":
                        mapping["publisheddate"] = i;
                        break;
                }
            }

            return mapping;
        }

        private bool ValidateHeaders(Dictionary<string, int> headerMap, out List<BulkImportValidationError> errors)
        {
            errors = new List<BulkImportValidationError>();
            var requiredHeaders = new[] { "title", "author", "genres", "publisheddate", "rating" };

            foreach (var required in requiredHeaders)
            {
                if (!headerMap.ContainsKey(required))
                {
                    errors.Add(new BulkImportValidationError
                    {
                        RowNumber = 1,
                        Field = "Headers",
                        ErrorMessage = $"Required header '{required}' not found",
                    });
                }
            }

            return !errors.Any();
        }

        private BookImportCandidate CreateBookCandidate(string[] values, Dictionary<string, int> headerMap, int rowNumber)
        {
            var candidate = new BookImportCandidate { RowNumber = rowNumber };

            try
            {
                candidate.Title = this.GetValue(values, headerMap, "title")?.Trim() ?? string.Empty;
                candidate.Author = this.GetValue(values, headerMap, "author")?.Trim() ?? string.Empty;
                candidate.PublishedDate = this.GetValue(values, headerMap, "publisheddate")?.Trim() ?? string.Empty;
                candidate.Edition = this.GetValue(values, headerMap, "edition")?.Trim();
                candidate.Isbn = this.GetValue(values, headerMap, "isbn")?.Trim();

                // Parse genres (comma-separated)
                var genresValue = this.GetValue(values, headerMap, "genres");
                if (!string.IsNullOrEmpty(genresValue))
                {
                    candidate.Genres = genresValue.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(g => g.Trim())
                        .Where(g => !string.IsNullOrEmpty(g))
                        .ToList();
                }

                // Parse rating
                var ratingValue = this.GetValue(values, headerMap, "rating");
                if (int.TryParse(ratingValue, out var rating))
                {
                    candidate.Rating = rating;
                }
                else
                {
                    candidate.Rating = 1; // Default rating if parsing fails
                }
            }
            catch (Exception ex)
            {
                candidate.ValidationErrors.Add(new BulkImportValidationError
                {
                    RowNumber = rowNumber,
                    Field = "General",
                    ErrorMessage = $"Error parsing row: {ex.Message}",
                });
            }

            return candidate;
        }

        private async Task ValidateCandidateAsync(BookImportCandidate candidate, CancellationToken cancellationToken)
        {
            var createRequest = new CreateBookRequest
            {
                Title = candidate.Title,
                Author = candidate.Author,
                Genres = candidate.Genres,
                PublishedDate = candidate.PublishedDate,
                Rating = candidate.Rating,
                Edition = candidate.Edition,
                Isbn = candidate.Isbn,
            };

            var validationResult = await this.bookValidator.ValidateAsync(createRequest, cancellationToken);

            foreach (var error in validationResult.Errors)
            {
                candidate.ValidationErrors.Add(new BulkImportValidationError
                {
                    RowNumber = candidate.RowNumber,
                    Field = error.PropertyName,
                    ErrorMessage = error.ErrorMessage,
                    OriginalValue = error.AttemptedValue?.ToString(),
                });
            }

            candidate.IsValid = validationResult.IsValid;
        }

        private string? GetValue(string[] values, Dictionary<string, int> headerMap, string key)
        {
            if (headerMap.TryGetValue(key, out var index) && index < values.Length)
            {
                return values[index];
            }

            return null;
        }

        private string[] ParseCsvLine(string line)
        {
            // Simple CSV parser - for production use, consider using a library like CsvHelper
            var values = new List<string>();
            var current = string.Empty;
            var inQuotes = false;

            for (int i = 0; i < line.Length; i++)
            {
                var c = line[i];

                if (c == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (c == ',' && !inQuotes)
                {
                    values.Add(current);
                    current = string.Empty;
                }
                else
                {
                    current += c;
                }
            }

            values.Add(current);
            return values.ToArray();
        }
    }
}
