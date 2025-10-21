/**
 * Main CryptoAnalyzer Component
 * 
 * This is the main application component that manages:
 * - Token selection state and timeframe configuration
 * - Loading states and error handling UI
 * - Integration with data services and calculation engine
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { 
  TokenData, 
  CryptoAnalyzerProps 
} from '../types';
import { useDataPreload } from '../hooks/useDataPreload';
import { CalculationService } from '../services/calculationService';
import { cryptoDataService } from '../services/cryptoDataService';
import { OmegaRatioTable } from './OmegaRatioTable';
import { SharpeRatioTable } from './SharpeRatioTable';
import { TokenSelectionPanel } from './TokenSelectionPanel';
import { TimeframeConfiguration } from './TimeframeConfiguration';
import { Button } from './ui/button';

// Default configuration
const DEFAULT_TIMEFRAMES = [90, 180, 365, 990, 2000];

// Helper function to format date for display
const formatLastUpdated = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffHours === 0) {
        return 'Updated less than an hour ago';
      }
      return `Updated ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays === 1) {
      return 'Updated yesterday';
    } else if (diffDays < 7) {
      return `Updated ${diffDays} days ago`;
    } else {
      return `Updated on ${date.toLocaleDateString()}`;
    }
  } catch {
    return 'Update time unknown';
  }
};

export const CryptoAnalyzer: React.FC<CryptoAnalyzerProps> = ({
  initialTimeframes = DEFAULT_TIMEFRAMES
}) => {
  // State management
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [timeframes, setTimeframes] = useState<number[]>(initialTimeframes);

  const [tokenData, setTokenData] = useState<TokenData[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [dataInfo, setDataInfo] = useState<{
    lastUpdated: string;
    totalTokens: number;
    dataSource: string;
  } | null>(null);

  // Data loading hook
  const { 
    tokens, 
    historicalData, 
    isReady
  } = useDataPreload({ autoStart: true });
  
  const isLoading = !isReady;
  const dataError = null; // useDataPreload doesn't expose error state directly

  // Initialize selected tokens when tokens are loaded (only once)
  useEffect(() => {
    if (tokens.length > 0 && !hasInitialized) {
      // Select all tokens by default (requirement 1.3)
      const allTokenIds = tokens.map(token => token.id);
      setSelectedTokenIds(allTokenIds);
      setHasInitialized(true);
    }
  }, [tokens, hasInitialized]);

  // Load data info for freshness indicator
  useEffect(() => {
    const loadDataInfo = async () => {
      try {
        const info = await cryptoDataService.getDataInfo();
        setDataInfo(info);
      } catch (error) {
        console.warn('Failed to load data info:', error);
      }
    };

    loadDataInfo();
  }, []);

  // Calculate performance metrics for selected tokens
  const calculateMetrics = useCallback(async () => {
    if (!isReady || selectedTokenIds.length === 0) {
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);

    try {
      const calculatedTokenData: TokenData[] = [];

      for (const tokenId of selectedTokenIds) {
        const token = tokens.find(t => t.id === tokenId);
        const prices = historicalData[tokenId]?.prices;

        if (!token || !prices || prices.length < 2) {
          console.warn(`Insufficient data for token ${tokenId}`);
          continue;
        }

        // Extract price values from [timestamp, price] pairs and clean invalid data
        const rawPriceValues = prices.map(([, price]) => price);
        
        // Filter out invalid prices (NaN, Infinity, null, undefined, negative, zero)
        const priceValues = rawPriceValues.filter(price => 
          typeof price === 'number' && 
          isFinite(price) && 
          price > 0
        );
        
        // Skip if we don't have enough valid price data
        if (priceValues.length < 2) {
          console.warn(`Insufficient valid price data for token ${tokenId}: ${priceValues.length} valid prices out of ${rawPriceValues.length}`);
          continue;
        }

        // Calculate ratios for each timeframe
        const omegaRatios: Record<number, number> = {};
        const sharpeRatios: Record<number, number> = {};

        for (const timeframe of timeframes) {
          // Skip if token doesn't have enough data for this timeframe
          if (priceValues.length < timeframe) {
            console.warn(`Token ${tokenId} only has ${priceValues.length} days of data, skipping ${timeframe}-day analysis`);
            continue; // Skip this timeframe entirely
          }

          try {
            console.log(`DEBUG: Calculating ${tokenId} for ${timeframe} days with ${priceValues.length} prices`);
            console.log(`DEBUG: First 5 prices:`, priceValues.slice(0, 5));
            console.log(`DEBUG: Last 5 prices:`, priceValues.slice(-5));
            
            const metrics = CalculationService.calculatePerformanceMetrics(
              priceValues,
              timeframe
            );
            
            console.log(`DEBUG: ${tokenId} ${timeframe}d - Omega: ${metrics.omegaRatio}, Sharpe: ${metrics.sharpeRatio}`);
            
            omegaRatios[timeframe] = metrics.omegaRatio;
            sharpeRatios[timeframe] = metrics.sharpeRatio;
          } catch (error) {
            console.error(`ERROR: Failed to calculate metrics for ${tokenId} at ${timeframe} days:`, error);
            // Skip this timeframe on error instead of setting to 0
            continue;
          }
        }


        
        calculatedTokenData.push({
          id: token.id,
          symbol: token.symbol,
          name: token.name,
          selected: true,
          omegaRatios,
          sharpeRatios,
          normalizedOmega: {},
          normalizedSharpe: {},
          averageOmegaScore: 0,
          averageSharpeScore: 0,
          overallAverageScore: 0
        });
      }

      // Apply smooth gradient coloring based on relative performance
      if (calculatedTokenData.length > 0) {
        // Normalize Omega ratios for smooth color gradients
        for (const timeframe of timeframes) {
          const omegaValues = calculatedTokenData
            .map(token => token.omegaRatios[timeframe])
            .filter(val => val !== undefined) as number[];
          
          if (omegaValues.length > 0) {
            // Use min-max normalization for smooth color gradients (0 to 1 range)
            const min = Math.min(...omegaValues);
            const max = Math.max(...omegaValues);
            const range = max - min;
            
            let valueIndex = 0;
            calculatedTokenData.forEach(token => {
              if (token.omegaRatios[timeframe] !== undefined) {
                const rawValue = token.omegaRatios[timeframe];
                // Normalize to 0-1 range, then scale to -3 to +3 for color coding
                const normalized = range > 0 ? (rawValue - min) / range : 0.5;
                const colorScore = (normalized - 0.5) * 6; // Maps 0-1 to -3 to +3
                token.normalizedOmega[timeframe] = colorScore;
                valueIndex++;
              }
            });
          }
        }
        
        // Normalize Sharpe ratios for smooth color gradients
        for (const timeframe of timeframes) {
          const sharpeValues = calculatedTokenData
            .map(token => token.sharpeRatios[timeframe])
            .filter(val => val !== undefined) as number[];
          
          if (sharpeValues.length > 0) {
            // Use min-max normalization for smooth color gradients
            const min = Math.min(...sharpeValues);
            const max = Math.max(...sharpeValues);
            const range = max - min;
            
            let valueIndex = 0;
            calculatedTokenData.forEach(token => {
              if (token.sharpeRatios[timeframe] !== undefined) {
                const rawValue = token.sharpeRatios[timeframe];
                // Normalize to 0-1 range, then scale to -3 to +3 for color coding
                const normalized = range > 0 ? (rawValue - min) / range : 0.5;
                const colorScore = (normalized - 0.5) * 6; // Maps 0-1 to -3 to +3
                token.normalizedSharpe[timeframe] = colorScore;
                valueIndex++;
              }
            });
          }
        }
        


        // Calculate average raw ratios for ranking
        calculatedTokenData.forEach(token => {
          const omegaValues = Object.values(token.omegaRatios);
          const sharpeValues = Object.values(token.sharpeRatios);
          
          token.averageOmegaScore = omegaValues.length > 0
            ? omegaValues.reduce((sum, val) => sum + val, 0) / omegaValues.length
            : 0;
            
          token.averageSharpeScore = sharpeValues.length > 0
            ? sharpeValues.reduce((sum, val) => sum + val, 0) / sharpeValues.length
            : 0;
            
          // Overall average for ranking (equal weight to both ratios)
          const validValues = [...omegaValues, ...sharpeValues];
          token.overallAverageScore = validValues.length > 0
            ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length
            : 0;
        });

        // Sort by overall average score (requirement 4.1)
        calculatedTokenData.sort((a, b) => b.overallAverageScore - a.overallAverageScore);
      }


      setTokenData(calculatedTokenData);
    } catch (error) {
      console.error('Calculation error:', error);
      setCalculationError(error instanceof Error ? error.message : 'Unknown calculation error');
    } finally {
      setIsCalculating(false);
    }
  }, [isReady, selectedTokenIds, tokens, historicalData, timeframes]);

  // Recalculate when dependencies change
  useEffect(() => {
    if (isReady && selectedTokenIds.length > 0) {
      calculateMetrics();
    }
  }, [calculateMetrics, isReady, selectedTokenIds]);

  // Handle token selection changes
  const handleTokenSelectionChange = useCallback((newSelectedTokenIds: string[]) => {
    console.log('CryptoAnalyzer received selection change:', newSelectedTokenIds);
    setSelectedTokenIds(newSelectedTokenIds);
  }, []);

  // Handle timeframe changes
  const handleTimeframesChange = useCallback((newTimeframes: number[]) => {
    setTimeframes(newTimeframes);
  }, []);



  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Crypto Data</h2>
          <p className="text-gray-600">Fetching historical data for analysis...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (dataError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Data Loading Error</h2>
          <p className="text-gray-600 mb-4">{dataError}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Ratio Analytics
              </h1>
              <p className="text-gray-600 mb-2">
                Advanced portfolio risk analysis using Omega and Sharpe ratios across multiple timeframes
              </p>
              {dataInfo && (
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatLastUpdated(dataInfo.lastUpdated)}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {dataInfo.totalTokens} tokens via {dataInfo.dataSource}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/sandrich/ratio-analytics"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </header>

        {/* Configuration Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Token Selection */}
          <div className="lg:col-span-1">
            <TokenSelectionPanel
              availableTokens={tokens}
              selectedTokens={selectedTokenIds}
              onSelectionChange={handleTokenSelectionChange}
            />
          </div>

          {/* Timeframe Configuration */}
          <div className="lg:col-span-1">
            <TimeframeConfiguration
              timeframes={timeframes}
              onTimeframesChange={handleTimeframesChange}
            />
          </div>

          {/* Performance Legend */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">
                Color Legend
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Color Coding:</strong>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(34, 197, 94)' }}></div>
                      <span>Best performing (relative to others)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(248, 250, 252)' }}></div>
                      <span>Average performance</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(239, 68, 68)' }}></div>
                      <span>Worst performing (relative to others)</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  <strong>Note:</strong> Colors show relative performance within the selected tokens and timeframes. Higher Omega and Sharpe ratios indicate better risk-adjusted returns.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status and Actions */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                Analysis Status
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedTokenIds.length} tokens selected • {timeframes.length} timeframes
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {isCalculating && (
                <div className="flex items-center text-primary">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  <span className="text-sm">Calculating...</span>
                </div>
              )}
              <Button 
                onClick={calculateMetrics}
                disabled={isCalculating || selectedTokenIds.length === 0}
              >
                Recalculate
              </Button>
            </div>
          </div>
          
          {calculationError && (
            <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{calculationError}</p>
            </div>
          )}
        </div>

        {/* Results Tables */}
        {tokenData.length > 0 && (
          <div className="space-y-8">
            <OmegaRatioTable
              tokens={tokenData}
              timeframes={timeframes}
            />
            <SharpeRatioTable
              tokens={tokenData}
              timeframes={timeframes}
            />
          </div>
        )}

        {/* Empty State */}
        {!isCalculating && tokenData.length === 0 && selectedTokenIds.length > 0 && (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-12 text-center">
            <div className="text-muted-foreground text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">
              No Results Yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Click "Recalculate" to analyze the selected tokens with current settings.
            </p>
            <Button onClick={calculateMetrics}>
              Start Analysis
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};