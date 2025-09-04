import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, CreateBookRequest, UpdateBookRequest } from '../generated/api';
import { useCreateBook, useUpdateBook } from '../hooks/useBooks';
import { openLibraryService } from '../services/openLibraryService';
import { logger } from '../utils/logger';
import StarRating from './StarRating';
import './BookForm.scss';
// import BookCover from './BookCover'; // Not used yet

interface BookFormProps {
  book?: Book;
  isEditing: boolean;
}

// Helper function to format date for HTML5 date input
const formatDateForInput = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  
  try {
    // Handle different date formats from Open Library service
    let date: Date;
    
    // If it's just a year (e.g., "1980")
    if (/^\d{4}$/.test(dateString.trim())) {
      date = new Date(`${dateString}-01-01`);
    }
    // If it's month year (e.g., "March 1980") 
    else if (/^\w+\s+\d{4}$/.test(dateString.trim())) {
      date = new Date(`${dateString} 1`);
    }
    // If it's reverse year month (e.g., "1980 May")
    else if (/^\d{4}\s+\w+$/.test(dateString.trim())) {
      const [year, month] = dateString.trim().split(' ');
      date = new Date(`${month} 1, ${year}`);
    }
    // If it's year-month (e.g., "2020-05")  
    else if (/^\d{4}-\d{2}$/.test(dateString.trim())) {
      date = new Date(`${dateString}-01`);
    }
    // Otherwise try to parse as-is (e.g., "Apr 07, 1981")
    else {
      date = new Date(dateString);
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Return in yyyy-MM-dd format required by HTML5 date input
    return date.toISOString().split('T')[0] ?? '';
  } catch {
    return '';
  }
};

const BookForm: React.FC<BookFormProps> = ({ book, isEditing }) => {
  const navigate = useNavigate();
  const createBookMutation = useCreateBook();
  const updateBookMutation = useUpdateBook();

  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    author: string;
    genres: string[];
    publishedDate: string;
    rating: number;
    edition: string;
    isbn: string;
  }>({
    title: book?.title ?? '',
    author: book?.author ?? '',
    genres: book?.bookGenres?.map(bg => bg.genreName ?? '').filter(Boolean) ?? [],
    publishedDate: formatDateForInput(book?.publishedDate),
    rating: book?.rating ?? 5,
    edition: book?.edition ?? '',
    isbn: book?.isbn ?? '',
  });

  // Genre input state
  const [currentGenre, setCurrentGenre] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Book search state
  const [bookSuggestions, setBookSuggestions] = useState<Array<{
    title: string;
    author: string;
    isbn?: string;
    publishedDate?: string;
    coverUrl?: string;
    subjects?: string[];
  }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Predefined genres for suggestions
  const commonGenres = [
    'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery',
    'Romance', 'Thriller', 'Biography', 'History', 'Science',
    'Technology', 'Self-Help', 'Business', 'Programming', 'Philosophy'
  ];

  // Update form data when book prop changes
  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        genres: book.bookGenres?.map(bg => bg.genreName ?? '').filter(Boolean) ?? [],
        publishedDate: formatDateForInput(book.publishedDate),
        rating: book.rating ?? 5,
        edition: book.edition ?? '',
        isbn: book.isbn ?? '',
      });
    }
  }, [book]);

  // Book search functionality
  const searchBooks = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setBookSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const suggestions = await openLibraryService.getBookSuggestions(query);
      setBookSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      logger.error('Failed to search books:', error);
      setBookSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery && !isEditing) {
        void searchBooks(searchQuery);
      }
    }, 500);

    return (): void => clearTimeout(timeoutId);
  }, [searchQuery, isEditing]);

  const handleBookSuggestionSelect = (suggestion: typeof bookSuggestions[0]): void => {
    setFormData(prev => ({
      ...prev,
      title: suggestion.title,
      author: suggestion.author,
      isbn: suggestion.isbn ?? '',
      publishedDate: formatDateForInput(suggestion.publishedDate),
      genres: suggestion.subjects?.slice(0, 3) ?? prev.genres, // Add up to 3 genres from subjects
    }));
    
    setShowSuggestions(false);
    setSearchQuery('');
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number | string[]): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addGenre = (genre: string): void => {
    const trimmedGenre = genre.trim();
    if (trimmedGenre && !formData.genres.includes(trimmedGenre)) {
      handleInputChange('genres', [...formData.genres, trimmedGenre]);
    }
    setCurrentGenre('');
  };

  const removeGenre = (genreToRemove: string): void => {
    handleInputChange('genres', formData.genres.filter(g => g !== genreToRemove));
  };

  const handleGenreKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addGenre(currentGenre);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.author.trim()) {
      newErrors.author = 'Author is required';
    }

    if (formData.genres.length === 0) {
      newErrors.genres = 'At least one genre is required';
    }

    if (!formData.publishedDate) {
      newErrors.publishedDate = 'Published date is required';
    } else {
      // Validate that the date is actually valid
      const dateValue = new Date(formData.publishedDate);
      if (isNaN(dateValue.getTime())) {
        newErrors.publishedDate = 'Published date must be a valid date';
      } else {
        // Check that the date is not in the future
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Set to end of today
        if (dateValue > today) {
          newErrors.publishedDate = 'Published date cannot be in the future';
        }
      }
    }

    if (formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = 'Rating must be between 1 and 5';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Double-check date validity before submission
    const dateValue = new Date(formData.publishedDate);
    if (isNaN(dateValue.getTime())) {
      setErrors({ submit: 'Invalid date format. Please select a valid date.' });
      return;
    }

    const bookData: CreateBookRequest | UpdateBookRequest = {
      title: formData.title.trim(),
      author: formData.author.trim(),
      genres: formData.genres,
      publishedDate: dateValue.toISOString(),
      rating: formData.rating,
      edition: formData.edition.trim() || null,
      isbn: formData.isbn.trim() || null,
    };

    try {
      if (isEditing && book?.id) {
        await updateBookMutation.mutateAsync({ id: book.id, bookData });
      } else {
        await createBookMutation.mutateAsync(bookData);
      }
      void navigate('/');
    } catch (error) {
      logger.error('Error saving book:', error);
      setErrors({ submit: 'Failed to save book. Please try again.' });
    }
  };

  const handleCancel = (): void => {
    void navigate('/');
  };

  const isLoading = createBookMutation.isPending || updateBookMutation.isPending;

  return (
    <div className="book-form-container">
      <div className="book-form-header">
        <h2>{isEditing ? 'Edit Book' : 'Add New Book'}</h2>
      </div>

      <form onSubmit={(e): void => void handleSubmit(e)} className="book-form">
        {/* Book Search - only show for new books */}
        {!isEditing && (
          <div className="form-group">
            <label htmlFor="bookSearch" className="form-label">
              Search for Book (Optional)
            </label>
            <div className="book-search-container">
              <input
                type="text"
                id="bookSearch"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                placeholder="Search by title or author to auto-fill details..."
                disabled={isLoading}
              />
              {isSearching && (
                <div className="search-loading">Searching...</div>
              )}
            </div>
            
            {/* Book Suggestions */}
            {showSuggestions && bookSuggestions.length > 0 && (
              <div className="book-suggestions">
                <div className="suggestions-header">
                  <span>Found {bookSuggestions.length} suggestions:</span>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="btn btn-sm btn-secondary"
                  >
                    Close
                  </button>
                </div>
                <div className="suggestions-list">
                  {bookSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleBookSuggestionSelect(suggestion)}
                    >
                      <div className="suggestion-content">
                        <div className="suggestion-title">{suggestion.title}</div>
                        <div className="suggestion-author">by {suggestion.author}</div>
                        {suggestion.publishedDate && (
                          <div className="suggestion-date">
                            Published: {new Date(suggestion.publishedDate).getFullYear()}
                          </div>
                        )}
                        {suggestion.subjects && suggestion.subjects.length > 0 && (
                          <div className="suggestion-subjects">
                            {suggestion.subjects.slice(0, 3).map(subject => (
                              <span key={subject} className="subject-tag">{subject}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button 
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookSuggestionSelect(suggestion);
                        }}
                      >
                        Use This
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Title <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`form-input ${errors.title ? 'error' : ''}`}
            placeholder="Enter book title"
            maxLength={255}
            disabled={isLoading}
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
        </div>

        {/* Author */}
        <div className="form-group">
          <label htmlFor="author" className="form-label">
            Author <span className="required">*</span>
          </label>
          <input
            type="text"
            id="author"
            value={formData.author}
            onChange={(e) => handleInputChange('author', e.target.value)}
            className={`form-input ${errors.author ? 'error' : ''}`}
            placeholder="Enter author name"
            maxLength={255}
            disabled={isLoading}
          />
          {errors.author && <span className="error-message">{errors.author}</span>}
        </div>

        {/* Genres */}
        <div className="form-group">
          <label htmlFor="genres" className="form-label">
            Genres <span className="required">*</span>
          </label>
          <div className="genre-input-container">
            <input
              type="text"
              id="genres"
              value={currentGenre}
              onChange={(e) => setCurrentGenre(e.target.value)}
              onKeyPress={handleGenreKeyPress}
              className={`form-input ${errors.genres ? 'error' : ''}`}
              placeholder="Type a genre and press Enter"
              disabled={isLoading}
              list="genre-suggestions"
            />
            <button
              type="button"
              onClick={() => addGenre(currentGenre)}
              className="btn btn-secondary btn-sm"
              disabled={!currentGenre.trim() || isLoading}
            >
              Add Genre
            </button>
            <datalist id="genre-suggestions">
              {commonGenres.map(genre => (
                <option key={genre} value={genre} />
              ))}
            </datalist>
          </div>
          
          {/* Selected Genres */}
          {formData.genres.length > 0 && (
            <div className="selected-genres">
              {formData.genres.map((genre) => (
                <span key={genre} className="genre-tag">
                  {genre}
                  <button
                    type="button"
                    onClick={() => removeGenre(genre)}
                    className="genre-remove"
                    disabled={isLoading}
                    aria-label={`Remove ${genre} genre`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          {errors.genres && <span className="error-message">{errors.genres}</span>}
        </div>

        {/* Published Date */}
        <div className="form-group">
          <label htmlFor="publishedDate" className="form-label">
            Published Date <span className="required">*</span>
          </label>
          <input
            type="date"
            id="publishedDate"
            value={formData.publishedDate}
            onChange={(e) => handleInputChange('publishedDate', e.target.value)}
            className={`form-input ${errors.publishedDate ? 'error' : ''}`}
            max={new Date().toISOString().split('T')[0]}
            disabled={isLoading}
          />
          {errors.publishedDate && <span className="error-message">{errors.publishedDate}</span>}
        </div>

        {/* Rating */}
        <div className="form-group">
          <label htmlFor="rating" className="form-label">
            Rating <span className="required">*</span>
          </label>
          <div className="rating-input">
            <StarRating
              rating={formData.rating}
              onRatingChange={(newRating) => handleInputChange('rating', newRating)}
              readOnly={isLoading}
            />
          </div>
          {errors.rating && <span className="error-message">{errors.rating}</span>}
        </div>

        {/* Edition */}
        <div className="form-group">
          <label htmlFor="edition" className="form-label">
            Edition
          </label>
          <input
            type="text"
            id="edition"
            value={formData.edition}
            onChange={(e) => handleInputChange('edition', e.target.value)}
            className="form-input"
            placeholder="Enter edition (optional)"
            maxLength={100}
            disabled={isLoading}
          />
        </div>

        {/* ISBN */}
        <div className="form-group">
          <label htmlFor="isbn" className="form-label">
            ISBN
          </label>
          <input
            type="text"
            id="isbn"
            value={formData.isbn}
            onChange={(e) => handleInputChange('isbn', e.target.value)}
            className="form-input"
            placeholder="Enter ISBN (optional)"
            maxLength={20}
            disabled={isLoading}
          />
        </div>

        {/* Submit/Error */}
        {errors.submit && (
          <div className="error-message submit-error">{errors.submit}</div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : (isEditing ? 'Update Book' : 'Add Book')}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookForm;