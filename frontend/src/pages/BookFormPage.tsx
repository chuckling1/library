import React from 'react';
import { useParams } from 'react-router-dom';
import { useBook } from '../hooks/useBooks';
import BookForm from '../components/BookForm';

const BookFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  
  const { data: book, isLoading, error } = useBook(id ?? '');

  if (isEditing && isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading book...</div>
      </div>
    );
  }

  if (isEditing && error) {
    return (
      <div className="error-container">
        <h2>Error Loading Book</h2>
        <p>Failed to load book for editing. Please try again.</p>
        <a href="/" className="btn btn-primary">
          Back to Books
        </a>
      </div>
    );
  }

  if (isEditing && !book) {
    return (
      <div className="error-container">
        <h2>Book Not Found</h2>
        <p>The book you're trying to edit could not be found.</p>
        <a href="/" className="btn btn-primary">
          Back to Books
        </a>
      </div>
    );
  }

  return <BookForm book={book} isEditing={isEditing} />;
};

export default BookFormPage