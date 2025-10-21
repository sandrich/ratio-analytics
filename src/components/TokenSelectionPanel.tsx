/**
 * Token Selection Panel Component
 * 
 * Provides checkbox-based token selection interface with:
 * - Select-all and deselect-all functionality
 * - Search/filter functionality for token list
 * - Individual token selection controls
 */

import React, { useState, useMemo } from 'react';
import type { TokenSelectionPanelProps } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';

export const TokenSelectionPanel: React.FC<TokenSelectionPanelProps> = ({
  availableTokens,
  selectedTokens,
  onSelectionChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tokens based on search query
  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableTokens;
    }

    const query = searchQuery.toLowerCase();
    return availableTokens.filter(token => 
      token.name.toLowerCase().includes(query) ||
      token.symbol.toLowerCase().includes(query) ||
      token.id.toLowerCase().includes(query)
    );
  }, [availableTokens, searchQuery]);

  // Handle individual token selection
  const handleTokenToggle = (tokenId: string) => {
    const isSelected = selectedTokens.includes(tokenId);
    
    if (isSelected) {
      // Remove token from selection
      onSelectionChange(selectedTokens.filter(id => id !== tokenId));
    } else {
      // Add token to selection
      onSelectionChange([...selectedTokens, tokenId]);
    }
  };

  // Handle select all filtered tokens
  const handleSelectAll = () => {
    const filteredTokenIds = filteredTokens.map(token => token.id);
    const newSelection = [...new Set([...selectedTokens, ...filteredTokenIds])];
    onSelectionChange(newSelection);
  };

  // Handle deselect all tokens
  const handleDeselectAll = () => {
    console.log('Deselect All clicked - current selections:', selectedTokens);
    onSelectionChange([]);
    console.log('Deselect All - called onSelectionChange with empty array');
  };

  const selectedCount = selectedTokens.length;
  const filteredSelectedCount = filteredTokens.filter(token => 
    selectedTokens.includes(token.id)
  ).length;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Token Selection
        </h3>
        <span className="text-sm text-muted-foreground">
          {selectedCount} of {availableTokens.length} selected
        </span>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search tokens..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={filteredSelectedCount === filteredTokens.length}
        >
          {searchQuery ? `Select Filtered (${filteredTokens.length})` : 'Select All'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDeselectAll}
          disabled={selectedCount === 0}
        >
          Deselect All
        </Button>
      </div>

      {/* Token List */}
      <div className="max-h-48 overflow-y-auto border rounded-md p-3">
        {filteredTokens.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {filteredTokens.map((token) => {
              const isSelected = selectedTokens.includes(token.id);
              
              return (
                <button
                  key={token.id}
                  className={`px-2 py-1 text-xs font-medium rounded border cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-muted hover:bg-accent border-border'
                  }`}
                  onClick={() => handleTokenToggle(token.id)}
                  title={token.name}
                >
                  {token.symbol}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery ? (
              <>
                <div className="text-4xl mb-2">🔍</div>
                <p>No tokens found matching "{searchQuery}"</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">📊</div>
                <p>No tokens available</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      {searchQuery && (
        <div className="mt-4 p-3 bg-muted rounded-md border">
          <p className="text-sm text-muted-foreground">
            Showing {filteredTokens.length} of {availableTokens.length} tokens
            {filteredSelectedCount > 0 && (
              <span> • {filteredSelectedCount} selected in current filter</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};