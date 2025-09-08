import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  BooksApi,
  Book,
  CreateBookRequest,
  UpdateBookRequest,
  BookStatsResponse,
} from '../generated/api';
import type { PaginatedResponse } from '../types/PaginatedResponse';
import { formatIso8601ForDisplay } from '../utils/dateUtils';
import { getApiConfiguration } from '../config/apiConfig';
import { useAuth } from './useAuth';

// Create authenticated API instance (uses httpOnly cookies automatically)
const createBooksApi = (): BooksApi => {
  const configuration = getApiConfiguration();
  return new BooksApi(configuration);
};

// Query key factory
export const booksKeys = {
  all: ['books'] as const,
  lists: () => [...booksKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...booksKeys.lists(), filters] as const,
  details: () => [...booksKeys.all, 'detail'] as const,
  detail: (id: string) => [...booksKeys.details(), id] as const,
  stats: () => [...booksKeys.all, 'stats'] as const,
};

// Books query parameters interface
export interface BooksFilters {
  genres?: string[];
  rating?: number;
  search?: string;
  sortBy?: 'title' | 'author' | 'publishedDate' | 'rating' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

// Custom hook for fetching books with filters (returns paginated response)
export const useBooks = (
  filters: BooksFilters = {}
): UseQueryResult<PaginatedResponse<Book>, Error> => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: booksKeys.list(filters),
    queryFn: async (): Promise<PaginatedResponse<Book>> => {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }

      const booksApi = createBooksApi();

      const response = await booksApi.apiBooksGet(
        filters.genres,
        filters.rating,
        filters.search,
        filters.sortBy,
        filters.sortDirection,
        filters.page,
        filters.pageSize
      );

      // The API returns a paginated response object
      const paginatedData = response.data as unknown as {
        items: Book[];
        totalItems: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasPreviousPage: boolean;
        hasNextPage: boolean;
      };
      
      const books = paginatedData.items;

      // Extract pagination info from the response
      const totalCount = paginatedData.totalItems;
      const page = paginatedData.page;
      const pageSize = paginatedData.pageSize;
      const totalPages = paginatedData.totalPages;

      const processedBooks = books.map((book: Book) => {
        return {
          ...book,
          publishedDate: formatIso8601ForDisplay(book.publishedDate),
        };
      });

      return {
        items: processedBooks,
        page,
        pageSize,
        totalItems: totalCount,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      };
    },
    enabled: isAuthenticated,
  });
};

// Custom hook for fetching a single book by ID
export const useBook = (
  id: string | undefined
): UseQueryResult<Book, Error> => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: booksKeys.detail(id ?? ''),
    queryFn: async (): Promise<Book> => {
      if (!id) {
        throw new Error('Book ID is required');
      }

      const booksApi = createBooksApi();
      const response = await booksApi.apiBooksIdGet(id);

      return {
        ...response.data,
        publishedDate: formatIso8601ForDisplay(response.data.publishedDate),
      };
    },
    enabled: isAuthenticated && !!id,
  });
};

// Custom hook for creating a new book
export const useCreateBook = (): UseMutationResult<
  Book,
  Error,
  CreateBookRequest
> => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newBook: CreateBookRequest): Promise<Book> => {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }

      const booksApi = createBooksApi();
      const response = await booksApi.apiBooksPost(newBook);

      return {
        ...response.data,
        publishedDate: formatIso8601ForDisplay(response.data.publishedDate),
      };
    },
    onSuccess: () => {
      // Invalidate and refetch books list after successful creation
      void queryClient.invalidateQueries({ queryKey: booksKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: booksKeys.stats() });
    },
  });
};

// Custom hook for updating an existing book
export const useUpdateBook = (): UseMutationResult<
  Book,
  Error,
  { id: string; book: UpdateBookRequest }
> => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      book,
    }: {
      id: string;
      book: UpdateBookRequest;
    }): Promise<Book> => {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }

      const booksApi = createBooksApi();
      const response = await booksApi.apiBooksIdPut(id, book);

      return {
        ...response.data,
        publishedDate: formatIso8601ForDisplay(response.data.publishedDate),
      };
    },
    onSuccess: (_, { id }) => {
      // Invalidate and refetch books list and the specific book after successful update
      void queryClient.invalidateQueries({ queryKey: booksKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: booksKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: booksKeys.stats() });
    },
  });
};

// Custom hook for deleting a book
export const useDeleteBook = (): UseMutationResult<void, Error, string> => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }

      const booksApi = createBooksApi();
      await booksApi.apiBooksIdDelete(id);
    },
    onSuccess: (_, id) => {
      // Remove the deleted book from cache and refetch lists
      void queryClient.removeQueries({ queryKey: booksKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: booksKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: booksKeys.stats() });
    },
  });
};

// Custom hook for fetching books statistics
export const useBooksStats = (): UseQueryResult<BookStatsResponse, Error> => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: booksKeys.stats(),
    queryFn: async (): Promise<BookStatsResponse> => {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }

      const booksApi = createBooksApi();
      const response = await booksApi.apiBooksStatsGet();
      return response.data;
    },
    enabled: isAuthenticated,
  });
};

// Utility function to extract genre names from a book
export const getBookGenres = (book: Book): string[] => {
  if (!book.bookGenres || !Array.isArray(book.bookGenres)) {
    return [];
  }

  return book.bookGenres
    .map(bg => bg.genreName)
    .filter((genre): genre is string => Boolean(genre));
};

// Utility function to format date strings for display
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Utility function to format rating for display
export const formatRating = (rating: number | undefined): string => {
  if (typeof rating !== 'number') return 'Not Rated';
  return `${rating}/5`;
};

// Legacy alias for useBooksStats to maintain backwards compatibility
export const useBookStats = useBooksStats;
