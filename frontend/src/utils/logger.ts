/**
 * Application logger with environment-based configuration
 * Provides consistent logging interface while avoiding ESLint warnings
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private isDevelopment: boolean = import.meta.env.DEV;

  /**
   * Log error messages
   * In development: outputs to console.error
   * In production: could be extended to send to logging service
   */
  error(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.error(message, ...args);
    }
    // TODO: Add production logging service integration here
  }

  /**
   * Log warning messages
   * In development: outputs to console.warn
   * In production: could be extended to send to logging service
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.warn(message, ...args);
    }
    // TODO: Add production logging service integration here
  }

  /**
   * Log informational messages
   * In development: outputs to console.info
   * In production: could be extended to send to logging service
   */
  info(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.info(message, ...args);
    }
    // TODO: Add production logging service integration here
  }

  /**
   * Log debug messages
   * In development: outputs to console.debug
   * In production: typically disabled
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.debug(message, ...args);
    }
  }

  /**
   * Generic log method with level specification
   */
  log(level: LogLevel, message: string, ...args: unknown[]): void {
    switch (level) {
      case 'error':
        this.error(message, ...args);
        break;
      case 'warn':
        this.warn(message, ...args);
        break;
      case 'info':
        this.info(message, ...args);
        break;
      case 'debug':
        this.debug(message, ...args);
        break;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for use in other files
export type { LogLevel };
