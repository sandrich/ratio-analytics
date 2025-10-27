/**
 * Application Configuration Types
 */

import { NormalizationMethod } from './calculations';

export interface AppConfig {
  COINGECKO_API_URL: string;
  COINGECKO_API_KEY?: string;
  CACHE_TTL_HOURS: number;
  MAX_CACHE_SIZE_MB: number;
  DEFAULT_TIMEFRAMES: number[];
  DEFAULT_NORMALIZATION: NormalizationMethod;
  API_RATE_LIMIT_MS: number;
  MAX_RETRIES: number;
}

export interface UserPreferences {
  selectedTokens: string[];
  timeframes: number[];
  normalizationMethod: NormalizationMethod;
  sortBy: 'average' | 'omega' | 'sharpe';
  colorScheme: 'default' | 'colorblind';
}

export interface AnnualizationConfig {
  tradingDaysPerYear: number;
  description: string;
}

export const ANNUALIZATION_PRESETS: Record<string, AnnualizationConfig> = {
  CRYPTO: { tradingDaysPerYear: 365, description: 'Crypto markets (24/7 trading)' },
  STOCKS: { tradingDaysPerYear: 252, description: 'Stock markets (252 trading days)' },
  CUSTOM: { tradingDaysPerYear: 365, description: 'Custom configuration' }
};

export interface TimeframeConfig {
  days: number;
  label: string;
  isDefault: boolean;
}

export const DEFAULT_TIMEFRAMES: TimeframeConfig[] = [
  { days: 90, label: '3 months', isDefault: true },
  { days: 180, label: '6 months', isDefault: true },
  { days: 365, label: '1 year', isDefault: true },
  { days: 990, label: '~3 years', isDefault: true },
  { days: 2000, label: '~5 years', isDefault: true }
];

export const DEFAULT_CONFIG: AppConfig = {
  COINGECKO_API_URL: 'https://api.coingecko.com/api/v3',
  CACHE_TTL_HOURS: 24,
  MAX_CACHE_SIZE_MB: 50,
  DEFAULT_TIMEFRAMES: [90, 180, 365, 990, 2000],
  DEFAULT_NORMALIZATION: NormalizationMethod.Z_SCORE,
  API_RATE_LIMIT_MS: 1000,
  MAX_RETRIES: 3
};

export const DEFAULT_ANNUALIZATION: AnnualizationConfig = ANNUALIZATION_PRESETS.CRYPTO;