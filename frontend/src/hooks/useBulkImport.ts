import React, { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getApiBaseUrl } from '../config/apiConfig';

interface BulkImportResult {
  jobId: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  status: string;
  errorSummary?: string;
}

interface BulkImportState {
  isImporting: boolean;
  result: BulkImportResult | null;
  error: string | null;
}

export const useBulkImport = (): {
  isImporting: boolean;
  result: BulkImportResult | null;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImportBooks: () => void;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
} => {
  const [state, setState] = useState<BulkImportState>({
    isImporting: false,
    result: null,
    error: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const bulkImportMutation = useMutation({
    mutationFn: async (file: File): Promise<BulkImportResult> => {
      const formData = new FormData();
      formData.append('file', file);

      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Create a custom request using fetch since the generated client might not handle FormData correctly
      const response = await fetch(`${getApiBaseUrl()}/api/BulkImport/books`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as BulkImportResult;
    },
    onSuccess: (result) => {
      setState(prev => ({ ...prev, result, error: null }));
      
      // Invalidate books queries to refresh the list
      void queryClient.invalidateQueries({ queryKey: ['books'] });
      
      // Show success/error notification
      if (result.errorRows === 0) {
        alert(`Successfully imported ${result.validRows} books!`);
      } else {
        alert(`Import completed: ${result.validRows} successful, ${result.errorRows} errors. ${result.errorSummary ?? ''}`);
      }
    },
    onError: (error: Error) => {
      setState(prev => ({ ...prev, error: error.message, result: null }));
      alert(`Import failed: ${error.message}`);
    },
    onSettled: () => {
      setState(prev => ({ ...prev, isImporting: false }));
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
  });

  const handleImportBooks = useCallback((): void => {
    if (state.isImporting) return;
    
    setState(prev => ({ ...prev, error: null, result: null }));
    fileInputRef.current?.click();
  }, [state.isImporting]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file.');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File is too large. Maximum size allowed is 10MB.');
      return;
    }

    setState(prev => ({ ...prev, isImporting: true, error: null, result: null }));
    
    try {
      await bulkImportMutation.mutateAsync(file);
    } catch {
      // Error handling is done in mutation callbacks
    }
  }, [bulkImportMutation]);

  return {
    isImporting: state.isImporting,
    result: state.result,
    error: state.error,
    fileInputRef,
    handleImportBooks,
    handleFileSelect,
  };
};