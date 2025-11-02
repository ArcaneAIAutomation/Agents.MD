/**
 * Correlation Analysis for UCIE Risk Assessment
 * 
 * Calculates correlation coefficients with major assets:
 * - Bitcoin (BTC)
 * - Ethereum (ETH)
 * - S&P 500 (SPX)
 * - Gold (XAU)
 * 
 * Includes rolling correlations and regime change detection
 */

export interface CorrelationMetrics {
  btc: number;
  eth: number;
  sp500: number;
  gold: number;
  rolling30d: {
    btc: number;
    eth: number;
  };
  rolling90d: {
    btc: number;
    eth: number;
  };
  regimeChanges: RegimeChange[];
  diversificationScore: number;
}

export interface RegimeChange {
  asset: string;
  date: string;
  previousCorrelation: number;
  newCorrelation: number;
  significance: 'Low' | 'Medium' | 'High';
}

export interface PriceDataPoint {
  timestamp: string;
  price: number;
}

/**
 * Calculate Pearson correlation coefficient between two price series
 */
function calculateCorrelation(prices1: number[], prices2: number[]): number {
  if (prices1.length !== prices2.length || prices1.length === 0) {
    return 0;
  }
  
  const n = prices1.length;
  
  // Calculate means
  const mean1 = prices1.reduce((sum, p) => sum + p, 0) / n;
  const mean2 = prices2.reduce((sum, p) => sum + p, 0) / n;
  
  // Calculate covariance and standard deviations
  let covariance = 0;
  let variance1 = 0;
  let variance2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = prices1[i] - mean1;
    const diff2 = prices2[i] - mean2;
    
    covariance += diff1 * diff2;
    variance1 += diff1 * diff1;
    variance2 += diff2 * diff2;
  }
  
  const std1 = Math.sqrt(variance1 / n);
  const std2 = Math.sqrt(variance2 / n);
  
  if (std1 === 0 || std2 === 0) return 0;
  
  return covariance / (n * std1 * std2);
}

/**
 * Calculate returns from price data
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
 * Detect correlation regime changes
 * A regime change is when correlation shifts significantly (>0.3 change)
 */
function detectRegimeChanges(
  rollingCorrelations: { date: string; correlation: number }[],
  asset: string
): RegimeChange[] {
  const changes: RegimeChange[] = [];
  const threshold = 0.3; // Significant change threshold
  
  for (let i = 1; i < rollingCorrelations.length; i++) {
    const prev = rollingCorrelations[i - 1].correlation;
    const curr = rollingCorrelations[i].correlation;
    const change = Math.abs(curr - prev);
    
    if (change >= threshold) {
      let significance: 'Low' | 'Medium' | 'High' = 'Low';
      if (change >= 0.5) significance = 'High';
      else if (change >= 0.4) significance = 'Medium';
      
      changes.push({
        asset,
        date: rollingCorrelations[i].date,
        previousCorrelation: prev,
        newCorrelation: curr,
        significance
      });
    }
  }
  
  return changes;
}

/**
 * Calculate diversification score based on correlations
 * Lower correlations = better diversification
 * Score: 0-100 (100 = perfect diversification)
 */
function calculateDiversificationScore(correlations: {
  btc: number;
  eth: number;
  sp500: number;
  gold: number;
}): number {
  // Average absolute correlation
  const avgCorrelation = (
    Math.abs(correlations.btc) +
    Math.abs(correlations.eth) +
    Math.abs(correlations.sp500) +
    Math.abs(correlations.gold)
  ) / 4;
  
  // Convert to diversification score (inverse of correlation)
  // 0 correlation = 100 score, 1 correlation = 0 score
  return Math.round((1 - avgCorrelation) * 100);
}

/**
 * Fetch historical price data for correlation analysis
 */
async function fetchAssetPrices(
  symbol: string,
  days: number = 365
): Promise<PriceDataPoint[]> {
  try {
    // Map symbols to CoinGecko IDs
    const symbolMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SPX': 'sp500', // Note: May need alternative source
      'XAU': 'gold'   // Note: May need alternative source
    };
    
    const coinId = symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${symbol} prices: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.prices.map((item: [number, number]) => ({
      timestamp: new Date(item[0]).toISOString(),
      price: item[1]
    }));
  } catch (error) {
    console.error(`Error fetching ${symbol} prices:`, error);
    throw error;
  }
}

/**
 * Align price data by timestamp (ensure same dates)
 */
function alignPriceData(
  data1: PriceDataPoint[],
  data2: PriceDataPoint[]
): { prices1: number[]; prices2: number[] } {
  const timestamps1 = new Set(data1.map(d => d.timestamp.split('T')[0]));
  const timestamps2 = new Set(data2.map(d => d.timestamp.split('T')[0]));
  
  // Find common timestamps
  const commonTimestamps = [...timestamps1].filter(t => timestamps2.has(t)).sort();
  
  const prices1: number[] = [];
  const prices2: number[] = [];
  
  for (const timestamp of commonTimestamps) {
    const point1 = data1.find(d => d.timestamp.startsWith(timestamp));
    const point2 = data2.find(d => d.timestamp.startsWith(timestamp));
    
    if (point1 && point2) {
      prices1.push(point1.price);
      prices2.push(point2.price);
    }
  }
  
  return { prices1, prices2 };
}

/**
 * Calculate rolling correlation
 */
function calculateRollingCorrelation(
  prices1: number[],
  prices2: number[],
  window: number
): { date: string; correlation: number }[] {
  const rollingCorrs: { date: string; correlation: number }[] = [];
  
  for (let i = window; i < prices1.length; i++) {
    const windowPrices1 = prices1.slice(i - window, i);
    const windowPrices2 = prices2.slice(i - window, i);
    
    const correlation = calculateCorrelation(windowPrices1, windowPrices2);
    
    rollingCorrs.push({
      date: new Date(Date.now() - (prices1.length - i) * 24 * 60 * 60 * 1000).toISOString(),
      correlation
    });
  }
  
  return rollingCorrs;
}

/**
 * Main function to calculate correlation metrics
 */
export async function calculateCorrelationMetrics(
  symbol: string
): Promise<CorrelationMetrics> {
  try {
    // Fetch price data for all assets
    const [tokenPrices, btcPrices, ethPrices, sp500Prices, goldPrices] = await Promise.all([
      fetchAssetPrices(symbol, 365),
      fetchAssetPrices('BTC', 365),
      fetchAssetPrices('ETH', 365),
      fetchAssetPrices('SPX', 365).catch(() => []), // Fallback if not available
      fetchAssetPrices('XAU', 365).catch(() => [])  // Fallback if not available
    ]);
    
    // Align data with BTC
    const { prices1: tokenPricesBTC, prices2: btcAligned } = alignPriceData(tokenPrices, btcPrices);
    const btcCorrelation = calculateCorrelation(tokenPricesBTC, btcAligned);
    
    // Align data with ETH
    const { prices1: tokenPricesETH, prices2: ethAligned } = alignPriceData(tokenPrices, ethPrices);
    const ethCorrelation = calculateCorrelation(tokenPricesETH, ethAligned);
    
    // Align data with S&P 500 (if available)
    let sp500Correlation = 0;
    if (sp500Prices.length > 0) {
      const { prices1: tokenPricesSPX, prices2: sp500Aligned } = alignPriceData(tokenPrices, sp500Prices);
      sp500Correlation = calculateCorrelation(tokenPricesSPX, sp500Aligned);
    }
    
    // Align data with Gold (if available)
    let goldCorrelation = 0;
    if (goldPrices.length > 0) {
      const { prices1: tokenPricesXAU, prices2: goldAligned } = alignPriceData(tokenPrices, goldPrices);
      goldCorrelation = calculateCorrelation(tokenPricesXAU, goldAligned);
    }
    
    // Calculate rolling correlations (30-day and 90-day)
    const rolling30dBTC = calculateRollingCorrelation(tokenPricesBTC, btcAligned, 30);
    const rolling90dBTC = calculateRollingCorrelation(tokenPricesBTC, btcAligned, 90);
    const rolling30dETH = calculateRollingCorrelation(tokenPricesETH, ethAligned, 30);
    const rolling90dETH = calculateRollingCorrelation(tokenPricesETH, ethAligned, 90);
    
    // Get most recent rolling correlations
    const rolling30d = {
      btc: rolling30dBTC[rolling30dBTC.length - 1]?.correlation || btcCorrelation,
      eth: rolling30dETH[rolling30dETH.length - 1]?.correlation || ethCorrelation
    };
    
    const rolling90d = {
      btc: rolling90dBTC[rolling90dBTC.length - 1]?.correlation || btcCorrelation,
      eth: rolling90dETH[rolling90dETH.length - 1]?.correlation || ethCorrelation
    };
    
    // Detect regime changes
    const regimeChangesBTC = detectRegimeChanges(rolling30dBTC, 'BTC');
    const regimeChangesETH = detectRegimeChanges(rolling30dETH, 'ETH');
    const regimeChanges = [...regimeChangesBTC, ...regimeChangesETH];
    
    // Calculate diversification score
    const diversificationScore = calculateDiversificationScore({
      btc: btcCorrelation,
      eth: ethCorrelation,
      sp500: sp500Correlation,
      gold: goldCorrelation
    });
    
    return {
      btc: btcCorrelation,
      eth: ethCorrelation,
      sp500: sp500Correlation,
      gold: goldCorrelation,
      rolling30d,
      rolling90d,
      regimeChanges,
      diversificationScore
    };
  } catch (error) {
    console.error('Error calculating correlation metrics:', error);
    throw error;
  }
}

/**
 * Test statistical significance of correlation
 * Uses t-test to determine if correlation is significantly different from zero
 */
export function testCorrelationSignificance(
  correlation: number,
  sampleSize: number,
  alpha: number = 0.05
): { significant: boolean; pValue: number } {
  // Calculate t-statistic
  const tStat = correlation * Math.sqrt((sampleSize - 2) / (1 - correlation * correlation));
  
  // Degrees of freedom
  const df = sampleSize - 2;
  
  // Approximate p-value (two-tailed test)
  // This is a simplified approximation
  const pValue = 2 * (1 - normalCDF(Math.abs(tStat)));
  
  return {
    significant: pValue < alpha,
    pValue
  };
}

/**
 * Approximate normal cumulative distribution function
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  return x > 0 ? 1 - prob : prob;
}
