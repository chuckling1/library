import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import {
  QueryClient,
  QueryClientProvider,
  type UseQueryResult,
} from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import BookFormPage from './BookFormPage';
import type { Book } from '../generated/api';
import * as useBooks from '../hooks/useBooks';
import * as router from 'react-router-dom';

// Mock the hooks
vi.mock('../hooks/useBooks');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

// Mock BookForm component to make testing easier
vi.mock('../components/BookForm', () => ({
  default: ({
    book,
    isEditing,
  }: {
    book?: Book;
    isEditing: boolean;
  }): React.JSX.Element => (
    <div data-testid="book-form">
      <div data-testid="book-form-book">
        {book ? JSON.stringify(book) : 'undefined'}
      </div>
      <div data-testid="book-form-is-editing">{String(isEditing)}</div>
    </div>
  ),
}));

const mockUseBook = vi.mocked(useBooks.useBook);
const mockUseParams = vi.mocked(router.useParams);

// Create mock book data
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
  userId: 'user-123',
  bookGenres: [{ bookId: '123', genreName: 'Fiction' }],
  ...overrides,
});

// Create wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }): React.JSX.Element => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

// Helper functions to create query states
const createLoadingQuery = (): UseQueryResult<Book, Error> =>
  ({
    data: undefined,
    isLoading: true,
    error: null,
    refetch: vi.fn(),
    isSuccess: false,
    isError: false,
    status: 'pending',
    isPending: true,
    isLoadingError: false,
    isRefetchError: false,
    isPlaceholderData: false,
    isStale: false,
    isFetching: true,
    isFetchedAfterMount: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    fetchStatus: 'fetching',
    isInitialLoading: true,
    isRefetching: false,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: false,
    isPaused: false,
    isEnabled: true,
    promise: Promise.resolve(undefined as unknown as Book),
  }) as unknown as UseQueryResult<Book, Error>;

const createSuccessQuery = (
  data: Book | undefined
): UseQueryResult<Book, Error> =>
  ({
    data,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isSuccess: true,
    isError: false,
    status: 'success',
    isPending: false,
    isLoadingError: false,
    isRefetchError: false,
    isPlaceholderData: false,
    isStale: false,
    isFetching: false,
    isFetchedAfterMount: true,
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    fetchStatus: 'idle',
    isInitialLoading: false,
    isRefetching: false,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: true,
    isPaused: false,
    isEnabled: true,
    promise: Promise.resolve(data),
  }) as unknown as UseQueryResult<Book, Error>;

const createErrorQuery = (error: Error): UseQueryResult<Book, Error> => {
  // Create a rejected promise that's already caught to prevent unhandled rejections
  const rejectedPromise = Promise.reject(error);
  rejectedPromise.catch(() => {}); // Catch to prevent unhandled rejection

  return {
    data: undefined,
    isLoading: false,
    error,
    refetch: vi.fn(),
    isSuccess: false,
    isError: true,
    status: 'error',
    isPending: false,
    isLoadingError: false,
    isRefetchError: false,
    isPlaceholderData: false,
    isStale: false,
    isFetching: false,
    isFetchedAfterMount: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: Date.now(),
    fetchStatus: 'idle',
    isInitialLoading: false,
    isRefetching: false,
    failureCount: 1,
    failureReason: error,
    errorUpdateCount: 1,
    isFetched: true,
    isPaused: false,
    isEnabled: true,
    promise: rejectedPromise,
  } as unknown as UseQueryResult<Book, Error>;
};

const createIdleQuery = (): UseQueryResult<Book, Error> =>
  ({
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isSuccess: false,
    isError: false,
    status: 'pending',
    isPending: true,
    isLoadingError: false,
    isRefetchError: false,
    isPlaceholderData: false,
    isStale: false,
    isFetching: false,
    isFetchedAfterMount: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    fetchStatus: 'idle',
    isInitialLoading: false,
    isRefetching: false,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetched: false,
    isPaused: false,
    isEnabled: false, // Disabled when no id provided
    promise: Promise.resolve(undefined as unknown as Book),
  }) as unknown as UseQueryResult<Book, Error>;

describe('BookFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode (no id parameter)', () => {
    beforeEach(() => {
      // Mock useParams to return no id (create mode)
      mockUseParams.mockReturnValue({});
      // Mock useBook to return idle query (disabled when no id)
      mockUseBook.mockReturnValue(createIdleQuery());
    });

    it('renders BookForm in create mode when no id param', () => {
      render(<BookFormPage />, { wrapper: createWrapper() });

      const bookForm = screen.getByTestId('book-form');
      const bookData = screen.getByTestId('book-form-book');
      const isEditingData = screen.getByTestId('book-form-is-editing');

      expect(bookForm).toBeInTheDocument();
      expect(bookData).toHaveTextContent('undefined');
      expect(isEditingData).toHaveTextContent('false');
    });

    it('calls useBook with empty string when no id', () => {
      render(<BookFormPage />, { wrapper: createWrapper() });

      expect(mockUseBook).toHaveBeenCalledWith('');
    });

    it('passes isEditing=false and book=undefined to BookForm', () => {
      render(<BookFormPage />, { wrapper: createWrapper() });

      const bookData = screen.getByTestId('book-form-book');
      const isEditingData = screen.getByTestId('book-form-is-editing');

      expect(bookData).toHaveTextContent('undefined');
      expect(isEditingData).toHaveTextContent('false');
    });
  });

  describe('Edit Mode (with id parameter)', () => {
    const testBookId = '123';

    beforeEach(() => {
      // Mock useParams to return book id (edit mode)
      mockUseParams.mockReturnValue({ id: testBookId });
    });

    describe('Loading State', () => {
      beforeEach(() => {
        mockUseBook.mockReturnValue(createLoadingQuery());
      });

      it('shows loading spinner while fetching book', () => {
        render(<BookFormPage />, { wrapper: createWrapper() });

        expect(screen.getByText('Loading book...')).toBeInTheDocument();
        expect(screen.queryByTestId('book-form')).not.toBeInTheDocument();
      });

      it('uses correct CSS classes for loading container', () => {
        render(<BookFormPage />, { wrapper: createWrapper() });

        const loadingContainer =
          screen.getByText('Loading book...').parentElement;
        expect(loadingContainer).toHaveClass('loading-container');

        const loadingSpinner = screen.getByText('Loading book...');
        expect(loadingSpinner).toHaveClass('loading-spinner');
      });

      it('calls useBook with correct book id parameter', () => {
        render(<BookFormPage />, { wrapper: createWrapper() });

        expect(mockUseBook).toHaveBeenCalledWith(testBookId);
      });
    });

    describe('Success State', () => {
      const mockBook = createMockBook({ id: testBookId });

      beforeEach(() => {
        mockUseBook.mockReturnValue(createSuccessQuery(mockBook));
      });

      it('renders BookForm with book data when loaded', () => {
        render(<BookFormPage />, { wrapper: createWrapper() });

        const bookForm = screen.getByTestId('book-form');
        const bookData = screen.getByTestId('book-form-book');
        const isEditingData = screen.getByTestId('book-form-is-editing');

        expect(bookForm).toBeInTheDocument();
        expect(bookData).toHaveTextContent(JSON.stringify(mockBook));
        expect(isEditingData).toHaveTextContent('true');
      });

      it('passes isEditing=true and loaded book to BookForm', () => {
        render(<BookFormPage />, { wrapper: createWrapper() });

        const bookData = screen.getByTestId('book-form-book');
        const isEditingData = screen.getByTestId('book-form-is-editing');

        expect(JSON.parse(bookData.textContent || '{}')).toEqual(mockBook);
        expect(isEditingData).toHaveTextContent('true');
      });

      it('uses correct CSS class for book form page container', () => {
        render(<BookFormPage />, { wrapper: createWrapper() });

        const container = screen.getByTestId('book-form').parentElement;
        expect(container).toHaveClass('book-form-page');
      });
    });

    describe('Error State', () => {
      const testError = new Error('Failed to fetch book');

      beforeEach(() => {
        mockUseBook.mockReturnValue(createErrorQuery(testError));
      });

      it('shows error message when book fetch fails', () => {
        render(<BookFormPage />, { wrapper: createWrapper() });

        expect(screen.getByText('Error Loading Book')).toBeInTheDocument();
        expect(
          screen.getByText('Failed to load book for editing. Please try again.')
        ).toBeInTheDocument();
        expect(screen.queryByTestId('book-form')).not.toBeInTheDocument();
      });

      it('uses correct CSS classes for error container', () => {
        render(<BookFormPage />, { wrapper: createWrapper() });

        const errorContainer =
          screen.getByText('Error Loading Book').parentElement;
        expect(errorContainer).toHaveClass('error-container');
      });

      it('renders "Back to Books" link with correct attributes', () => {
        render(<BookFormPage />, { wrapper: createWrapper() });

        const backLink = screen.getByRole('link', { name: 'Back to Books' });
        expect(backLink).toBeInTheDocument();
        expect(backLink).toHaveAttribute('href', '/');
        expect(backLink).toHaveClass('btn', 'btn-primary');
      });

      it('shows proper error message structure', () => {
        render(<BookFormPage />, { wrapper: createWrapper() });

        // Check heading
        const heading = screen.getByRole('heading', { level: 2 });
        expect(heading).toHaveTextContent('Error Loading Book');

        // Check paragraph
        const paragraph = screen.getByText(
          'Failed to load book for editing. Please try again.'
        );
        expect(paragraph.tagName.toLowerCase()).toBe('p');
      });
    });

    describe('Book Not Found State', () => {
      beforeEach(() => {
        // Mock successful query but with no data (book not found)
        mockUseBook.mockReturnValue(createSuccessQuery(undefined));
      });

      it('shows "Book Not Found" when book doesnt exist', () => {
        render(<BookFormPage />, { wrapper: createWrapper() });

        expect(screen.getByText('Book Not Found')).toBeInTheDocument();
        expect(
          screen.getByText("The book you're trying to edit could not be found.")
        ).toBeInTheDocument();
        expect(screen.queryByTestId('book-form')).not.toBeInTheDocument();
      });

      it('uses correct CSS classes for not found container', () => {
        render(<BookFormPage />, { wrapper: createWrapper() });

        const errorContainer = screen.getByText('Book Not Found').parentElement;
        expect(errorContainer).toHaveClass('error-container');
      });

      it('renders "Back to Books" link with correct attributes', () => {
        render(<BookFormPage />, { wrapper: createWrapper() });

        const backLink = screen.getByRole('link', { name: 'Back to Books' });
        expect(backLink).toBeInTheDocument();
        expect(backLink).toHaveAttribute('href', '/');
        expect(backLink).toHaveClass('btn', 'btn-primary');
      });

      it('shows proper not found message structure', () => {
        render(<BookFormPage />, { wrapper: createWrapper() });

        // Check heading
        const heading = screen.getByRole('heading', { level: 2 });
        expect(heading).toHaveTextContent('Book Not Found');

        // Check paragraph
        const paragraph = screen.getByText(
          "The book you're trying to edit could not be found."
        );
        expect(paragraph.tagName.toLowerCase()).toBe('p');
      });
    });
  });

  describe('Hook Integration', () => {
    it('extracts id parameter from useParams correctly', () => {
      const testId = '456';
      mockUseParams.mockReturnValue({ id: testId });
      mockUseBook.mockReturnValue(createLoadingQuery());

      render(<BookFormPage />, { wrapper: createWrapper() });

      expect(mockUseParams).toHaveBeenCalled();
      expect(mockUseBook).toHaveBeenCalledWith(testId);
    });

    it('handles undefined id parameter correctly', () => {
      mockUseParams.mockReturnValue({ id: undefined });
      mockUseBook.mockReturnValue(createIdleQuery());

      render(<BookFormPage />, { wrapper: createWrapper() });

      expect(mockUseParams).toHaveBeenCalled();
      expect(mockUseBook).toHaveBeenCalledWith('');
    });

    it('calls useBook with empty string when id is not provided', () => {
      mockUseParams.mockReturnValue({});
      mockUseBook.mockReturnValue(createIdleQuery());

      render(<BookFormPage />, { wrapper: createWrapper() });

      expect(mockUseBook).toHaveBeenCalledWith('');
    });

    it('handles useBook loading state correctly', () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseBook.mockReturnValue(createLoadingQuery());

      render(<BookFormPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Loading book...')).toBeInTheDocument();
    });

    it('handles useBook error state correctly', () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseBook.mockReturnValue(createErrorQuery(new Error('Network error')));

      render(<BookFormPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Error Loading Book')).toBeInTheDocument();
    });

    it('handles useBook success state correctly', () => {
      const mockBook = createMockBook();
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseBook.mockReturnValue(createSuccessQuery(mockBook));

      render(<BookFormPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId('book-form')).toBeInTheDocument();
      expect(screen.getByTestId('book-form-is-editing')).toHaveTextContent(
        'true'
      );
    });
  });

  describe('Boolean Logic Tests', () => {
    it('correctly determines isEditing when id is truthy', () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseBook.mockReturnValue(createSuccessQuery(createMockBook()));

      render(<BookFormPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId('book-form-is-editing')).toHaveTextContent(
        'true'
      );
    });

    it('correctly determines isEditing when id is falsy', () => {
      mockUseParams.mockReturnValue({ id: undefined });
      mockUseBook.mockReturnValue(createIdleQuery());

      render(<BookFormPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId('book-form-is-editing')).toHaveTextContent(
        'false'
      );
    });

    it('correctly determines isEditing when id is empty string', () => {
      mockUseParams.mockReturnValue({ id: '' });
      mockUseBook.mockReturnValue(createIdleQuery());

      render(<BookFormPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId('book-form-is-editing')).toHaveTextContent(
        'false'
      );
    });
  });

  describe('Component Rendering Priority', () => {
    const testId = '123';

    beforeEach(() => {
      mockUseParams.mockReturnValue({ id: testId });
    });

    it('prioritizes loading state over other states when editing and loading', () => {
      mockUseBook.mockReturnValue(createLoadingQuery());

      render(<BookFormPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Loading book...')).toBeInTheDocument();
      expect(screen.queryByText('Error Loading Book')).not.toBeInTheDocument();
      expect(screen.queryByTestId('book-form')).not.toBeInTheDocument();
    });

    it('shows error state when editing and has error (not loading)', () => {
      mockUseBook.mockReturnValue(createErrorQuery(new Error('Fetch failed')));

      render(<BookFormPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Error Loading Book')).toBeInTheDocument();
      expect(screen.queryByText('Loading book...')).not.toBeInTheDocument();
      expect(screen.queryByTestId('book-form')).not.toBeInTheDocument();
    });

    it('shows not found state when editing and no error but no book data', () => {
      mockUseBook.mockReturnValue(createSuccessQuery(undefined));

      render(<BookFormPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Book Not Found')).toBeInTheDocument();
      expect(screen.queryByText('Loading book...')).not.toBeInTheDocument();
      expect(screen.queryByText('Error Loading Book')).not.toBeInTheDocument();
      expect(screen.queryByTestId('book-form')).not.toBeInTheDocument();
    });

    it('shows book form when all conditions are met', () => {
      const mockBook = createMockBook();
      mockUseBook.mockReturnValue(createSuccessQuery(mockBook));

      render(<BookFormPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId('book-form')).toBeInTheDocument();
      expect(screen.queryByText('Loading book...')).not.toBeInTheDocument();
      expect(screen.queryByText('Error Loading Book')).not.toBeInTheDocument();
      expect(screen.queryByText('Book Not Found')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty id string correctly', () => {
      mockUseParams.mockReturnValue({ id: '' });
      mockUseBook.mockReturnValue(createIdleQuery());

      render(<BookFormPage />, { wrapper: createWrapper() });

      expect(mockUseBook).toHaveBeenCalledWith('');
      expect(screen.getByTestId('book-form-is-editing')).toHaveTextContent(
        'false'
      );
    });

    it('handles whitespace-only id correctly', () => {
      mockUseParams.mockReturnValue({ id: '   ' });
      mockUseBook.mockReturnValue(createLoadingQuery());

      render(<BookFormPage />, { wrapper: createWrapper() });

      // Boolean('   ') is true, so it should be in edit mode
      expect(mockUseBook).toHaveBeenCalledWith('   ');
      expect(screen.getByText('Loading book...')).toBeInTheDocument();
    });

    it('handles numeric id correctly', () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseBook.mockReturnValue(createSuccessQuery(createMockBook()));

      render(<BookFormPage />, { wrapper: createWrapper() });

      expect(mockUseBook).toHaveBeenCalledWith('123');
      expect(screen.getByTestId('book-form-is-editing')).toHaveTextContent(
        'true'
      );
    });
  });
});
