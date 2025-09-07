import { Configuration } from '../generated/api';

/**
 * Centralized API configuration with optional JWT token support
 */
export const getApiConfiguration = (token?: string | null): Configuration => {
  // The generated API client already includes '/api' in its paths
  // In development: Use empty basePath so '/api/Books' works with Vite proxy
  // In production: Use the full API URL from environment variable
  const basePath = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
  
  const config = new Configuration({
    basePath,
  });

  // Add Authorization header if token is provided
  if (token) {
    config.baseOptions = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  return config;
};

/**
 * API base URL for direct fetch calls (used by AuthService)
 */
export const getApiBaseUrl = (): string => {
  // AuthService manually constructs URLs, so it needs the base path
  // In development: Use empty string so AuthService can use '/api/Auth'
  // In production: Use the full API URL from environment variable
  return (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
};