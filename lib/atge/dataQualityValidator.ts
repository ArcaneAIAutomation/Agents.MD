/**
 * Data Quality Validator for ATGE Historical Price Data
 * 
 * Validates historical price data quality to ensure accurate backtesting results.
 * Implements comprehensive checks for completeness, validity, and consistency.
 * 
 * Requirements: Task 5.4 - Data Quality Validation
 * 
 * Quality Score Calculation:
 * - Completeness (60%): Percentage of expected data points present
 * - Validity (30%): OHLC relationships and price movement checks
 * - Consistency (10%): Timestamp sequence and gap analysis
 * 
 * Quality Score Ranges:
 * - 100%: Perfect data (no gaps, all valid)
 * - 90-99%: Excellent (minor gaps <5%)
 * - 70-89%: Good (some gaps 5-15%)
 * - <70%: Poor (significant gaps >15%)
 */

import { OHLCVDataPoint } from './historicalPriceQuery';

// ============================================================================
// TYPES
// ============================================================================

export interface DataQualityReport {
  overallScore: number;
  completeness: number;
  validityScore: number;
  consistencyScore: number;
  totalDataPoints: number;
  expectedDataPoints: number;
  gaps: GapInfo[];
  anomalies: AnomalyInfo[];
  ohlcViolations: OHLCViolation[];
  suspiciousPriceMovements: PriceMovement[];
  recommendation: 'excellent' | 'good' | 'acceptable' | 'poor';
}

export interface GapInfo {
  startTime: string;
  endTime: string;
  durationMs: number;
  missedDataPoints: number;
}

export interface AnomalyInfo {
  timestamp: string;
  type: 'price_spike' | 'ohlc_violation' | 'volume_anomaly';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface OHLCViolation {
  timestamp: string;
  violation: string;
  values: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
}

export interface PriceMovement {
  timestamp: string;
  priceChange: number;
  percentageChange: number;
  fromPrice: number;
  toPrice: number;
}

export interface ValidationConfig {
  minQualityScore: number;
  maxPriceChangePercent: number;
  maxGapToleranceMultiplier: number;
  minDataPointsRequired: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: ValidationConfig = {
  minQualityScore: 70,
  maxPriceChangePercent: 50,
  maxGapToleranceMultiplier: 1.5,
  minDataPointsRequired: 10
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Validate data quality for historical price data
 * Returns comprehensive quality report with detailed analysis
 */
export function validateDataQuality(
  data: OHLCVDataPoint[],
  startDate: string,
  endDate: string,
  timeframe: '15m' | '1h' | '4h' | '1d' | '1w',
  config: Partial<ValidationConfig> = {}
): DataQualityReport {
  const validationConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Handle empty data
  if (data.length === 0) {
    return createEmptyReport(startDate, endDate, timeframe);
  }
  
  // Calculate expected data points
  const expectedDataPoints = calculateExpectedDataPoints(startDate, endDate, timeframe);
  
  // Perform validation checks
  const gaps = detectGaps(data, timeframe, validationConfig);
  const ohlcViolations = validateOHLCRelationships(data);
  const suspiciousPriceMovements = detectSuspiciousPriceMovements(data, validationConfig);
  
  // Calculate component scores
  const completeness = calculateCompleteness(data.length, expectedDataPoints);
  const validityScore = calculateValidityScore(data, ohlcViolations, suspiciousPriceMovements);
  const consistencyScore = calculateConsistencyScore(data, gaps);
  
  // Calculate overall quality score
  const overallScore = calculateOverallScore(completeness, validityScore, consistencyScore);
  
  // Combine anomalies
  const anomalies = combineAnomalies(ohlcViolations, suspiciousPriceMovements);
  
  // Determine recommendation
  const recommendation = getRecommendation(overallScore);
  
  return {
    overallScore,
    completeness,
    validityScore,
    consistencyScore,
    totalDataPoints: data.length,
    expectedDataPoints,
    gaps,
    anomalies,
    ohlcViolations,
    suspiciousPriceMovements,
    recommendation
  };
}

/**
 * Quick validation check - returns true if data quality meets minimum threshold
 */
export function isDataQualityAcceptable(
  data: OHLCVDataPoint[],
  startDate: string,
  endDate: string,
  timeframe: '15m' | '1h' | '4h' | '1d' | '1w',
  minQualityScore: number = 70
): boolean {
  const report = validateDataQuality(data, startDate, endDate, timeframe, { minQualityScore });
  return report.overallScore >= minQualityScore;
}

// ============================================================================
// GAP DETECTION
// ============================================================================

function detectGaps(
  data: OHLCVDataPoint[],
  timeframe: '15m' | '1h' | '4h' | '1d' | '1w',
  config: ValidationConfig
): GapInfo[] {
  if (data.length < 2) {
    return [];
  }
  
  const gaps: GapInfo[] = [];
  const intervalMs = getTimeframeMs(timeframe);
  const maxGapMs = intervalMs * config.maxGapToleranceMultiplier;
  
  for (let i = 1; i < data.length; i++) {
    const prevTime = new Date(data[i - 1].timestamp).getTime();
    const currTime = new Date(data[i].timestamp).getTime();
    const gapDuration = currTime - prevTime;
    
    if (gapDuration > maxGapMs) {
      const missedDataPoints = Math.floor(gapDuration / intervalMs) - 1;
      
      gaps.push({
        startTime: data[i - 1].timestamp,
        endTime: data[i].timestamp,
        durationMs: gapDuration,
        missedDataPoints
      });
    }
  }
  
  return gaps;
}

// ============================================================================
// OHLC VALIDATION
// ============================================================================

function validateOHLCRelationships(data: OHLCVDataPoint[]): OHLCViolation[] {
  const violations: OHLCViolation[] = [];
  
  for (const point of data) {
    const { timestamp, open, high, low, close } = point;
    const issues: string[] = [];
    
    // High must be >= open and close
    if (high < open) {
      issues.push(`High (${high}) < Open (${open})`);
    }
    if (high < close) {
      issues.push(`High (${high}) < Close (${close})`);
    }
    
    // Low must be <= open and close
    if (low > open) {
      issues.push(`Low (${low}) > Open (${open})`);
    }
    if (low > close) {
      issues.push(`Low (${low}) > Close (${close})`);
    }
    
    // High must be >= low
    if (high < low) {
      issues.push(`High (${high}) < Low (${low})`);
    }
    
    if (issues.length > 0) {
      violations.push({
        timestamp,
        violation: issues.join('; '),
        values: { open, high, low, close }
      });
    }
  }
  
  return violations;
}

// ============================================================================
// PRICE MOVEMENT DETECTION
// ============================================================================

function detectSuspiciousPriceMovements(
  data: OHLCVDataPoint[],
  config: ValidationConfig
): PriceMovement[] {
  if (data.length < 2) {
    return [];
  }
  
  const suspiciousMovements: PriceMovement[] = [];
  const maxChangePercent = config.maxPriceChangePercent;
  
  for (let i = 1; i < data.length; i++) {
    const prevClose = data[i - 1].close;
    const currOpen = data[i].open;
    const priceChange = currOpen - prevClose;
    const percentageChange = Math.abs((priceChange / prevClose) * 100);
    
    // Flag price changes exceeding threshold
    if (percentageChange > maxChangePercent) {
      suspiciousMovements.push({
        timestamp: data[i].timestamp,
        priceChange,
        percentageChange,
        fromPrice: prevClose,
        toPrice: currOpen
      });
    }
  }
  
  return suspiciousMovements;
}

// ============================================================================
// SCORE CALCULATIONS
// ============================================================================

function calculateCompleteness(actualPoints: number, expectedPoints: number): number {
  if (expectedPoints === 0) {
    return 0;
  }
  
  // Cap at 100% (can have more data than expected due to overlaps)
  return Math.min(100, (actualPoints / expectedPoints) * 100);
}

function calculateValidityScore(
  data: OHLCVDataPoint[],
  ohlcViolations: OHLCViolation[],
  suspiciousMovements: PriceMovement[]
): number {
  if (data.length === 0) {
    return 0;
  }
  
  // Calculate penalty for violations
  const ohlcPenalty = (ohlcViolations.length / data.length) * 100;
  const pricePenalty = (suspiciousMovements.length / data.length) * 50; // Less severe
  
  // Total penalty capped at 100
  const totalPenalty = Math.min(100, ohlcPenalty + pricePenalty);
  
  return Math.max(0, 100 - totalPenalty);
}

function calculateConsistencyScore(data: OHLCVDataPoint[], gaps: GapInfo[]): number {
  if (data.length === 0) {
    return 0;
  }
  
  // Calculate total missed data points from gaps
  const totalMissedPoints = gaps.reduce((sum, gap) => sum + gap.missedDataPoints, 0);
  
  // Penalty based on percentage of missed points
  const gapPenalty = (totalMissedPoints / data.length) * 100;
  
  return Math.max(0, 100 - gapPenalty);
}

function calculateOverallScore(
  completeness: number,
  validityScore: number,
  consistencyScore: number
): number {
  // Weighted average: completeness (60%), validity (30%), consistency (10%)
  const score = (completeness * 0.6) + (validityScore * 0.3) + (consistencyScore * 0.1);
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateExpectedDataPoints(
  startDate: string,
  endDate: string,
  timeframe: '15m' | '1h' | '4h' | '1d' | '1w'
): number {
  const startTime = new Date(startDate).getTime();
  const endTime = new Date(endDate).getTime();
  const timeRangeMs = endTime - startTime;
  const intervalMs = getTimeframeMs(timeframe);
  
  return Math.floor(timeRangeMs / intervalMs);
}

function getTimeframeMs(timeframe: '15m' | '1h' | '4h' | '1d' | '1w'): number {
  const timeframeMap = {
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000
  };
  return timeframeMap[timeframe];
}

function combineAnomalies(
  ohlcViolations: OHLCViolation[],
  suspiciousMovements: PriceMovement[]
): AnomalyInfo[] {
  const anomalies: AnomalyInfo[] = [];
  
  // Add OHLC violations
  for (const violation of ohlcViolations) {
    anomalies.push({
      timestamp: violation.timestamp,
      type: 'ohlc_violation',
      description: violation.violation,
      severity: 'high'
    });
  }
  
  // Add suspicious price movements
  for (const movement of suspiciousMovements) {
    anomalies.push({
      timestamp: movement.timestamp,
      type: 'price_spike',
      description: `Price changed ${movement.percentageChange.toFixed(2)}% (${movement.fromPrice} → ${movement.toPrice})`,
      severity: movement.percentageChange > 100 ? 'high' : 'medium'
    });
  }
  
  return anomalies;
}

function getRecommendation(score: number): 'excellent' | 'good' | 'acceptable' | 'poor' {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'acceptable';
  return 'poor';
}

function createEmptyReport(
  startDate: string,
  endDate: string,
  timeframe: '15m' | '1h' | '4h' | '1d' | '1w'
): DataQualityReport {
  const expectedDataPoints = calculateExpectedDataPoints(startDate, endDate, timeframe);
  
  return {
    overallScore: 0,
    completeness: 0,
    validityScore: 0,
    consistencyScore: 0,
    totalDataPoints: 0,
    expectedDataPoints,
    gaps: [],
    anomalies: [],
    ohlcViolations: [],
    suspiciousPriceMovements: [],
    recommendation: 'poor'
  };
}
