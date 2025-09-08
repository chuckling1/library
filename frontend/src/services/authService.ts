import axios from 'axios';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';
import { logger } from '../utils/logger';

class AuthService {
  private readonly baseUrl: string;

  constructor() {
    // Use proxy-relative URL for consistent cookie domain handling
    // This ensures auth requests go through Vite proxy like other API calls
    this.baseUrl = '/api/Auth';
    
    // URL construction working correctly - using proxy for consistency
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const loginUrl = `${this.baseUrl}/login`;
      
      // Login request to backend API
      
      // SECURITY ENHANCEMENT: Include credentials for httpOnly cookie support (Phase 2)
      const response = await axios.post<AuthResponse>(
        loginUrl,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true, // Send and receive httpOnly cookies
        }
      );

      logger.info('User logged in successfully', {
        appLayer: 'Frontend-UI',
        sourceContext: 'AuthService',
        functionName: 'login',
        payload: { email: request.email },
      });

      return response.data;
    } catch (error) {
      logger.error('Login failed', {
        appLayer: 'Frontend-UI',
        sourceContext: 'AuthService',
        functionName: 'login',
        payload: {
          email: request.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    try {
      // SECURITY ENHANCEMENT: Include credentials for httpOnly cookie support (Phase 2)
      const response = await axios.post<AuthResponse>(
        `${this.baseUrl}/register`,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true, // Send and receive httpOnly cookies
        }
      );

      logger.info('User registered successfully', {
        appLayer: 'Frontend-UI',
        sourceContext: 'AuthService',
        functionName: 'register',
        payload: { email: request.email },
      });

      return response.data;
    } catch (error) {
      logger.error('Registration failed', {
        appLayer: 'Frontend-UI',
        sourceContext: 'AuthService',
        functionName: 'register',
        payload: {
          email: request.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // SECURITY: Call backend logout to clear httpOnly cookies (JWT authentication)
      await axios.post(
        `${this.baseUrl}/logout`,
        {},
        {
          withCredentials: true, // Include httpOnly cookies for authentication
        }
      );

      logger.info('Backend logout successful - httpOnly cookies cleared', {
        appLayer: 'Frontend-UI',
        sourceContext: 'AuthService',
        functionName: 'logout',
        payload: { cookiesCleared: true },
      });
    } catch (error) {
      logger.warn('Backend logout failed', {
        appLayer: 'Frontend-UI',
        sourceContext: 'AuthService',
        functionName: 'logout',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error; // Re-throw so caller can handle
    }
  }
}

export const authService = new AuthService();
