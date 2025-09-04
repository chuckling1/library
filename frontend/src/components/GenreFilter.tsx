import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useBooks } from '../hooks/useBooks';
import { useGenreFilter } from '../contexts/GenreFilterContext';
import { getBookGenres } from '../hooks/useBooks';
import './GenreFilter.scss';

const GenreFilter: React.FC = () => {
  const { data: books } = useBooks({});
  const { activeGenres, toggleGenre, clearGenres, isGenreActive } = useGenreFilter();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [needsExpansion, setNeedsExpansion] = useState<boolean>(false);
  const genresContainerRef = useRef<HTMLDivElement>(null);

  // Extract all unique genres from the book collection
  const allGenres = useMemo(() => {
    if (!books || books.length === 0) return [];

    const genreSet = new Set<string>();
    books.forEach(book => {
      const bookGenres = getBookGenres(book);
      bookGenres.forEach(genre => {
        if (genre.trim()) {
          genreSet.add(genre.trim());
        }
      });
    });

    return Array.from(genreSet).sort();
  }, [books]);

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

  return (
    <div className="genre-filter">
      <div className="genre-filter__header">
        <label className="genre-filter__label">
          Genres
        </label>
        <button
          type="button"
          onClick={handleClearAll}
          className={`genre-filter__clear ${activeGenres.length === 0 ? 'genre-filter__clear--hidden' : ''}`}
          style={{ visibility: activeGenres.length > 0 ? 'visible' : 'hidden' }}
        >
          Clear ({activeGenres.length})
        </button>
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
        <div className="genre-filter__empty">
          No genres available
        </div>
      )}
    </div>
  );
};

export default GenreFilter;