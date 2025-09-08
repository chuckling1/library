import { Configuration } from '../generated/api';

/**
 * Centralized API configuration with secure httpOnly cookie authentication
 * SECURITY: Uses JWT tokens via httpOnly cookies - no JavaScript token access needed
 */
export const getApiConfiguration = (): Configuration => {
  // The generated API client already includes '/api' in its paths
  // In development: Use empty basePath so '/api/Books' works with Vite proxy
  // In production: Use the full API URL from environment variable
  
  // CRITICAL FIX: Always use empty basePath in Docker development to route through Vite proxy
  // This ensures consistent cookie domain handling (localhost:3000 for both auth and API calls)
  const basePath = '';

  // Environment variable configuration working correctly

  const config = new Configuration({
    basePath,
  });

  // SECURITY: JWT tokens are automatically included via httpOnly cookies
  config.baseOptions = {
    credentials: 'include', // Send httpOnly cookies with all API requests
  };

  return config;
};

/**
 * API base URL for direct fetch calls (used by AuthService)
 */
export const getApiBaseUrl = (): string => {
  // AuthService manually constructs URLs, so it needs the base path
  // In development: Use empty string so AuthService can use '/api/Auth'
  // In production: Use the full API URL from environment variable
  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
  
  // Environment variable configuration working correctly
  
  return baseUrl;
};
