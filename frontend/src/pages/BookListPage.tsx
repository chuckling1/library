import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';
import { useBooks, useDeleteBook, BooksFilters, getBookGenres } from '../hooks/useBooks';
import { useGenreFilter } from '../hooks/useGenreFilter';
import BookCard from '../components/BookCard';
import StarRatingFilter from '../components/StarRatingFilter';
import GenreFilter from '../components/GenreFilter';
import { Book } from '../generated/api';
import './BookListPage.scss';

interface LocationState {
  rating?: number;
}

const BookListPage: React.FC = () => {
  const location = useLocation();
  
  // Core state for filters
  const [filters, setFilters] = useState<BooksFilters>({
    page: 1,
    pageSize: 20,
    sortBy: 'title',
    sortDirection: 'asc',
    rating: undefined,
    genres: undefined,
    search: undefined,
  });

  // Handle navigation state for rating filter
  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.rating) {
      setFilters(prev => ({ ...prev, rating: state.rating }));
      // Clear the state to avoid re-applying on page refresh
      window.history.replaceState(null, '', location.pathname);
    }
  }, [location]);

  // Use uncontrolled input with ref for search
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Genre filter context
  const { activeGenres } = useGenreFilter();
  
  // Query hooks - fetch all books first
  const { data: allBooks, isLoading, error, refetch } = useBooks({
    ...filters,
    genres: undefined, // Remove server-side genre filtering
  });
  const deleteBookMutation = useDeleteBook();

  // Client-side filtering for genre functionality
  const filteredBooks = useMemo(() => {
    if (!allBooks || activeGenres.length === 0) {
      return allBooks ?? [];
    }

    return allBooks.filter(book => {
      const bookGenres = getBookGenres(book);
      return activeGenres.some(activeGenre => 
        bookGenres.some(bookGenre => 
          bookGenre.toLowerCase() === activeGenre.toLowerCase()
        )
      );
    });
  }, [allBooks, activeGenres]);

  // Debounced search handler
  const handleSearchChange = useDebouncedCallback(
    (value: string) => {
      setFilters(prev => ({
        ...prev,
        search: value.trim() || undefined,
      }));
    },
    300
  );

  // Handle filter changes
  const handleFilterChange = useCallback((updates: Partial<BooksFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle rating filter
  const handleRatingChange = useCallback((newRating: number) => {
    setFilters(prev => ({ ...prev, rating: newRating === 0 ? undefined : newRating }));
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

  // Clear search
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
        <button onClick={() => void refetch()} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const displayBooks = filteredBooks;
  const hasActiveFilters = (filters.search ?? false) || (filters.rating ?? false) || activeGenres.length > 0;

  return (
    <div className="book-list-page">
      <div className="page-header">
        <h2>Book Collection</h2>
        <Link to="/books/new" className="btn-primary">
          Add Book
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        {/* Row 1: Primary Search & Secondary Filters */}
        <div className="filter-bar__row">
          <div className="filter-bar__search">
            <input
              ref={searchInputRef}
              type="text"
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by title or author..."
              className="search-input"
            />
            {filters.search && (
              <button
                type="button"
                onClick={clearSearch}
                className="search-clear"
              >
                ×
              </button>
            )}
          </div>

          <div className="filter-bar__rating">
            <StarRatingFilter
              rating={filters.rating ?? 0}
              onRatingChange={handleRatingChange}
            />
          </div>
        </div>

        {/* Row 2: Genre Tag Filter */}
        <div className="filter-bar__genres">
          <GenreFilter />
        </div>
      </div>

      {/* Results Bar */}
      <div className="results-bar">
        <div className="results-bar__count">
          {displayBooks.length} book{displayBooks.length !== 1 ? 's' : ''} found
          {hasActiveFilters && (
            <span className="results-bar__filtered"> (filtered)</span>
          )}
        </div>
        
        <div className="results-bar__sorting">
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
        </div>
      </div>

      {/* Books Grid */}
      {displayBooks.length > 0 ? (
        <div className="books-grid">
          {displayBooks.map((book) => (
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
            {hasActiveFilters 
              ? "No books match your current filters. Try adjusting your search or filters."
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