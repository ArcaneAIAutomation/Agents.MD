/**
 * Support and Resistance Level Detection
 * Identifies key price levels using multiple methods
 * Requirements: 7.4
 */

import { OHLCVData } from './technicalIndicators';

export interface PriceLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: 'strong' | 'moderate' | 'weak';
  confidence: number; // 0-100
  method: 'pivot' | 'volume_profile' | 'fibonacci' | 'psychological';
  touches: number; // Number of times price touched this level
  lastTouch?: number; // Timestamp of last touch
  description: string;
}

export interface SupportResistanceAnalysis {
  levels: PriceLevel[];
  currentPrice: number;
  nearestSupport: PriceLevel | null;
  nearestResistance: PriceLevel | null;
  keyLevels: {
    strongSupports: PriceLevel[];
    strongResistances: PriceLevel[];
  };
  summary: string;
}

/**
 * Detect all support and resistance levels
 */
export function detectSupportResistance(
  data: OHLCVData[],
  currentPrice: number
): SupportResistanceAnalysis {
  const allLevels: PriceLevel[] = [];

  // 1. Pivot point levels
  const pivotLevels = detectPivotPoints(data);
  allLevels.push(...pivotLevels);

  // 2. Volume profile levels
  const volumeLevels = detectVolumeProfileLevels(data);
  allLevels.push(...volumeLevels);

  // 3. Fibonacci levels
  const fibLevels = detectFibonacciLevels(data, currentPrice);
  allLevels.push(...fibLevels);

  // 4. Psychological levels
  const psychLevels = detectPsychologicalLevels(currentPrice);
  allLevels.push(...psychLevels);

  // Merge similar levels and sort by price
  const mergedLevels = mergeSimilarLevels(allLevels);
  const sortedLevels = mergedLevels.sort((a, b) => b.price - a.price);

  // Find nearest support and resistance
  const nearestSupport = sortedLevels
    .filter(l => l.type === 'support' && l.price < currentPrice)
    .sort((a, b) => b.price - a.price)[0] || null;

  const nearestResistance = sortedLevels
    .filter(l => l.type === 'resistance' && l.price > currentPrice)
    .sort((a, b) => a.price - b.price)[0] || null;

  // Identify key levels (strong confidence)
  const strongSupports = sortedLevels
    .filter(l => l.type === 'support' && l.strength === 'strong')
    .slice(0, 3);

  const strongResistances = sortedLevels
    .filter(l => l.type === 'resistance' && l.strength === 'strong')
    .slice(0, 3);

  // Generate summary
  const summary = generateSummary(
    currentPrice,
    nearestSupport,
    nearestResistance,
    strongSupports,
    strongResistances
  );

  return {
    levels: sortedLevels,
    currentPrice,
    nearestSupport,
    nearestResistance,
    keyLevels: {
      strongSupports,
      strongResistances
    },
    summary
  };
}

/**
 * Detect pivot points (swing highs and lows)
 */
function detectPivotPoints(data: OHLCVData[]): PriceLevel[] {
  const levels: PriceLevel[] = [];
  const lookback = 5; // Look 5 candles back and forward

  for (let i = lookback; i < data.length - lookback; i++) {
    const current = data[i];
    
    // Check for swing high (resistance)
    let isSwingHigh = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && data[j].high >= current.high) {
        isSwingHigh = false;
        break;
      }
    }

    if (isSwingHigh) {
      // Count touches
      const touches = countTouches(data, current.high, 0.005); // 0.5% tolerance
      
      levels.push({
        price: current.high,
        type: 'resistance',
        strength: touches >= 3 ? 'strong' : touches >= 2 ? 'moderate' : 'weak',
        confidence: Math.min(95, 60 + (touches * 10)),
        method: 'pivot',
        touches,
        lastTouch: current.timestamp,
        description: `Swing high at ${current.high.toFixed(2)} (${touches} touches)`
      });
    }

    // Check for swing low (support)
    let isSwingLow = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && data[j].low <= current.low) {
        isSwingLow = false;
        break;
      }
    }

    if (isSwingLow) {
      const touches = countTouches(data, current.low, 0.005);
      
      levels.push({
        price: current.low,
        type: 'support',
        strength: touches >= 3 ? 'strong' : touches >= 2 ? 'moderate' : 'weak',
        confidence: Math.min(95, 60 + (touches * 10)),
        method: 'pivot',
        touches,
        lastTouch: current.timestamp,
        description: `Swing low at ${current.low.toFixed(2)} (${touches} touches)`
      });
    }
  }

  return levels;
}

/**
 * Detect volume profile levels (high volume nodes)
 */
function detectVolumeProfileLevels(data: OHLCVData[]): PriceLevel[] {
  const levels: PriceLevel[] = [];
  
  // Create price bins
  const prices = data.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const binCount = 20;
  const binSize = (maxPrice - minPrice) / binCount;

  const volumeByPrice: Map<number, number> = new Map();

  // Aggregate volume by price level
  for (const candle of data) {
    const bin = Math.floor((candle.close - minPrice) / binSize);
    const priceLevel = minPrice + (bin * binSize);
    volumeByPrice.set(priceLevel, (volumeByPrice.get(priceLevel) || 0) + candle.volume);
  }

  // Find high volume nodes (top 20%)
  const sortedVolumes = Array.from(volumeByPrice.entries())
    .sort((a, b) => b[1] - a[1]);
  
  const topCount = Math.ceil(sortedVolumes.length * 0.2);
  const topVolumes = sortedVolumes.slice(0, topCount);

  const currentPrice = data[data.length - 1].close;

  for (const [price, volume] of topVolumes) {
    const type = price < currentPrice ? 'support' : 'resistance';
    const maxVolume = sortedVolumes[0][1];
    const volumeRatio = volume / maxVolume;

    levels.push({
      price,
      type,
      strength: volumeRatio > 0.8 ? 'strong' : volumeRatio > 0.5 ? 'moderate' : 'weak',
      confidence: Math.round(50 + (volumeRatio * 40)),
      method: 'volume_profile',
      touches: 0,
      description: `High volume node at ${price.toFixed(2)} (${volumeRatio.toFixed(0)}% of max volume)`
    });
  }

  return levels;
}

/**
 * Detect Fibonacci retracement levels
 */
function detectFibonacciLevels(data: OHLCVData[], currentPrice: number): PriceLevel[] {
  const levels: PriceLevel[] = [];
  
  // Find swing high and low in recent data
  const recentData = data.slice(-100);
  const high = Math.max(...recentData.map(d => d.high));
  const low = Math.min(...recentData.map(d => d.low));
  const diff = high - low;

  // Fibonacci ratios
  const fibRatios = [
    { ratio: 0.236, label: '23.6%' },
    { ratio: 0.382, label: '38.2%' },
    { ratio: 0.5, label: '50%' },
    { ratio: 0.618, label: '61.8%' },
    { ratio: 0.786, label: '78.6%' }
  ];

  for (const fib of fibRatios) {
    const price = high - (diff * fib.ratio);
    const type = price < currentPrice ? 'support' : 'resistance';
    
    // Higher confidence for key Fibonacci levels (38.2%, 50%, 61.8%)
    const isKeyLevel = [0.382, 0.5, 0.618].includes(fib.ratio);
    const confidence = isKeyLevel ? 75 : 65;

    levels.push({
      price,
      type,
      strength: isKeyLevel ? 'moderate' : 'weak',
      confidence,
      method: 'fibonacci',
      touches: 0,
      description: `Fibonacci ${fib.label} retracement at ${price.toFixed(2)}`
    });
  }

  return levels;
}

/**
 * Detect psychological levels (round numbers)
 */
function detectPsychologicalLevels(currentPrice: number): PriceLevel[] {
  const levels: PriceLevel[] = [];
  
  // Determine appropriate round number intervals based on price
  let interval: number;
  if (currentPrice < 1) {
    interval = 0.1;
  } else if (currentPrice < 10) {
    interval = 1;
  } else if (currentPrice < 100) {
    interval = 10;
  } else if (currentPrice < 1000) {
    interval = 100;
  } else if (currentPrice < 10000) {
    interval = 1000;
  } else {
    interval = 5000;
  }

  // Find nearby round numbers
  const lowerBound = currentPrice * 0.8;
  const upperBound = currentPrice * 1.2;

  for (let price = Math.floor(lowerBound / interval) * interval; 
       price <= upperBound; 
       price += interval) {
    
    if (price <= 0) continue;
    
    const type = price < currentPrice ? 'support' : 'resistance';
    const distance = Math.abs(price - currentPrice) / currentPrice;
    
    // Closer psychological levels have higher confidence
    const confidence = Math.round(70 - (distance * 100));

    levels.push({
      price,
      type,
      strength: 'weak',
      confidence: Math.max(50, Math.min(80, confidence)),
      method: 'psychological',
      touches: 0,
      description: `Psychological level at ${price.toFixed(2)}`
    });
  }

  return levels;
}

/**
 * Count how many times price touched a level
 */
function countTouches(data: OHLCVData[], level: number, tolerance: number): number {
  let touches = 0;
  const range = level * tolerance;

  for (const candle of data) {
    if (Math.abs(candle.high - level) <= range || Math.abs(candle.low - level) <= range) {
      touches++;
    }
  }

  return touches;
}

/**
 * Merge similar levels (within 1% of each other)
 */
function mergeSimilarLevels(levels: PriceLevel[]): PriceLevel[] {
  if (levels.length === 0) return [];

  const merged: PriceLevel[] = [];
  const sorted = levels.sort((a, b) => a.price - b.price);
  
  let currentGroup: PriceLevel[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const groupAvg = currentGroup.reduce((sum, l) => sum + l.price, 0) / currentGroup.length;
    
    // If within 1% of group average, add to group
    if (Math.abs(current.price - groupAvg) / groupAvg < 0.01) {
      currentGroup.push(current);
    } else {
      // Merge current group and start new group
      merged.push(mergeGroup(currentGroup));
      currentGroup = [current];
    }
  }

  // Merge last group
  if (currentGroup.length > 0) {
    merged.push(mergeGroup(currentGroup));
  }

  return merged;
}

/**
 * Merge a group of similar levels into one
 */
function mergeGroup(group: PriceLevel[]): PriceLevel {
  // Calculate weighted average price (weighted by confidence)
  const totalConfidence = group.reduce((sum, l) => sum + l.confidence, 0);
  const weightedPrice = group.reduce((sum, l) => sum + (l.price * l.confidence), 0) / totalConfidence;

  // Determine type (majority vote)
  const supportCount = group.filter(l => l.type === 'support').length;
  const type = supportCount > group.length / 2 ? 'support' : 'resistance';

  // Calculate average confidence
  const avgConfidence = totalConfidence / group.length;

  // Determine strength based on number of methods agreeing
  let strength: 'strong' | 'moderate' | 'weak';
  if (group.length >= 3) {
    strength = 'strong';
  } else if (group.length >= 2) {
    strength = 'moderate';
  } else {
    strength = group[0].strength;
  }

  // Combine methods
  const methods = [...new Set(group.map(l => l.method))].join(', ');

  // Sum touches
  const totalTouches = group.reduce((sum, l) => sum + l.touches, 0);

  return {
    price: weightedPrice,
    type,
    strength,
    confidence: Math.round(avgConfidence),
    method: methods as any,
    touches: totalTouches,
    description: `${type} at ${weightedPrice.toFixed(2)} (${methods}, ${totalTouches} touches)`
  };
}

/**
 * Generate summary of support/resistance analysis
 */
function generateSummary(
  currentPrice: number,
  nearestSupport: PriceLevel | null,
  nearestResistance: PriceLevel | null,
  strongSupports: PriceLevel[],
  strongResistances: PriceLevel[]
): string {
  let summary = `Current price: $${currentPrice.toFixed(2)}. `;

  if (nearestSupport) {
    const distance = ((currentPrice - nearestSupport.price) / currentPrice * 100).toFixed(2);
    summary += `Nearest support at $${nearestSupport.price.toFixed(2)} (${distance}% below, ${nearestSupport.strength} strength). `;
  } else {
    summary += `No clear support levels identified below current price. `;
  }

  if (nearestResistance) {
    const distance = ((nearestResistance.price - currentPrice) / currentPrice * 100).toFixed(2);
    summary += `Nearest resistance at $${nearestResistance.price.toFixed(2)} (${distance}% above, ${nearestResistance.strength} strength). `;
  } else {
    summary += `No clear resistance levels identified above current price. `;
  }

  if (strongSupports.length > 0) {
    summary += `${strongSupports.length} strong support level(s) identified. `;
  }

  if (strongResistances.length > 0) {
    summary += `${strongResistances.length} strong resistance level(s) identified. `;
  }

  return summary;
}

/**
 * Calculate distance to nearest levels
 */
export function calculateLevelDistances(
  currentPrice: number,
  levels: PriceLevel[]
): {
  nearestSupportDistance: number | null;
  nearestResistanceDistance: number | null;
  supportLevelsBelow: number;
  resistanceLevelsAbove: number;
} {
  const supports = levels.filter(l => l.type === 'support' && l.price < currentPrice);
  const resistances = levels.filter(l => l.type === 'resistance' && l.price > currentPrice);

  const nearestSupport = supports.sort((a, b) => b.price - a.price)[0];
  const nearestResistance = resistances.sort((a, b) => a.price - b.price)[0];

  return {
    nearestSupportDistance: nearestSupport 
      ? ((currentPrice - nearestSupport.price) / currentPrice * 100)
      : null,
    nearestResistanceDistance: nearestResistance
      ? ((nearestResistance.price - currentPrice) / currentPrice * 100)
      : null,
    supportLevelsBelow: supports.length,
    resistanceLevelsAbove: resistances.length
  };
}
