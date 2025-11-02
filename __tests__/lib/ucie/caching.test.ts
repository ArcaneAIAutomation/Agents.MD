/**
 * Unit Tests: Caching Functions
 * 
 * Tests for multi-level caching (memory, Redis, database)
 */

import {
  getCachedData,
  setCachedData,
  invalidateCache,
  getCacheStats
} from '../../../lib/ucie/caching';

// Mock Redis and database
jest.mock('@vercel/kv', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn()
}));

describe('Caching Functions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getCachedData', () => {
    test('retrieves data from memory cache first', async () => {
      const key = 'test-key';
      const data = { price: 100, timestamp: Date.now() };
      
      // Set data in cache
      await setCachedData(key, data, 60);
      
      // Retrieve data
      const cached = await getCachedData(key);
      
      expect(cached).toEqual(data);
    });

    test('returns null for non-existent key', async () => {
      const cached = await getCachedData('non-existent-key');
      
      expect(cached).toBeNull();
    });

    test('respects TTL expiration', async () => {
      const key = 'expiring-key';
      const data = { value: 'test' };
      
      // Set with 1 second TTL
      await setCachedData(key, data, 1);
      
      // Should exist immediately
      let cached = await getCachedData(key);
      expect(cached).toEqual(data);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be expired
      cached = await getCachedData(key);
      expect(cached).toBeNull();
    });

    test('handles JSON serialization correctly', async () => {
      const key = 'json-key';
      const complexData = {
        nested: {
          array: [1, 2, 3],
          object: { a: 'b' }
        },
        date: new Date().toISOString()
      };
      
      await setCachedData(key, complexData, 60);
      const cached = await getCachedData(key);
      
      expect(cached).toEqual(complexData);
    });
  });

  describe('setCachedData', () => {
    test('stores data with TTL', async () => {
      const key = 'ttl-key';
      const data = { value: 'test' };
      const ttl = 300; // 5 minutes
      
      await setCachedData(key, data, ttl);
      
      const cached = await getCachedData(key);
      expect(cached).toEqual(data);
    });

    test('overwrites existing data', async () => {
      const key = 'overwrite-key';
      const data1 = { value: 'first' };
      const data2 = { value: 'second' };
      
      await setCachedData(key, data1, 60);
      await setCachedData(key, data2, 60);
      
      const cached = await getCachedData(key);
      expect(cached).toEqual(data2);
    });

    test('handles large data objects', async () => {
      const key = 'large-data';
      const largeData = {
        array: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          value: `item-${i}`
        }))
      };
      
      await setCachedData(key, largeData, 60);
      const cached = await getCachedData(key);
      
      expect(cached).toEqual(largeData);
      expect(cached.array).toHaveLength(1000);
    });
  });

  describe('invalidateCache', () => {
    test('removes data from cache', async () => {
      const key = 'invalidate-key';
      const data = { value: 'test' };
      
      await setCachedData(key, data, 60);
      
      // Verify data exists
      let cached = await getCachedData(key);
      expect(cached).toEqual(data);
      
      // Invalidate
      await invalidateCache(key);
      
      // Verify data is gone
      cached = await getCachedData(key);
      expect(cached).toBeNull();
    });

    test('handles invalidating non-existent key', async () => {
      // Should not throw error
      await expect(invalidateCache('non-existent')).resolves.not.toThrow();
    });

    test('supports pattern-based invalidation', async () => {
      // Set multiple keys with pattern
      await setCachedData('btc:price', { value: 100 }, 60);
      await setCachedData('btc:volume', { value: 1000 }, 60);
      await setCachedData('eth:price', { value: 50 }, 60);
      
      // Invalidate all BTC keys
      await invalidateCache('btc:*');
      
      // BTC keys should be gone
      expect(await getCachedData('btc:price')).toBeNull();
      expect(await getCachedData('btc:volume')).toBeNull();
      
      // ETH key should remain
      expect(await getCachedData('eth:price')).toEqual({ value: 50 });
    });
  });

  describe('getCacheStats', () => {
    test('returns cache statistics', async () => {
      // Perform some cache operations
      await setCachedData('key1', { value: 1 }, 60);
      await setCachedData('key2', { value: 2 }, 60);
      await getCachedData('key1'); // Hit
      await getCachedData('key1'); // Hit
      await getCachedData('key3'); // Miss
      
      const stats = await getCacheStats();
      
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('totalKeys');
      
      expect(stats.hits).toBeGreaterThanOrEqual(2);
      expect(stats.misses).toBeGreaterThanOrEqual(1);
      expect(stats.totalKeys).toBeGreaterThanOrEqual(2);
    });

    test('calculates hit rate correctly', async () => {
      // Clear stats
      await invalidateCache('*');
      
      // 3 hits, 1 miss = 75% hit rate
      await setCachedData('key1', { value: 1 }, 60);
      await getCachedData('key1'); // Hit
      await getCachedData('key1'); // Hit
      await getCachedData('key1'); // Hit
      await getCachedData('key2'); // Miss
      
      const stats = await getCacheStats();
      
      expect(stats.hitRate).toBeCloseTo(0.75, 2);
    });

    test('handles zero operations', async () => {
      // Clear everything
      await invalidateCache('*');
      
      const stats = await getCacheStats();
      
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.totalKeys).toBe(0);
    });
  });

  describe('Cache Performance', () => {
    test('memory cache is faster than database', async () => {
      const key = 'perf-key';
      const data = { value: 'test' };
      
      // Set data
      await setCachedData(key, data, 60);
      
      // Measure memory cache access
      const memStart = Date.now();
      await getCachedData(key);
      const memTime = Date.now() - memStart;
      
      // Memory cache should be very fast (< 10ms)
      expect(memTime).toBeLessThan(10);
    });

    test('handles concurrent cache operations', async () => {
      const operations = Array.from({ length: 100 }, (_, i) => 
        setCachedData(`concurrent-${i}`, { value: i }, 60)
      );
      
      // All operations should complete without error
      await expect(Promise.all(operations)).resolves.not.toThrow();
      
      // Verify all data was stored
      const key50 = await getCachedData('concurrent-50');
      expect(key50).toEqual({ value: 50 });
    });
  });
});
