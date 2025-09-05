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
  Configuration,
  BookStatsResponse,
} from '../generated/api';
import type { PaginatedResponse } from '../types/PaginatedResponse';
import { formatIso8601ForDisplay } from '../utils/dateUtils';

// Create API instance with proper base URL configuration
const configuration = new Configuration({
  basePath: 'http://localhost:5000',
});
const booksApi = new BooksApi(configuration);

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
  return useQuery({
    queryKey: booksKeys.list(filters),
    queryFn: async (): Promise<PaginatedResponse<Book>> => {
      const response = await booksApi.apiBooksGet(
        filters.genres,
        filters.rating,
        filters.search,
        filters.sortBy,
        filters.sortDirection,
        filters.page,
        filters.pageSize
      );

      return response.data as unknown as PaginatedResponse<Book>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnReconnect: false, // Prevent refetch on reconnect
    placeholderData: previousData => previousData, // Keep previous data while fetching
  });
};

// Custom hook for fetching a single book
export const useBook = (id: string): UseQueryResult<Book, Error> => {
  return useQuery({
    queryKey: booksKeys.detail(id),
    queryFn: async (): Promise<Book> => {
      const response = await booksApi.apiBooksIdGet(id);
      return response.data;
    },
    enabled: !!id,
  });
};

// Custom hook for fetching book statistics
export const useBookStats = (): UseQueryResult<BookStatsResponse, Error> => {
  return useQuery({
    queryKey: booksKeys.stats(),
    queryFn: async (): Promise<BookStatsResponse> => {
      const response = await booksApi.apiBooksStatsGet();
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes for stats
  });
};

// Custom hook for creating a book
export const useCreateBook = (): UseMutationResult<
  Book,
  Error,
  CreateBookRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookData: CreateBookRequest): Promise<Book> => {
      const response = await booksApi.apiBooksPost(bookData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch books queries
      void queryClient.invalidateQueries({ queryKey: booksKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: booksKeys.stats() });
    },
  });
};

// Custom hook for updating a book
export const useUpdateBook = (): UseMutationResult<
  Book,
  Error,
  { id: string; bookData: UpdateBookRequest }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      bookData,
    }: {
      id: string;
      bookData: UpdateBookRequest;
    }): Promise<Book> => {
      const response = await booksApi.apiBooksIdPut(id, bookData);
      return response.data;
    },
    onSuccess: updatedBook => {
      // Invalidate and refetch books queries
      void queryClient.invalidateQueries({ queryKey: booksKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: booksKeys.detail(updatedBook.id!),
      });
      void queryClient.invalidateQueries({ queryKey: booksKeys.stats() });
    },
  });
};

// Custom hook for deleting a book
export const useDeleteBook = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await booksApi.apiBooksIdDelete(id);
    },
    onSuccess: () => {
      // Invalidate and refetch books queries
      void queryClient.invalidateQueries({ queryKey: booksKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: booksKeys.stats() });
    },
  });
};

// Helper function to extract genres from book
export const getBookGenres = (book: Book): string[] => {
  return book.bookGenres?.map(bg => bg.genreName ?? '') ?? [];
};

// Helper function to format date - now handles ISO 8601 format properly
export const formatDate = (dateString: string): string => {
  // Use the new ISO 8601 utility for consistent formatting
  return formatIso8601ForDisplay(dateString, { year: 'numeric', month: 'long', day: 'numeric' });
};

// Helper function to format rating stars
export const formatRating = (rating: number): string => {
  if (rating < 0) {
    throw new Error(`Invalid count value: ${rating}`);
  }
  const filledStars = Math.min(rating, 5);
  const emptyStars = rating > 5 ? 1 : Math.max(5 - rating, 0);
  return '★'.repeat(filledStars) + '☆'.repeat(emptyStars);
};
