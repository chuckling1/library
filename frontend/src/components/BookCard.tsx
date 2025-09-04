import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book } from '../generated/api';
import { getBookGenres, formatDate } from '../hooks/useBooks';
import { useGenreFilter } from '../contexts/GenreFilterContext';
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
  const genres = getBookGenres(book);
  const { toggleGenre, isGenreActive } = useGenreFilter();
  const [isGenresExpanded, setIsGenresExpanded] = useState<boolean>(false);
  const [needsExpansion, setNeedsExpansion] = useState<boolean>(false);
  const genresContainerRef = useRef<HTMLDivElement>(null);
  
  // Detect overflow by measuring actual container height
  useEffect(() => {
    const checkOverflow = (): void => {
      if (!genresContainerRef.current || genres.length === 0) {
        setNeedsExpansion(false);
        return;
      }

      const container = genresContainerRef.current;
      
      // Always measure in collapsed state to determine if toggle is needed
      const wasExpanded = isGenresExpanded;
      if (wasExpanded) {
        container.classList.remove('book-card__genres--expanded');
      }
      
      const computedStyle = getComputedStyle(container);
      const maxHeight = parseFloat(computedStyle.maxHeight);
      
      // Temporarily expand to measure full height
      const originalMaxHeight = container.style.maxHeight;
      container.style.maxHeight = 'none';
      const fullHeight = container.scrollHeight;
      container.style.maxHeight = originalMaxHeight;
      
      // Restore expanded state if it was expanded
      if (wasExpanded) {
        container.classList.add('book-card__genres--expanded');
      }
      
      setNeedsExpansion(fullHeight > maxHeight);
    };

    checkOverflow();
    
    // Recheck on window resize
    window.addEventListener('resize', checkOverflow);
    return (): void => {
      window.removeEventListener('resize', checkOverflow);
    };
  }, [genres, isGenresExpanded]);
  
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
            const fallback = target.nextElementSibling as HTMLElement;
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
              ref={genresContainerRef}
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