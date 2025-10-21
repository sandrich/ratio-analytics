/**
 * Calculation and Analysis Types
 */

export const NormalizationMethod = {
  Z_SCORE: 'z-score',
  MIN_MAX: 'min-max',
  ROBUST: 'robust',
  NONE: 'none'
} as const;

export type NormalizationMethod = typeof NormalizationMethod[keyof typeof NormalizationMethod];

export interface CalculationResult {
  tokenId: string;
  timeframe: number;
  omegaRatio: number;
  sharpeRatio: number;
  returns: number[];
  volatility: number;
}

export interface TokenData {
  id: string;
  symbol: string;
  name: string;
  selected: boolean;
  omegaRatios: Record<number, number>; // timeframe -> ratio
  sharpeRatios: Record<number, number>; // timeframe -> ratio
  normalizedOmega: Record<number, number>;
  normalizedSharpe: Record<number, number>;
  averageOmegaScore: number;
  averageSharpeScore: number;
  overallAverageScore: number; // Combined average for overall ranking
}

export interface PerformanceMetrics {
  omegaRatio: number;
  sharpeRatio: number;
  returns: number[];
  volatility: number;
  drawdown: number;
}

export interface NormalizationConfig {
  method: NormalizationMethod;
  parameters?: {
    threshold?: number; // for Omega ratio
    riskFreeRate?: number; // for Sharpe ratio
  };
}