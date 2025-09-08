import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthContext, type AuthContextType } from '../contexts/AuthContext';

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
  },
}));

// Test component wrapper with mock auth context
const TestWrapper: React.FC<{ 
  children: React.ReactNode;
  authValue: AuthContextType;
}> = ({ children, authValue }) => {
  return (
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        {children}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

const TestContent: React.FC = () => <div data-testid="protected-content">Protected Content</div>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when authentication is loading', () => {
    const mockAuth: AuthContextType = {
      isAuthenticated: false,
      isLoading: true,
      userEmail: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    };

    render(
      <TestWrapper authValue={mockAuth}>
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('Authenticating...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders protected content when authenticated', () => {
    const mockAuth: AuthContextType = {
      isAuthenticated: true,
      isLoading: false,
      userEmail: 'test@example.com',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    };

    render(
      <TestWrapper authValue={mockAuth}>
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByText('Authenticating...')).not.toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    const mockAuth: AuthContextType = {
      isAuthenticated: false,
      isLoading: false,
      userEmail: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    };

    render(
      <TestWrapper authValue={mockAuth}>
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      </TestWrapper>
    );

    // Should not render the protected content
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByText('Authenticating...')).not.toBeInTheDocument();
    
    // Note: In a real test, you'd check that navigation to /login occurred
    // This would require more complex router testing setup
  });
});