/**
 * Price Prediction Models for UCIE
 * 
 * Implements machine learning-based price forecasting using historical data
 * Generates 24h, 7d, and 30d predictions with confidence intervals
 */

export interface PricePrediction {
  timeframe: '24h' | '7d' | '30d';
  low: number;
  mid: number;
  high: number;
  confidence: number; // 0-100
  methodology: string;
  dataQuality: number; // 0-100
}

export interface HistoricalPrice {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PredictionResult {
  predictions: {
    price24h: PricePrediction;
    price7d: PricePrediction;
    price30d: PricePrediction;
  };
  modelAccuracy: {
    last30Days: number;
    last90Days: number;
    allTime: number;
  };
  dataQuality: number;
  lastUpdated: string;
}

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const slice = prices.slice(-period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
}

/**
 * Calculate Exponential Moving Average
 */
function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) return calculateSMA(prices, prices.length);
  
  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(prices.slice(0, period), period);
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

/**
 * Calculate volatility (standard deviation)
 */
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const squaredDiffs = prices.map(price => Math.pow(price - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / prices.length;
  
  return Math.sqrt(variance);
}

/**
 * Calculate linear regression trend
 */
function calculateTrend(prices: number[]): { slope: number; intercept: number } {
  const n = prices.length;
  if (n < 2) return { slope: 0, intercept: prices[0] || 0 };
  
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += prices[i];
    sumXY += i * prices[i];
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

/**
 * Generate price prediction using multiple methods
 */
function generatePrediction(
  historicalPrices: HistoricalPrice[],
  currentPrice: number,
  periodsAhead: number,
  timeframe: '24h' | '7d' | '30d'
): PricePrediction {
  const closePrices = historicalPrices.map(p => p.close);
  
  // Method 1: EMA-based prediction
  const ema20 = calculateEMA(closePrices, 20);
  const ema50 = calculateEMA(closePrices, 50);
  const emaTrend = ema20 - ema50;
  
  // Method 2: Linear regression
  const { slope, intercept } = calculateTrend(closePrices.slice(-30));
  const trendPrediction = slope * (closePrices.length + periodsAhead) + intercept;
  
  // Method 3: Momentum-based
  const recentPrices = closePrices.slice(-7);
  const momentum = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0];
  const momentumPrediction = currentPrice * (1 + momentum * (periodsAhead / 7));
  
  // Weighted average of methods
  const midPrediction = (
    trendPrediction * 0.4 +
    momentumPrediction * 0.3 +
    (currentPrice + emaTrend * periodsAhead) * 0.3
  );
  
  // Calculate volatility for confidence intervals
  const volatility = calculateVolatility(closePrices.slice(-30));
  const volatilityFactor = volatility / currentPrice;
  
  // Adjust confidence interval based on timeframe
  const timeframeMultiplier = periodsAhead / 24; // Normalize to days
  const intervalWidth = midPrediction * volatilityFactor * Math.sqrt(timeframeMultiplier);
  
  const lowPrediction = midPrediction - intervalWidth;
  const highPrediction = midPrediction + intervalWidth;
  
  // Calculate confidence based on data quality and volatility
  const dataQuality = Math.min(100, (historicalPrices.length / 365) * 100);
  const volatilityPenalty = Math.min(30, volatilityFactor * 100);
  const confidence = Math.max(20, Math.min(95, dataQuality - volatilityPenalty));
  
  return {
    timeframe,
    low: Math.max(0, lowPrediction),
    mid: midPrediction,
    high: highPrediction,
    confidence: Math.round(confidence),
    methodology: 'Ensemble (EMA + Linear Regression + Momentum)',
    dataQuality: Math.round(dataQuality)
  };
}

/**
 * Calculate model accuracy metrics
 */
function calculateModelAccuracy(
  historicalPredictions: Array<{ predicted: number; actual: number; timestamp: number }>
): { last30Days: number; last90Days: number; allTime: number } {
  if (historicalPredictions.length === 0) {
    return { last30Days: 0, last90Days: 0, allTime: 0 };
  }
  
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;
  
  const calculateAccuracy = (predictions: typeof historicalPredictions) => {
    if (predictions.length === 0) return 0;
    
    const errors = predictions.map(p => {
      const percentError = Math.abs((p.predicted - p.actual) / p.actual) * 100;
      return Math.min(100, percentError);
    });
    
    const avgError = errors.reduce((sum, err) => sum + err, 0) / errors.length;
    return Math.max(0, 100 - avgError);
  };
  
  const last30 = historicalPredictions.filter(p => p.timestamp >= thirtyDaysAgo);
  const last90 = historicalPredictions.filter(p => p.timestamp >= ninetyDaysAgo);
  
  return {
    last30Days: Math.round(calculateAccuracy(last30)),
    last90Days: Math.round(calculateAccuracy(last90)),
    allTime: Math.round(calculateAccuracy(historicalPredictions))
  };
}

/**
 * Main function to generate price predictions
 */
export async function generatePricePredictions(
  symbol: string,
  historicalPrices: HistoricalPrice[],
  currentPrice: number
): Promise<PredictionResult> {
  // Validate input
  if (!historicalPrices || historicalPrices.length < 7) {
    throw new Error('Insufficient historical data for predictions (minimum 7 days required)');
  }
  
  // Generate predictions for different timeframes
  const price24h = generatePrediction(historicalPrices, currentPrice, 1, '24h');
  const price7d = generatePrediction(historicalPrices, currentPrice, 7, '7d');
  const price30d = generatePrediction(historicalPrices, currentPrice, 30, '30d');
  
  // Calculate overall data quality
  const dataQuality = Math.min(100, (historicalPrices.length / 365) * 100);
  
  // TODO: Fetch historical prediction accuracy from database
  // For now, use placeholder values
  const modelAccuracy = {
    last30Days: 0,
    last90Days: 0,
    allTime: 0
  };
  
  return {
    predictions: {
      price24h,
      price7d,
      price30d
    },
    modelAccuracy,
    dataQuality: Math.round(dataQuality),
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Validate predictions against actual outcomes
 * This should be called periodically to track model accuracy
 */
export async function validatePrediction(
  symbol: string,
  predictionTimestamp: number,
  predictedPrice: number,
  actualPrice: number
): Promise<void> {
  // TODO: Store validation results in database
  // This will be used to calculate historical accuracy metrics
  
  const error = Math.abs((predictedPrice - actualPrice) / actualPrice) * 100;
  const accuracy = Math.max(0, 100 - error);
  
  console.log(`Prediction validation for ${symbol}:`, {
    predicted: predictedPrice,
    actual: actualPrice,
    error: `${error.toFixed(2)}%`,
    accuracy: `${accuracy.toFixed(2)}%`
  });
}
