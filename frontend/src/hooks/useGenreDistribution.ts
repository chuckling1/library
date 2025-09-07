import { useState, useEffect } from 'react';
import { BooksApi, GenreCount } from '../generated/api';
import { getApiConfiguration } from '../config/apiConfig';
import { useAuth } from '../contexts/AuthContext';

interface UseGenreDistributionResult {
  genreDistribution: GenreCount[];
  isLoading: boolean;
  error: string | null;
}

export const useGenreDistribution = (): UseGenreDistributionResult => {
  const { token } = useAuth();
  const [genreDistribution, setGenreDistribution] = useState<GenreCount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenreDistribution = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const configuration = getApiConfiguration(token);
        const api = new BooksApi(configuration);
        const response = await api.apiBooksStatsGet();

        setGenreDistribution(response.data.genreDistribution ?? []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch genre distribution:', err);
        setError('Failed to load genre statistics');
        setGenreDistribution([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchGenreDistribution();
  }, [token]);

  return {
    genreDistribution,
    isLoading,
    error,
  };
};
