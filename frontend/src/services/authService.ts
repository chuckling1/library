import axios from 'axios';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';
import { logger } from '../utils/logger';

class AuthService {
  private readonly baseUrl: string;

  constructor() {
    // Use relative URL to work with Vite proxy configuration
    // In development, Vite will proxy /api requests to the backend
    this.baseUrl = '/api/Auth';
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(`${this.baseUrl}/login`, request, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

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
        payload: { email: request.email, error: error instanceof Error ? error.message : 'Unknown error' },
      });
      throw error;
    }
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(`${this.baseUrl}/register`, request, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

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
        payload: { email: request.email, error: error instanceof Error ? error.message : 'Unknown error' },
      });
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    logger.info('User logged out', {
      appLayer: 'Frontend-UI',
      sourceContext: 'AuthService',
      functionName: 'logout',
      payload: {},
    });
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Simple token expiration check - decode JWT payload
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3 || !tokenParts[1]) {
        return false;
      }
      const payload = JSON.parse(atob(tokenParts[1])) as { exp?: number };
      const currentTime = Math.floor(Date.now() / 1000);
      return (payload.exp ?? 0) > currentTime;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();