import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useBooks } from '../hooks/useBooks';
import { useGenreFilter } from '../hooks/useGenreFilter';
import { useGenreDistribution } from '../hooks/useGenreDistribution';
import { getBookGenres } from '../hooks/useBooks';
import './GenreFilter.scss';

type SortType = 'popular' | 'alphabetical';
type SortDirection = 'asc' | 'desc';

const GenreFilter: React.FC = () => {
  const { data: paginatedResponse } = useBooks({});
  const { activeGenres, toggleGenre, clearGenres, isGenreActive } =
    useGenreFilter();
  const { genreDistribution } = useGenreDistribution();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [needsExpansion, setNeedsExpansion] = useState<boolean>(false);
  const [sortType, setSortType] = useState<SortType>('popular');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const genresContainerRef = useRef<HTMLDivElement>(null);

  // Extract and sort genres with selected genres first
  const allGenres = useMemo(() => {
    let availableGenres: string[];

    // Get available genres from distribution or fallback to books
    if (genreDistribution.length === 0) {
      const books = paginatedResponse?.items ?? [];
      if (books.length === 0) return [];

      const genreSet = new Set<string>();
      books.forEach(book => {
        const bookGenres = getBookGenres(book);
        if (Array.isArray(bookGenres)) {
          bookGenres.forEach(genre => {
            if (genre && typeof genre === 'string' && genre.trim()) {
              genreSet.add(genre.trim());
            }
          });
        }
      });
      availableGenres = Array.from(genreSet);
    } else {
      // Use genre distribution data
      availableGenres = genreDistribution
        .filter(gc => gc.genre?.trim())
        .map(gc => gc.genre!.trim());
    }

    // Separate selected and unselected genres
    const selectedGenres = availableGenres.filter(genre =>
      activeGenres.includes(genre)
    );
    const unselectedGenres = availableGenres.filter(
      genre => !activeGenres.includes(genre)
    );

    // Sort selected genres (always alphabetically for consistency when selected)
    selectedGenres.sort((a, b) => a.localeCompare(b));

    // Sort unselected genres based on type and direction
    if (sortType === 'popular' && genreDistribution.length > 0) {
      // Create a map for quick count lookup
      const countMap = new Map(
        genreDistribution
          .filter(gc => gc.genre?.trim())
          .map(gc => [gc.genre!.trim(), gc.count ?? 0])
      );

      unselectedGenres.sort((a, b) => {
        const countA = countMap.get(a) ?? 0;
        const countB = countMap.get(b) ?? 0;
        if (countA !== countB) {
          // Primary sort by popularity (count)
          if (sortDirection === 'desc') {
            return countB - countA; // Most popular first (higher count first)
          } else {
            return countA - countB; // Least popular first (lower count first)
          }
        }
        // Secondary sort: alphabetical (always ascending for ties in popularity)
        return a.localeCompare(b);
      });
    } else {
      // Sort alphabetically
      unselectedGenres.sort((a, b) => {
        const comparison = a.localeCompare(b);
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    // Return selected genres first, then unselected
    const finalGenres = [...selectedGenres, ...unselectedGenres];

    return finalGenres;
  }, [
    paginatedResponse,
    genreDistribution,
    sortType,
    sortDirection,
    activeGenres,
  ]);

  // Detect overflow by measuring actual container height
  useEffect(() => {
    const checkOverflow = (): void => {
      if (!genresContainerRef.current || allGenres.length === 0) {
        setNeedsExpansion(false);
        return;
      }

      const container = genresContainerRef.current;

      // Always measure in collapsed state to determine if toggle is needed
      const wasExpanded = isExpanded;
      if (wasExpanded) {
        container.classList.remove('genre-filter__pills--expanded');
      }

      const computedStyle = getComputedStyle(container);
      const maxHeight = parseFloat(computedStyle.maxHeight);

      // Temporarily expand to measure full height
      const originalMaxHeight = container.style.maxHeight;
      container.style.maxHeight = 'none';
      const fullHeight = container.scrollHeight;
      container.style.maxHeight = originalMaxHeight;

      // Restore expanded state if it was expanded
      if (wasExpanded) {
        container.classList.add('genre-filter__pills--expanded');
      }

      setNeedsExpansion(fullHeight > maxHeight);
    };

    checkOverflow();

    // Recheck on window resize
    window.addEventListener('resize', checkOverflow);
    return (): void => {
      window.removeEventListener('resize', checkOverflow);
    };
  }, [allGenres, isExpanded]);

  const handleGenreToggle = (genre: string): void => {
    toggleGenre(genre);
  };

  const handleClearAll = (): void => {
    clearGenres();
  };

  const handleToggleExpansion = (): void => {
    setIsExpanded(prev => !prev);
  };

  const handleSortDirectionToggle = (): void => {
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="genre-filter">
      <div className="genre-filter__header">
        <label className="genre-filter__label">Genres</label>
        <div className="genre-filter__controls">
          <div className="genre-filter__sort-controls">
            <div className="genre-filter__sort-type-toggle">
              <button
                type="button"
                onClick={() => {
                  if (sortType !== 'popular') {
                    setSortType('popular');
                    setSortDirection('desc');
                  }
                }}
                className={`genre-filter__toggle-option genre-filter__toggle-option--left ${
                  sortType === 'popular'
                    ? 'genre-filter__toggle-option--active'
                    : ''
                }`}
                title="Sort by popularity (book count)"
              >
                📊 Popular
              </button>
              <button
                type="button"
                onClick={() => {
                  if (sortType !== 'alphabetical') {
                    setSortType('alphabetical');
                    setSortDirection('asc');
                  }
                }}
                className={`genre-filter__toggle-option genre-filter__toggle-option--right ${
                  sortType === 'alphabetical'
                    ? 'genre-filter__toggle-option--active'
                    : ''
                }`}
                title="Sort alphabetically"
              >
                🔤 A-Z
              </button>
            </div>
            <button
              type="button"
              onClick={handleSortDirectionToggle}
              className="genre-filter__direction-toggle"
              title={`Sort direction: ${sortDirection === 'desc' ? 'Descending' : 'Ascending'}. Click to toggle.`}
            >
              {sortDirection === 'desc' ? '↓' : '↑'}
            </button>
          </div>
          <button
            type="button"
            onClick={handleClearAll}
            className={`genre-filter__clear ${activeGenres.length === 0 ? 'genre-filter__clear--hidden' : ''}`}
            style={{
              visibility: activeGenres.length > 0 ? 'visible' : 'hidden',
            }}
          >
            Clear ({activeGenres.length})
          </button>
        </div>
      </div>

      {allGenres.length > 0 ? (
        <div className="genre-filter__container">
          <div
            ref={genresContainerRef}
            className={`genre-filter__pills ${isExpanded ? 'genre-filter__pills--expanded' : ''}`}
          >
            {allGenres.map(genre => (
              <button
                key={genre}
                type="button"
                className={`genre-filter__pill ${isGenreActive(genre) ? 'genre-filter__pill--active' : ''}`}
                onClick={() => handleGenreToggle(genre)}
                aria-label={`${isGenreActive(genre) ? 'Remove' : 'Add'} ${genre} filter`}
              >
                {genre}
              </button>
            ))}
          </div>
          {needsExpansion && (
            <button
              className="genre-filter__toggle"
              onClick={handleToggleExpansion}
              aria-label={isExpanded ? 'Show fewer genres' : 'Show more genres'}
            >
              {isExpanded ? 'Show Less ▲' : 'Show More ▼'}
            </button>
          )}
        </div>
      ) : (
        <div className="genre-filter__empty">No genres available</div>
      )}
    </div>
  );
};

export default GenreFilter;
