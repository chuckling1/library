import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { GenreFilterProvider } from '../contexts/GenreFilterContext';
import StatsPage from './StatsPage';
import * as useBooks from '../hooks/useBooks';

// Mock the hooks module
vi.mock('../hooks/useBooks', () => ({
  useBookStats: vi.fn(),
  useBooksStats: vi.fn(),
  useBooks: vi.fn(),
  formatRating: vi.fn(
    (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating)
  ),
}));

// Mock recharts components
vi.mock('recharts', () => ({
  BarChart: ({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactElement => <div data-testid="bar-chart">{children}</div>,
  Bar: (): React.ReactElement => <div data-testid="bar" />,
  XAxis: (): React.ReactElement => <div data-testid="x-axis" />,
  YAxis: (): React.ReactElement => <div data-testid="y-axis" />,
  CartesianGrid: (): React.ReactElement => <div data-testid="cartesian-grid" />,
  Tooltip: (): React.ReactElement => <div data-testid="tooltip" />,
  ResponsiveContainer: ({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactElement => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactElement => <div data-testid="pie-chart">{children}</div>,
  Pie: (): React.ReactElement => <div data-testid="pie" />,
  Cell: (): React.ReactElement => <div data-testid="cell" />,
  Legend: (): React.ReactElement => <div data-testid="legend" />,
}));

const createWrapper = (): React.FC<{ children: React.ReactNode }> => {
  return ({ children }: { children: React.ReactNode }): React.ReactElement => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <GenreFilterProvider>{children}</GenreFilterProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };
};

describe('StatsPage', () => {
  let mockUseBookStats: ReturnType<typeof vi.fn>;
  let mockUseBooks: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUseBookStats = vi.mocked(useBooks.useBooksStats);
    mockUseBooks = vi.mocked(useBooks.useBooks);
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseBookStats.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as never);

    mockUseBooks.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as never);

    render(<StatsPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading statistics...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseBookStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    } as never);

    mockUseBooks.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as never);

    render(<StatsPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Error Loading Statistics')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Failed to load library statistics. Please refresh the page to try again.'
      )
    ).toBeInTheDocument();
  });

  it('renders empty state when no stats', () => {
    mockUseBookStats.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as never);

    mockUseBooks.mockReturnValue({
      data: {
        items: [],
        page: 1,
        pageSize: 20,
        totalPages: 0,
        totalItems: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      isLoading: false,
      error: null,
    } as never);

    render(<StatsPage />, { wrapper: createWrapper() });

    expect(screen.getByText('No Statistics Available')).toBeInTheDocument();
    expect(
      screen.getByText('No data available to generate statistics.')
    ).toBeInTheDocument();
  });

  it('renders complete stats dashboard with data', async () => {
    const mockStats = {
      totalBooks: 25,
      averageRating: 4.2,
      genreDistribution: [
        { genre: 'Fantasy', count: 10, averageRating: 4.5 },
        { genre: 'Science Fiction', count: 8, averageRating: 4.0 },
        { genre: 'Mystery', count: 7, averageRating: 3.8 },
      ],
    };

    const mockRecentBooks = [
      {
        id: '1',
        title: 'Test Book 1',
        author: 'Test Author 1',
        rating: 5,
        bookGenres: [{ genreName: 'Fantasy' }],
      },
      {
        id: '2',
        title: 'Test Book 2',
        author: 'Test Author 2',
        rating: 4,
        bookGenres: [{ genreName: 'Sci-Fi' }],
      },
    ];

    mockUseBookStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    } as never);

    mockUseBooks.mockReturnValue({
      data: {
        items: mockRecentBooks,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: mockRecentBooks.length,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      isLoading: false,
      error: null,
    } as never);

    render(<StatsPage />, { wrapper: createWrapper() });

    // Check overview cards
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument(); // Total books
      expect(screen.getByText('4.2')).toBeInTheDocument(); // Average rating
      expect(screen.getByText('3')).toBeInTheDocument(); // Unique genres
      expect(screen.getAllByText('Fantasy').length).toBeGreaterThan(0); // Top genre appears in multiple places
    });

    // Check chart elements are rendered (there are multiple charts)
    expect(
      screen.getAllByTestId('responsive-container').length
    ).toBeGreaterThan(0);
    expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);

    // Check recent books section
    expect(screen.getByText('Recently Added Books')).toBeInTheDocument();
    expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    expect(screen.getByText('Test Author 1')).toBeInTheDocument();

    // Check detailed stats table
    expect(screen.getByText('Detailed Genre Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Science Fiction')).toBeInTheDocument();
    expect(screen.getByText('Mystery')).toBeInTheDocument();

    // Check for interactive instructions
    expect(
      screen.getByText(/Click charts to filter books/)
    ).toBeInTheDocument();
  });

  it('handles chart type switching', async () => {
    const mockStats = {
      totalBooks: 10,
      averageRating: 4.0,
      genreDistribution: [{ genre: 'Fantasy', count: 5, averageRating: 4.0 }],
    };

    mockUseBookStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    } as never);

    mockUseBooks.mockReturnValue({
      data: {
        items: [],
        page: 1,
        pageSize: 20,
        totalPages: 0,
        totalItems: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      isLoading: false,
      error: null,
    } as never);

    render(<StatsPage />, { wrapper: createWrapper() });

    // Initially bar chart should be active for genre distribution (use getAllByText for multiple buttons)
    await waitFor(() => {
      const barButtons = screen.getAllByText('📊 Bar');
      expect(barButtons[0]).toHaveClass('active'); // Genre chart bar button
    });

    // Click pie chart button for genre distribution
    const pieButtons = screen.getAllByText('🥧 Pie');
    expect(pieButtons.length).toBeGreaterThan(0);

    act(() => {
      fireEvent.click(pieButtons[0]!); // Click first pie button (genre distribution)
    });

    await waitFor(() => {
      const pieButtonsAfter = screen.getAllByText('🥧 Pie');
      const barButtonsAfter = screen.getAllByText('📊 Bar');
      expect(pieButtonsAfter[0]).toHaveClass('active');
      expect(barButtonsAfter[0]).not.toHaveClass('active');
    });
  });

  it('displays interactive chart instructions', () => {
    const mockStats = {
      totalBooks: 5,
      averageRating: 3.0,
      genreDistribution: [{ genre: 'Fantasy', count: 5, averageRating: 4.0 }],
    };

    mockUseBookStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    } as never);

    mockUseBooks.mockReturnValue({
      data: {
        items: [],
        page: 1,
        pageSize: 20,
        totalPages: 0,
        totalItems: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      isLoading: false,
      error: null,
    } as never);

    render(<StatsPage />, { wrapper: createWrapper() });

    expect(
      screen.getByText(/Click charts to filter books/)
    ).toBeInTheDocument();
  });

  it('handles empty genre distribution gracefully', () => {
    const mockStats = {
      totalBooks: 5,
      averageRating: 4.0,
      genreDistribution: [],
    };

    mockUseBookStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    } as never);

    mockUseBooks.mockReturnValue({
      data: {
        items: [],
        page: 1,
        pageSize: 20,
        totalPages: 0,
        totalItems: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      isLoading: false,
      error: null,
    } as never);

    render(<StatsPage />, { wrapper: createWrapper() });

    expect(screen.getByText('No genre data available')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Unique genres count
  });
});
