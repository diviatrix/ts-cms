export class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttls = new Map(); // Time to live for each cache entry
  }

  // Set a value in cache with optional TTL (time to live in milliseconds)
  set(key, value, ttl = null) {
    this.cache.set(key, value);
    if (ttl) {
      this.ttls.set(key, Date.now() + ttl);
    }
    return value;
  }

  // Get a value from cache if it exists and hasn't expired
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    // Check if TTL has expired
    if (this.ttls.has(key)) {
      const ttl = this.ttls.get(key);
      if (Date.now() > ttl) {
        this.cache.delete(key);
        this.ttls.delete(key);
        return null;
      }
    }

    return this.cache.get(key);
  }

  // Check if a key exists in cache
  has(key) {
    return this.get(key) !== null;
  }

  // Delete a key from cache
  delete(key) {
    this.cache.delete(key);
    this.ttls.delete(key);
  }

  // Clear all cache entries
  clear() {
    this.cache.clear();
    this.ttls.clear();
  }

  // Get cache size
  size() {
    return this.cache.size;
  }

  // Get all cache keys
  keys() {
    return Array.from(this.cache.keys());
  }

  // Invalidate expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, ttl] of this.ttls.entries()) {
      if (now > ttl) {
        this.cache.delete(key);
        this.ttls.delete(key);
      }
    }
  }
}

// Create a singleton instance
export const cacheManager = new CacheManager();