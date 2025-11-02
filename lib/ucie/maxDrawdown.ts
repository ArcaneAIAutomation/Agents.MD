/**
 * Maximum Drawdown Estimation for UCIE Risk Assessment
 * 
 * Calculates:
 * - Historical maximum drawdown
 * - Monte Carlo simulation for future drawdown estimates
 * - 95% and 99% confidence interval drawdowns
 */

export interface MaxDrawdownMetrics {
  historical: number;
  estimated95: number;
  estimated99: number;
  historicalPeriod: {
    start: string;
    end: string;
    duration: number; // days
  };
  monteCarloResults: {
    mean: number;
    median: number;
    worstCase: number;
    iterations: number;
  };
}

export interface PriceDataPoint {
  timestamp: string;
  price: number;
}

/**
 * Calculate historical maximum drawdown
 * Returns the largest peak-to-trough decline
 */
export function calculateHistoricalMaxDrawdown(
  priceHistory: PriceDataPoint[]
): {
  maxDrawdown: number;
  peakDate: string;
  troughDate: string;
  duration: number;
} {
  if (priceHistory.length < 2) {
    return {
      maxDrawdown: 0,
      peakDate: '',
      troughDate: '',
      duration: 0
    };
  }
  
  let maxDrawdown = 0;
  let peak = priceHistory[0].price;
  let peakDate = priceHistory[0].timestamp;
  let troughDate = priceHistory[0].timestamp;
  let peakIndex = 0;
  let troughIndex = 0;
  
  for (let i = 1; i < priceHistory.length; i++) {
    const currentPrice = priceHistory[i].price;
    
    // Update peak if current price is higher
    if (currentPrice > peak) {
      peak = currentPrice;
      peakDate = priceHistory[i].timestamp;
      peakIndex = i;
    }
    
    // Calculate drawdown from peak
    const drawdown = (peak - currentPrice) / peak;
    
    // Update max drawdown if current drawdown is larger
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      troughDate = priceHistory[i].timestamp;
      troughIndex = i;
    }
  }
  
  const duration = troughIndex - peakIndex;
  
  return {
    maxDrawdown,
    peakDate,
    troughDate,
    duration
  };
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
 * Calculate mean and standard deviation of returns
 */
function calculateReturnStats(returns: number[]): { mean: number; std: number } {
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((sum, sd) => sum + sd, 0) / returns.length;
  const std = Math.sqrt(variance);
  
  return { mean, std };
}

/**
 * Generate random normal distribution value (Box-Muller transform)
 */
function randomNormal(mean: number, std: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  
  return mean + std * z0;
}

/**
 * Simulate one price path using Monte Carlo
 */
function simulatePricePath(
  initialPrice: number,
  mean: number,
  std: number,
  days: number
): number[] {
  const prices: number[] = [initialPrice];
  
  for (let i = 0; i < days; i++) {
    const dailyReturn = randomNormal(mean, std);
    const newPrice = prices[prices.length - 1] * (1 + dailyReturn);
    prices.push(newPrice);
  }
  
  return prices;
}

/**
 * Calculate maximum drawdown for a simulated price path
 */
function calculatePathMaxDrawdown(prices: number[]): number {
  let maxDrawdown = 0;
  let peak = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > peak) {
      peak = prices[i];
    }
    
    const drawdown = (peak - prices[i]) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return maxDrawdown;
}

/**
 * Run Monte Carlo simulation for maximum drawdown estimation
 */
export function runMonteCarloSimulation(
  priceHistory: PriceDataPoint[],
  iterations: number = 10000,
  forecastDays: number = 365
): {
  drawdowns: number[];
  mean: number;
  median: number;
  percentile95: number;
  percentile99: number;
  worstCase: number;
} {
  // Extract prices and calculate returns
  const prices = priceHistory.map(p => p.price);
  const returns = calculateReturns(prices);
  const { mean, std } = calculateReturnStats(returns);
  
  const initialPrice = prices[prices.length - 1];
  const drawdowns: number[] = [];
  
  // Run simulations
  for (let i = 0; i < iterations; i++) {
    const simulatedPrices = simulatePricePath(initialPrice, mean, std, forecastDays);
    const maxDrawdown = calculatePathMaxDrawdown(simulatedPrices);
    drawdowns.push(maxDrawdown);
  }
  
  // Sort drawdowns for percentile calculation
  const sortedDrawdowns = [...drawdowns].sort((a, b) => a - b);
  
  // Calculate statistics
  const meanDrawdown = drawdowns.reduce((sum, d) => sum + d, 0) / drawdowns.length;
  const medianDrawdown = sortedDrawdowns[Math.floor(sortedDrawdowns.length / 2)];
  const percentile95 = sortedDrawdowns[Math.floor(sortedDrawdowns.length * 0.95)];
  const percentile99 = sortedDrawdowns[Math.floor(sortedDrawdowns.length * 0.99)];
  const worstCase = sortedDrawdowns[sortedDrawdowns.length - 1];
  
  return {
    drawdowns,
    mean: meanDrawdown,
    median: medianDrawdown,
    percentile95,
    percentile99,
    worstCase
  };
}

/**
 * Main function to calculate all maximum drawdown metrics
 */
export async function calculateMaxDrawdownMetrics(
  priceHistory: PriceDataPoint[],
  monteCarloIterations: number = 10000
): Promise<MaxDrawdownMetrics> {
  // Calculate historical maximum drawdown
  const historical = calculateHistoricalMaxDrawdown(priceHistory);
  
  // Run Monte Carlo simulation
  const simulation = runMonteCarloSimulation(priceHistory, monteCarloIterations, 365);
  
  return {
    historical: historical.maxDrawdown,
    estimated95: simulation.percentile95,
    estimated99: simulation.percentile99,
    historicalPeriod: {
      start: historical.peakDate,
      end: historical.troughDate,
      duration: historical.duration
    },
    monteCarloResults: {
      mean: simulation.mean,
      median: simulation.median,
      worstCase: simulation.worstCase,
      iterations: monteCarloIterations
    }
  };
}

/**
 * Fetch historical price data for drawdown calculation
 */
export async function fetchHistoricalPrices(
  symbol: string,
  days: number = 365
): Promise<PriceDataPoint[]> {
  try {
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
    
    return data.prices.map((item: [number, number]) => ({
      timestamp: new Date(item[0]).toISOString(),
      price: item[1]
    }));
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    throw error;
  }
}

/**
 * Calculate maximum drawdown metrics with automatic data fetching
 */
export async function getMaxDrawdownMetrics(
  symbol: string,
  monteCarloIterations: number = 10000
): Promise<MaxDrawdownMetrics> {
  const priceHistory = await fetchHistoricalPrices(symbol, 365);
  return calculateMaxDrawdownMetrics(priceHistory, monteCarloIterations);
}
