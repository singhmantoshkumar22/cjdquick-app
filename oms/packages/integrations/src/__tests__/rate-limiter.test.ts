import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RateLimiter,
  RateLimitError,
  createRateLimiter,
  rateLimiterRegistry,
  MarketplaceRateLimits,
  TransporterRateLimits,
} from '../utils/rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    rateLimiterRegistry.resetAll();
  });

  describe('initial state', () => {
    it('should start with full token bucket', () => {
      const rl = new RateLimiter({
        name: 'test',
        maxTokens: 10,
        refillRate: 1,
      });
      const stats = rl.getStats();
      expect(stats.availableTokens).toBe(10);
      expect(stats.queueSize).toBe(0);
    });

    it('should have correct configuration', () => {
      const rl = new RateLimiter({
        name: 'test',
        maxTokens: 20,
        refillRate: 2,
      });
      const stats = rl.getStats();
      expect(stats.name).toBe('test');
      expect(stats.maxTokens).toBe(20);
      expect(stats.refillRate).toBe(2);
    });
  });

  describe('acquire', () => {
    it('should acquire token when available', async () => {
      const rl = new RateLimiter({
        name: 'test',
        maxTokens: 10,
        refillRate: 1,
      });

      await rl.acquire();
      expect(rl.getStats().availableTokens).toBe(9);
    });

    it('should consume tokens on multiple acquires', async () => {
      const rl = new RateLimiter({
        name: 'test',
        maxTokens: 5,
        refillRate: 1,
      });

      await rl.acquire();
      await rl.acquire();
      await rl.acquire();

      expect(rl.getStats().availableTokens).toBe(2);
    });

    it('should throw when queue is full', async () => {
      const rl = new RateLimiter({
        name: 'test',
        maxTokens: 1,
        refillRate: 0.01, // Very slow refill
        maxQueueSize: 2,
      });

      // Consume the only token
      await rl.acquire();

      // These will queue (don't await - they'll be pending)
      // Catch their rejections to avoid unhandled promise warnings
      const queued1 = rl.acquire().catch(() => {});
      const queued2 = rl.acquire().catch(() => {});

      // This should throw because queue is full
      await expect(rl.acquire()).rejects.toThrow(RateLimitError);
      await expect(rl.acquire()).rejects.toThrow(/queue full/);

      // Reset to clean up queued requests
      rl.reset();

      // Wait for queued promises to settle
      await Promise.allSettled([queued1, queued2]);
    });
  });

  describe('token refill', () => {
    it('should refill tokens over time', async () => {
      const rl = new RateLimiter({
        name: 'test',
        maxTokens: 10,
        refillRate: 2, // 2 tokens per second
      });

      // Consume all tokens
      for (let i = 0; i < 10; i++) {
        await rl.acquire();
      }
      expect(rl.getStats().availableTokens).toBe(0);

      // Advance time by 1 second
      vi.advanceTimersByTime(1000);

      // Should have ~2 tokens now
      const stats = rl.getStats();
      expect(stats.availableTokens).toBeGreaterThanOrEqual(2);
    });

    it('should not exceed max tokens', async () => {
      const rl = new RateLimiter({
        name: 'test',
        maxTokens: 5,
        refillRate: 10, // Fast refill
      });

      // Advance time significantly
      vi.advanceTimersByTime(10000);

      const stats = rl.getStats();
      expect(stats.availableTokens).toBe(5);
    });
  });

  describe('execute', () => {
    it('should execute function with rate limiting', async () => {
      const rl = new RateLimiter({
        name: 'test',
        maxTokens: 10,
        refillRate: 1,
      });

      const result = await rl.execute(async () => 'success');
      expect(result).toBe('success');
      expect(rl.getStats().availableTokens).toBe(9);
    });

    it('should pass through function errors', async () => {
      const rl = new RateLimiter({
        name: 'test',
        maxTokens: 10,
        refillRate: 1,
      });

      await expect(
        rl.execute(async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });
  });

  describe('reset', () => {
    it('should refill all tokens on reset', async () => {
      const rl = new RateLimiter({
        name: 'test',
        maxTokens: 10,
        refillRate: 1,
      });

      // Consume some tokens
      for (let i = 0; i < 5; i++) {
        await rl.acquire();
      }
      expect(rl.getStats().availableTokens).toBe(5);

      rl.reset();
      expect(rl.getStats().availableTokens).toBe(10);
    });
  });

  describe('createRateLimiter factory', () => {
    it('should create and register rate limiter', () => {
      const rl = createRateLimiter({
        name: 'factory-test',
        maxTokens: 10,
        refillRate: 1,
      });
      expect(rl.getStats().maxTokens).toBe(10);

      const retrieved = rateLimiterRegistry.get('factory-test');
      expect(retrieved).toBe(rl);
    });

    it('should return existing rate limiter with same name', () => {
      const rl1 = createRateLimiter({
        name: 'same-name',
        maxTokens: 10,
        refillRate: 1,
      });
      const rl2 = createRateLimiter({
        name: 'same-name',
        maxTokens: 20,
        refillRate: 2,
      });
      expect(rl1).toBe(rl2);
      // Should keep original config
      expect(rl2.getStats().maxTokens).toBe(10);
    });
  });

  describe('pre-configured rate limits', () => {
    it('should have marketplace rate limits defined', () => {
      expect(MarketplaceRateLimits.AMAZON).toEqual({
        maxTokens: 30,
        refillRate: 0.5,
      });
      expect(MarketplaceRateLimits.FLIPKART).toEqual({
        maxTokens: 100,
        refillRate: 1.67,
      });
      expect(MarketplaceRateLimits.SHOPIFY).toEqual({
        maxTokens: 40,
        refillRate: 2,
      });
    });

    it('should have transporter rate limits defined', () => {
      expect(TransporterRateLimits.DELHIVERY).toEqual({
        maxTokens: 100,
        refillRate: 1.67,
      });
      expect(TransporterRateLimits.SHIPROCKET).toEqual({
        maxTokens: 120,
        refillRate: 2,
      });
      expect(TransporterRateLimits.BLUEDART).toEqual({
        maxTokens: 30,
        refillRate: 0.5,
      });
    });

    it('should work with pre-configured limits', async () => {
      const rl = createRateLimiter({
        name: 'amazon-limiter',
        ...MarketplaceRateLimits.AMAZON,
      });

      expect(rl.getStats().maxTokens).toBe(30);
      expect(rl.getStats().refillRate).toBe(0.5);
    });
  });

  describe('registry operations', () => {
    it('should get all stats from registry', () => {
      createRateLimiter({
        name: 'limiter-1',
        maxTokens: 10,
        refillRate: 1,
      });
      createRateLimiter({
        name: 'limiter-2',
        maxTokens: 20,
        refillRate: 2,
      });

      const allStats = rateLimiterRegistry.getAllStats();
      expect(allStats.length).toBeGreaterThanOrEqual(2);

      const names = allStats.map((s) => s.name);
      expect(names).toContain('limiter-1');
      expect(names).toContain('limiter-2');
    });

    it('should reset all limiters in registry', async () => {
      const rl1 = createRateLimiter({
        name: 'reset-test-1',
        maxTokens: 10,
        refillRate: 1,
      });
      const rl2 = createRateLimiter({
        name: 'reset-test-2',
        maxTokens: 10,
        refillRate: 1,
      });

      await rl1.acquire();
      await rl2.acquire();

      expect(rl1.getStats().availableTokens).toBe(9);
      expect(rl2.getStats().availableTokens).toBe(9);

      rateLimiterRegistry.resetAll();

      expect(rl1.getStats().availableTokens).toBe(10);
      expect(rl2.getStats().availableTokens).toBe(10);
    });
  });
});
