import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book } from '../generated/api';
import { getBookGenres, formatDate } from '../hooks/useBooks';
import { useGenreFilter } from '../hooks/useGenreFilter';
import StarRating from './StarRating';
import BookCover from './BookCover';
import EditIcon from '../images/edit_icon.svg';
import DeleteIcon from '../images/delete_icon.svg';
import './BookCard.scss';

interface BookCardProps {
  book: Book;
  onDelete: (book: Book) => Promise<void>;
}

const BookCard: React.FC<BookCardProps> = React.memo(({ book, onDelete }) => {
  const navigate = useNavigate();
  const genres = useMemo(() => {
    const bookGenres = getBookGenres(book);
    return Array.isArray(bookGenres) ? bookGenres : [];
  }, [book]);
  const { toggleGenre, isGenreActive } = useGenreFilter();
  const [isGenresExpanded, setIsGenresExpanded] = useState<boolean>(false);
  const [needsExpansion, setNeedsExpansion] = useState<boolean>(false);
  
  // Calculate if genres will overflow 2 rows based on text length
  useEffect(() => {
    if (genres.length === 0) {
      setNeedsExpansion(false);
      return;
    }

    // Estimate container width (account for padding: 8px * 2 = 16px)
    // BookCard content area is flexible, estimate ~300-400px available width
    const estimatedContainerWidth = 350; // Conservative estimate
    
    // Calculate approximate width for each genre pill
    // Base pill styling: 8px padding * 2 + 1px border * 2 + text width
    const basePillWidth = 18; // padding + borders
    const avgCharWidth = 7; // approximate character width in 12px font
    
    let currentRowWidth = 0;
    let rowCount = 1;
    
    for (const genre of genres) {
      const pillWidth = basePillWidth + (genre.length * avgCharWidth);
      
      // Check if adding this pill would exceed row width
      if (currentRowWidth + pillWidth + 4 > estimatedContainerWidth) { // +4 for gap
        rowCount++;
        currentRowWidth = pillWidth;
      } else {
        currentRowWidth += pillWidth + 4; // +4 for gap between pills
      }
    }
    
    // Show "Show More" if we need more than 2 rows
    setNeedsExpansion(rowCount > 2);
  }, [genres]);
  
  const handleEdit = (): void => {
    void navigate(`/books/${book.id}/edit`);
  };

  const handleDelete = async (): Promise<void> => {
    if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      await onDelete(book);
    }
  };

  const handleGenreClick = (genre: string): void => {
    toggleGenre(genre);
  };

  const handleToggleGenres = (): void => {
    setIsGenresExpanded(prev => !prev);
  };

  // Get image URL (title or fallback to cover component)
  const imageUrl = book.title 
    ? `https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-M.jpg`
    : '';
  
  return (
    <div className="book-card">
      {/* Left Column - Fixed width cover */}
      <div className="book-card__cover">
        <img 
          src={imageUrl}
          alt={`Cover of ${book.title}`}
          onError={(e) => {
            // Fallback to BookCover component on error
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement | null;
            if (fallback) {
              fallback.style.display = 'block';
            }
          }}
        />
        <div className="book-cover-fallback">
          <BookCover book={book} size="medium" />
        </div>
      </div>
      
      {/* Right Column - Flex content */}
      <div className="book-card__content">
        {/* Primary Info - Title, Author, Rating */}
        <div className="book-card__primary-info">
          <h3 className="book-card__title">{book.title}</h3>
          <p className="book-card__author">by {book.author}</p>
          <div className="book-card__rating">
            <StarRating
              rating={book.rating ?? 0}
              readOnly={true}
              showLabel={false}
            />
          </div>
        </div>
        
        {/* Genre Tags - Expandable container */}
        {genres.length > 0 && (
          <div className="book-card__genres-container">
            <div 
              className={`book-card__genres ${isGenresExpanded ? 'book-card__genres--expanded' : ''}`}
            >
              {genres.map((genre) => (
                <button
                  key={genre}
                  className={`book-card__genre-pill ${isGenreActive(genre) ? 'book-card__genre-pill--active' : ''}`}
                  onClick={() => handleGenreClick(genre)}
                  aria-label={`${isGenreActive(genre) ? 'Remove' : 'Add'} ${genre} filter`}
                >
                  {genre}
                </button>
              ))}
            </div>
            {needsExpansion && (
              <button 
                className="book-card__genres-toggle"
                onClick={handleToggleGenres}
                aria-label={isGenresExpanded ? 'Show fewer genres' : 'Show more genres'}
              >
                {isGenresExpanded ? 'Show Less ▲' : 'Show More ▼'}
              </button>
            )}
          </div>
        )}
        
        {/* Published Date - Pushed to bottom-right */}
        <div className="book-card__published-date">
          {formatDate(book.publishedDate)}
        </div>

        {/* Action Buttons - Positioned absolutely in top-right corner */}
        <div className="book-card__actions">
          <button
            onClick={handleEdit}
            className="btn-secondary"
            aria-label={`Edit ${book.title}`}
          >
            <img src={EditIcon} alt="Edit" />
          </button>
          <button
            onClick={() => void handleDelete()}
            className="btn-destructive"
            aria-label={`Delete ${book.title}`}
          >
            <img src={DeleteIcon} alt="Delete" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default BookCard;