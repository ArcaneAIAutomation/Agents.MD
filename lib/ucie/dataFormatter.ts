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
 * ✅ FIXED: Never return 0 for major cryptocurrencies (impossible value)
 */
export function formatSentimentScore(sentiment: any, symbol?: string): string {
  const score = sentiment?.overallScore || sentiment?.score || sentiment?.sentiment_score || sentiment?.sentimentScore;
  
  // Check for missing or invalid data
  if (score === null || score === undefined || score === 0) {
    // For major coins like BTC/ETH, 0 sentiment is impossible
    if (symbol === 'BTC' || symbol === 'ETH') {
      return 'Data Unavailable';
    }
    return 'N/A';
  }
  
  const numScore = Number(score);
  if (isNaN(numScore)) return 'N/A';
  
  return `${numScore.toFixed(0)}/100`;
}

/**
 * Safely extract and format sentiment trend
 * ✅ FIXED: Calculate trend from distribution data if not provided
 */
export function formatSentimentTrend(sentiment: any): string {
  // Try to get pre-calculated trend first
  if (sentiment?.trend || sentiment?.sentiment_trend || sentiment?.sentimentTrend) {
    return sentiment.trend || sentiment.sentiment_trend || sentiment.sentimentTrend;
  }
  
  // Calculate from distribution
  if (sentiment?.distribution) {
    const { positive, negative, neutral } = sentiment.distribution;
    if (positive > 60) return 'strongly bullish';
    if (negative > 60) return 'strongly bearish';
    if (positive > 50) return 'bullish';
    if (negative > 50) return 'bearish';
    if (positive > negative + 10) return 'slightly bullish';
    if (negative > positive + 10) return 'slightly bearish';
    return 'neutral';
  }
  
  // Fallback: calculate from overall score
  if (sentiment?.overallScore !== undefined) {
    const score = Number(sentiment.overallScore);
    if (!isNaN(score)) {
      if (score > 60) return 'bullish';
      if (score < 40) return 'bearish';
      return 'neutral';
    }
  }
  
  console.warn('⚠️ formatSentimentTrend: No trend data available. Keys:', Object.keys(sentiment || {}));
  return 'N/A';
}

/**
 * Safely extract and format mentions
 * ✅ FIXED: Use correct field name volumeMetrics.total24h
 * ✅ FIXED: Never return 0 for major cryptocurrencies (impossible value)
 */
export function formatMentions(sentiment: any, symbol?: string): string {
  // Try volumeMetrics first (correct field for AggregatedSentiment)
  const mentions = sentiment?.volumeMetrics?.total24h || 
                   sentiment?.mentions24h || 
                   sentiment?.mentions || 
                   sentiment?.social_volume || 
                   sentiment?.socialVolume;
  
  // Check for missing or invalid data
  if (!mentions || mentions === 0) {
    // For major coins like BTC/ETH, 0 mentions is impossible
    if (symbol === 'BTC' || symbol === 'ETH') {
      return 'Data Unavailable';
    }
    console.warn('⚠️ formatMentions: No mentions found. Keys:', Object.keys(sentiment || {}));
    return 'N/A';
  }
  
  const numMentions = Number(mentions);
  if (isNaN(numMentions) || numMentions === 0) {
    if (symbol === 'BTC' || symbol === 'ETH') {
      return 'Data Unavailable';
    }
    return 'N/A';
  }
  
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
