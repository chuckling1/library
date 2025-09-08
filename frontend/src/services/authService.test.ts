import { authService } from './authService';
import axios from 'axios';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('calls login endpoint with correct parameters', async () => {
      // Arrange
      const loginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockResponse = {
        email: 'test@example.com',
        message: 'Login successful',
      };

      vi.mocked(mockedAxios.post).mockResolvedValueOnce({
        data: mockResponse,
      } as any);

      // Act
      const result = await authService.login(loginRequest);

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/Auth/login',
        loginRequest,
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error when login fails', async () => {
      // Arrange
      const loginRequest = { email: 'test@example.com', password: 'wrong' };
      vi.mocked(mockedAxios.post).mockRejectedValueOnce(
        new Error('Unauthorized')
      );

      // Act & Assert
      await expect(authService.login(loginRequest)).rejects.toThrow(
        'Unauthorized'
      );
    });
  });

  describe('register', () => {
    it('calls register endpoint with correct parameters', async () => {
      // Arrange
      const registerRequest = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };
      const mockResponse = {
        email: 'test@example.com',
        message: 'Registration successful',
      };

      vi.mocked(mockedAxios.post).mockResolvedValueOnce({
        data: mockResponse,
      } as any);

      // Act
      const result = await authService.register(registerRequest);

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/Auth/register',
        registerRequest,
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error when registration fails', async () => {
      // Arrange
      const registerRequest = {
        email: 'invalid-email',
        password: 'pass',
        confirmPassword: 'different',
      };
      vi.mocked(mockedAxios.post).mockRejectedValueOnce(
        new Error('Bad Request')
      );

      // Act & Assert
      await expect(authService.register(registerRequest)).rejects.toThrow(
        'Bad Request'
      );
    });
  });

  describe('logout', () => {
    it('calls logout endpoint to clear httpOnly cookies', async () => {
      // Arrange
      vi.mocked(mockedAxios.post).mockResolvedValueOnce({ data: {} } as any);

      // Act
      await authService.logout();

      // Assert
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/Auth/logout',
        {},
        { withCredentials: true }
      );
    });

    it('throws error when logout fails', async () => {
      // Arrange
      vi.mocked(mockedAxios.post).mockRejectedValueOnce(
        new Error('Server Error')
      );

      // Act & Assert
      await expect(authService.logout()).rejects.toThrow('Server Error');
    });
  });
});
