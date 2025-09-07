/**
 * Utility functions for error handling and testing
 */

/**
 * Throws an error to test the error boundary
 * This is useful for development and testing purposes
 */
export const throwTestError = (): never => {
  throw new Error('Test error thrown intentionally');
};

/**
 * Handles unhandled promise rejections
 * This can be used to catch async errors that might not be caught by error boundaries
 */
export const setupGlobalErrorHandlers = (): void => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled promise rejection:', event.reason);
    
    // You could send this to a logging service
    // errorLoggingService.logError(event.reason);
    
    // Prevent the default behavior of logging to console
    // event.preventDefault();
  });

  // Handle other global errors
  window.addEventListener('error', (event) => {
    // eslint-disable-next-line no-console
    console.error('Global error:', event.error);
    
    // You could send this to a logging service
    // errorLoggingService.logError(event.error);
  });
};

/**
 * Error logging interface for future implementation
 * This can be extended to integrate with services like Sentry, LogRocket, etc.
 */
export interface ErrorLoggingService {
  logError: (error: Error, context?: Record<string, unknown>) => void;
  logInfo: (message: string, context?: Record<string, unknown>) => void;
}

/**
 * Mock error logging service
 * Replace with real implementation for production
 */
export const mockErrorLoggingService: ErrorLoggingService = {
  logError: (error: Error, context?: Record<string, unknown>) => {
    // eslint-disable-next-line no-console
    console.error('Error logged:', { error: error.message, stack: error.stack, context });
  },
  logInfo: (message: string, context?: Record<string, unknown>) => {
    // eslint-disable-next-line no-console
    console.info('Info logged:', { message, context });
  },
};