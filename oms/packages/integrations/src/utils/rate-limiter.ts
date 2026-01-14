/**
 * Token Bucket Rate Limiter
 *
 * Implements rate limiting for API calls to external services.
 * Uses the token bucket algorithm which allows bursts while
 * maintaining a sustained rate limit.
 */

export interface RateLimiterConfig {
  /** Name for identification in logs */
  name: string;
  /** Maximum tokens in bucket (burst capacity) */
  maxTokens: number;
  /** Tokens added per second (sustained rate) */
  refillRate: number;
  /** Optional: Maximum queue size for waiting requests (default: 100) */
  maxQueueSize?: number;
  /** Optional: Maximum wait time in ms (default: 30000) */
  maxWaitTime?: number;
}

interface QueuedRequest {
  resolve: () => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private queue: QueuedRequest[] = [];
  private processing: boolean = false;

  private readonly name: string;
  private readonly maxTokens: number;
  private readonly refillRate: number;
  private readonly maxQueueSize: number;
  private readonly maxWaitTime: number;

  constructor(config: RateLimiterConfig) {
    this.name = config.name;
    this.maxTokens = config.maxTokens;
    this.refillRate = config.refillRate;
    this.maxQueueSize = config.maxQueueSize ?? 100;
    this.maxWaitTime = config.maxWaitTime ?? 30000;

    // Start with full bucket
    this.tokens = config.maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Acquire a token for making a request
   * Returns a promise that resolves when a token is available
   */
  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // No tokens available, queue the request
    if (this.queue.length >= this.maxQueueSize) {
      throw new RateLimitError(
        `Rate limiter [${this.name}] queue full (${this.queue.length}/${this.maxQueueSize})`
      );
    }

    return new Promise<void>((resolve, reject) => {
      this.queue.push({
        resolve,
        reject,
        timestamp: Date.now(),
      });

      // Start processing queue if not already doing so
      this.processQueue();
    });
  }

  /**
   * Execute a function with rate limiting
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    return fn();
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / 1000) * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      this.refill();

      // Check for expired requests
      const now = Date.now();
      const expiredIndex = this.queue.findIndex(
        (req) => now - req.timestamp > this.maxWaitTime
      );

      if (expiredIndex !== -1) {
        const expired = this.queue.splice(expiredIndex, 1)[0];
        expired.reject(
          new RateLimitTimeoutError(
            `Rate limiter [${this.name}] request timed out after ${this.maxWaitTime}ms`
          )
        );
        continue;
      }

      if (this.tokens >= 1) {
        this.tokens -= 1;
        const request = this.queue.shift();
        if (request) {
          request.resolve();
        }
      } else {
        // Wait for tokens to refill
        const waitTime = (1 / this.refillRate) * 1000;
        await this.sleep(Math.min(waitTime, 100));
      }
    }

    this.processing = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limiter stats
   */
  getStats(): RateLimiterStats {
    this.refill();
    return {
      name: this.name,
      availableTokens: Math.floor(this.tokens),
      maxTokens: this.maxTokens,
      refillRate: this.refillRate,
      queueSize: this.queue.length,
      maxQueueSize: this.maxQueueSize,
    };
  }

  /**
   * Reset the rate limiter (refill all tokens, clear queue)
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();

    // Reject all queued requests
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        request.reject(new RateLimitError(`Rate limiter [${this.name}] was reset`));
      }
    }
  }
}

export interface RateLimiterStats {
  name: string;
  availableTokens: number;
  maxTokens: number;
  refillRate: number;
  queueSize: number;
  maxQueueSize: number;
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class RateLimitTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitTimeoutError';
  }
}

/**
 * Rate Limiter Registry for managing multiple limiters
 */
class RateLimiterRegistry {
  private limiters: Map<string, RateLimiter> = new Map();

  /**
   * Get or create a rate limiter
   */
  getOrCreate(config: RateLimiterConfig): RateLimiter {
    let limiter = this.limiters.get(config.name);
    if (!limiter) {
      limiter = new RateLimiter(config);
      this.limiters.set(config.name, limiter);
    }
    return limiter;
  }

  /**
   * Get a rate limiter by name
   */
  get(name: string): RateLimiter | undefined {
    return this.limiters.get(name);
  }

  /**
   * Get all rate limiter stats
   */
  getAllStats(): RateLimiterStats[] {
    return Array.from(this.limiters.values()).map((l) => l.getStats());
  }

  /**
   * Reset all rate limiters
   */
  resetAll(): void {
    this.limiters.forEach((l) => l.reset());
  }
}

// Global registry instance
export const rateLimiterRegistry = new RateLimiterRegistry();

/**
 * Factory function to create a rate limiter
 */
export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  return rateLimiterRegistry.getOrCreate(config);
}

/**
 * Pre-configured rate limiters for common marketplace APIs
 */
export const MarketplaceRateLimits = {
  // Amazon MWS: 30 requests per minute
  AMAZON: { maxTokens: 30, refillRate: 0.5 },
  // Flipkart: 100 requests per minute
  FLIPKART: { maxTokens: 100, refillRate: 1.67 },
  // Myntra (via Flipkart): 60 requests per minute
  MYNTRA: { maxTokens: 60, refillRate: 1 },
  // AJIO: 30 requests per minute
  AJIO: { maxTokens: 30, refillRate: 0.5 },
  // Meesho: 60 requests per minute
  MEESHO: { maxTokens: 60, refillRate: 1 },
  // Nykaa: 50 requests per minute
  NYKAA: { maxTokens: 50, refillRate: 0.83 },
  // Tata Cliq: 40 requests per minute
  TATA_CLIQ: { maxTokens: 40, refillRate: 0.67 },
  // JioMart: 50 requests per minute
  JIOMART: { maxTokens: 50, refillRate: 0.83 },
  // Shopify: 2 requests per second
  SHOPIFY: { maxTokens: 40, refillRate: 2 },
  // WooCommerce: No official limit, using conservative 60/min
  WOOCOMMERCE: { maxTokens: 60, refillRate: 1 },
} as const;

/**
 * Pre-configured rate limiters for transporter APIs
 */
export const TransporterRateLimits = {
  // Delhivery: 100 requests per minute
  DELHIVERY: { maxTokens: 100, refillRate: 1.67 },
  // BlueDart: 30 requests per minute
  BLUEDART: { maxTokens: 30, refillRate: 0.5 },
  // Ekart: 60 requests per minute
  EKART: { maxTokens: 60, refillRate: 1 },
  // Shadowfax: 60 requests per minute
  SHADOWFAX: { maxTokens: 60, refillRate: 1 },
  // DTDC: 40 requests per minute
  DTDC: { maxTokens: 40, refillRate: 0.67 },
  // Ecom Express: 50 requests per minute
  ECOM_EXPRESS: { maxTokens: 50, refillRate: 0.83 },
  // Xpressbees: 60 requests per minute
  XPRESSBEES: { maxTokens: 60, refillRate: 1 },
  // Shiprocket: 120 requests per minute
  SHIPROCKET: { maxTokens: 120, refillRate: 2 },
} as const;
