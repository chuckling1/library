import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  userEmail: string | null;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }): React.JSX.Element => {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = (): void => {
      try {
        const existingToken = authService.getToken();
        const isTokenValid = authService.isAuthenticated();

        if (existingToken && isTokenValid) {
          setToken(existingToken);
          setIsAuthenticated(true);
          
          // Extract user email from token payload
          const tokenParts = existingToken.split('.');
          if (tokenParts.length !== 3 || !tokenParts[1]) {
            throw new Error('Invalid JWT token format');
          }
          const payload = JSON.parse(atob(tokenParts[1])) as { 
            email?: string;
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string;
            sub?: string;
            exp?: number;
            iat?: number;
          };

          // === AUTH DEBUG ===
          // eslint-disable-next-line no-console
          console.log('=== AUTH INITIALIZATION DEBUG ===');
          // eslint-disable-next-line no-console
          console.log('Token:', existingToken.substring(0, 50) + '...');
          // eslint-disable-next-line no-console
          console.log('JWT Payload:', {
            userId: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? payload.sub,
            email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ?? payload.email,
            exp: payload.exp ? new Date(payload.exp * 1000) : 'N/A',
            iat: payload.iat ? new Date(payload.iat * 1000) : 'N/A',
          });

          // .NET uses fully qualified claim names
          const email = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ?? payload.email;
          setUserEmail(email ?? null);
          
          logger.info('Authentication restored from local storage', {
            appLayer: 'Frontend-UI',
            sourceContext: 'AuthContext',
            functionName: 'initializeAuth',
            payload: { email },
          });
        } else if (existingToken) {
          // Token exists but is invalid/expired
          authService.logout();
          logger.info('Expired token removed', {
            appLayer: 'Frontend-UI',
            sourceContext: 'AuthContext', 
            functionName: 'initializeAuth',
            payload: {},
          });
        }
      } catch (error) {
        logger.error('Error initializing authentication', {
          appLayer: 'Frontend-UI',
          sourceContext: 'AuthContext',
          functionName: 'initializeAuth',
          payload: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (request: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await authService.login(request);

      // === LOGIN AUTH DEBUG ===
      // eslint-disable-next-line no-console
      console.log('=== LOGIN AUTH DEBUG ===');
      // eslint-disable-next-line no-console
      console.log('Login Token:', response.token.substring(0, 50) + '...');
      
      // Decode and log JWT payload
      const tokenParts = response.token.split('.');
      if (tokenParts.length === 3 && tokenParts[1]) {
        const payload = JSON.parse(atob(tokenParts[1])) as {
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string;
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
          sub?: string;
          email?: string;
          exp?: number;
          iat?: number;
        };
        // eslint-disable-next-line no-console
        console.log('Login JWT Payload:', {
          userId: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? payload.sub,
          email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ?? payload.email,
          exp: payload.exp ? new Date(payload.exp * 1000) : 'N/A',
          iat: payload.iat ? new Date(payload.iat * 1000) : 'N/A',
        });
      }

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify({ email: response.email }));

      setToken(response.token);
      setUserEmail(response.email);
      setIsAuthenticated(true);

      // Clear React Query cache to ensure fresh data for the new user
      await queryClient.invalidateQueries();
      // eslint-disable-next-line no-console
      console.log('React Query cache invalidated after login');

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
        payload: { error: error instanceof Error ? error.message : 'Unknown error' },
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

      // === REGISTER AUTH DEBUG ===
      // eslint-disable-next-line no-console
      console.log('=== REGISTER AUTH DEBUG ===');
      // eslint-disable-next-line no-console
      console.log('Register Token:', response.token.substring(0, 50) + '...');
      
      // Decode and log JWT payload
      const tokenParts = response.token.split('.');
      if (tokenParts.length === 3 && tokenParts[1]) {
        const payload = JSON.parse(atob(tokenParts[1])) as {
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string;
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
          sub?: string;
          email?: string;
          exp?: number;
          iat?: number;
        };
        // eslint-disable-next-line no-console
        console.log('Register JWT Payload:', {
          userId: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? payload.sub,
          email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ?? payload.email,
          exp: payload.exp ? new Date(payload.exp * 1000) : 'N/A',
          iat: payload.iat ? new Date(payload.iat * 1000) : 'N/A',
        });
      }

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify({ email: response.email }));

      setToken(response.token);
      setUserEmail(response.email);
      setIsAuthenticated(true);

      // Clear React Query cache to ensure fresh data for the new user
      await queryClient.invalidateQueries();
      // eslint-disable-next-line no-console
      console.log('React Query cache invalidated after register');

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
        payload: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    authService.logout();
    setToken(null);
    setUserEmail(null);
    setIsAuthenticated(false);

    // Clear React Query cache on logout to prevent data leakage
    queryClient.clear();
    // eslint-disable-next-line no-console
    console.log('React Query cache cleared after logout');

    logger.info('Logout completed', {
      appLayer: 'Frontend-UI',
      sourceContext: 'AuthContext',
      functionName: 'logout',
      payload: {},
    });
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    token,
    userEmail,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};