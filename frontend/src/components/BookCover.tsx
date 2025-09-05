import React, { useState, useEffect } from 'react';
import { Book } from '../generated/api';
import { BookCoverManager } from '../utils/bookCovers';
import { logger } from '../utils/logger';

interface BookCoverProps {
  book: Book;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const BookCover: React.FC<BookCoverProps> = ({
  book,
  size = 'medium',
  className = '',
}) => {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    small: 'book-cover-small',
    medium: 'book-cover-medium',
    large: 'book-cover-large',
  };

  useEffect(() => {
    let isMounted = true;

    const loadCover = async (): Promise<void> => {
      setIsLoading(true);
      setHasError(false);

      try {
        const url = await BookCoverManager.getCover(book);
        if (isMounted) {
          setCoverUrl(url);
        }
      } catch (error) {
        logger.error('Failed to load book cover:', error);
        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCover();

    return (): void => {
      isMounted = false;
    };
  }, [book]);

  const handleImageError = (): void => {
    setHasError(true);
  };

  if (isLoading) {
    return (
      <div
        className={`book-cover-placeholder ${sizeClasses[size]} ${className}`}
      >
        <div className="book-cover-loading">
          <div className="loading-spinner">📚</div>
        </div>
      </div>
    );
  }

  if (hasError || !coverUrl) {
    return (
      <div
        className={`book-cover-placeholder ${sizeClasses[size]} ${className}`}
      >
        <div className="book-cover-fallback">
          <div className="book-cover-title">{book.title}</div>
          <div className="book-cover-author">by {book.author}</div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={coverUrl}
      alt={`Cover of ${book.title} by ${book.author}`}
      className={`book-cover ${sizeClasses[size]} ${className}`}
      onError={handleImageError}
      loading="lazy"
    />
  );
};

export default BookCover;
