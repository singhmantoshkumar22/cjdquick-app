import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
}

export interface HttpResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export class HttpClient {
  private client: AxiosInstance;
  private retries: number;
  private retryDelay: number;
  public readonly baseURL: string;

  constructor(config: HttpClientConfig) {
    this.baseURL = config.baseURL;
    this.retries = config.retries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[HTTP] Response ${response.status} from ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`[HTTP] Error from ${error.config?.url}:`, error.message);
        return Promise.reject(error);
      }
    );
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retriesLeft: number = this.retries
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retriesLeft === 0) {
        throw error;
      }

      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;

      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw error;
      }

      console.log(`[HTTP] Retrying... ${retriesLeft} attempts left`);
      await this.sleep(this.retryDelay * (this.retries - retriesLeft + 1));
      return this.executeWithRetry(fn, retriesLeft - 1);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    try {
      const response = await this.executeWithRetry(() =>
        this.client.get<T>(url, config)
      );
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    try {
      const response = await this.executeWithRetry(() =>
        this.client.post<T>(url, data, config)
      );
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    try {
      const response = await this.executeWithRetry(() =>
        this.client.put<T>(url, data, config)
      );
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    try {
      const response = await this.executeWithRetry(() =>
        this.client.patch<T>(url, data, config)
      );
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<HttpResponse<T>> {
    try {
      const response = await this.executeWithRetry(() =>
        this.client.delete<T>(url, config)
      );
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError<T>(error: unknown): HttpResponse<T> {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;

    return {
      success: false,
      error: axiosError.response?.data?.message ||
             axiosError.response?.data?.error ||
             axiosError.message ||
             'Unknown error',
      statusCode: axiosError.response?.status,
    };
  }

  // Update headers dynamically (for token refresh)
  setHeader(key: string, value: string): void {
    this.client.defaults.headers.common[key] = value;
  }

  // Remove header
  removeHeader(key: string): void {
    delete this.client.defaults.headers.common[key];
  }
}

// Factory function for creating HTTP clients
export function createHttpClient(config: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}
