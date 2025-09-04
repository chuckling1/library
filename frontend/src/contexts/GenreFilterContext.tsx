import React, { useState, ReactNode } from 'react';
import { GenreFilterContext, GenreFilterContextType } from './GenreFilterContextType';

interface GenreFilterProviderProps {
  children: ReactNode;
}

export const GenreFilterProvider: React.FC<GenreFilterProviderProps> = ({ children }) => {
  const [activeGenres, setActiveGenres] = useState<string[]>([]);

  const toggleGenre = (genre: string): void => {
    setActiveGenres(prev => {
      const isActive = prev.includes(genre);
      if (isActive) {
        return prev.filter(g => g !== genre);
      } else {
        return [...prev, genre];
      }
    });
  };

  const clearGenres = (): void => {
    setActiveGenres([]);
  };

  const isGenreActive = (genre: string): boolean => {
    return activeGenres.includes(genre);
  };

  const value: GenreFilterContextType = {
    activeGenres,
    toggleGenre,
    clearGenres,
    isGenreActive
  };

  return (
    <GenreFilterContext.Provider value={value}>
      {children}
    </GenreFilterContext.Provider>
  );
};