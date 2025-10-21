/**
 * Main Types Export
 */

// API Types
export * from './api';

// Calculation Types
export * from './calculations';

// Error Types
export * from './errors';

// Storage Types
export * from './storage';

// Configuration Types
export * from './config';

// Component Props Types
export interface CryptoAnalyzerProps {
  initialTimeframes?: number[];
}

export interface TokenDataTableProps {
  tokens: import('./calculations').TokenData[];
  timeframes: number[];
  onTokenSelectionChange: (selectedTokens: string[]) => void;
  sortBy: 'average' | 'omega' | 'sharpe';
}

export interface TimeframeConfigurationProps {
  timeframes: number[];
  onTimeframesChange: (timeframes: number[]) => void;
}

export interface TokenSelectionPanelProps {
  availableTokens: import('./api').CoinGeckoToken[];
  selectedTokens: string[];
  onSelectionChange: (tokenIds: string[]) => void;
}

// Service Interface Types
export interface CoinGeckoService {
  getTopTokens(limit: number): Promise<import('./api').CoinGeckoToken[]>;
  getHistoricalData(tokenId: string, days: number): Promise<import('./api').HistoricalData>;
  getCurrentPrices(tokenIds: string[]): Promise<import('./api').TokenPrice[]>;
}

export interface CacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttl?: number): void;
  clear(): void;
  getStorageUsage(): import('./storage').StorageInfo;
  evictOldest(): void;
}

export interface CalculationService {
  calculateOmegaRatio(returns: number[], threshold?: number): number;
  calculateSharpeRatio(returns: number[], riskFreeRate?: number): number;
  calculateReturns(prices: number[]): number[];
  normalizeValues(values: number[], method: import('./calculations').NormalizationMethod): number[];
}