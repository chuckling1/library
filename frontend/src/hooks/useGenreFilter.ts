import { useContext } from 'react';
import {
  GenreFilterContext,
  GenreFilterContextType,
} from '../contexts/GenreFilterContextType';

export const useGenreFilter = (): GenreFilterContextType => {
  const context = useContext(GenreFilterContext);
  if (!context) {
    throw new Error('useGenreFilter must be used within a GenreFilterProvider');
  }
  return context;
};
