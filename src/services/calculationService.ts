/**
 * Financial Calculation Service
 * Implements Omega ratio, Sharpe ratio, and normalization calculations
 */

import type { PerformanceMetrics } from '../types/calculations';
import { NormalizationMethod } from '../types/calculations';

export class CalculationService {
  /**
   * Calculate Omega ratio from price returns
   * Omega = (Expected return above threshold) / (Expected return below threshold)
   * 
   * @param returns Array of return values (as decimals, e.g., 0.05 for 5%)
   * @param threshold Minimum acceptable return (default: 0 for risk-free rate)
   * @returns Omega ratio value
   */
  static calculateOmegaRatio(returns: number[], threshold: number = 0): number {

    
    // Handle edge cases
    if (!returns || returns.length === 0) {
      throw new Error('Returns array cannot be empty');
    }

    if (returns.some(r => !isFinite(r))) {
      throw new Error('Returns array contains invalid values (NaN or Infinity)');
    }

    // Filter out any potential NaN or infinite values for safety
    const validReturns = returns.filter(r => isFinite(r));
    
    if (validReturns.length === 0) {
      throw new Error('No valid returns found after filtering');
    }

    // Calculate gains (returns above threshold) and losses (returns below threshold)
    const gains = validReturns.filter(r => r > threshold).map(r => r - threshold);
    const losses = validReturns.filter(r => r < threshold).map(r => threshold - r);



    // Calculate expected values
    const expectedGain = gains.length > 0 ? gains.reduce((sum, gain) => sum + gain, 0) / validReturns.length : 0;
    const expectedLoss = losses.length > 0 ? losses.reduce((sum, loss) => sum + loss, 0) / validReturns.length : 0;



    // Handle edge cases for Omega calculation
    if (expectedLoss === 0) {
      // If there are no losses, return a high finite number instead of infinity
      return expectedGain > 0 ? 100 : 1; // Cap at 100 instead of infinity
    }

    if (expectedGain === 0) {
      // If there are no gains, Omega is 0

      return 0;
    }

    const omega = expectedGain / expectedLoss;

    
    // Ensure we return a finite number
    return isFinite(omega) ? omega : 0;
  }

  /**
   * Calculate Sharpe ratio from returns
   * Sharpe = (Expected return - Risk-free rate) / Standard deviation of returns
   * 
   * @param returns Array of return values (as decimals)
   * @param riskFreeRate Risk-free rate (default: 0.02 for 2% annual)
   * @returns Sharpe ratio value
   */
  static calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
    // Handle edge cases
    if (!returns || returns.length === 0) {
      throw new Error('Returns array cannot be empty');
    }

    if (returns.some(r => !isFinite(r))) {
      throw new Error('Returns array contains invalid values (NaN or Infinity)');
    }

    // Filter out any potential NaN or infinite values for safety
    const validReturns = returns.filter(r => isFinite(r));
    
    if (validReturns.length === 0) {
      throw new Error('No valid returns found after filtering');
    }

    if (validReturns.length === 1) {
      // Cannot calculate standard deviation with only one return
      return 0;
    }

    // Calculate mean return
    const meanReturn = validReturns.reduce((sum, r) => sum + r, 0) / validReturns.length;
    
    // Annualize the mean return (assuming daily returns, multiply by ~252 trading days)
    const annualizedReturn = meanReturn * 252;
    
    // Calculate standard deviation
    const variance = validReturns.reduce((sum, r) => {
      const diff = r - meanReturn;
      return sum + (diff * diff);
    }, 0) / (validReturns.length - 1);
    
    const standardDeviation = Math.sqrt(variance);
    
    // Annualize the standard deviation (multiply by sqrt of 252 trading days)
    const annualizedVolatility = standardDeviation * Math.sqrt(252);
    
    // Handle edge case where volatility is zero
    if (annualizedVolatility === 0) {
      return annualizedReturn > riskFreeRate ? Number.POSITIVE_INFINITY : 0;
    }

    const sharpeRatio = (annualizedReturn - riskFreeRate) / annualizedVolatility;
    
    // Ensure we return a finite number
    return isFinite(sharpeRatio) ? sharpeRatio : 0;
  }

  /**
   * Calculate volatility (standard deviation) from returns
   * 
   * @param returns Array of return values
   * @returns Annualized volatility
   */
  static calculateVolatility(returns: number[]): number {
    if (!returns || returns.length < 2) {
      return 0;
    }

    const validReturns = returns.filter(r => isFinite(r));
    
    if (validReturns.length < 2) {
      return 0;
    }

    // Calculate mean return
    const meanReturn = validReturns.reduce((sum, r) => sum + r, 0) / validReturns.length;
    
    // Calculate variance
    const variance = validReturns.reduce((sum, r) => {
      const diff = r - meanReturn;
      return sum + (diff * diff);
    }, 0) / (validReturns.length - 1);
    
    const standardDeviation = Math.sqrt(variance);
    
    // Annualize the volatility (assuming daily returns)
    return standardDeviation * Math.sqrt(252);
  }

  /**
   * Calculate returns from price data
   * Returns[i] = (Price[i] - Price[i-1]) / Price[i-1]
   * 
   * @param prices Array of price values
   * @returns Array of return values (one less element than prices)
   */
  static calculateReturns(prices: number[]): number[] {
    if (!prices || prices.length < 2) {
      throw new Error('Price array must contain at least 2 values');
    }

    if (prices.some(p => !isFinite(p) || p <= 0)) {
      throw new Error('Price array contains invalid values (must be positive finite numbers)');
    }

    const returns: number[] = [];
    
    for (let i = 1; i < prices.length; i++) {
      const previousPrice = prices[i - 1];
      const currentPrice = prices[i];
      
      if (previousPrice === 0) {
        throw new Error(`Previous price at index ${i - 1} is zero, cannot calculate return`);
      }
      
      const returnValue = (currentPrice - previousPrice) / previousPrice;
      returns.push(returnValue);
    }

    return returns;
  }

  /**
   * Normalize values using Z-Score method
   * Z-Score = (value - mean) / standard deviation
   * 
   * @param values Array of values to normalize
   * @returns Array of normalized values
   */
  static normalizeZScore(values: number[]): number[] {
    if (!values || values.length === 0) {
      return [];
    }

    const validValues = values.filter(v => isFinite(v));
    
    if (validValues.length === 0) {
      return values.map(() => 0);
    }

    if (validValues.length === 1) {
      return values.map(() => 0);
    }

    // Calculate mean
    const mean = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
    
    // Calculate standard deviation
    const variance = validValues.reduce((sum, v) => {
      const diff = v - mean;
      return sum + (diff * diff);
    }, 0) / (validValues.length - 1);
    
    const standardDeviation = Math.sqrt(variance);
    
    // Handle edge case where standard deviation is zero
    if (standardDeviation === 0) {
      return values.map(() => 0);
    }

    // Normalize values
    return values.map(v => {
      if (!isFinite(v)) return 0;
      return (v - mean) / standardDeviation;
    });
  }

  /**
   * Normalize values using Min-Max method
   * Normalized = (value - min) / (max - min)
   * 
   * @param values Array of values to normalize
   * @returns Array of normalized values (0 to 1 range)
   */
  static normalizeMinMax(values: number[]): number[] {
    if (!values || values.length === 0) {
      return [];
    }

    const validValues = values.filter(v => isFinite(v));
    
    if (validValues.length === 0) {
      return values.map(() => 0);
    }

    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    
    // Handle edge case where all values are the same
    if (max === min) {
      return values.map(() => 0.5);
    }

    const range = max - min;
    
    return values.map(v => {
      if (!isFinite(v)) return 0;
      return (v - min) / range;
    });
  }

  /**
   * Normalize values using Robust method (median and IQR)
   * Robust = (value - median) / IQR
   * 
   * @param values Array of values to normalize
   * @returns Array of normalized values
   */
  static normalizeRobust(values: number[]): number[] {
    if (!values || values.length === 0) {
      return [];
    }

    const validValues = values.filter(v => isFinite(v)).sort((a, b) => a - b);
    
    if (validValues.length === 0) {
      return values.map(() => 0);
    }

    if (validValues.length === 1) {
      return values.map(() => 0);
    }

    // Calculate median
    const median = validValues.length % 2 === 0
      ? (validValues[validValues.length / 2 - 1] + validValues[validValues.length / 2]) / 2
      : validValues[Math.floor(validValues.length / 2)];

    // Calculate Q1 and Q3
    const q1Index = Math.floor(validValues.length * 0.25);
    const q3Index = Math.floor(validValues.length * 0.75);
    const q1 = validValues[q1Index];
    const q3 = validValues[q3Index];
    
    const iqr = q3 - q1;
    
    // Handle edge case where IQR is zero
    if (iqr === 0) {
      return values.map(() => 0);
    }

    return values.map(v => {
      if (!isFinite(v)) return 0;
      return (v - median) / iqr;
    });
  }

  /**
   * Normalize values using the specified method
   * 
   * @param values Array of values to normalize
   * @param method Normalization method to use
   * @returns Array of normalized values
   */
  static normalizeValues(values: number[], method: NormalizationMethod): number[] {
    switch (method) {
      case 'z-score':
        return this.normalizeZScore(values);
      case 'min-max':
        return this.normalizeMinMax(values);
      case 'robust':
        return this.normalizeRobust(values);
      case 'none':
        return [...values]; // Return copy of original values
      default:
        throw new Error(`Unknown normalization method: ${method}`);
    }
  }

  /**
   * Calculate complete performance metrics for a token
   * 
   * @param prices Array of historical prices
   * @param timeframe Number of days for the analysis
   * @param threshold Threshold for Omega ratio calculation
   * @param riskFreeRate Risk-free rate for Sharpe ratio calculation
   * @returns Complete performance metrics
   */
  static calculatePerformanceMetrics(
    prices: number[], 
    timeframe: number,
    threshold: number = 0,
    riskFreeRate: number = 0.02
  ): PerformanceMetrics {
    // Take the last 'timeframe' prices
    const relevantPrices = prices.slice(-timeframe);
    
    if (relevantPrices.length < 2) {
      throw new Error(`Insufficient price data: need at least 2 prices, got ${relevantPrices.length}`);
    }

    // Calculate returns
    const returns = this.calculateReturns(relevantPrices);
    
    // Calculate ratios
    const omegaRatio = this.calculateOmegaRatio(returns, threshold);
    const sharpeRatio = this.calculateSharpeRatio(returns, riskFreeRate);
    const volatility = this.calculateVolatility(returns);
    
    // Calculate maximum drawdown
    const drawdown = this.calculateMaxDrawdown(relevantPrices);

    return {
      omegaRatio,
      sharpeRatio,
      returns,
      volatility,
      drawdown
    };
  }

  /**
   * Calculate maximum drawdown from price series
   * 
   * @param prices Array of price values
   * @returns Maximum drawdown as a percentage (negative value)
   */
  private static calculateMaxDrawdown(prices: number[]): number {
    if (prices.length < 2) {
      return 0;
    }

    let maxDrawdown = 0;
    let peak = prices[0];

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > peak) {
        peak = prices[i];
      } else {
        const drawdown = (prices[i] - peak) / peak;
        if (drawdown < maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }

    return maxDrawdown;
  }
}