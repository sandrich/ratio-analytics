/**
 * Timeframe Configuration Component
 * 
 * Provides interface for configuring analysis timeframes with:
 * - Input fields for custom timeframe values
 * - Preset timeframe buttons (90, 180, 365, 990, 2000 days)
 * - Validation for timeframe inputs
 */

import React, { useState } from 'react';
import type { TimeframeConfigurationProps } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';

// Preset timeframe options
const PRESET_TIMEFRAMES = [
  { label: '90 days', value: 90 },
  { label: '180 days', value: 180 },
  { label: '365 days', value: 365 },
  { label: '990 days', value: 990 },
  { label: '2000 days', value: 2000 }
];

export const TimeframeConfiguration: React.FC<TimeframeConfigurationProps> = ({
  timeframes,
  onTimeframesChange
}) => {
  const [customTimeframe, setCustomTimeframe] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate timeframe value
  const validateTimeframe = (value: number): string | null => {
    if (!Number.isInteger(value) || value <= 0) {
      return 'Timeframe must be a positive integer';
    }
    if (value < 7) {
      return 'Timeframe must be at least 7 days';
    }
    if (value > 3000) {
      return 'Timeframe cannot exceed 3000 days';
    }
    return null;
  };

  // Handle adding custom timeframe
  const handleAddCustomTimeframe = () => {
    const value = parseInt(customTimeframe.trim());
    
    if (isNaN(value)) {
      setValidationError('Please enter a valid number');
      return;
    }

    const error = validateTimeframe(value);
    if (error) {
      setValidationError(error);
      return;
    }

    if (timeframes.includes(value)) {
      setValidationError('This timeframe is already added');
      return;
    }

    // Add the new timeframe and sort
    const newTimeframes = [...timeframes, value].sort((a, b) => a - b);
    onTimeframesChange(newTimeframes);
    setCustomTimeframe('');
    setValidationError(null);
  };

  // Handle removing timeframe
  const handleRemoveTimeframe = (timeframe: number) => {
    if (timeframes.length <= 1) {
      setValidationError('At least one timeframe is required');
      return;
    }
    
    const newTimeframes = timeframes.filter(t => t !== timeframe);
    onTimeframesChange(newTimeframes);
    setValidationError(null);
  };

  // Handle preset timeframe toggle
  const handlePresetToggle = (presetValue: number) => {
    if (timeframes.includes(presetValue)) {
      handleRemoveTimeframe(presetValue);
    } else {
      const newTimeframes = [...timeframes, presetValue].sort((a, b) => a - b);
      onTimeframesChange(newTimeframes);
    }
  };

  // Handle reset to defaults
  const handleResetToDefaults = () => {
    onTimeframesChange([90, 180, 365, 990, 2000]);
    setValidationError(null);
  };

  // Handle custom timeframe input
  const handleCustomTimeframeChange = (value: string) => {
    setCustomTimeframe(value);
    setValidationError(null);
  };

  // Handle Enter key in custom input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCustomTimeframe();
    }
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Analysis Timeframes
        </h3>
        <span className="text-sm text-muted-foreground">
          {timeframes.length} timeframe{timeframes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Current Timeframes */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-card-foreground mb-2">
          Current Timeframes (days)
        </h4>
        <div className="flex flex-wrap gap-2">
          {timeframes.sort((a, b) => a - b).map((timeframe) => (
            <div
              key={timeframe}
              className="flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm border"
            >
              <span>{timeframe}</span>
              <button
                onClick={() => handleRemoveTimeframe(timeframe)}
                className="ml-2 text-primary hover:text-primary/80 font-bold"
                title="Remove timeframe"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Preset Timeframes */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-card-foreground mb-2">
          Preset Timeframes
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_TIMEFRAMES.map((preset) => {
            const isActive = timeframes.includes(preset.value);
            
            return (
              <Button
                key={preset.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetToggle(preset.value)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Custom Timeframe Input */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-card-foreground mb-2">
          Add Custom Timeframe
        </h4>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Enter days (7-3000)"
            value={customTimeframe}
            onChange={(e) => handleCustomTimeframeChange(e.target.value)}
            onKeyPress={handleKeyPress}
            min="7"
            max="3000"
            className="flex-1"
          />
          <Button
            onClick={handleAddCustomTimeframe}
            disabled={!customTimeframe.trim()}
            size="sm"
          >
            Add
          </Button>
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{validationError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetToDefaults}
        >
          Reset to Defaults
        </Button>
        
        <div className="text-xs text-muted-foreground">
          Timeframes: 7-3000 days
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-muted rounded-md border">
        <p className="text-xs text-muted-foreground">
          <strong>Tip:</strong> Shorter timeframes (90-365 days) show recent performance, 
          while longer timeframes (990-2000 days) reveal long-term trends. 
          Use multiple timeframes for comprehensive analysis.
        </p>
      </div>
    </div>
  );
};