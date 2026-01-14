/**
 * Circuit Breaker Pattern for API Resilience
 *
 * Prevents cascading failures by tracking errors and temporarily
 * blocking requests to failing services.
 *
 * States:
 * - CLOSED: Normal operation, requests flow through
 * - OPEN: Circuit tripped, requests are blocked
 * - HALF_OPEN: Testing if service recovered
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  /** Name for identification in logs */
  name: string;
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold?: number;
  /** Number of successes in half-open to close circuit (default: 2) */
  successThreshold?: number;
  /** Time in ms before attempting recovery (default: 30000) */
  resetTimeout?: number;
  /** Time window in ms for failure counting (default: 60000) */
  failureWindow?: number;
  /** Optional callback when state changes */
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

interface FailureRecord {
  timestamp: number;
  error: string;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: FailureRecord[] = [];
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private nextAttemptTime: number = 0;

  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly resetTimeout: number;
  private readonly failureWindow: number;
  private readonly onStateChange?: (from: CircuitState, to: CircuitState) => void;

  constructor(config: CircuitBreakerConfig) {
    this.name = config.name;
    this.failureThreshold = config.failureThreshold ?? 5;
    this.successThreshold = config.successThreshold ?? 2;
    this.resetTimeout = config.resetTimeout ?? 30000;
    this.failureWindow = config.failureWindow ?? 60000;
    this.onStateChange = config.onStateChange;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new CircuitOpenError(
          `Circuit breaker [${this.name}] is OPEN. Retry after ${Math.ceil((this.nextAttemptTime - Date.now()) / 1000)}s`
        );
      }
      // Time to try again - move to half-open
      this.transitionTo(CircuitState.HALF_OPEN);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Record a successful call
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      console.log(
        `[CircuitBreaker:${this.name}] Success in HALF_OPEN (${this.successCount}/${this.successThreshold})`
      );

      if (this.successCount >= this.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Clean up old failures
      this.cleanupOldFailures();
    }
  }

  /**
   * Record a failed call
   */
  private onFailure(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);

    this.failures.push({
      timestamp: Date.now(),
      error: errorMessage,
    });
    this.lastFailureTime = Date.now();

    // Clean up old failures outside the window
    this.cleanupOldFailures();

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open trips the circuit again
      console.log(`[CircuitBreaker:${this.name}] Failure in HALF_OPEN, reopening circuit`);
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      // Check if threshold exceeded
      if (this.failures.length >= this.failureThreshold) {
        console.log(
          `[CircuitBreaker:${this.name}] Failure threshold reached (${this.failures.length}/${this.failureThreshold})`
        );
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const previousState = this.state;
    this.state = newState;

    console.log(`[CircuitBreaker:${this.name}] State: ${previousState} -> ${newState}`);

    if (newState === CircuitState.OPEN) {
      this.nextAttemptTime = Date.now() + this.resetTimeout;
      this.successCount = 0;
    } else if (newState === CircuitState.CLOSED) {
      this.failures = [];
      this.successCount = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.successCount = 0;
    }

    this.onStateChange?.(previousState, newState);
  }

  /**
   * Remove failures outside the time window
   */
  private cleanupOldFailures(): void {
    const cutoff = Date.now() - this.failureWindow;
    this.failures = this.failures.filter((f) => f.timestamp > cutoff);
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit statistics
   */
  getStats(): CircuitBreakerStats {
    this.cleanupOldFailures();
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failures.length,
      failureThreshold: this.failureThreshold,
      lastFailureTime: this.lastFailureTime || null,
      nextAttemptTime: this.state === CircuitState.OPEN ? this.nextAttemptTime : null,
      successCount: this.state === CircuitState.HALF_OPEN ? this.successCount : 0,
    };
  }

  /**
   * Force circuit to closed state (use with caution)
   */
  reset(): void {
    console.log(`[CircuitBreaker:${this.name}] Manual reset to CLOSED`);
    this.transitionTo(CircuitState.CLOSED);
  }

  /**
   * Force circuit to open state (for maintenance)
   */
  trip(): void {
    console.log(`[CircuitBreaker:${this.name}] Manual trip to OPEN`);
    this.transitionTo(CircuitState.OPEN);
  }
}

export interface CircuitBreakerStats {
  name: string;
  state: CircuitState;
  failureCount: number;
  failureThreshold: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;
  successCount: number;
}

export class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

/**
 * Circuit Breaker Registry for managing multiple breakers
 */
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker
   */
  getOrCreate(config: CircuitBreakerConfig): CircuitBreaker {
    let breaker = this.breakers.get(config.name);
    if (!breaker) {
      breaker = new CircuitBreaker(config);
      this.breakers.set(config.name, breaker);
    }
    return breaker;
  }

  /**
   * Get a circuit breaker by name
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Get all circuit breaker stats
   */
  getAllStats(): CircuitBreakerStats[] {
    return Array.from(this.breakers.values()).map((b) => b.getStats());
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach((b) => b.reset());
  }
}

// Global registry instance
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

/**
 * Factory function to create a circuit breaker
 */
export function createCircuitBreaker(config: CircuitBreakerConfig): CircuitBreaker {
  return circuitBreakerRegistry.getOrCreate(config);
}
