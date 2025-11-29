/**
 * Data Unwrapper Utility
 * 
 * Handles backward compatibility during the data shape migration.
 * Unwraps API response wrappers from cached data if present.
 * 
 * This allows the system to work with both:
 * - Old format: { success: true, symbol: "BTC", ...data }
 * - New format: { ...data } (no wrappers)
 */

/**
 * Check if data has API response wrappers
 */
export function hasAPIWrappers(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  // Check for common API wrapper fields
  return (
    'success' in data &&
    'cached' in data &&
    'timestamp' in data
  );
}

/**
 * Unwrap API response wrappers from data
 * 
 * @param data - Raw data from cache (may have wrappers)
 * @param type - Analysis type for specific unwrapping logic
 * @returns Unwrapped data (just the actual data fields)
 */
export function unwrapData(data: any, type: string): any {
  if (!data) return null;
  
  // If no wrappers, return as-is
  if (!hasAPIWrappers(data)) {
    return data;
  }
  
  console.log(`🔓 Unwrapping ${type} data (old format detected)`);
  
  // Create unwrapped object by excluding wrapper fields
  const { success, cached, symbol, ...unwrapped } = data;
  
  // Type-specific unwrapping
  switch (type) {
    case 'market-data':
      // Keep: priceAggregation, marketData, dataQuality, timestamp, sources, attribution
      return {
        priceAggregation: data.priceAggregation,
        marketData: data.marketData,
        dataQuality: data.dataQuality,
        timestamp: data.timestamp,
        sources: data.sources,
        attribution: data.attribution,
        veritasValidation: data.veritasValidation
      };
    
    case 'sentiment':
      // Keep: overallScore, fearGreedIndex, lunarCrush, reddit, twitter, dataQuality, timestamp
      return {
        overallScore: data.overallScore,
        fearGreedIndex: data.fearGreedIndex,
        lunarCrush: data.lunarCrush,
        reddit: data.reddit,
        twitter: data.twitter,
        dataQuality: data.dataQuality,
        timestamp: data.timestamp,
        sources: data.sources
      };
    
    case 'technical':
      // Keep: rsi, macd, ema, bollingerBands, signals, dataQuality, timestamp
      return {
        rsi: data.rsi,
        macd: data.macd,
        ema: data.ema,
        bollingerBands: data.bollingerBands,
        atr: data.atr,
        stochastic: data.stochastic,
        signals: data.signals,
        multiTimeframeConsensus: data.multiTimeframeConsensus,
        dataQuality: data.dataQuality,
        timestamp: data.timestamp
      };
    
    case 'news':
      // Keep: articles, summary, sources, dataQuality, timestamp
      return {
        articles: data.articles,
        summary: data.summary,
        sources: data.sources,
        dataQuality: data.dataQuality,
        timestamp: data.timestamp,
        veritasValidation: data.veritasValidation
      };
    
    case 'on-chain':
      // Keep: networkMetrics, whaleActivity, mempoolAnalysis, dataQuality, timestamp
      return {
        networkMetrics: data.networkMetrics,
        whaleActivity: data.whaleActivity,
        mempoolAnalysis: data.mempoolAnalysis,
        holderDistribution: data.holderDistribution,
        exchangeFlows: data.exchangeFlows,
        smartContract: data.smartContract,
        dataQuality: data.dataQuality,
        timestamp: data.timestamp,
        chain: data.chain
      };
    
    default:
      // Generic unwrapping: remove known wrapper fields
      return unwrapped;
  }
}

/**
 * Unwrap all data sources in a comprehensive context object
 * 
 * @param context - Context object with multiple data sources
 * @returns Context with all data sources unwrapped
 */
export function unwrapComprehensiveContext(context: any): any {
  if (!context) return context;
  
  return {
    marketData: context.marketData ? unwrapData(context.marketData, 'market-data') : null,
    sentiment: context.sentiment ? unwrapData(context.sentiment, 'sentiment') : null,
    technical: context.technical ? unwrapData(context.technical, 'technical') : null,
    news: context.news ? unwrapData(context.news, 'news') : null,
    onChain: context.onChain ? unwrapData(context.onChain, 'on-chain') : null,
    risk: context.risk,
    predictions: context.predictions,
    defi: context.defi,
    derivatives: context.derivatives,
    research: context.research,
    openaiSummary: context.openaiSummary
  };
}
