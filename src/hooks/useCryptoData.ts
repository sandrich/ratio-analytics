/**
 * Custom hook for managing crypto data from pre-downloaded files
 */

import { useState, useEffect } from 'react';
import type { CoinGeckoToken, HistoricalData } from '../types/api';
import { cryptoDataService } from '../services/cryptoDataService';

interface CryptoDataState {
  tokens: CoinGeckoToken[];
  historicalData: Record<string, HistoricalData>;
  loading: boolean;
  error: string | null;
  dataInfo: {
    lastUpdated?: string;
    totalTokens?: number;
    dataSource?: string;
  };
}

export function useCryptoData() {
  const [state, setState] = useState<CryptoDataState>({
    tokens: [],
    historicalData: {},
    loading: true,
    error: null,
    dataInfo: {}
  });

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Load available tokens
        const tokens = await cryptoDataService.getAvailableTokens();
        
        if (!isMounted) return;

        // Load historical data for all tokens
        const tokenIds = tokens.map(t => t.id);
        const historicalData = await cryptoDataService.getMultipleHistoricalData(tokenIds);
        
        if (!isMounted) return;

        // Get data info
        const dataInfo = await cryptoDataService.getDataInfo();

        if (isMounted) {
          setState({
            tokens,
            historicalData,
            loading: false,
            error: null,
            dataInfo
          });
        }

      } catch (error) {
        console.error('Failed to load crypto data:', error);
        
        if (isMounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load data'
          }));
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}

export default useCryptoData;