/**
 * Simple Crypto Data Service
 * Loads pre-downloaded historical data from static files
 */

import type { CoinGeckoToken, HistoricalData } from '../types/api';

export interface CryptoDataIndex {
  last_updated: string;
  total_tokens: number;
  available_tokens: string[];
  data_source: string;
}

export interface CryptoDataFile {
  symbol: string;
  crypto_id: string;
  name: string;
  last_updated: string;
  data_points: number;
  earliest_date: string;
  latest_date: string;
  prices: [number, number][];
  total_volumes: [number, number][];
}

export class CryptoDataService {
  private dataIndex: CryptoDataIndex | null = null;
  private loadedData: Map<string, CryptoDataFile> = new Map();

  /**
   * Load the data index to see what tokens are available
   */
  async loadDataIndex(): Promise<CryptoDataIndex> {
    if (this.dataIndex) {
      return this.dataIndex;
    }

    try {
      const response = await fetch('/data/index.json');
      if (!response.ok) {
        throw new Error(`Failed to load data index: ${response.status}`);
      }
      
      const dataIndex = await response.json() as CryptoDataIndex;
      this.dataIndex = dataIndex;
      console.log(`📊 Found ${dataIndex.total_tokens} pre-downloaded tokens`);
      return dataIndex;
    } catch (error) {
      throw new Error(`Failed to load crypto data index: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load historical data for a specific token
   */
  async loadTokenData(cryptoId: string): Promise<CryptoDataFile> {
    // Check cache first
    if (this.loadedData.has(cryptoId)) {
      return this.loadedData.get(cryptoId)!;
    }

    try {
      const response = await fetch(`/data/${cryptoId}.json`);
      if (!response.ok) {
        throw new Error(`Token data not found: ${cryptoId}`);
      }
      
      const tokenData = await response.json();
      this.loadedData.set(cryptoId, tokenData);
      return tokenData;
    } catch (error) {
      throw new Error(`Failed to load data for ${cryptoId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all available tokens with basic info
   */
  async getAvailableTokens(): Promise<CoinGeckoToken[]> {
    const index = await this.loadDataIndex();
    const tokens: CoinGeckoToken[] = [];

    for (const cryptoId of index.available_tokens) {
      try {
        const tokenData = await this.loadTokenData(cryptoId);
        
        // Get latest price from the data
        const latestPrice = tokenData.prices.length > 0 
          ? tokenData.prices[tokenData.prices.length - 1][1] 
          : 0;

        // Calculate 24h change (approximate)
        let priceChange24h = 0;
        if (tokenData.prices.length >= 2) {
          const currentPrice = tokenData.prices[tokenData.prices.length - 1][1];
          const previousPrice = tokenData.prices[tokenData.prices.length - 2][1];
          priceChange24h = ((currentPrice - previousPrice) / previousPrice) * 100;
        }

        tokens.push({
          id: cryptoId,
          symbol: tokenData.symbol.replace('-USD', ''),
          name: tokenData.name,
          current_price: latestPrice,
          market_cap: 0, // Not available in our data
          market_cap_rank: 0, // Not available in our data
          price_change_percentage_24h: priceChange24h
        });
      } catch (error) {
        console.warn(`Failed to load token ${cryptoId}:`, error);
      }
    }

    return tokens;
  }

  /**
   * Get historical data for a specific token
   */
  async getHistoricalData(cryptoId: string): Promise<HistoricalData> {
    const tokenData = await this.loadTokenData(cryptoId);
    
    return {
      prices: tokenData.prices,
      market_caps: [], // Not available in our data
      total_volumes: tokenData.total_volumes
    };
  }

  /**
   * Get historical data for multiple tokens
   */
  async getMultipleHistoricalData(cryptoIds: string[]): Promise<Record<string, HistoricalData>> {
    const results: Record<string, HistoricalData> = {};
    
    for (const cryptoId of cryptoIds) {
      try {
        results[cryptoId] = await this.getHistoricalData(cryptoId);
      } catch (error) {
        console.warn(`Failed to load historical data for ${cryptoId}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Get data info/stats
   */
  async getDataInfo() {
    const index = await this.loadDataIndex();
    
    return {
      lastUpdated: index.last_updated,
      totalTokens: index.total_tokens,
      dataSource: index.data_source,
      availableTokens: index.available_tokens
    };
  }
}

// Export singleton instance
export const cryptoDataService = new CryptoDataService();