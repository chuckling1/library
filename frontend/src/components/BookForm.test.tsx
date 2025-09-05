import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BookForm from './BookForm';

// Mock functions
const mockCreateBookMutateAsync = vi.fn();
const mockUpdateBookMutateAsync = vi.fn();

// Mock the hooks and services
vi.mock('../hooks/useBooks', () => ({
  useCreateBook: (): {
    mutateAsync: typeof mockCreateBookMutateAsync;
    isPending: boolean;
  } => ({
    mutateAsync: mockCreateBookMutateAsync,
    isPending: false,
  }),
  useUpdateBook: (): {
    mutateAsync: typeof mockUpdateBookMutateAsync;
    isPending: boolean;
  } => ({
    mutateAsync: mockUpdateBookMutateAsync,
    isPending: false,
  }),
}));

vi.mock('../services/openLibraryService', () => ({
  openLibraryService: {
    getBookSuggestions: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}): React.ReactElement => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('BookForm - Date Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show error when published date is empty', async (): Promise<void> => {
    // Arrange
    render(
      <TestWrapper>
        <BookForm isEditing={false} />
      </TestWrapper>
    );

    // Act - Fill all required fields except published date
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Book' },
    });
    fireEvent.change(screen.getByLabelText(/author/i), {
      target: { value: 'Test Author' },
    });
    fireEvent.change(screen.getByLabelText(/genres/i), {
      target: { value: 'Fiction' },
    });
    fireEvent.click(screen.getByText('Add Genre'));
    fireEvent.click(screen.getByText(/add book/i));

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText('Published date is required')
      ).toBeInTheDocument();
    });
  });

  it('should show error when published date is invalid', async (): Promise<void> => {
    // Arrange
    render(
      <TestWrapper>
        <BookForm isEditing={false} />
      </TestWrapper>
    );

    // Act - Fill form with invalid date
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Book' },
    });
    fireEvent.change(screen.getByLabelText(/author/i), {
      target: { value: 'Test Author' },
    });
    fireEvent.change(screen.getByLabelText(/genres/i), {
      target: { value: 'Fiction' },
    });
    fireEvent.click(screen.getByText('Add Genre'));

    // Set an invalid date value directly
    const dateInput = screen.getByLabelText(/published date/i);
    Object.defineProperty(dateInput, 'value', {
      get: (): string => 'invalid-date',
      configurable: true,
    });
    fireEvent.change(dateInput, { target: { value: 'invalid-date' } });
    fireEvent.click(screen.getByText(/add book/i));

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText('Published date must be a valid date')
      ).toBeInTheDocument();
    });
  });

  it('should show error when published date is in the future', async (): Promise<void> => {
    // Arrange
    render(
      <TestWrapper>
        <BookForm isEditing={false} />
      </TestWrapper>
    );

    // Act - Fill form with future date (use a fixed future date to avoid timezone issues)
    const futureDateString = '2025-12-31'; // Fixed future date that will always be in the future

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Book' },
    });
    fireEvent.change(screen.getByLabelText(/author/i), {
      target: { value: 'Test Author' },
    });
    fireEvent.change(screen.getByLabelText(/genres/i), {
      target: { value: 'Fiction' },
    });
    fireEvent.click(screen.getByText('Add Genre'));

    fireEvent.change(screen.getByLabelText(/published date/i), {
      target: { value: futureDateString },
    });
    fireEvent.click(screen.getByText(/add book/i));

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText('Published date cannot be in the future')
      ).toBeInTheDocument();
    });
  });

  it('should accept valid past date', async (): Promise<void> => {
    // Arrange
    mockCreateBookMutateAsync.mockResolvedValueOnce({});

    render(
      <TestWrapper>
        <BookForm isEditing={false} />
      </TestWrapper>
    );

    // Act - Fill form with valid past date
    const pastDate = '2023-01-01';

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Book' },
    });
    fireEvent.change(screen.getByLabelText(/author/i), {
      target: { value: 'Test Author' },
    });
    fireEvent.change(screen.getByLabelText(/genres/i), {
      target: { value: 'Fiction' },
    });
    fireEvent.click(screen.getByText('Add Genre'));
    fireEvent.change(screen.getByLabelText(/published date/i), {
      target: { value: pastDate },
    });
    fireEvent.click(screen.getByText(/add book/i));

    // Assert - Form should submit without date validation errors
    await waitFor(() => {
      expect(mockCreateBookMutateAsync).toHaveBeenCalled();
    });

    // Should not show date validation errors
    expect(
      screen.queryByText('Published date is required')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Published date must be a valid date')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Published date cannot be in the future')
    ).not.toBeInTheDocument();
  });

  it('should accept today as a valid date', async (): Promise<void> => {
    // Arrange
    mockCreateBookMutateAsync.mockResolvedValueOnce({});

    render(
      <TestWrapper>
        <BookForm isEditing={false} />
      </TestWrapper>
    );

    // Act - Fill form with today's date
    const today = new Date().toISOString().split('T')[0];

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Book' },
    });
    fireEvent.change(screen.getByLabelText(/author/i), {
      target: { value: 'Test Author' },
    });
    fireEvent.change(screen.getByLabelText(/genres/i), {
      target: { value: 'Fiction' },
    });
    fireEvent.click(screen.getByText('Add Genre'));
    fireEvent.change(screen.getByLabelText(/published date/i), {
      target: { value: today },
    });
    fireEvent.click(screen.getByText(/add book/i));

    // Assert - Form should submit without date validation errors
    await waitFor(() => {
      expect(mockCreateBookMutateAsync).toHaveBeenCalled();
    });

    // Should not show date validation errors
    expect(
      screen.queryByText('Published date cannot be in the future')
    ).not.toBeInTheDocument();
  });

  it('should clear date error when user fixes invalid date', async (): Promise<void> => {
    // Arrange
    render(
      <TestWrapper>
        <BookForm isEditing={false} />
      </TestWrapper>
    );

    // Act - First, trigger validation error with future date
    const futureDateString = '2025-12-31'; // Fixed future date that will always be in the future

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Book' },
    });
    fireEvent.change(screen.getByLabelText(/author/i), {
      target: { value: 'Test Author' },
    });
    fireEvent.change(screen.getByLabelText(/genres/i), {
      target: { value: 'Fiction' },
    });
    fireEvent.click(screen.getByText('Add Genre'));

    fireEvent.change(screen.getByLabelText(/published date/i), {
      target: { value: futureDateString },
    });
    fireEvent.click(screen.getByText(/add book/i));

    // Verify error appears
    await waitFor(() => {
      expect(
        screen.getByText('Published date cannot be in the future')
      ).toBeInTheDocument();
    });

    // Then fix the date with a valid past date
    fireEvent.change(screen.getByLabelText(/published date/i), {
      target: { value: '2023-01-01' },
    });

    // Assert - Error should be cleared
    await waitFor(() => {
      expect(
        screen.queryByText('Published date cannot be in the future')
      ).not.toBeInTheDocument();
    });
  });
});
