/**
 * Storage and Cache Types
 */

export interface StorageInfo {
  used: number;
  available: number;
  percentage: number;
}

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl?: number; // time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  maxSizeBytes: number;
  defaultTtlHours: number;
  evictionStrategy: 'lru' | 'fifo' | 'lfu';
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  storageUsed: number;
  entriesCount: number;
}