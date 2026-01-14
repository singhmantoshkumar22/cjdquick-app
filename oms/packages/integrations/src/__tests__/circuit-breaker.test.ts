import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CircuitBreaker,
  CircuitState,
  CircuitOpenError,
  createCircuitBreaker,
  circuitBreakerRegistry,
} from '../utils/circuit-breaker';

describe('CircuitBreaker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    circuitBreakerRegistry.resetAll();
  });

  describe('initial state', () => {
    it('should start in CLOSED state', () => {
      const cb = new CircuitBreaker({ name: 'test' });
      expect(cb.getState()).toBe(CircuitState.CLOSED);
    });

    it('should have correct default configuration', () => {
      const cb = new CircuitBreaker({ name: 'test' });
      const stats = cb.getStats();
      expect(stats.name).toBe('test');
      expect(stats.failureThreshold).toBe(5);
      expect(stats.failureCount).toBe(0);
    });
  });

  describe('execute', () => {
    it('should execute function successfully when circuit is closed', async () => {
      const cb = new CircuitBreaker({ name: 'test' });
      const result = await cb.execute(async () => 'success');
      expect(result).toBe('success');
    });

    it('should pass through errors from executed function', async () => {
      const cb = new CircuitBreaker({ name: 'test' });
      await expect(
        cb.execute(async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });

    it('should record failures', async () => {
      const cb = new CircuitBreaker({ name: 'test' });

      try {
        await cb.execute(async () => {
          throw new Error('Test error');
        });
      } catch {
        // Expected
      }

      const stats = cb.getStats();
      expect(stats.failureCount).toBe(1);
    });
  });

  describe('state transitions', () => {
    it('should open circuit after reaching failure threshold', async () => {
      const cb = new CircuitBreaker({
        name: 'test',
        failureThreshold: 3,
      });

      for (let i = 0; i < 3; i++) {
        try {
          await cb.execute(async () => {
            throw new Error('Test error');
          });
        } catch {
          // Expected
        }
      }

      expect(cb.getState()).toBe(CircuitState.OPEN);
    });

    it('should throw CircuitOpenError when circuit is open', async () => {
      const cb = new CircuitBreaker({
        name: 'test',
        failureThreshold: 1,
        resetTimeout: 10000,
      });

      try {
        await cb.execute(async () => {
          throw new Error('Test error');
        });
      } catch {
        // Expected
      }

      expect(cb.getState()).toBe(CircuitState.OPEN);

      await expect(cb.execute(async () => 'success')).rejects.toThrow(
        CircuitOpenError
      );
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      const cb = new CircuitBreaker({
        name: 'test',
        failureThreshold: 1,
        resetTimeout: 5000,
      });

      try {
        await cb.execute(async () => {
          throw new Error('Test error');
        });
      } catch {
        // Expected
      }

      expect(cb.getState()).toBe(CircuitState.OPEN);

      // Advance time past reset timeout
      vi.advanceTimersByTime(6000);

      // Next call should transition to HALF_OPEN and execute
      const result = await cb.execute(async () => 'success');
      expect(result).toBe('success');
      expect(cb.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should close circuit after success threshold in HALF_OPEN', async () => {
      const cb = new CircuitBreaker({
        name: 'test',
        failureThreshold: 1,
        successThreshold: 2,
        resetTimeout: 1000,
      });

      // Trip the circuit
      try {
        await cb.execute(async () => {
          throw new Error('Test error');
        });
      } catch {
        // Expected
      }

      expect(cb.getState()).toBe(CircuitState.OPEN);

      // Advance time past reset timeout
      vi.advanceTimersByTime(2000);

      // Two successful calls should close the circuit
      await cb.execute(async () => 'success');
      expect(cb.getState()).toBe(CircuitState.HALF_OPEN);

      await cb.execute(async () => 'success');
      expect(cb.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reopen circuit on failure in HALF_OPEN state', async () => {
      const cb = new CircuitBreaker({
        name: 'test',
        failureThreshold: 1,
        resetTimeout: 1000,
      });

      // Trip the circuit
      try {
        await cb.execute(async () => {
          throw new Error('Test error');
        });
      } catch {
        // Expected
      }

      // Advance time past reset timeout
      vi.advanceTimersByTime(2000);

      // Fail in HALF_OPEN state
      try {
        await cb.execute(async () => {
          throw new Error('Test error');
        });
      } catch {
        // Expected
      }

      expect(cb.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('manual controls', () => {
    it('should reset circuit to CLOSED state', async () => {
      const cb = new CircuitBreaker({
        name: 'test',
        failureThreshold: 1,
      });

      try {
        await cb.execute(async () => {
          throw new Error('Test error');
        });
      } catch {
        // Expected
      }

      expect(cb.getState()).toBe(CircuitState.OPEN);

      cb.reset();
      expect(cb.getState()).toBe(CircuitState.CLOSED);
    });

    it('should trip circuit to OPEN state', () => {
      const cb = new CircuitBreaker({ name: 'test' });
      expect(cb.getState()).toBe(CircuitState.CLOSED);

      cb.trip();
      expect(cb.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('onStateChange callback', () => {
    it('should call callback on state changes', async () => {
      const stateChanges: { from: CircuitState; to: CircuitState }[] = [];

      const cb = new CircuitBreaker({
        name: 'test',
        failureThreshold: 1,
        onStateChange: (from, to) => {
          stateChanges.push({ from, to });
        },
      });

      try {
        await cb.execute(async () => {
          throw new Error('Test error');
        });
      } catch {
        // Expected
      }

      expect(stateChanges).toHaveLength(1);
      expect(stateChanges[0]).toEqual({
        from: CircuitState.CLOSED,
        to: CircuitState.OPEN,
      });
    });
  });

  describe('failure window', () => {
    it('should not count failures outside the window', async () => {
      const cb = new CircuitBreaker({
        name: 'test',
        failureThreshold: 3,
        failureWindow: 5000,
      });

      // First two failures
      for (let i = 0; i < 2; i++) {
        try {
          await cb.execute(async () => {
            throw new Error('Test error');
          });
        } catch {
          // Expected
        }
      }

      expect(cb.getStats().failureCount).toBe(2);

      // Advance time past failure window
      vi.advanceTimersByTime(6000);

      // Old failures should be cleaned up on next call
      try {
        await cb.execute(async () => {
          throw new Error('Test error');
        });
      } catch {
        // Expected
      }

      // Should only have 1 failure (the recent one)
      expect(cb.getStats().failureCount).toBe(1);
      expect(cb.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('createCircuitBreaker factory', () => {
    it('should create and register circuit breaker', () => {
      const cb = createCircuitBreaker({ name: 'factory-test' });
      expect(cb.getState()).toBe(CircuitState.CLOSED);

      const retrieved = circuitBreakerRegistry.get('factory-test');
      expect(retrieved).toBe(cb);
    });

    it('should return existing circuit breaker with same name', () => {
      const cb1 = createCircuitBreaker({ name: 'same-name' });
      const cb2 = createCircuitBreaker({ name: 'same-name' });
      expect(cb1).toBe(cb2);
    });
  });
});
