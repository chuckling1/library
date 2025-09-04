import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookStats, useBooks, formatRating } from '../hooks/useBooks';
import { useGenreFilter } from '../hooks/useGenreFilter';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import './StatsPage.scss';

const StatsPage: React.FC = () => {
  const { data: stats, isLoading, error } = useBookStats();
  const { data: recentBooks } = useBooks({ sortBy: 'createdAt', sortDirection: 'desc', pageSize: 5 });
  const navigate = useNavigate();
  const { clearGenres, toggleGenre } = useGenreFilter();
  
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [ratingChartType, setRatingChartType] = useState<'bar' | 'pie'>('bar');

  // Process genre data for charts with better presentation (top 12 for readability)
  const chartData = useMemo(() => {
    if (!stats?.genreDistribution) return [];
    
    // Sort by count descending and take top 12 for better chart readability
    const sorted = [...stats.genreDistribution]
      .filter(genre => genre.genre && genre.count && genre.count > 0)
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
      .slice(0, 12);

    return sorted.map((genre, index) => ({
      genre: genre.genre ?? 'Unknown',
      count: genre.count ?? 0,
      averageRating: genre.averageRating ?? 0,
      // Color for pie chart
      fill: CHART_COLORS[index % CHART_COLORS.length]
    }));
  }, [stats?.genreDistribution]);

  // Process ALL genre data for the detailed table (no filtering)
  const allGenreData = useMemo(() => {
    if (!stats?.genreDistribution) return [];
    
    // Show ALL genres, sorted by count descending
    return [...stats.genreDistribution]
      .filter(genre => genre.genre && genre.count && genre.count > 0)
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
      .map(genre => ({
        genre: genre.genre ?? 'Unknown',
        count: genre.count ?? 0,
        averageRating: genre.averageRating ?? 0
      }));
  }, [stats?.genreDistribution]);

  // Rating distribution data
  const ratingData = useMemo(() => {
    if (!stats?.genreDistribution) return [];
    
    const ratingCounts = [1, 2, 3, 4, 5].map(rating => {
      const count = stats.genreDistribution?.filter(g => 
        Math.round(g.averageRating ?? 0) === rating
      ).length ?? 0;
      return { rating: `${rating} Star${rating !== 1 ? 's' : ''}`, count, fill: RATING_COLORS[rating - 1] };
    });

    return ratingCounts.filter(r => r.count > 0);
  }, [stats?.genreDistribution]);

  // Handle genre chart clicks - navigate to books with genre filter
  const handleGenreClick = (genre: string): void => {
    void clearGenres();
    void toggleGenre(genre);
    void navigate('/books');
  };

  // Handle rating chart clicks - navigate to books with rating filter
  const handleRatingClick = (rating: number): void => {
    void clearGenres();
    void navigate('/books', { state: { rating } });
  };

  if (isLoading) {
    return (
      <div className="stats-page">
        <div className="loading-container">
          <div className="loading-spinner">Loading statistics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-page">
        <div className="error-container">
          <h2>Error Loading Statistics</h2>
          <p>Failed to load library statistics. Please refresh the page to try again.</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="stats-page">
        <div className="empty-state">
          <h2>No Statistics Available</h2>
          <p>No data available to generate statistics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-page">
      <div className="page-header">
        <div className="title-section">
          <h2>Library Statistics</h2>
          <p className="subtitle">Comprehensive overview of your book collection • Click charts to filter books</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.totalBooks ?? 0}</h3>
            <p className="stat-label">Total Books</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3 className="stat-number">{(stats.averageRating ?? 0).toFixed(1)}</h3>
            <p className="stat-label">Average Rating</p>
            <p className="stat-detail">{formatRating(Math.round(stats.averageRating ?? 0))}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.genreDistribution?.length ?? 0}</h3>
            <p className="stat-label">Unique Genres</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📖</div>
          <div className="stat-content">
            <h3 className="stat-number">
              {stats.genreDistribution?.find(g => 
                g.count === Math.max(...(stats.genreDistribution?.map(x => x.count ?? 0) ?? []))
              )?.genre ?? 'N/A'}
            </h3>
            <p className="stat-label">Top Genre</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Genre Distribution Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Genre Distribution</h3>
            <div className="chart-controls">
              <button 
                className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                onClick={() => setChartType('bar')}
              >
                📊 Bar
              </button>
              <button 
                className={`chart-type-btn ${chartType === 'pie' ? 'active' : ''}`}
                onClick={() => setChartType('pie')}
              >
                🥧 Pie
              </button>
            </div>
          </div>
          
          <div className="chart-content">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                {chartType === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="genre" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [
                        `${value} book${value !== 1 ? 's' : ''}`,
                        'Count'
                      ]}
                      labelFormatter={(label: string) => `Genre: ${label} (click to filter books)`}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#4f46e5" 
                      radius={[4, 4, 0, 0]}
                      onClick={(data: { genre?: string }) => {
                        if (data.genre) {
                          handleGenreClick(data.genre);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ genre, count, percent }) => 
                        `${genre}: ${count} (${(percent * 100).toFixed(1)}%)`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                      onClick={(_, index) => {
                        const genre = chartData[index]?.genre;
                        if (genre) {
                          handleGenreClick(genre);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [
                        `${value} books (click to filter)`, 
                        'Count'
                      ]}
                    />
                  </PieChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">
                <p>No genre data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Rating Distribution Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Rating Distribution by Genre</h3>
            <div className="chart-controls">
              <button 
                className={`chart-type-btn ${ratingChartType === 'bar' ? 'active' : ''}`}
                onClick={() => setRatingChartType('bar')}
              >
                📊 Bar
              </button>
              <button 
                className={`chart-type-btn ${ratingChartType === 'pie' ? 'active' : ''}`}
                onClick={() => setRatingChartType('pie')}
              >
                🥧 Pie
              </button>
            </div>
          </div>
          <div className="chart-content">
            {ratingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                {ratingChartType === 'bar' ? (
                  <BarChart data={ratingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value} genre${value !== 1 ? 's' : ''} (click to filter books)`, 'Count']}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]}
                      onClick={(data: { rating?: string }) => {
                        const ratingString = data.rating;
                        if (ratingString) {
                          const ratingMatch = ratingString.match(/^(\d+)/);
                          if (ratingMatch?.[1]) {
                            handleRatingClick(parseInt(ratingMatch[1]));
                          }
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={ratingData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ rating, count, percent }) => 
                        `${rating}: ${count} (${(percent * 100).toFixed(1)}%)`
                      }
                      outerRadius={100}
                      fill="#10b981"
                      dataKey="count"
                      onClick={(_, index) => {
                        const ratingString = ratingData[index]?.rating;
                        if (ratingString) {
                          const ratingMatch = ratingString.match(/^(\d+)/);
                          if (ratingMatch?.[1]) {
                            handleRatingClick(parseInt(ratingMatch[1]));
                          }
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {ratingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value} genres (click to filter books)`, 'Count']}
                    />
                  </PieChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">
                <p>No rating data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recently Added Books */}
      {recentBooks && recentBooks.length > 0 && (
        <div className="recent-books-section">
          <h3>Recently Added Books</h3>
          <div className="recent-books-grid">
            {recentBooks.slice(0, 5).map((book) => (
              <div key={book.id} className="recent-book-card">
                <h4 className="book-title">{book.title}</h4>
                <p className="book-author">{book.author}</p>
                <div className="book-rating">
                  {formatRating(book.rating ?? 0)} ({book.rating}/5)
                </div>
                <div className="book-genres">
                  {book.bookGenres?.map((bg, index) => (
                    <span key={index} className="genre-tag">
                      {bg.genreName}
                    </span>
                  )) ?? <span className="no-genres">No genres</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Stats Table */}
      <div className="detailed-stats-section">
        <h3>Detailed Genre Breakdown</h3>
        <div className="stats-table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Genre</th>
                <th>Books</th>
                <th>Avg Rating</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {allGenreData.map((genre, index) => (
                <tr 
                  key={index} 
                  onClick={() => handleGenreClick(genre.genre)}
                  style={{ cursor: 'pointer' }}
                  title="Click to filter books by this genre"
                >
                  <td className="genre-cell">{genre.genre}</td>
                  <td className="count-cell">{genre.count}</td>
                  <td className="rating-cell">
                    {formatRating(Math.round(genre.averageRating))} ({genre.averageRating.toFixed(1)})
                  </td>
                  <td className="percentage-cell">
                    {((genre.count / (stats.totalBooks ?? 1)) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Color palettes for charts
const CHART_COLORS = [
  '#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#6366f1', '#d946ef'
];

const RATING_COLORS = [
  '#ef4444', // 1 star - red
  '#f97316', // 2 stars - orange  
  '#f59e0b', // 3 stars - yellow
  '#84cc16', // 4 stars - light green
  '#10b981'  // 5 stars - green
];

export default StatsPage;