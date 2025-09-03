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
    expect(screen.getByText('(4/5)')).toBeInTheDocument();
    expect(screen.getByText('Published: 12/31/2022')).toBeInTheDocument();
    expect(screen.getByText('Edition: 1st Edition')).toBeInTheDocument();
    expect(screen.getByText('ISBN: 978-0123456789')).toBeInTheDocument();
    expect(screen.getByText('Added: 5/31/2023')).toBeInTheDocument();
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
    expect(screen.getByText('(3/5)')).toBeInTheDocument();
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
    expect(screen.queryByText('Edition:')).not.toBeInTheDocument();
    expect(screen.queryByText('ISBN:')).not.toBeInTheDocument();
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
    expect(container.querySelector('.book-title')).toBeInTheDocument();
    expect(container.querySelector('.book-author')).toBeInTheDocument();
    expect(container.querySelector('.book-rating')).toBeInTheDocument();
    expect(container.querySelector('.genre-tag')).toBeInTheDocument();
  });

  it('handles undefined rating gracefully', () => {
    const book = createMockBook({ rating: undefined });
    renderBookCard(book);

    expect(screen.getByText('☆☆☆☆☆')).toBeInTheDocument();
    expect(screen.getByText('(0/5)')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    const book = createMockBook({
      publishedDate: '2023-12-25T00:00:00.000Z',
      createdAt: '2023-07-15T10:30:00.000Z',
    });
    renderBookCard(book);

    expect(screen.getByText('Published: 12/24/2023')).toBeInTheDocument();
    expect(screen.getByText('Added: 7/15/2023')).toBeInTheDocument();
  });
});