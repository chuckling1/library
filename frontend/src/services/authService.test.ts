import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from './authService';

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token Storage', () => {
    it('should store and retrieve token from localStorage', () => {
      // Arrange
      const token = 'test.token.here';
      localStorage.setItem('token', token);

      // Act
      const retrievedToken = authService.getToken();

      // Assert
      expect(retrievedToken).toBe(token);
    });

    it('should return null when no token exists', () => {
      // Act
      const retrievedToken = authService.getToken();

      // Assert
      expect(retrievedToken).toBeNull();
    });
  });

  describe('Token Validation', () => {
    it('should return false for null token', () => {
      // Act
      const isAuthenticated = authService.isAuthenticated();

      // Assert
      expect(isAuthenticated).toBe(false);
    });

    it('should return false for malformed token (wrong number of parts)', () => {
      // Arrange
      localStorage.setItem('token', 'invalid.token');

      // Act
      const isAuthenticated = authService.isAuthenticated();

      // Assert
      expect(isAuthenticated).toBe(false);
    });

    it('should return false for token with empty payload', () => {
      // Arrange
      localStorage.setItem('token', 'header..signature');

      // Act
      const isAuthenticated = authService.isAuthenticated();

      // Assert
      expect(isAuthenticated).toBe(false);
    });

    it('should return false for token with invalid base64 payload', () => {
      // Arrange
      localStorage.setItem('token', 'header.invalid-base64!@#.signature');

      // Act
      const isAuthenticated = authService.isAuthenticated();

      // Assert
      expect(isAuthenticated).toBe(false);
    });

    it('should return false for expired token', () => {
      // Arrange - Create an expired token
      const expiredPayload = {
        'exp': Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        'iat': Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
      };
      const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;
      localStorage.setItem('token', expiredToken);

      // Act
      const isAuthenticated = authService.isAuthenticated();

      // Assert
      expect(isAuthenticated).toBe(false);
    });

    it('should return true for valid unexpired token', () => {
      // Arrange - Create a valid token
      const validPayload = {
        'exp': Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        'iat': Math.floor(Date.now() / 1000),
      };
      const validToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;
      localStorage.setItem('token', validToken);

      // Act
      const isAuthenticated = authService.isAuthenticated();

      // Assert
      expect(isAuthenticated).toBe(true);
    });

    it('should handle token without exp claim gracefully', () => {
      // Arrange - Token without expiration claim
      const payloadWithoutExp = {
        'iat': Math.floor(Date.now() / 1000),
        'sub': 'user123',
      };
      const token = `header.${btoa(JSON.stringify(payloadWithoutExp))}.signature`;
      localStorage.setItem('token', token);

      // Act
      const isAuthenticated = authService.isAuthenticated();

      // Assert
      expect(isAuthenticated).toBe(false); // Should default to false when no exp claim
    });

    it('should handle token with malformed JSON payload gracefully', () => {
      // Arrange - Token with invalid JSON in payload
      const invalidJsonToken = `header.${btoa('{ invalid json }')}.signature`;
      localStorage.setItem('token', invalidJsonToken);

      // Act
      const isAuthenticated = authService.isAuthenticated();

      // Assert
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('Token Edge Cases', () => {
    it('should handle token that expires exactly now', () => {
      // Arrange - Token that expires at current time
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresNowPayload = {
        'exp': currentTime,
        'iat': currentTime - 3600,
      };
      const token = `header.${btoa(JSON.stringify(expiresNowPayload))}.signature`;
      localStorage.setItem('token', token);

      // Act
      const isAuthenticated = authService.isAuthenticated();

      // Assert
      expect(isAuthenticated).toBe(false); // Should be false when exp <= current time
    });

    it('should handle token that expires in 1 second', () => {
      // Arrange - Token that expires in 1 second
      const expiresInOneSecPayload = {
        'exp': Math.floor(Date.now() / 1000) + 1,
        'iat': Math.floor(Date.now() / 1000),
      };
      const token = `header.${btoa(JSON.stringify(expiresInOneSecPayload))}.signature`;
      localStorage.setItem('token', token);

      // Act
      const isAuthenticated = authService.isAuthenticated();

      // Assert
      expect(isAuthenticated).toBe(true); // Should be true when exp > current time
    });
  });

  describe('Logout', () => {
    it('should remove token and user from localStorage', () => {
      // Arrange
      localStorage.setItem('token', 'test.token.here');
      localStorage.setItem('user', '{"email":"test@example.com"}');

      // Act
      authService.logout();

      // Assert
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});