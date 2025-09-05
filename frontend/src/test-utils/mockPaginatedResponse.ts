import type { PaginatedResponse } from '../types/PaginatedResponse';
import type { Book } from '../generated/api';

export const createMockPaginatedResponse = (
  books: Book[],
  page: number = 1,
  pageSize: number = 20,
  totalItems?: number
): PaginatedResponse<Book> => {
  const actualTotalItems = totalItems ?? books.length;
  const totalPages = Math.ceil(actualTotalItems / pageSize);

  return {
    items: books,
    page,
    pageSize,
    totalItems: actualTotalItems,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
};
