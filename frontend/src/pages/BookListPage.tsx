import React, { useState, useCallback, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useBooks, useDeleteBook, BooksFilters } from '../hooks/useBooks';
import BookCard from '../components/BookCard';
import { Book } from '../generated/api';

const BookListPage: React.FC = () => {
  // Core state for filters
  const [filters, setFilters] = useState<BooksFilters>({
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    rating: undefined,
    genres: undefined,
    search: undefined,
  });

  // Use uncontrolled input with ref for search
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Query hooks
  const { data: books, isLoading, error, refetch } = useBooks(filters);
  const deleteBookMutation = useDeleteBook();

  // Debounced search handler - industry standard pattern
  const handleSearchChange = useDebouncedCallback(
    (value: string) => {
      setFilters(prev => ({
        ...prev,
        search: value.trim() || undefined,
      }));
    },
    300 // 300ms debounce
  );

  // Handle filter changes
  const handleFilterChange = useCallback((updates: Partial<BooksFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle delete book
  const handleDeleteBook = useCallback(async (book: Book): Promise<void> => {
    if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      try {
        await deleteBookMutation.mutateAsync(book.id!);
      } catch {
        alert('Failed to delete book. Please try again.');
      }
    }
  }, [deleteBookMutation]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      page: 1,
      pageSize: 20,
      sortBy: 'createdAt',
      sortDirection: 'desc',
      rating: undefined,
      genres: undefined,
      search: undefined,
    });
    // Clear the search input
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  }, []);

  // Clear just the search
  const clearSearch = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
      setFilters(prev => ({ ...prev, search: undefined }));
    }
  }, []);

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
        <div className="search-form">
          {/* UNCONTROLLED INPUT - The key to stability */}
          <input
            ref={searchInputRef}
            type="text"
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by title or author... (live search)"
            className="search-input"
          />
          {filters.search && (
            <button
              type="button"
              onClick={clearSearch}
              className="btn btn-secondary btn-sm clear-search"
            >
              Clear
            </button>
          )}
        </div>

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
            value={filters.rating?.toString() ?? ''}
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
              ? "No books match your search criteria. Try adjusting your search or filters."
              : "Your library is empty. Add your first book to get started!"}
          </p>
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