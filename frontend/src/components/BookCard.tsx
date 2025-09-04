import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book } from '../generated/api';
import { getBookGenres, formatDate, formatRating } from '../hooks/useBooks';
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
  const [showAllGenres, setShowAllGenres] = useState(false);
  
  const handleEdit = (): void => {
    void navigate(`/books/${book.id}/edit`);
  };

  const handleDelete = async (): Promise<void> => {
    if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      await onDelete(book);
    }
  };

  // Show first 4 genres by default, rest on expand
  const maxVisibleGenres = 4;
  const visibleGenres = showAllGenres ? genres : genres.slice(0, maxVisibleGenres);
  const hiddenGenreCount = genres.length - maxVisibleGenres;
  
  return (
    <div className="book-card">
      <div className="book-card__cover">
        <img 
          src={`https://covers.openlibrary.org/b/title/${encodeURIComponent(book.title)}-M.jpg`}
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
      
      <div className="book-card__content">
        <div className="book-card__header">
          <div className="book-card__title-section">
            <h3 className="book-card__title">{book.title}</h3>
            <p className="book-card__author">by {book.author}</p>
          </div>
          
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
        
        <div className="book-card__rating">
          <span className="rating-stars">
            {formatRating(book.rating ?? 0)}
          </span>
        </div>
        
        {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
        {genres && genres.length > 0 && (
          <div className="book-card__tags-container">
            <div className="book-card__tags-list">
              {visibleGenres.map((genre) => (
                <span key={genre} className="book-card__tag">
                  {genre}
                </span>
              ))}
              {!showAllGenres && hiddenGenreCount > 0 && (
                <button
                  className="book-card__tag book-card__tag--more"
                  onClick={() => setShowAllGenres(true)}
                  aria-label={`Show ${hiddenGenreCount} more genres`}
                >
                  +{hiddenGenreCount}
                </button>
              )}
              {showAllGenres && genres.length > maxVisibleGenres && (
                <button
                  className="book-card__tag book-card__tag--less"
                  onClick={() => setShowAllGenres(false)}
                  aria-label="Show fewer genres"
                >
                  Show less
                </button>
              )}
            </div>
          </div>
        )}
        
        <div className="book-card__published-date">
          {formatDate(book.publishedDate)}
        </div>
      </div>
    </div>
  );
});

export default BookCard;