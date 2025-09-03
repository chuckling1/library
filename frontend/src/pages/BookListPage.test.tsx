import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import BookListPage from './BookListPage';
import type { Book } from '../generated/api';
import * as useBooks from '../hooks/useBooks';

vi.mock('../hooks/useBooks');
const mockUseBooks = vi.mocked(useBooks.useBooks);
const mockUseDeleteBook = vi.mocked(useBooks.useDeleteBook);

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
    { bookId: '123', genreName: 'Fiction' }
  ],
  ...overrides,
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: ReactNode }): React.JSX.Element => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const createMockUseMutationResult = function<TData, TError, TVariables>(overrides: Partial<UseMutationResult<TData, TError, TVariables>> = {}): UseMutationResult<TData, TError, TVariables> {
  return {
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    isSuccess: false,
    data: undefined,
    mutate: vi.fn(),
    reset: vi.fn(),
    status: 'idle',
    variables: undefined,
    context: undefined,
    isIdle: true,
    failureCount: 0,
    failureReason: null,
    submittedAt: 0,
    isPaused: false,
    ...overrides
  } as unknown as UseMutationResult<TData, TError, TVariables>;
};

// Create specific mock functions for different query states to ensure type safety
const createLoadingQuery = function<TData>(): UseQueryResult<TData, Error> {
  return {
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
    promise: Promise.resolve(undefined as unknown as TData),
  } as unknown as UseQueryResult<TData, Error>;
};

const createSuccessQuery = function<TData>(data: TData): UseQueryResult<TData, Error> {
  return {
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
  } as unknown as UseQueryResult<TData, Error>;
};

const createErrorQuery = function<TData>(error: Error, refetch = vi.fn()): UseQueryResult<TData, Error> {
  // Create a rejected promise that's already caught to prevent unhandled rejections
  const rejectedPromise = Promise.reject(error);
  rejectedPromise.catch(() => {}); // Catch to prevent unhandled rejection
  
  return {
    data: undefined,
    isLoading: false,
    error,
    refetch,
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
  } as unknown as UseQueryResult<TData, Error>;
};

const mockDeleteMutation = createMockUseMutationResult<void, Error, string>();

describe('BookListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDeleteBook.mockReturnValue(mockDeleteMutation);
    // Set default mock implementation that returns empty books
    mockUseBooks.mockImplementation(() => createSuccessQuery([]));
  });

  it('renders loading state', () => {
    mockUseBooks.mockReturnValue(createLoadingQuery<Book[]>());

    render(<BookListPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading books...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const mockRefetch = vi.fn();
    mockUseBooks.mockReturnValue(createErrorQuery<Book[]>(new Error('Failed to fetch'), mockRefetch));

    render(<BookListPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Error Loading Books')).toBeInTheDocument();
    expect(screen.getByText('Failed to load books. Please try again.')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders books when loaded successfully', () => {
    const mockBooks = [
      createMockBook({ id: '1', title: 'Book 1' }),
      createMockBook({ id: '2', title: 'Book 2' }),
    ];

    mockUseBooks.mockReturnValue(createSuccessQuery(mockBooks));

    render(<BookListPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Book Collection')).toBeInTheDocument();
    expect(screen.getByText('2 books found')).toBeInTheDocument();
    expect(screen.getByText('Book 1')).toBeInTheDocument();
    expect(screen.getByText('Book 2')).toBeInTheDocument();
  });

  it('renders empty state when no books found', () => {
    mockUseBooks.mockReturnValue(createSuccessQuery([]));

    render(<BookListPage />, { wrapper: createWrapper() });

    expect(screen.getByText('No books found')).toBeInTheDocument();
    expect(screen.getByText('Your library is empty. Add your first book to get started!')).toBeInTheDocument();
  });

  it('handles search functionality', () => {
    const mockBooks = [createMockBook()];
    
    mockUseBooks.mockReturnValue(createSuccessQuery(mockBooks));

    render(<BookListPage />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText('Search by title or author...');
    const searchButton = screen.getByText('Search');

    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.click(searchButton);

    // Verify the hook was called with search filter
    expect(mockUseBooks).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'test query'
      })
    );
  });

  it('handles search form submission', () => {
    const mockBooks = [createMockBook()];
    
    mockUseBooks.mockReturnValue(createSuccessQuery(mockBooks));

    render(<BookListPage />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText('Search by title or author...');
    const form = searchInput.closest('form')!;

    fireEvent.change(searchInput, { target: { value: 'form submit test' } });
    fireEvent.submit(form);

    expect(mockUseBooks).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'form submit test'
      })
    );
  });

  it('handles sort by selection', () => {
    mockUseBooks.mockReturnValue(createSuccessQuery([createMockBook()]));

    render(<BookListPage />, { wrapper: createWrapper() });

    const sortSelect = screen.getByDisplayValue('Sort by Date Added');
    fireEvent.change(sortSelect, { target: { value: 'title' } });

    expect(mockUseBooks).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'title'
      })
    );
  });

  it('handles sort direction selection', () => {
    mockUseBooks.mockReturnValue(createSuccessQuery([createMockBook()]));

    render(<BookListPage />, { wrapper: createWrapper() });

    const directionSelect = screen.getByDisplayValue('Descending');
    fireEvent.change(directionSelect, { target: { value: 'asc' } });

    expect(mockUseBooks).toHaveBeenCalledWith(
      expect.objectContaining({
        sortDirection: 'asc'
      })
    );
  });

  it('handles rating filter selection', () => {
    mockUseBooks.mockReturnValue(createSuccessQuery([createMockBook()]));

    render(<BookListPage />, { wrapper: createWrapper() });

    const ratingSelect = screen.getByDisplayValue('All Ratings');
    fireEvent.change(ratingSelect, { target: { value: '4' } });

    expect(mockUseBooks).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: 4
      })
    );
  });

  it('clears filters when clear button is clicked', () => {
    mockUseBooks.mockReturnValue(createSuccessQuery([createMockBook()]));

    render(<BookListPage />, { wrapper: createWrapper() });

    // First set some filters
    const searchInput = screen.getByPlaceholderText('Search by title or author...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Then clear them
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    expect(searchInput).toHaveValue('');
    expect(mockUseBooks).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        pageSize: 20,
        sortBy: 'createdAt',
        sortDirection: 'desc'
      })
    );
  });

  it('handles book deletion successfully', async () => {
    const mockBooks = [createMockBook()];
    const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
    
    mockUseBooks.mockReturnValue(createSuccessQuery(mockBooks));

    mockUseDeleteBook.mockReturnValue(createMockUseMutationResult({
      mutateAsync: mockMutateAsync
    }));

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<BookListPage />, { wrapper: createWrapper() });

    const deleteButton = screen.getByLabelText('Delete Test Book');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith('123');
    });

    confirmSpy.mockRestore();
  });

  it('handles book deletion failure', async () => {
    const mockBooks = [createMockBook()];
    const mockMutateAsync = vi.fn().mockRejectedValue(new Error('Delete failed'));
    
    mockUseBooks.mockReturnValue(createSuccessQuery(mockBooks));

    mockUseDeleteBook.mockReturnValue(createMockUseMutationResult({
      mutateAsync: mockMutateAsync
    }));

    // Mock window.confirm and alert
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<BookListPage />, { wrapper: createWrapper() });

    const deleteButton = screen.getByLabelText('Delete Test Book');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to delete book. Please try again.');
    });

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('shows loading indicator during deletion', () => {
    mockUseBooks.mockReturnValue(createSuccessQuery([createMockBook()]));

    mockUseDeleteBook.mockReturnValue(createMockUseMutationResult({
      isPending: true
    }));

    render(<BookListPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Deleting book...')).toBeInTheDocument();
  });

  it('shows empty state with search filters', () => {
    // Mock to return empty results for any filter
    mockUseBooks.mockImplementation(() => {
      return createSuccessQuery([]);
    });

    const { rerender } = render(<BookListPage />, { wrapper: createWrapper() });

    // Set a search filter first
    const searchInput = screen.getByPlaceholderText('Search by title or author...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    fireEvent.submit(searchInput.closest('form')!);

    // Force re-render to simulate the state update
    rerender(<BookListPage />);

    expect(screen.getByRole('heading', { name: 'No books found' })).toBeInTheDocument();
    expect(screen.getByText('No books match your search criteria. Try adjusting your filters.')).toBeInTheDocument();
  });

  it('trims whitespace from search input', () => {
    const mockBooks = [createMockBook()];
    mockUseBooks.mockImplementation(() => createSuccessQuery(mockBooks));

    render(<BookListPage />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText('Search by title or author...');
    fireEvent.change(searchInput, { target: { value: '  test  ' } });
    fireEvent.submit(searchInput.closest('form')!);

    expect(mockUseBooks).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'test'
      })
    );
  });

  it('clears search when input is empty', () => {
    const mockBooks = [createMockBook()];
    mockUseBooks.mockImplementation(() => createSuccessQuery(mockBooks));

    render(<BookListPage />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText('Search by title or author...');
    fireEvent.change(searchInput, { target: { value: '   ' } });
    fireEvent.submit(searchInput.closest('form')!);

    expect(mockUseBooks).toHaveBeenCalledWith(
      expect.objectContaining({
        search: undefined
      })
    );
  });
});