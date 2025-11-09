/**
 * Data Formatter Utilities
 * Safely format data from various API sources with different property names
 */

/**
 * Safely extract and format price data
 */
export function formatPrice(market: any): string {
  // Try multiple possible locations for price data
  const price = market?.price || 
                market?.currentPrice || 
                market?.priceUsd || 
                market?.current_price ||
                market?.priceAggregation?.averagePrice || // ✅ Preview data uses averagePrice
                market?.priceAggregation?.aggregatedPrice ||
                market?.data?.price ||
                market?.data?.currentPrice;
  
  if (!price) {
    console.warn('⚠️ formatPrice: No price found in market data. Keys:', Object.keys(market || {}));
    return 'N/A';
  }
  
  const numPrice = Number(price);
  if (isNaN(numPrice)) {
    console.warn('⚠️ formatPrice: Price is not a number:', price);
    return 'N/A';
  }
  
  return `$${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Safely extract and format volume data
 */
export function formatVolume(market: any): string {
  const volume = market?.volume24h || 
                 market?.totalVolume || 
                 market?.volume || 
                 market?.total_volume ||
                 market?.priceAggregation?.totalVolume24h || // ✅ Preview data uses totalVolume24h
                 market?.priceAggregation?.aggregatedVolume24h ||
                 market?.data?.volume24h ||
                 market?.data?.totalVolume;
  
  if (!volume) {
    console.warn('⚠️ formatVolume: No volume found in market data. Keys:', Object.keys(market || {}));
    return 'N/A';
  }
  
  const numVolume = Number(volume);
  if (isNaN(numVolume)) return 'N/A';
  
  return `$${numVolume.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Safely extract and format market cap data
 */
export function formatMarketCap(market: any): string {
  const marketCap = market?.marketCap || 
                    market?.market_cap || 
                    market?.marketCapUsd || 
                    market?.market_cap_usd ||
                    market?.marketData?.marketCap || // ✅ Preview data uses marketData.marketCap
                    market?.priceAggregation?.aggregatedMarketCap ||
                    market?.data?.marketCap ||
                    market?.data?.market_cap;
  
  if (!marketCap) {
    console.warn('⚠️ formatMarketCap: No market cap found in market data. Keys:', Object.keys(market || {}));
    return 'N/A';
  }
  
  const numMarketCap = Number(marketCap);
  if (isNaN(numMarketCap)) return 'N/A';
  
  return `$${numMarketCap.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Safely extract and format price change data
 */
export function formatPriceChange(market: any): string {
  const priceChange = market?.priceChange24h || 
                      market?.price_change_percentage_24h || 
                      market?.change24h || 
                      market?.percent_change_24h ||
                      market?.priceAggregation?.averageChange24h; // ✅ Preview data uses averageChange24h
  if (priceChange === null || priceChange === undefined) return 'N/A';
  
  const numChange = Number(priceChange);
  if (isNaN(numChange)) return 'N/A';
  
  return `${numChange > 0 ? '+' : ''}${numChange.toFixed(2)}%`;
}

/**
 * Safely extract and format sentiment score
 */
export function formatSentimentScore(sentiment: any): string {
  const score = sentiment?.overallScore || sentiment?.score || sentiment?.sentiment_score || sentiment?.sentimentScore;
  if (score === null || score === undefined) return 'N/A';
  
  const numScore = Number(score);
  if (isNaN(numScore)) return 'N/A';
  
  return `${numScore.toFixed(0)}/100`;
}

/**
 * Safely extract and format sentiment trend
 */
export function formatSentimentTrend(sentiment: any): string {
  return sentiment?.trend || sentiment?.sentiment_trend || sentiment?.sentimentTrend || 'N/A';
}

/**
 * Safely extract and format mentions
 */
export function formatMentions(sentiment: any): string {
  const mentions = sentiment?.mentions24h || sentiment?.mentions || sentiment?.social_volume || sentiment?.socialVolume;
  if (!mentions) return 'N/A';
  
  const numMentions = Number(mentions);
  if (isNaN(numMentions)) return 'N/A';
  
  return numMentions.toLocaleString('en-US');
}

/**
 * Safely extract and format RSI
 */
export function formatRSI(technical: any): string {
  const indicators = technical?.indicators || technical?.data?.indicators;
  if (!indicators) {
    console.warn('⚠️ formatRSI: No indicators found in technical data. Keys:', Object.keys(technical || {}));
    return 'N/A';
  }
  
  const rsi = indicators.rsi || indicators.RSI;
  if (!rsi) {
    console.warn('⚠️ formatRSI: No RSI found in indicators. Keys:', Object.keys(indicators));
    return 'N/A';
  }
  
  // Handle different RSI formats
  if (typeof rsi === 'number') {
    return rsi.toFixed(2);
  } else if (typeof rsi === 'object' && rsi.value !== undefined) {
    return Number(rsi.value).toFixed(2);
  } else if (typeof rsi === 'string') {
    const parsed = parseFloat(rsi);
    return isNaN(parsed) ? 'N/A' : parsed.toFixed(2);
  }
  
  console.warn('⚠️ formatRSI: RSI format not recognized:', typeof rsi, rsi);
  return 'N/A';
}

/**
 * Safely extract and format MACD signal
 */
export function formatMACDSignal(technical: any): string {
  const macd = technical?.macd || technical?.indicators?.macd;
  if (!macd) return 'N/A';
  
  return macd.signal || macd.Signal || 'N/A';
}

/**
 * Safely extract and format trend direction
 */
export function formatTrendDirection(technical: any): string {
  return technical?.trend?.direction || technical?.trendDirection || technical?.trend || 'N/A';
}
