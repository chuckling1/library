import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';
import { getApiBaseUrl } from '../config/apiConfig';
import { AuthContext, AuthContextType } from './AuthContextDefinition';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
}): React.JSX.Element => {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check authentication status via httpOnly cookies on mount
  useEffect(() => {
    const checkAuthStatus = async (): Promise<void> => {
      try {
        // Try to make an authenticated request to verify the httpOnly cookie
        const apiBaseUrl = getApiBaseUrl();
        const meUrl = `${apiBaseUrl}/api/Auth/me`;
        
        // Authentication status check
        
        const response = await fetch(meUrl, {
          credentials: 'include', // Include httpOnly cookies
        });

        if (response.ok) {
          const userData = (await response.json()) as { email: string };
          setUserEmail(userData.email);
          setIsAuthenticated(true);

          logger.info('Authentication restored via httpOnly cookie', {
            appLayer: 'Frontend-UI',
            sourceContext: 'AuthContext',
            functionName: 'checkAuthStatus',
            payload: { email: userData.email },
          });
        } else {
          // No valid authentication cookie
          setIsAuthenticated(false);
          setUserEmail(null);
        }
      } catch (error) {
        logger.info('No valid authentication found', {
          appLayer: 'Frontend-UI',
          sourceContext: 'AuthContext',
          functionName: 'checkAuthStatus',
          payload: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
        setIsAuthenticated(false);
        setUserEmail(null);
      } finally {
        setIsLoading(false);
      }
    };

    void checkAuthStatus();
  }, []);

  const login = async (request: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await authService.login(request);

      // SECURITY: httpOnly cookie is set automatically by the backend
      // No need to store tokens in JavaScript - they're secure in httpOnly cookies
      setUserEmail(response.email);
      setIsAuthenticated(true);

      // Clear React Query cache to ensure fresh data for the new user
      await queryClient.invalidateQueries();

      logger.info('Login successful', {
        appLayer: 'Frontend-UI',
        sourceContext: 'AuthContext',
        functionName: 'login',
        payload: { email: response.email },
      });
    } catch (error) {
      logger.error('Login failed in AuthContext', {
        appLayer: 'Frontend-UI',
        sourceContext: 'AuthContext',
        functionName: 'login',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (request: RegisterRequest): Promise<void> => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await authService.register(request);

      // SECURITY: httpOnly cookie is set automatically by the backend
      // No need to store tokens in JavaScript - they're secure in httpOnly cookies
      setUserEmail(response.email);
      setIsAuthenticated(true);

      // Clear React Query cache to ensure fresh data for the new user
      await queryClient.invalidateQueries();

      logger.info('Registration successful', {
        appLayer: 'Frontend-UI',
        sourceContext: 'AuthContext',
        functionName: 'register',
        payload: { email: response.email },
      });
    } catch (error) {
      logger.error('Registration failed in AuthContext', {
        appLayer: 'Frontend-UI',
        sourceContext: 'AuthContext',
        functionName: 'register',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // SECURITY: Call backend to clear httpOnly cookies (JWT authentication)
      await authService.logout();

      setUserEmail(null);
      setIsAuthenticated(false);

      // Clear React Query cache on logout to prevent data leakage
      queryClient.clear();

      logger.info('Logout completed', {
        appLayer: 'Frontend-UI',
        sourceContext: 'AuthContext',
        functionName: 'logout',
        payload: { cookiesCleared: true },
      });
    } catch (error) {
      logger.error('Logout error in AuthContext', {
        appLayer: 'Frontend-UI',
        sourceContext: 'AuthContext',
        functionName: 'logout',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Even if logout fails, clear local state for security
      setUserEmail(null);
      setIsAuthenticated(false);
      queryClient.clear();
    }
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    userEmail,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};