import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from './AuthContext';
import { useAuth } from '../hooks/useAuth';

// Mock the auth service
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
  },
}));

// Mock API config
vi.mock('../config/apiConfig', () => ({
  getApiBaseUrl: vi.fn(() => 'http://localhost:5000'),
}));

// Mock fetch  
Object.defineProperty(globalThis, 'fetch', {
  value: vi.fn(),
  writable: true,
});

// Test component that uses auth
const AuthTestComponent: React.FC = () => {
  const { isAuthenticated, isLoading, userEmail } = useAuth();
  
  if (isLoading) return <div data-testid="loading">Loading...</div>;
  if (isAuthenticated) return <div data-testid="authenticated">Authenticated: {userEmail}</div>;
  return <div data-testid="not-authenticated">Not authenticated</div>;
};

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockReset();
  });

  it('starts in loading state and checks authentication status', async () => {
    // Mock unauthenticated response
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    render(
      <TestWrapper>
        <AuthTestComponent />
      </TestWrapper>
    );

    // Should start with loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Should resolve to not authenticated
    await waitFor(() => {
      expect(screen.getByTestId('not-authenticated')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/Auth/me', {
      credentials: 'include',
    });
  });

  it('authenticates when valid cookie exists', async () => {
    // Mock authenticated response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ email: 'test@example.com' }),
    } as unknown as Response);

    render(
      <TestWrapper>
        <AuthTestComponent />
      </TestWrapper>
    );

    // Should start with loading
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Should resolve to authenticated with email
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toBeInTheDocument();
      expect(screen.getByText('Authenticated: test@example.com')).toBeInTheDocument();
    });
  });

  it('handles authentication check errors gracefully', async () => {
    // Mock network error
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    render(
      <TestWrapper>
        <AuthTestComponent />
      </TestWrapper>
    );

    // Should start with loading
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Should resolve to not authenticated on error
    await waitFor(() => {
      expect(screen.getByTestId('not-authenticated')).toBeInTheDocument();
    });
  });
});