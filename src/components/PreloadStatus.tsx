/**
 * Preload Status Component
 * Shows the current status of data preloading
 */

import React from 'react';
import { useDataPreload } from '../hooks/useDataPreload';

export interface PreloadStatusProps {
  autoStart?: boolean;
  showDetails?: boolean;
  className?: string;
}

export const PreloadStatus: React.FC<PreloadStatusProps> = ({
  autoStart = true,
  showDetails = true,
  className = ''
}) => {
  const { 
    loading,
    error,
    isReady, 
    tokens,
    historicalData,
    dataInfo,
    refreshData
  } = useDataPreload({ autoStart });

  if (!showDetails && isReady && !loading) {
    return null; // Hide when ready and not showing details
  }

  return (
    <div className={`preload-status ${className}`}>
      {loading && (
        <div className="preload-progress">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Loading crypto data...
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse w-full" />
          </div>
          
          <div className="text-xs text-gray-600">
            Loading pre-downloaded historical data...
          </div>
        </div>
      )}

      {!loading && isReady && (
        <div className="preload-ready">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600 font-medium">
              ✓ Data ready ({tokens.length} tokens, {Object.keys(historicalData).length} with history)
            </span>
            {showDetails && (
              <div className="flex gap-2">
                <button
                  onClick={refreshData}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
          
          {showDetails && (
            <div className="text-xs text-gray-500 mt-1">
              Source: {dataInfo.dataSource || 'Yahoo Finance'}
              {dataInfo.lastUpdated && (
                <span className="ml-2">
                  Updated: {new Date(dataInfo.lastUpdated).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {!loading && !isReady && (
        <div className="preload-not-started">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Market data not loaded
            </span>
            <button
              onClick={refreshData}
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Load Data
            </button>
          </div>
        </div>
      )}

      {error && showDetails && (
        <div className="preload-errors mt-2">
          <div className="text-xs text-red-600">
            Error loading data:
          </div>
          <div className="text-xs text-red-500">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};