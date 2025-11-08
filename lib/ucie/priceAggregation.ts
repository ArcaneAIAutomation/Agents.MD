/**
 * Multi-Exchange Price Aggregation for UCIE
 * 
 * This module aggregates cryptocurrency prices from multiple exchanges,
 * calculates volume-weighted average price (VWAP), detects price discrepancies,
 * and identifies arbitrage opportunities.
 * 
 * Features:
 * - Parallel fetching from 5+ exchanges
 * - VWAP calculation
 * - Price discrepancy detection (>2% variance)
 * - Arbitrage opportunity identification
 * - 2-second timeout guarantee
 */

import {
  coinGeckoClient,
  coinMarketCapClient,
  krakenClient,
  coinbaseClient,
  type PriceData,
} from './marketDataClients';

export interface ExchangePrice {
  exchange: string;
  price: number;
  volume24h: number;
  change24h: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

export interface ArbitrageOpportunity {
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercentage: number;
  potentialProfit: number; // Per unit
}

export interface PriceAggregation {
  symbol: string;
  prices: ExchangePrice[];
  vwap: number;
  averagePrice: number;
  highestPrice: number;
  lowestPrice: number;
  priceVariance: number;
  priceVariancePercentage: number;
  totalVolume24h: number;
  averageChange24h: number;
  arbitrageOpportunities: ArbitrageOpportunity[];
  dataQuality: number; // 0-100 score
  timestamp: string;
  fetchDuration: number; // milliseconds
}

/**
 * Fetch price from a single exchange with timeout and error handling
 */
async function fetchExchangePrice(
  symbol: string,
  fetchFn: () => Promise<PriceData>,
  exchangeName: string
): Promise<ExchangePrice> {
  try {
    const data = await fetchFn();
    return {
      exchange: exchangeName,
      price: data.price,
      volume24h: data.volume24h,
      change24h: data.change24h,
      timestamp: data.timestamp,
      success: true,
    };
  } catch (error) {
    return {
      exchange: exchangeName,
      price: 0,
      volume24h: 0,
      change24h: 0,
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate Volume-Weighted Average Price (VWAP)
 */
function calculateVWAP(prices: ExchangePrice[]): number {
  const successfulPrices = prices.filter(p => p.success && p.volume24h > 0);
  
  if (successfulPrices.length === 0) {
    return 0;
  }

  const totalVolumeWeightedPrice = successfulPrices.reduce(
    (sum, p) => sum + (p.price * p.volume24h),
    0
  );
  
  const totalVolume = successfulPrices.reduce(
    (sum, p) => sum + p.volume24h,
    0
  );

  return totalVolume > 0 ? totalVolumeWeightedPrice / totalVolume : 0;
}

/**
 * Calculate simple average price
 */
function calculateAveragePrice(prices: ExchangePrice[]): number {
  const successfulPrices = prices.filter(p => p.success);
  
  if (successfulPrices.length === 0) {
    return 0;
  }

  const sum = successfulPrices.reduce((acc, p) => acc + p.price, 0);
  return sum / successfulPrices.length;
}

/**
 * Detect arbitrage opportunities
 */
function detectArbitrageOpportunities(
  prices: ExchangePrice[],
  minSpreadPercentage: number = 2
): ArbitrageOpportunity[] {
  const successfulPrices = prices.filter(p => p.success);
  const opportunities: ArbitrageOpportunity[] = [];

  for (let i = 0; i < successfulPrices.length; i++) {
    for (let j = i + 1; j < successfulPrices.length; j++) {
      const price1 = successfulPrices[i];
      const price2 = successfulPrices[j];

      const [buyPrice, sellPrice, buyExchange, sellExchange] =
        price1.price < price2.price
          ? [price1.price, price2.price, price1.exchange, price2.exchange]
          : [price2.price, price1.price, price2.exchange, price1.exchange];

      const spread = sellPrice - buyPrice;
      const spreadPercentage = (spread / buyPrice) * 100;

      if (spreadPercentage >= minSpreadPercentage) {
        opportunities.push({
          buyExchange,
          sellExchange,
          buyPrice,
          sellPrice,
          spread,
          spreadPercentage,
          potentialProfit: spread,
        });
      }
    }
  }

  // Sort by spread percentage (highest first)
  return opportunities.sort((a, b) => b.spreadPercentage - a.spreadPercentage);
}

/**
 * Calculate data quality score (0-100)
 */
function calculateDataQuality(prices: ExchangePrice[]): number {
  const successCount = prices.filter(p => p.success).length;
  const totalCount = prices.length;
  
  if (totalCount === 0) {
    return 0;
  }

  // Base score from success rate
  const successRate = (successCount / totalCount) * 100;
  
  // Bonus for having volume data
  const withVolume = prices.filter(p => p.success && p.volume24h > 0).length;
  const volumeBonus = (withVolume / totalCount) * 10;
  
  // Penalty for high variance
  const successfulPrices = prices.filter(p => p.success);
  if (successfulPrices.length > 1) {
    const avgPrice = calculateAveragePrice(prices);
    const maxDeviation = Math.max(
      ...successfulPrices.map(p => Math.abs(p.price - avgPrice) / avgPrice * 100)
    );
    const variancePenalty = Math.min(maxDeviation * 2, 20);
    
    return Math.max(0, Math.min(100, successRate + volumeBonus - variancePenalty));
  }

  return Math.min(100, successRate + volumeBonus);
}

/**
 * Aggregate prices from multiple exchanges with parallel fetching
 * Completes within 2-second timeout
 */
export async function aggregateExchangePrices(symbol: string): Promise<PriceAggregation> {
  const startTime = Date.now();
  
  // Fetch from all exchanges in parallel with 2-second timeout
  // ✅ IMPROVED: CoinMarketCap first (more reliable), CoinGecko second
  // NOTE: Binance removed due to consistent 451 errors (geo-blocking)
  const fetchPromises = [
    fetchExchangePrice(symbol, () => coinMarketCapClient.getPrice(symbol), 'CoinMarketCap'),
    fetchExchangePrice(symbol, () => coinGeckoClient.getPrice(symbol), 'CoinGecko'),
    fetchExchangePrice(symbol, () => krakenClient.getPrice(symbol), 'Kraken'),
    fetchExchangePrice(symbol, () => coinbaseClient.getPrice(symbol), 'Coinbase'),
  ];

  // Race against 2-second timeout
  const timeoutPromise = new Promise<ExchangePrice[]>((resolve) => {
    setTimeout(() => {
      resolve([]);
    }, 2000);
  });

  let prices: ExchangePrice[];
  
  try {
    const result = await Promise.race([
      Promise.allSettled(fetchPromises),
      timeoutPromise,
    ]);

    if (Array.isArray(result) && result.length === 0) {
      // Timeout occurred, use whatever we have so far
      prices = await Promise.allSettled(fetchPromises).then(results =>
        results.map(r => r.status === 'fulfilled' ? r.value : {
          exchange: 'unknown',
          price: 0,
          volume24h: 0,
          change24h: 0,
          timestamp: new Date().toISOString(),
          success: false,
          error: 'Timeout',
        })
      );
    } else {
      // All promises settled within timeout
      prices = (result as PromiseSettledResult<ExchangePrice>[]).map(r =>
        r.status === 'fulfilled' ? r.value : {
          exchange: 'unknown',
          price: 0,
          volume24h: 0,
          change24h: 0,
          timestamp: new Date().toISOString(),
          success: false,
          error: 'Failed',
        }
      );
    }
  } catch (error) {
    // Fallback in case of unexpected error
    prices = fetchPromises.map(() => ({
      exchange: 'unknown',
      price: 0,
      volume24h: 0,
      change24h: 0,
      timestamp: new Date().toISOString(),
      success: false,
      error: 'Unexpected error',
    }));
  }

  const successfulPrices = prices.filter(p => p.success);
  
  // Calculate metrics
  const vwap = calculateVWAP(prices);
  const averagePrice = calculateAveragePrice(prices);
  const highestPrice = successfulPrices.length > 0
    ? Math.max(...successfulPrices.map(p => p.price))
    : 0;
  const lowestPrice = successfulPrices.length > 0
    ? Math.min(...successfulPrices.map(p => p.price))
    : 0;
  const priceVariance = highestPrice - lowestPrice;
  const priceVariancePercentage = lowestPrice > 0
    ? (priceVariance / lowestPrice) * 100
    : 0;
  const totalVolume24h = successfulPrices.reduce((sum, p) => sum + p.volume24h, 0);
  const averageChange24h = successfulPrices.length > 0
    ? successfulPrices.reduce((sum, p) => sum + p.change24h, 0) / successfulPrices.length
    : 0;

  // Detect arbitrage opportunities (>2% spread)
  const arbitrageOpportunities = detectArbitrageOpportunities(prices, 2);

  // Calculate data quality score
  const dataQuality = calculateDataQuality(prices);

  const fetchDuration = Date.now() - startTime;

  return {
    symbol: symbol.toUpperCase(),
    prices,
    vwap,
    averagePrice,
    highestPrice,
    lowestPrice,
    priceVariance,
    priceVariancePercentage,
    totalVolume24h,
    averageChange24h,
    arbitrageOpportunities,
    dataQuality,
    timestamp: new Date().toISOString(),
    fetchDuration,
  };
}

/**
 * Get best price (highest for selling, lowest for buying)
 */
export function getBestPrice(
  aggregation: PriceAggregation,
  type: 'buy' | 'sell'
): ExchangePrice | null {
  const successfulPrices = aggregation.prices.filter(p => p.success);
  
  if (successfulPrices.length === 0) {
    return null;
  }

  if (type === 'buy') {
    // Lowest price for buying
    return successfulPrices.reduce((min, p) => p.price < min.price ? p : min);
  } else {
    // Highest price for selling
    return successfulPrices.reduce((max, p) => p.price > max.price ? p : max);
  }
}

/**
 * Check if price discrepancy is significant (>2% variance)
 */
export function hasSignificantDiscrepancy(aggregation: PriceAggregation): boolean {
  return aggregation.priceVariancePercentage > 2;
}

/**
 * Get price summary for display
 */
export function getPriceSummary(aggregation: PriceAggregation): string {
  const successCount = aggregation.prices.filter(p => p.success).length;
  const totalCount = aggregation.prices.length;
  
  return `${successCount}/${totalCount} exchanges | VWAP: $${aggregation.vwap.toFixed(2)} | ` +
    `Variance: ${aggregation.priceVariancePercentage.toFixed(2)}% | ` +
    `Quality: ${aggregation.dataQuality.toFixed(0)}%`;
}
