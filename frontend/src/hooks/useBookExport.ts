import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { booksKeys } from './useBooks';
import { getApiBaseUrl } from '../config/apiConfig';
import { useAuth } from '../contexts/AuthContext';

export const useBookExport = (): {
  exportBooks: () => Promise<void>;
  getButtonLabel: (hasBooks: boolean) => string;
} => {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const exportBooks = useCallback(async (): Promise<void> => {
    try {
      const headers: Record<string, string> = {
        'Accept': 'text/csv',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/BulkImport/export/books`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get the filename from the Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'library_export.csv';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^";\s]+)"?/);
        if (filenameMatch?.[1]) {
          filename = filenameMatch[1];
        }
      }

      // Get the CSV content
      const blob = await response.blob();
      
      // Check if we have any books by looking at cache
      const cachedData = queryClient.getQueryData(booksKeys.lists());
      const hasBooks = cachedData && Array.isArray(cachedData) && cachedData.length > 0;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = hasBooks ? filename : 'library_import_template.csv';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to export books:', error);
      alert('Failed to export books. Please try again.');
    }
  }, [queryClient, token]);

  const getButtonLabel = useCallback((hasBooks: boolean): string => {
    return hasBooks ? 'Export Collection' : 'Download Import Template';
  }, []);

  return {
    exportBooks,
    getButtonLabel,
  };
};