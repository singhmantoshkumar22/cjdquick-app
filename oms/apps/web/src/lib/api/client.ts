/**
 * API Client Configuration
 *
 * Configures the generated OpenAPI client with:
 * - Base URL pointing to FastAPI backend
 * - JWT token authentication
 * - Request/response interceptors
 */

import { OpenAPI } from './generated';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cjdquick-api-vr4w.onrender.com';

// Token storage key
const TOKEN_KEY = 'auth_token';

/**
 * Get stored authentication token
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

/**
 * Set authentication token
 */
export function setAuthToken(token: string | null): void {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
}

/**
 * Clear authentication token
 */
export function clearAuthToken(): void {
  setAuthToken(null);
}

/**
 * Configure the API client with base URL and auth token
 */
export function configureApiClient(): void {
  // Set base URL
  OpenAPI.BASE = API_BASE_URL;

  // Set token resolver - called before each request
  OpenAPI.TOKEN = async () => {
    return getAuthToken() || '';
  };

  // Add response interceptor for error handling
  OpenAPI.interceptors.response.use((response: Response) => {
    // Handle 401 Unauthorized - clear token and redirect to login
    if (response.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        // Don't redirect if already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return response;
  });
}

// Auto-configure on import (client-side only)
if (typeof window !== 'undefined') {
  configureApiClient();
}

// Re-export the OpenAPI configuration
export { OpenAPI };

// Re-export all generated services and types
export * from './generated';
