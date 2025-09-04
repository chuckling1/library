import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GenreFilterContextType {
  activeGenres: string[];
  toggleGenre: (genre: string) => void;
  clearGenres: () => void;
  isGenreActive: (genre: string) => boolean;
}

const GenreFilterContext = createContext<GenreFilterContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useGenreFilter = (): GenreFilterContextType => {
  const context = useContext(GenreFilterContext);
  if (!context) {
    throw new Error('useGenreFilter must be used within a GenreFilterProvider');
  }
  return context;
};

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