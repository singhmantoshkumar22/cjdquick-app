/**
 * Centralized Error Logging Utility
 *
 * This module provides consistent error logging across the application.
 * Can be extended to integrate with external monitoring services like Sentry.
 */

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  companyId?: string;
  metadata?: Record<string, unknown>;
}

interface LoggedError {
  message: string;
  stack?: string;
  digest?: string;
  timestamp: string;
  context?: ErrorContext;
}

class ErrorLogger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  /**
   * Log an error with context
   */
  logError(error: Error & { digest?: string }, context?: ErrorContext): void {
    const loggedError: LoggedError = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      context,
    };

    // Always log to console in development
    if (this.isDevelopment) {
      console.error("[ErrorLogger]", loggedError);
    } else {
      // In production, log minimal info to console
      console.error("[Error]", {
        message: error.message,
        digest: error.digest,
        timestamp: loggedError.timestamp,
      });
    }

    // TODO: Integrate with external monitoring service (e.g., Sentry)
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: context });
    // }
  }

  /**
   * Log an API error response
   */
  logApiError(
    endpoint: string,
    method: string,
    status: number,
    errorBody?: unknown,
    context?: ErrorContext
  ): void {
    const apiError = {
      type: "API_ERROR",
      endpoint,
      method,
      status,
      errorBody,
      timestamp: new Date().toISOString(),
      context,
    };

    if (this.isDevelopment) {
      console.error("[API Error]", apiError);
    } else {
      console.error("[API Error]", {
        endpoint,
        method,
        status,
        timestamp: apiError.timestamp,
      });
    }

    // TODO: Send to monitoring service
  }

  /**
   * Log a warning (non-critical issue)
   */
  logWarning(message: string, context?: ErrorContext): void {
    const warning = {
      type: "WARNING",
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (this.isDevelopment) {
      console.warn("[Warning]", warning);
    }
  }

  /**
   * Log user action for debugging (development only)
   */
  logDebug(action: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.debug("[Debug]", { action, data, timestamp: new Date().toISOString() });
    }
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Convenience exports
export const logError = errorLogger.logError.bind(errorLogger);
export const logApiError = errorLogger.logApiError.bind(errorLogger);
export const logWarning = errorLogger.logWarning.bind(errorLogger);
export const logDebug = errorLogger.logDebug.bind(errorLogger);
