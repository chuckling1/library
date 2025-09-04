import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BookCard from './BookCard';
import type { Book } from '../generated/api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: (): typeof mockNavigate => mockNavigate,
  };
});

const createMockBook = (overrides: Partial<Book> = {}): Book => ({
  id: '123',
  title: 'Test Book',
  author: 'Test Author',
  publishedDate: '2023-01-01T00:00:00.000Z',
  rating: 4,
  edition: '1st Edition',
  isbn: '978-0123456789',
  createdAt: '2023-06-01T00:00:00.000Z',
  updatedAt: '2023-06-01T00:00:00.000Z',
  bookGenres: [
    { bookId: '123', genreName: 'Fiction' },
    { bookId: '123', genreName: 'Mystery' }
  ],
  ...overrides,
});

const createMockBookWithManyGenres = (): Book => ({
  ...createMockBook(),
  bookGenres: [
    { bookId: '123', genreName: 'Fiction' },
    { bookId: '123', genreName: 'Mystery' },
    { bookId: '123', genreName: 'Thriller' },
    { bookId: '123', genreName: 'Adventure' },
    { bookId: '123', genreName: 'Horror' },
    { bookId: '123', genreName: 'Romance' },
  ]
});

const renderBookCard = (book: Book, onDelete = vi.fn()): ReturnType<typeof render> => {
  return render(
    <BrowserRouter>
      <BookCard book={book} onDelete={onDelete} />
    </BrowserRouter>
  );
};

describe('BookCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders book information correctly', () => {
    const book = createMockBook();
    renderBookCard(book);

    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('by Test Author')).toBeInTheDocument();
    expect(screen.getByText('★★★★☆')).toBeInTheDocument();
    expect(screen.getByText('12/31/2022')).toBeInTheDocument();
  });

  it('renders genres correctly', () => {
    const book = createMockBook();
    renderBookCard(book);

    expect(screen.getByText('Fiction')).toBeInTheDocument();
    expect(screen.getByText('Mystery')).toBeInTheDocument();
  });

  it('renders rating stars correctly', () => {
    const book = createMockBook({ rating: 3 });
    renderBookCard(book);

    expect(screen.getByText('★★★☆☆')).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const book = createMockBook({
      edition: null,
      isbn: null,
      bookGenres: null,
    });
    renderBookCard(book);

    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('by Test Author')).toBeInTheDocument();
    // Verify that ISBN and Edition are not displayed (per new specification)
    expect(screen.queryByText('Edition:')).not.toBeInTheDocument();
    expect(screen.queryByText('ISBN:')).not.toBeInTheDocument();
    expect(screen.queryByText('Added:')).not.toBeInTheDocument();
  });

  it('shows genre overflow handling with many genres', () => {
    const book = createMockBookWithManyGenres();
    renderBookCard(book);

    // Should show first 4 genres
    expect(screen.getByText('Fiction')).toBeInTheDocument();
    expect(screen.getByText('Mystery')).toBeInTheDocument();
    expect(screen.getByText('Thriller')).toBeInTheDocument();
    expect(screen.getByText('Adventure')).toBeInTheDocument();
    
    // Should show "+2" button for remaining genres
    expect(screen.getByText('+2')).toBeInTheDocument();
    
    // Horror and Romance should not be visible initially
    expect(screen.queryByText('Horror')).not.toBeInTheDocument();
    expect(screen.queryByText('Romance')).not.toBeInTheDocument();
  });

  it('expands genres when show more button is clicked', async () => {
    const book = createMockBookWithManyGenres();
    renderBookCard(book);

    // Click the "+2" button
    const showMoreButton = screen.getByText('+2');
    fireEvent.click(showMoreButton);

    // All genres should now be visible
    await waitFor(() => {
      expect(screen.getByText('Fiction')).toBeInTheDocument();
      expect(screen.getByText('Mystery')).toBeInTheDocument();
      expect(screen.getByText('Thriller')).toBeInTheDocument();
      expect(screen.getByText('Adventure')).toBeInTheDocument();
      expect(screen.getByText('Horror')).toBeInTheDocument();
      expect(screen.getByText('Romance')).toBeInTheDocument();
    });

    // Should show "Show less" button
    expect(screen.getByText('Show less')).toBeInTheDocument();
  });

  it('collapses genres when show less button is clicked', async () => {
    const book = createMockBookWithManyGenres();
    renderBookCard(book);

    // First expand
    const showMoreButton = screen.getByText('+2');
    fireEvent.click(showMoreButton);

    // Wait for expansion
    await waitFor(() => {
      expect(screen.getByText('Show less')).toBeInTheDocument();
    });

    // Then collapse
    const showLessButton = screen.getByText('Show less');
    fireEvent.click(showLessButton);

    // Should be back to limited view
    await waitFor(() => {
      expect(screen.getByText('+2')).toBeInTheDocument();
      expect(screen.queryByText('Horror')).not.toBeInTheDocument();
      expect(screen.queryByText('Romance')).not.toBeInTheDocument();
    });
  });

  it('navigates to edit page when edit button is clicked', () => {
    const book = createMockBook();
    renderBookCard(book);

    const editButton = screen.getByLabelText('Edit Test Book');
    fireEvent.click(editButton);

    expect(mockNavigate).toHaveBeenCalledWith('/books/123/edit');
  });

  it('shows confirmation dialog when delete button is clicked', () => {
    const book = createMockBook();
    const onDelete = vi.fn();
    
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    renderBookCard(book, onDelete);

    const deleteButton = screen.getByLabelText('Delete Test Book');
    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete "Test Book"?');
    confirmSpy.mockRestore();
  });

  it('calls onDelete when confirmation is accepted', async () => {
    const book = createMockBook();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    renderBookCard(book, onDelete);

    const deleteButton = screen.getByLabelText('Delete Test Book');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(book);
    });
    
    confirmSpy.mockRestore();
  });

  it('does not call onDelete when confirmation is cancelled', () => {
    const book = createMockBook();
    const onDelete = vi.fn();
    
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    
    renderBookCard(book, onDelete);

    const deleteButton = screen.getByLabelText('Delete Test Book');
    fireEvent.click(deleteButton);

    expect(onDelete).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('has correct aria labels for accessibility', () => {
    const book = createMockBook();
    renderBookCard(book);

    expect(screen.getByLabelText('Edit Test Book')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Test Book')).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    const book = createMockBook();
    const { container } = renderBookCard(book);

    expect(container.querySelector('.book-card')).toBeInTheDocument();
    expect(container.querySelector('.book-card__title')).toBeInTheDocument();
    expect(container.querySelector('.book-card__author')).toBeInTheDocument();
    expect(container.querySelector('.book-card__rating')).toBeInTheDocument();
    expect(container.querySelector('.book-card__tag')).toBeInTheDocument();
    expect(container.querySelector('.book-card__published-date')).toBeInTheDocument();
    expect(container.querySelector('.book-card__actions')).toBeInTheDocument();
  });

  it('handles undefined rating gracefully', () => {
    const book = createMockBook({ rating: undefined });
    renderBookCard(book);

    expect(screen.getByText('☆☆☆☆☆')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    const book = createMockBook({
      publishedDate: '2023-12-25T00:00:00.000Z',
    });
    renderBookCard(book);

    expect(screen.getByText('12/24/2023')).toBeInTheDocument();
  });

  it('displays action buttons in header', () => {
    const book = createMockBook();
    const { container } = renderBookCard(book);

    const actionsContainer = container.querySelector('.book-card__actions');
    expect(actionsContainer).toBeInTheDocument();
    expect(screen.getByAltText('Edit')).toBeInTheDocument();
    expect(screen.getByAltText('Delete')).toBeInTheDocument();
  });

  it('handles empty genres array gracefully', () => {
    const book = createMockBook({ bookGenres: [] });
    renderBookCard(book);

    expect(screen.getByText('Test Book')).toBeInTheDocument();
    // Verify no genre tags are rendered
    const tagsContainer = document.querySelector('.book-card__tags-container');
    expect(tagsContainer).not.toBeInTheDocument();
  });

  it('handles genres with null names gracefully', () => {
    const book = createMockBook({
      bookGenres: [
        { bookId: '123', genreName: 'Fiction' },
        { bookId: '123', genreName: null },
        { bookId: '123', genreName: 'Mystery' }
      ]
    });
    renderBookCard(book);

    expect(screen.getByText('Fiction')).toBeInTheDocument();
    expect(screen.getByText('Mystery')).toBeInTheDocument();
    // Empty string from null genre name should be handled by the helper function
  });
});