import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import type {
  Book,
  CreateBookRequest,
  UpdateBookRequest,
} from '../generated/api';
import {
  useBooks,
  useBook,
  useBooksStats,
  useCreateBook,
  useUpdateBook,
  useDeleteBook,
  getBookGenres,
  formatDate,
  formatRating,
  type BooksFilters,
} from './useBooks';

// Use vi.hoisted to create mocks that are hoisted to the top
const {
  mockApiBooksGet,
  mockApiBooksIdDelete,
  mockApiBooksIdGet,
  mockApiBooksIdPut,
  mockApiBooksPost,
  mockApiBooksStatsGet,
} = vi.hoisted(() => {
  const mocks = {
    mockApiBooksGet: vi.fn(),
    mockApiBooksIdDelete: vi.fn(),
    mockApiBooksIdGet: vi.fn(),
    mockApiBooksIdPut: vi.fn(),
    mockApiBooksPost: vi.fn(),
    mockApiBooksStatsGet: vi.fn(),
  };
  return mocks;
});

// Mock the API module
vi.mock('../generated/api', () => {
  return {
    BooksApi: vi.fn().mockImplementation(() => ({
      apiBooksGet: mockApiBooksGet,
      apiBooksIdDelete: mockApiBooksIdDelete,
      apiBooksIdGet: mockApiBooksIdGet,
      apiBooksIdPut: mockApiBooksIdPut,
      apiBooksPost: mockApiBooksPost,
      apiBooksStatsGet: mockApiBooksStatsGet,
    })),
    Configuration: vi.fn(),
  };
});

// Mock the auth context definition
vi.mock('../contexts/AuthContextDefinition', () => ({
  AuthContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

// Mock the auth hook
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    user: { id: '1', email: 'test@example.com' },
  })),
}));

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
  bookGenres: [
    { bookId: '123', genreName: 'Fiction' },
    { bookId: '123', genreName: 'Mystery' },
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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useBooks hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useBooks', () => {
    it('fetches books with default filters', async () => {
      const mockBooks = [
        createMockBook(),
        createMockBook({ id: '456', title: 'Another Book' }),
      ];
      const mockPaginatedResponse = {
        items: mockBooks,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: mockBooks.length,
        hasPreviousPage: false,
        hasNextPage: false,
      };
      mockApiBooksGet.mockResolvedValue({ data: mockPaginatedResponse });

      const { result } = renderHook(() => useBooks(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiBooksGet).toHaveBeenCalledWith(
        undefined, // genres
        undefined, // rating
        undefined, // search
        undefined, // sortBy
        undefined, // sortDirection
        undefined, // page
        undefined // pageSize
      );
      // The hook formats publishedDate and returns a PaginatedResponse
      const expectedResponse = {
        items: mockBooks.map(book => ({
          ...book,
          publishedDate: 'December 31, 2022', // formatIso8601ForDisplay('2023-01-01T00:00:00.000Z')
        })),
        page: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 2,
        hasPreviousPage: false,
        hasNextPage: false,
      };
      expect(result.current.data).toEqual(expectedResponse);
    });

    it('fetches books with custom filters', async () => {
      const filters: BooksFilters = {
        genres: ['Fiction'],
        rating: 4,
        search: 'test',
        sortBy: 'title',
        sortDirection: 'asc',
        page: 2,
        pageSize: 10,
      };

      mockApiBooksGet.mockResolvedValue({ data: [] });

      renderHook(() => useBooks(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockApiBooksGet).toHaveBeenCalledWith(
          ['Fiction'], // genres
          4, // rating
          'test', // search
          'title', // sortBy
          'asc', // sortDirection
          2, // page
          10 // pageSize
        );
      });
    });
  });

  describe('useBook', () => {
    it('fetches a single book by ID', async () => {
      const mockBook = createMockBook();
      mockApiBooksIdGet.mockResolvedValue({ data: mockBook });

      const { result } = renderHook(() => useBook('123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiBooksIdGet).toHaveBeenCalledWith('123');
      // The hook formats the publishedDate, so expect the formatted version
      const expectedBook = {
        ...mockBook,
        publishedDate: 'December 31, 2022', // formatIso8601ForDisplay('2023-01-01T00:00:00.000Z')
      };
      expect(result.current.data).toEqual(expectedBook);
    });

    it('is disabled when no ID is provided', () => {
      renderHook(() => useBook(''), {
        wrapper: createWrapper(),
      });

      expect(mockApiBooksIdGet).not.toHaveBeenCalled();
    });
  });

  describe('useBookStats', () => {
    it('fetches book statistics', async () => {
      const mockStats = { totalBooks: 100, averageRating: 4.2 };
      mockApiBooksStatsGet.mockResolvedValue({ data: mockStats });

      const { result } = renderHook(() => useBooksStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiBooksStatsGet).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockStats);
    });
  });

  describe('useCreateBook', () => {
    it('creates a new book', async () => {
      const createRequest: CreateBookRequest = {
        title: 'New Book',
        author: 'New Author',
        publishedDate: '2023-01-01T00:00:00.000Z',
        genres: ['Fiction'],
      };
      const createdBook = createMockBook(createRequest);

      mockApiBooksPost.mockResolvedValue({ data: createdBook });

      const { result } = renderHook(() => useCreateBook(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync(createRequest);

      expect(mockApiBooksPost).toHaveBeenCalledWith(createRequest);
    });
  });

  describe('useUpdateBook', () => {
    it('updates an existing book', async () => {
      const updateData = {
        id: '123',
        book: {
          title: 'Updated Book',
          author: 'Updated Author',
          publishedDate: '2023-01-01T00:00:00.000Z',
          genres: ['Fiction'],
        } as UpdateBookRequest,
      };
      const updatedBook = createMockBook({ id: '123', title: 'Updated Book' });

      mockApiBooksIdPut.mockResolvedValue({ data: updatedBook });

      const { result } = renderHook(() => useUpdateBook(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync(updateData);

      expect(mockApiBooksIdPut).toHaveBeenCalledWith('123', updateData.book);
    });
  });

  describe('useDeleteBook', () => {
    it('deletes a book', async () => {
      mockApiBooksIdDelete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteBook(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('123');

      expect(mockApiBooksIdDelete).toHaveBeenCalledWith('123');
    });
  });
});

describe('Helper functions', () => {
  describe('getBookGenres', () => {
    it('extracts genre names from book genres', () => {
      const book = createMockBook();
      const genres = getBookGenres(book);

      expect(genres).toEqual(['Fiction', 'Mystery']);
    });

    it('returns empty array when bookGenres is null', () => {
      const book = createMockBook({ bookGenres: null });
      const genres = getBookGenres(book);

      expect(genres).toEqual([]);
    });

    it('returns empty array when bookGenres is undefined', () => {
      const book = createMockBook({ bookGenres: undefined });
      const genres = getBookGenres(book);

      expect(genres).toEqual([]);
    });

    it('handles genres with null names', () => {
      const book = createMockBook({
        bookGenres: [
          { bookId: '123', genreName: 'Fiction' },
          { bookId: '123', genreName: null },
        ],
      });
      const genres = getBookGenres(book);

      expect(genres).toEqual(['Fiction']);
    });
  });

  describe('formatDate', () => {
    it('formats ISO date string to locale date', () => {
      const formatted = formatDate('2023-12-25T10:30:00.000Z');
      expect(formatted).toBe('December 25, 2023');
    });

    it('formats different date correctly', () => {
      const formatted = formatDate('2023-01-01T12:00:00.000Z');
      expect(formatted).toBe('January 1, 2023');
    });
  });

  describe('formatRating', () => {
    it('formats rating as numeric string', () => {
      expect(formatRating(0)).toBe('0/5');
      expect(formatRating(1)).toBe('1/5');
      expect(formatRating(2)).toBe('2/5');
      expect(formatRating(3)).toBe('3/5');
      expect(formatRating(4)).toBe('4/5');
      expect(formatRating(5)).toBe('5/5');
    });

    it('handles edge cases', () => {
      expect(formatRating(undefined)).toBe('Not Rated');
      expect(formatRating(6)).toBe('6/5');
    });
  });
});
