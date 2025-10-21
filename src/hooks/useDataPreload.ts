/**
 * React Hook for Pre-downloaded Data
 * Simple interface for loading pre-downloaded crypto data
 */

import { useState, useEffect, useCallback } from 'react';
import type { HistoricalData, CoinGeckoToken } from '../types/api';
import { cryptoDataService } from '../services/cryptoDataService';

export interface UseDataPreloadOptions {
  autoStart?: boolean;
}

export interface UseDataPreloadReturn {
  // Status
  loading: boolean;
  error: string | null;
  isReady: boolean;
  
  // Data
  tokens: CoinGeckoToken[];
  historicalData: Record<string, HistoricalData>;
  
  // Data info
  dataInfo: {
    lastUpdated?: string;
    totalTokens?: number;
    dataSource?: string;
  };
  
  // Actions
  refreshData: () => Promise<void>;
}

export function useDataPreload(options: UseDataPreloadOptions = {}): UseDataPreloadReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<CoinGeckoToken[]>([]);
  const [historicalData, setHistoricalData] = useState<Record<string, HistoricalData>>({});
  const [dataInfo, setDataInfo] = useState<{
    lastUpdated?: string;
    totalTokens?: number;
    dataSource?: string;
  }>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load available tokens
      const freshTokens = await cryptoDataService.getAvailableTokens();
      
      // Load historical data for all tokens
      const tokenIds = freshTokens.map(t => t.id);
      const freshHistoricalData = await cryptoDataService.getMultipleHistoricalData(tokenIds);
      
      // Get data info
      const info = await cryptoDataService.getDataInfo();

      setTokens(freshTokens);
      setHistoricalData(freshHistoricalData);
      setDataInfo(info);
      setLoading(false);

    } catch (err) {
      console.error('Failed to load crypto data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setLoading(false);
    }
  }, []);

  // Initialize and auto-start
  useEffect(() => {
    if (options.autoStart !== false) { // Default to true
      loadData();
    }
  }, [loadData, options.autoStart]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const isReady = !loading && tokens.length > 0 && Object.keys(historicalData).length > 0;

  return {
    loading,
    error,
    isReady,
    tokens,
    historicalData,
    dataInfo,
    refreshData
  };
}