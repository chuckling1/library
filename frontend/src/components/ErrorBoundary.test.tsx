import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock console.error to avoid noise in test output
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(/We've encountered an unexpected error/)
    ).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  it('shows retry button when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be shown
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();

    // Retry button should be available
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();

    // Button should be clickable (testing the handler exists)
    fireEvent.click(retryButton);
    // After clicking, the error boundary will attempt to re-render children
    // In a real app, this would trigger a new render cycle
  });

  it('shows error details in development mode', () => {
    // Mock import.meta.env.DEV for this test
    const originalImportMeta = import.meta.env;
    // @ts-expect-error - mocking import.meta for test
    import.meta.env = { ...originalImportMeta, DEV: true };

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(
      screen.getByText('Error Details (Development Only)')
    ).toBeInTheDocument();

    // Restore original
    // @ts-expect-error - restoring import.meta for test
    import.meta.env = originalImportMeta;
  });

  it('uses custom fallback when provided', () => {
    const customFallback = (): React.ReactElement => (
      <div>Custom error message</div>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(
      screen.queryByText('Oops! Something went wrong')
    ).not.toBeInTheDocument();
  });

  it('logs error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('has proper accessibility attributes', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check that buttons are properly accessible
    const tryAgainButton = screen.getByText('Try Again');
    const reloadButton = screen.getByText('Reload Page');

    expect(tryAgainButton).toHaveAttribute('type', 'button');
    expect(reloadButton).toHaveAttribute('type', 'button');
  });
});
