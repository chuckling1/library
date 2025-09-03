import React, { useState } from 'react';
import { useBooks, useDeleteBook, BooksFilters } from '../hooks/useBooks';
import BookCard from '../components/BookCard';
import { Book } from '../generated/api';

const BookListPage: React.FC = () => {
  const [filters, setFilters] = useState<BooksFilters>({
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortDirection: 'desc'
  });
  
  const [searchInput, setSearchInput] = useState('');
  
  const { data: books, isLoading, error, refetch } = useBooks(filters);
  const deleteBookMutation = useDeleteBook();

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchInput.trim() || undefined }));
  };

  const handleFilterChange = (newFilters: Partial<BooksFilters>): void => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleDeleteBook = async (book: Book): Promise<void> => {
    try {
      await deleteBookMutation.mutateAsync(book.id!);
      // The mutation will automatically refetch the books list
    } catch {
      // console.error('Failed to delete book:', error);
      alert('Failed to delete book. Please try again.');
    }
  };

  const clearFilters = (): void => {
    setFilters({
      page: 1,
      pageSize: 20,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    });
    setSearchInput('');
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading books...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Books</h2>
        <p>Failed to load books. Please try again.</p>
        <button onClick={() => void refetch()} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="book-list-page">
      <div className="page-header">
        <h2>Book Collection</h2>
        <div className="book-count">
          {books?.length ?? 0} books found
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title or author..."
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        <div className="filter-controls">
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange({ 
              sortBy: e.target.value as BooksFilters['sortBy']
            })}
            className="sort-select"
          >
            <option value="title">Sort by Title</option>
            <option value="author">Sort by Author</option>
            <option value="publishedDate">Sort by Published Date</option>
            <option value="rating">Sort by Rating</option>
            <option value="createdAt">Sort by Date Added</option>
          </select>

          <select
            value={filters.sortDirection}
            onChange={(e) => handleFilterChange({ 
              sortDirection: e.target.value as BooksFilters['sortDirection']
            })}
            className="direction-select"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>

          <select
            value={filters.rating ?? ''}
            onChange={(e) => handleFilterChange({ 
              rating: e.target.value ? parseInt(e.target.value) : undefined
            })}
            className="rating-filter"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
            <option value="1">1+ Stars</option>
          </select>

          <button onClick={clearFilters} className="btn btn-secondary">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Books Grid */}
      {books && books.length > 0 ? (
        <div className="books-grid">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onDelete={handleDeleteBook}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No books found</h3>
          <p>
            {filters.search 
              ? "No books match your search criteria. Try adjusting your filters."
              : "Your library is empty. Add your first book to get started!"}
          </p>
          {filters.search && (
            <button onClick={() => void clearFilters()} className="btn btn-primary">
              Show All Books
            </button>
          )}
        </div>
      )}

      {/* Loading state for mutations */}
      {deleteBookMutation.isPending && (
        <div className="mutation-loading">
          Deleting book...
        </div>
      )}
    </div>
  );
};

export default BookListPage;