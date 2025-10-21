/**
 * Color Coding Utilities for Performance Visualization
 * 
 * Provides color gradient system from red (worst) to green (best) based on normalized scores
 * Implements dynamic color updates when data changes
 */

export interface ColorConfig {
  minColor: [number, number, number]; // RGB for worst performance
  neutralColor: [number, number, number]; // RGB for average performance  
  maxColor: [number, number, number]; // RGB for best performance
  scoreRange: [number, number]; // Min and max expected normalized scores
}

// Default color configuration
export const DEFAULT_COLOR_CONFIG: ColorConfig = {
  minColor: [239, 68, 68], // Red-500
  neutralColor: [248, 250, 252], // Slate-50
  maxColor: [34, 197, 94], // Green-500
  scoreRange: [-3, 3] // Typical Z-score range
};

/**
 * Interpolate between two RGB colors
 */
function interpolateColor(
  color1: [number, number, number],
  color2: [number, number, number],
  factor: number
): [number, number, number] {
  // Clamp factor to 0-1 range
  const t = Math.max(0, Math.min(1, factor));
  
  return [
    Math.round(color1[0] + (color2[0] - color1[0]) * t),
    Math.round(color1[1] + (color2[1] - color1[1]) * t),
    Math.round(color1[2] + (color2[2] - color1[2]) * t)
  ];
}

/**
 * Convert RGB array to CSS color string
 */
function rgbToString(rgb: [number, number, number]): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

/**
 * Get performance color based on normalized score
 * 
 * @param normalizedScore The normalized performance score (typically Z-score)
 * @param config Color configuration (optional, uses default if not provided)
 * @returns CSS color string
 */
export function getPerformanceColor(
  normalizedScore: number,
  config: ColorConfig = DEFAULT_COLOR_CONFIG
): string {
  // Handle invalid scores
  if (!isFinite(normalizedScore)) {
    return rgbToString(config.neutralColor);
  }

  const [minScore, maxScore] = config.scoreRange;
  
  // Clamp score to expected range
  const clampedScore = Math.max(minScore, Math.min(maxScore, normalizedScore));
  
  if (clampedScore > 0) {
    // Positive scores: interpolate from neutral to max (green)
    const factor = clampedScore / maxScore;
    const color = interpolateColor(config.neutralColor, config.maxColor, factor);
    return rgbToString(color);
  } else if (clampedScore < 0) {
    // Negative scores: interpolate from neutral to min (red)
    const factor = Math.abs(clampedScore) / Math.abs(minScore);
    const color = interpolateColor(config.neutralColor, config.minColor, factor);
    return rgbToString(color);
  } else {
    // Neutral score
    return rgbToString(config.neutralColor);
  }
}

/**
 * Get performance color with opacity
 * 
 * @param normalizedScore The normalized performance score
 * @param opacity Opacity value (0-1)
 * @param config Color configuration (optional)
 * @returns CSS color string with alpha
 */
export function getPerformanceColorWithOpacity(
  normalizedScore: number,
  opacity: number = 1,
  config: ColorConfig = DEFAULT_COLOR_CONFIG
): string {
  // Handle invalid scores
  if (!isFinite(normalizedScore)) {
    const [r, g, b] = config.neutralColor;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  const [minScore, maxScore] = config.scoreRange;
  
  // Clamp score to expected range
  const clampedScore = Math.max(minScore, Math.min(maxScore, normalizedScore));
  
  let color: [number, number, number];
  
  if (clampedScore > 0) {
    // Positive scores: interpolate from neutral to max (green)
    const factor = clampedScore / maxScore;
    color = interpolateColor(config.neutralColor, config.maxColor, factor);
  } else if (clampedScore < 0) {
    // Negative scores: interpolate from neutral to min (red)
    const factor = Math.abs(clampedScore) / Math.abs(minScore);
    color = interpolateColor(config.neutralColor, config.minColor, factor);
  } else {
    // Neutral score
    color = config.neutralColor;
  }

  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;
}

/**
 * Get text color that contrasts well with the performance background color
 * 
 * @param normalizedScore The normalized performance score
 * @param config Color configuration (optional)
 * @returns CSS color string for text
 */
export function getContrastTextColor(
  normalizedScore: number,
  config: ColorConfig = DEFAULT_COLOR_CONFIG
): string {
  // Handle invalid scores
  if (!isFinite(normalizedScore)) {
    return '#374151'; // Gray-700 for neutral background
  }

  const [minScore, maxScore] = config.scoreRange;
  const clampedScore = Math.max(minScore, Math.min(maxScore, normalizedScore));
  
  // For extreme values, use white text for better contrast
  if (Math.abs(clampedScore) > Math.abs(maxScore) * 0.7) {
    return '#ffffff';
  }
  
  // For moderate values, use dark text
  return '#374151'; // Gray-700
}

/**
 * Generate a color scale for legend/reference
 * 
 * @param steps Number of color steps to generate
 * @param config Color configuration (optional)
 * @returns Array of color strings from worst to best
 */
export function generateColorScale(
  steps: number = 5,
  config: ColorConfig = DEFAULT_COLOR_CONFIG
): string[] {
  const colors: string[] = [];
  const [minScore, maxScore] = config.scoreRange;
  
  for (let i = 0; i < steps; i++) {
    const factor = i / (steps - 1); // 0 to 1
    const score = minScore + (maxScore - minScore) * factor;
    colors.push(getPerformanceColor(score, config));
  }
  
  return colors;
}

/**
 * Get performance category based on normalized score
 * 
 * @param normalizedScore The normalized performance score
 * @returns Performance category string
 */
export function getPerformanceCategory(normalizedScore: number): string {
  if (!isFinite(normalizedScore)) {
    return 'Unknown';
  }

  if (normalizedScore >= 2) return 'Excellent';
  if (normalizedScore >= 1) return 'Good';
  if (normalizedScore >= -1) return 'Average';
  if (normalizedScore >= -2) return 'Poor';
  return 'Very Poor';
}

/**
 * Create CSS custom properties for performance colors
 * This can be used to inject color variables into CSS
 * 
 * @param config Color configuration (optional)
 * @returns Object with CSS custom property names and values
 */
export function createColorCSSProperties(
  config: ColorConfig = DEFAULT_COLOR_CONFIG
): Record<string, string> {
  return {
    '--performance-color-min': rgbToString(config.minColor),
    '--performance-color-neutral': rgbToString(config.neutralColor),
    '--performance-color-max': rgbToString(config.maxColor),
  };
}