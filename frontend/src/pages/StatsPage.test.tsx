import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StatsPage from './StatsPage';
import * as useBooks from '../hooks/useBooks';

// Mock the hooks module
vi.mock('../hooks/useBooks', () => ({
  useBookStats: vi.fn(),
  useBooks: vi.fn(),
  formatRating: vi.fn((rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating))
}));

// Mock recharts components
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }): React.ReactElement => <div data-testid="bar-chart">{children}</div>,
  Bar: (): React.ReactElement => <div data-testid="bar" />,
  XAxis: (): React.ReactElement => <div data-testid="x-axis" />,
  YAxis: (): React.ReactElement => <div data-testid="y-axis" />,
  CartesianGrid: (): React.ReactElement => <div data-testid="cartesian-grid" />,
  Tooltip: (): React.ReactElement => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }): React.ReactElement => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }): React.ReactElement => <div data-testid="pie-chart">{children}</div>,
  Pie: (): React.ReactElement => <div data-testid="pie" />,
  Cell: (): React.ReactElement => <div data-testid="cell" />,
  Legend: (): React.ReactElement => <div data-testid="legend" />
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
        {children}
      </QueryClientProvider>
    );
  };
};

describe('StatsPage', () => {
  let mockUseBookStats: ReturnType<typeof vi.fn>;
  let mockUseBooks: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUseBookStats = vi.mocked(useBooks.useBookStats);
    mockUseBooks = vi.mocked(useBooks.useBooks);
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseBookStats.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn()
    } as never);

    mockUseBooks.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null
    } as never);

    render(<StatsPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading statistics...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const mockRefetch = vi.fn();
    mockUseBookStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      refetch: mockRefetch
    } as never);

    mockUseBooks.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null
    } as never);

    render(<StatsPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Error Loading Statistics')).toBeInTheDocument();
    expect(screen.getByText('Failed to load library statistics. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('renders empty state when no stats', () => {
    mockUseBookStats.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    } as never);

    mockUseBooks.mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    } as never);

    render(<StatsPage />, { wrapper: createWrapper() });

    expect(screen.getByText('No Statistics Available')).toBeInTheDocument();
    expect(screen.getByText('No data available to generate statistics.')).toBeInTheDocument();
  });

  it('renders complete stats dashboard with data', async () => {
    const mockStats = {
      totalBooks: 25,
      averageRating: 4.2,
      genreDistribution: [
        { genre: 'Fantasy', count: 10, averageRating: 4.5 },
        { genre: 'Science Fiction', count: 8, averageRating: 4.0 },
        { genre: 'Mystery', count: 7, averageRating: 3.8 }
      ]
    };

    const mockRecentBooks = [
      {
        id: '1',
        title: 'Test Book 1',
        author: 'Test Author 1',
        rating: 5,
        bookGenres: [{ genreName: 'Fantasy' }]
      },
      {
        id: '2', 
        title: 'Test Book 2',
        author: 'Test Author 2',
        rating: 4,
        bookGenres: [{ genreName: 'Sci-Fi' }]
      }
    ];

    mockUseBookStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    } as never);

    mockUseBooks.mockReturnValue({
      data: mockRecentBooks,
      isLoading: false,
      error: null
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
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);

    // Check recent books section
    expect(screen.getByText('Recently Added Books')).toBeInTheDocument();
    expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    expect(screen.getByText('Test Author 1')).toBeInTheDocument();

    // Check detailed stats table
    expect(screen.getByText('Detailed Genre Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Science Fiction')).toBeInTheDocument();
    expect(screen.getByText('Mystery')).toBeInTheDocument();
  });

  it('handles chart type switching', async () => {
    const mockStats = {
      totalBooks: 10,
      averageRating: 4.0,
      genreDistribution: [
        { genre: 'Fantasy', count: 5, averageRating: 4.0 }
      ]
    };

    mockUseBookStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    } as never);

    mockUseBooks.mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    } as never);

    render(<StatsPage />, { wrapper: createWrapper() });

    // Initially bar chart should be active
    await waitFor(() => {
      expect(screen.getByText('📊 Bar')).toHaveClass('active');
    });

    // Click pie chart button
    const pieButton = screen.getByText('🥧 Pie');
    pieButton.click();

    await waitFor(() => {
      expect(screen.getByText('🥧 Pie')).toHaveClass('active');
      expect(screen.getByText('📊 Bar')).not.toHaveClass('active');
    });
  });

  it('handles refresh button click', () => {
    const mockRefetch = vi.fn();
    const mockStats = {
      totalBooks: 5,
      averageRating: 3.0,
      genreDistribution: []
    };

    mockUseBookStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
      refetch: mockRefetch
    } as never);

    mockUseBooks.mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    } as never);

    render(<StatsPage />, { wrapper: createWrapper() });

    const refreshButton = screen.getByText('🔄 Refresh');
    refreshButton.click();

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('handles empty genre distribution gracefully', () => {
    const mockStats = {
      totalBooks: 5,
      averageRating: 4.0,
      genreDistribution: []
    };

    mockUseBookStats.mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    } as never);

    mockUseBooks.mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    } as never);

    render(<StatsPage />, { wrapper: createWrapper() });

    expect(screen.getByText('No genre data available')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Unique genres count
  });
});