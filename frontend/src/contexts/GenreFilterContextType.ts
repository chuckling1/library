import { createContext } from 'react';

export interface GenreFilterContextType {
  activeGenres: string[];
  toggleGenre: (genre: string) => void;
  clearGenres: () => void;
  isGenreActive: (genre: string) => boolean;
}

export const GenreFilterContext = createContext<GenreFilterContextType | undefined>(undefined);