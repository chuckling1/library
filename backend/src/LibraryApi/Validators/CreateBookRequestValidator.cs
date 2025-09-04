using FluentValidation;
using LibraryApi.Requests;

namespace LibraryApi.Validators;

/// <summary>
/// Validator for CreateBookRequest with comprehensive date validation.
/// </summary>
public class CreateBookRequestValidator : AbstractValidator<CreateBookRequest>
{
    /// <summary>
    /// Initializes a new instance of the <see cref="CreateBookRequestValidator"/> class.
    /// </summary>
    public CreateBookRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Title is required")
            .MaximumLength(255)
            .WithMessage("Title cannot exceed 255 characters");

        RuleFor(x => x.Author)
            .NotEmpty()
            .WithMessage("Author is required")
            .MaximumLength(255)
            .WithMessage("Author cannot exceed 255 characters");

        RuleFor(x => x.Genres)
            .NotEmpty()
            .WithMessage("At least one genre is required")
            .Must(genres => genres.Count > 0)
            .WithMessage("At least one genre is required");

        RuleFor(x => x.PublishedDate)
            .NotEmpty()
            .WithMessage("Published date is required")
            .MaximumLength(50)
            .WithMessage("Published date cannot exceed 50 characters")
            .Must(BeValidDateString)
            .WithMessage("Published date must be a valid date in ISO format (YYYY-MM-DD)")
            .Must(BeValidDateRange)
            .WithMessage("Published date cannot be in the future");

        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5)
            .WithMessage("Rating must be between 1 and 5");

        When(x => !string.IsNullOrEmpty(x.Edition), () =>
        {
            RuleFor(x => x.Edition)
                .MaximumLength(100)
                .WithMessage("Edition cannot exceed 100 characters");
        });

        When(x => !string.IsNullOrEmpty(x.Isbn), () =>
        {
            RuleFor(x => x.Isbn)
                .MaximumLength(20)
                .WithMessage("ISBN cannot exceed 20 characters");
        });
    }

    /// <summary>
    /// Validates that the published date string can be parsed as a valid DateTime.
    /// </summary>
    /// <param name="publishedDateString">The published date string to validate.</param>
    /// <returns>True if the string represents a valid date.</returns>
    private static bool BeValidDateString(string publishedDateString)
    {
        if (string.IsNullOrEmpty(publishedDateString))
        {
            return false;
        }

        return DateTime.TryParse(publishedDateString, out _);
    }

    /// <summary>
    /// Validates that the published date is not in the future.
    /// </summary>
    /// <param name="publishedDateString">The published date string to validate.</param>
    /// <returns>True if the date is not in the future.</returns>
    private static bool BeValidDateRange(string publishedDateString)
    {
        if (string.IsNullOrEmpty(publishedDateString))
        {
            return false;
        }

        if (!DateTime.TryParse(publishedDateString, out var publishedDate))
        {
            return false;
        }

        // Allow dates up to today (books can be published today)
        return publishedDate.Date <= DateTime.Today;
    }
}