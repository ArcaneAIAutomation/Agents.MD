/**
 * Volatility Calculators for UCIE Risk Assessment
 * 
 * Calculates historical volatility metrics including:
 * - 30-day, 90-day, and 1-year standard deviation
 * - Volatility percentile rankings
 * - Annualized volatility
 */

export interface VolatilityMetrics {
  std30d: number;
  std90d: number;
  std1y: number;
  percentile: number;
  annualized30d: number;
  annualized90d: number;
  annualized1y: number;
  volatilityCategory: 'Low' | 'Medium' | 'High' | 'Extreme';
}

export interface PriceDataPoint {
  timestamp: string;
  price: number;
}

/**
 * Calculate standard deviation of returns
 */
function calculateStandardDeviation(returns: number[]): number {
  if (returns.length === 0) return 0;
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((sum, sd) => sum + sd, 0) / returns.length;
  
  return Math.sqrt(variance);
}

/**
 * Calculate daily returns from price data
 */
function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
    returns.push(dailyReturn);
  }
  
  return returns;
}

/**
 * Annualize volatility (standard deviation)
 * Assumes 365 days per year for crypto markets (24/7 trading)
 */
function annualizeVolatility(dailyStd: number): number {
  return dailyStd * Math.sqrt(365);
}

/**
 * Determine volatility category based on annualized volatility
 */
function categorizeVolatility(annualizedVol: number): 'Low' | 'Medium' | 'High' | 'Extreme' {
  if (annualizedVol < 0.3) return 'Low';      // < 30% annual volatility
  if (annualizedVol < 0.6) return 'Medium';   // 30-60% annual volatility
  if (annualizedVol < 1.0) return 'High';     // 60-100% annual volatility
  return 'Extreme';                            // > 100% annual volatility
}

/**
 * Calculate volatility percentile ranking
 * Compares current volatility against historical distribution
 */
function calculatePercentile(currentVol: number, historicalVols: number[]): number {
  if (historicalVols.length === 0) return 50; // Default to median
  
  const sorted = [...historicalVols].sort((a, b) => a - b);
  const lowerCount = sorted.filter(v => v < currentVol).length;
  
  return (lowerCount / sorted.length) * 100;
}

/**
 * Main function to calculate all volatility metrics
 */
export async function calculateVolatilityMetrics(
  priceHistory: PriceDataPoint[]
): Promise<VolatilityMetrics> {
  // Extract prices
  const prices = priceHistory.map(p => p.price);
  
  // Calculate daily returns
  const allReturns = calculateReturns(prices);
  
  // Calculate 30-day volatility (last 30 days)
  const returns30d = allReturns.slice(-30);
  const std30d = calculateStandardDeviation(returns30d);
  const annualized30d = annualizeVolatility(std30d);
  
  // Calculate 90-day volatility (last 90 days)
  const returns90d = allReturns.slice(-90);
  const std90d = calculateStandardDeviation(returns90d);
  const annualized90d = annualizeVolatility(std90d);
  
  // Calculate 1-year volatility (last 365 days)
  const returns1y = allReturns.slice(-365);
  const std1y = calculateStandardDeviation(returns1y);
  const annualized1y = annualizeVolatility(std1y);
  
  // Calculate rolling 30-day volatilities for percentile ranking
  const rolling30dVols: number[] = [];
  for (let i = 30; i < allReturns.length; i++) {
    const windowReturns = allReturns.slice(i - 30, i);
    const windowStd = calculateStandardDeviation(windowReturns);
    rolling30dVols.push(annualizeVolatility(windowStd));
  }
  
  // Calculate percentile ranking
  const percentile = calculatePercentile(annualized30d, rolling30dVols);
  
  // Determine volatility category
  const volatilityCategory = categorizeVolatility(annualized30d);
  
  return {
    std30d,
    std90d,
    std1y,
    percentile,
    annualized30d,
    annualized90d,
    annualized1y,
    volatilityCategory
  };
}

/**
 * Fetch historical price data for volatility calculation
 * This is a helper function that should be called before calculateVolatilityMetrics
 */
export async function fetchHistoricalPrices(
  symbol: string,
  days: number = 365
): Promise<PriceDataPoint[]> {
  try {
    // Use CoinGecko API for historical data
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase()}/market_chart?vs_currency=usd&days=${days}&interval=daily`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch historical prices: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Convert CoinGecko format to our format
    const priceHistory: PriceDataPoint[] = data.prices.map((item: [number, number]) => ({
      timestamp: new Date(item[0]).toISOString(),
      price: item[1]
    }));
    
    return priceHistory;
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    throw error;
  }
}

/**
 * Calculate volatility metrics with automatic data fetching
 */
export async function getVolatilityMetrics(symbol: string): Promise<VolatilityMetrics> {
  const priceHistory = await fetchHistoricalPrices(symbol, 365);
  return calculateVolatilityMetrics(priceHistory);
}
