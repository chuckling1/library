import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Book } from '../generated/api';
import { getBookGenres, formatDate, formatRating } from '../hooks/useBooks';

interface BookCardProps {
  book: Book;
  onDelete: (book: Book) => Promise<void>;
}

const BookCard: React.FC<BookCardProps> = ({ book, onDelete }) => {
  const navigate = useNavigate();
  const genres = getBookGenres(book);
  
  const handleEdit = (): void => {
    void navigate(`/books/${book.id}/edit`);
  };

  const handleDelete = async (): Promise<void> => {
    if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      await onDelete(book);
    }
  };
  
  return (
    <div className="book-card">
      <div className="book-card-content">
        <div className="book-card-header">
          <h3 className="book-title">{book.title}</h3>
          <div className="book-actions">
            <button
              onClick={handleEdit}
              className="btn btn-sm btn-secondary"
              aria-label={`Edit ${book.title}`}
            >
              Edit
            </button>
            <button
              onClick={() => void handleDelete()}
              className="btn btn-sm btn-danger"
              aria-label={`Delete ${book.title}`}
            >
              Delete
            </button>
          </div>
        </div>
        
        <p className="book-author">by {book.author}</p>
        
        <div className="book-meta">
          <div className="book-rating">
            <span className="rating-stars">
              {formatRating(book.rating ?? 0)}
            </span>
            <span className="rating-text">({book.rating ?? 0}/5)</span>
          </div>
          
          <p className="book-published">
            Published: {formatDate(book.publishedDate)}
          </p>
          
          {book.edition && (
            <p className="book-edition">Edition: {book.edition}</p>
          )}
          
          {book.isbn && (
            <p className="book-isbn">ISBN: {book.isbn}</p>
          )}
        </div>
        
        {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
        {genres && genres.length > 0 && (
          <div className="book-genres">
            {genres.map((genre) => (
              <span key={genre} className="genre-tag">
                {genre}
              </span>
            ))}
          </div>
        )}
        
        <p className="book-added">
          Added: {formatDate(book.createdAt!)}
        </p>
      </div>
    </div>
  );
};

export default BookCard;