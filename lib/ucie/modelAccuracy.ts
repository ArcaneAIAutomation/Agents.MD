/**
 * Model Accuracy Tracking for UCIE
 * 
 * Stores predictions in database with timestamps
 * Compares predictions to actual outcomes
 * Calculates accuracy metrics (MAE, RMSE, directional accuracy)
 */

export interface PredictionRecord {
  id?: string;
  symbol: string;
  predictionTimestamp: number;
  targetTimestamp: number;
  timeframe: '24h' | '7d' | '30d';
  predictedPrice: number;
  actualPrice?: number;
  currentPrice: number;
  confidence: number;
  methodology: string;
  validated: boolean;
  validatedAt?: number;
}

export interface AccuracyMetrics {
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Square Error
  mape: number; // Mean Absolute Percentage Error
  directionalAccuracy: number; // Percentage of correct direction predictions
  totalPredictions: number;
  validatedPredictions: number;
}

export interface TimeframeAccuracy {
  '24h': AccuracyMetrics;
  '7d': AccuracyMetrics;
  '30d': AccuracyMetrics;
  overall: AccuracyMetrics;
}

export interface ModelPerformance {
  last30Days: number; // 0-100 score
  last90Days: number; // 0-100 score
  allTime: number; // 0-100 score
  byTimeframe: TimeframeAccuracy;
  recentPredictions: PredictionRecord[];
}

/**
 * Calculate Mean Absolute Error
 */
function calculateMAE(predictions: PredictionRecord[]): number {
  if (predictions.length === 0) return 0;
  
  const errors = predictions.map(p => 
    Math.abs(p.predictedPrice - (p.actualPrice || 0))
  );
  
  return errors.reduce((sum, err) => sum + err, 0) / errors.length;
}

/**
 * Calculate Root Mean Square Error
 */
function calculateRMSE(predictions: PredictionRecord[]): number {
  if (predictions.length === 0) return 0;
  
  const squaredErrors = predictions.map(p => 
    Math.pow(p.predictedPrice - (p.actualPrice || 0), 2)
  );
  
  const mse = squaredErrors.reduce((sum, err) => sum + err, 0) / squaredErrors.length;
  return Math.sqrt(mse);
}

/**
 * Calculate Mean Absolute Percentage Error
 */
function calculateMAPE(predictions: PredictionRecord[]): number {
  if (predictions.length === 0) return 0;
  
  const percentageErrors = predictions.map(p => {
    if (!p.actualPrice || p.actualPrice === 0) return 0;
    return Math.abs((p.predictedPrice - p.actualPrice) / p.actualPrice) * 100;
  });
  
  return percentageErrors.reduce((sum, err) => sum + err, 0) / percentageErrors.length;
}

/**
 * Calculate directional accuracy (% of correct up/down predictions)
 */
function calculateDirectionalAccuracy(predictions: PredictionRecord[]): number {
  if (predictions.length === 0) return 0;
  
  const correctDirections = predictions.filter(p => {
    if (!p.actualPrice) return false;
    
    const predictedDirection = p.predictedPrice > p.currentPrice ? 'up' : 'down';
    const actualDirection = p.actualPrice > p.currentPrice ? 'up' : 'down';
    
    return predictedDirection === actualDirection;
  });
  
  return (correctDirections.length / predictions.length) * 100;
}

/**
 * Calculate accuracy metrics for a set of predictions
 */
function calculateAccuracyMetrics(predictions: PredictionRecord[]): AccuracyMetrics {
  const validatedPredictions = predictions.filter(p => p.validated && p.actualPrice);
  
  return {
    mae: Math.round(calculateMAE(validatedPredictions) * 100) / 100,
    rmse: Math.round(calculateRMSE(validatedPredictions) * 100) / 100,
    mape: Math.round(calculateMAPE(validatedPredictions) * 100) / 100,
    directionalAccuracy: Math.round(calculateDirectionalAccuracy(validatedPredictions) * 100) / 100,
    totalPredictions: predictions.length,
    validatedPredictions: validatedPredictions.length
  };
}

/**
 * Convert accuracy metrics to 0-100 score
 */
function metricsToScore(metrics: AccuracyMetrics): number {
  if (metrics.validatedPredictions === 0) return 0;
  
  // Weight different metrics
  const mapeScore = Math.max(0, 100 - metrics.mape); // Lower MAPE is better
  const directionalScore = metrics.directionalAccuracy;
  
  // Weighted average
  const score = (mapeScore * 0.6) + (directionalScore * 0.4);
  
  return Math.round(score);
}

/**
 * Store a new prediction
 */
export async function storePrediction(
  prediction: Omit<PredictionRecord, 'id' | 'validated' | 'validatedAt'>
): Promise<string> {
  // TODO: Store in database
  // For now, return a mock ID
  const id = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('Storing prediction:', {
    id,
    ...prediction
  });
  
  return id;
}

/**
 * Validate a prediction against actual price
 */
export async function validatePrediction(
  predictionId: string,
  actualPrice: number
): Promise<PredictionRecord> {
  // TODO: Fetch from database, update with actual price
  // For now, return a mock record
  
  const record: PredictionRecord = {
    id: predictionId,
    symbol: 'BTC',
    predictionTimestamp: Date.now() - 24 * 60 * 60 * 1000,
    targetTimestamp: Date.now(),
    timeframe: '24h',
    predictedPrice: 95000,
    actualPrice,
    currentPrice: 94000,
    confidence: 75,
    methodology: 'Ensemble',
    validated: true,
    validatedAt: Date.now()
  };
  
  console.log('Validating prediction:', record);
  
  return record;
}

/**
 * Get predictions for a symbol within a time range
 */
export async function getPredictions(
  symbol: string,
  startDate?: number,
  endDate?: number
): Promise<PredictionRecord[]> {
  // TODO: Fetch from database
  // For now, return empty array
  
  console.log('Fetching predictions for', symbol, {
    startDate: startDate ? new Date(startDate).toISOString() : 'all',
    endDate: endDate ? new Date(endDate).toISOString() : 'now'
  });
  
  return [];
}

/**
 * Calculate model performance metrics
 */
export async function calculateModelPerformance(
  symbol: string
): Promise<ModelPerformance> {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;
  
  // Fetch predictions
  const allPredictions = await getPredictions(symbol);
  const last30Days = allPredictions.filter(p => p.predictionTimestamp >= thirtyDaysAgo);
  const last90Days = allPredictions.filter(p => p.predictionTimestamp >= ninetyDaysAgo);
  
  // Calculate metrics by timeframe
  const predictions24h = allPredictions.filter(p => p.timeframe === '24h');
  const predictions7d = allPredictions.filter(p => p.timeframe === '7d');
  const predictions30d = allPredictions.filter(p => p.timeframe === '30d');
  
  const byTimeframe: TimeframeAccuracy = {
    '24h': calculateAccuracyMetrics(predictions24h),
    '7d': calculateAccuracyMetrics(predictions7d),
    '30d': calculateAccuracyMetrics(predictions30d),
    overall: calculateAccuracyMetrics(allPredictions)
  };
  
  // Convert to scores
  const last30DaysScore = metricsToScore(calculateAccuracyMetrics(last30Days));
  const last90DaysScore = metricsToScore(calculateAccuracyMetrics(last90Days));
  const allTimeScore = metricsToScore(byTimeframe.overall);
  
  // Get recent predictions for display
  const recentPredictions = allPredictions
    .sort((a, b) => b.predictionTimestamp - a.predictionTimestamp)
    .slice(0, 10);
  
  return {
    last30Days: last30DaysScore,
    last90Days: last90DaysScore,
    allTime: allTimeScore,
    byTimeframe,
    recentPredictions
  };
}

/**
 * Batch validate predictions that have reached their target date
 */
export async function batchValidatePredictions(
  currentPrices: Record<string, number>
): Promise<number> {
  // TODO: Fetch predictions that need validation
  // For now, return 0
  
  const now = Date.now();
  let validatedCount = 0;
  
  console.log('Batch validating predictions at', new Date(now).toISOString());
  console.log('Current prices:', currentPrices);
  
  // In production, this would:
  // 1. Fetch all predictions where targetTimestamp <= now and validated = false
  // 2. For each prediction, update with actual price from currentPrices
  // 3. Mark as validated
  // 4. Return count of validated predictions
  
  return validatedCount;
}

/**
 * Get accuracy summary for display
 */
export function getAccuracySummary(metrics: AccuracyMetrics): string {
  if (metrics.validatedPredictions === 0) {
    return 'No validated predictions yet';
  }
  
  const score = metricsToScore(metrics);
  
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Moderate';
  return 'Poor';
}

/**
 * Export accuracy report
 */
export function exportAccuracyReport(performance: ModelPerformance): string {
  const report = `
# Model Accuracy Report

## Overall Performance
- Last 30 Days: ${performance.last30Days}/100
- Last 90 Days: ${performance.last90Days}/100
- All Time: ${performance.allTime}/100

## By Timeframe

### 24-Hour Predictions
- MAE: $${performance.byTimeframe['24h'].mae}
- RMSE: $${performance.byTimeframe['24h'].rmse}
- MAPE: ${performance.byTimeframe['24h'].mape}%
- Directional Accuracy: ${performance.byTimeframe['24h'].directionalAccuracy}%
- Total Predictions: ${performance.byTimeframe['24h'].totalPredictions}
- Validated: ${performance.byTimeframe['24h'].validatedPredictions}

### 7-Day Predictions
- MAE: $${performance.byTimeframe['7d'].mae}
- RMSE: $${performance.byTimeframe['7d'].rmse}
- MAPE: ${performance.byTimeframe['7d'].mape}%
- Directional Accuracy: ${performance.byTimeframe['7d'].directionalAccuracy}%
- Total Predictions: ${performance.byTimeframe['7d'].totalPredictions}
- Validated: ${performance.byTimeframe['7d'].validatedPredictions}

### 30-Day Predictions
- MAE: $${performance.byTimeframe['30d'].mae}
- RMSE: $${performance.byTimeframe['30d'].rmse}
- MAPE: ${performance.byTimeframe['30d'].mape}%
- Directional Accuracy: ${performance.byTimeframe['30d'].directionalAccuracy}%
- Total Predictions: ${performance.byTimeframe['30d'].totalPredictions}
- Validated: ${performance.byTimeframe['30d'].validatedPredictions}

## Recent Predictions
${performance.recentPredictions.map((p, i) => `
${i + 1}. ${p.symbol} - ${p.timeframe}
   - Predicted: $${p.predictedPrice}
   - Actual: ${p.actualPrice ? `$${p.actualPrice}` : 'Pending'}
   - Status: ${p.validated ? 'Validated' : 'Pending'}
   - Confidence: ${p.confidence}%
`).join('\n')}

---
Generated: ${new Date().toISOString()}
  `.trim();
  
  return report;
}
