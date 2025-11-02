/**
 * Market Microstructure Analysis for UCIE
 * 
 * Analyzes order book depth, liquidity, and market manipulation patterns
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */

export interface OrderBookDepth {
  exchange: string;
  bids: OrderLevel[];
  asks: OrderLevel[];
  bidDepth: number; // Total bid volume
  askDepth: number; // Total ask volume
  imbalance: number; // -100 to +100 (positive = more bids)
  spread: number; // Bid-ask spread
  spreadPercentage: number;
  midPrice: number;
}

export interface OrderLevel {
  price: number;
  volume: number;
  cumulativeVolume: number;
}

export interface SlippageEstimate {
  tradeSize: number;
  tradeSizeUSD: number;
  estimatedPrice: number;
  slippage: number; // Percentage
  slippageUSD: number;
  worstPrice: number;
  impactScore: number; // 0-100
}

export interface LiquidityPool {
  type: 'CEX' | 'DEX';
  exchange: string;
  pair: string;
  liquidity: number;
  volume24h: number;
  depth: number;
  fee: number;
  optimalForSize: number; // Optimal trade size for this pool
}

export interface MarketMakerActivity {
  detected: boolean;
  patterns: ManipulationPattern[];
  confidence: number;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ManipulationPattern {
  type: 'spoofing' | 'layering' | 'wash_trading' | 'pump_dump' | 'none';
  confidence: number;
  description: string;
  evidence: string[];
  timeDetected: string;
}

export interface MarketImpactScore {
  tradeSize: number;
  impactPercentage: number;
  impactScore: number; // 0-100
  historicalValidation: {
    averageImpact: number;
    maxImpact: number;
    minImpact: number;
    sampleSize: number;
  };
  recommendation: string;
}

export interface MarketMicrostructureReport {
  symbol: string;
  timestamp: string;
  orderBooks: OrderBookDepth[];
  aggregatedDepth: {
    totalBidDepth: number;
    totalAskDepth: number;
    weightedSpread: number;
    overallImbalance: number;
  };
  slippageEstimates: SlippageEstimate[];
  liquidityPools: LiquidityPool[];
  optimalRouting: {
    tradeSize: number;
    recommendedPools: Array<{ pool: string; percentage: number }>;
    estimatedSlippage: number;
    estimatedCost: number;
  };
  marketMakerActivity: MarketMakerActivity;
  marketImpact: MarketImpactScore[];
  summary: string;
}

/**
 * Analyze order book depth
 */
export function analyzeOrderBookDepth(
  exchange: string,
  bids: Array<{ price: number; volume: number }>,
  asks: Array<{ price: number; volume: number }>
): OrderBookDepth {
  // Calculate cumulative volumes
  let cumulativeBidVolume = 0;
  const bidLevels: OrderLevel[] = bids.map(bid => {
    cumulativeBidVolume += bid.volume;
    return {
      price: bid.price,
      volume: bid.volume,
      cumulativeVolume: cumulativeBidVolume
    };
  });
  
  let cumulativeAskVolume = 0;
  const askLevels: OrderLevel[] = asks.map(ask => {
    cumulativeAskVolume += ask.volume;
    return {
      price: ask.price,
      volume: ask.volume,
      cumulativeVolume: cumulativeAskVolume
    };
  });
  
  const bidDepth = cumulativeBidVolume;
  const askDepth = cumulativeAskVolume;
  
  // Calculate imbalance (-100 to +100)
  const totalDepth = bidDepth + askDepth;
  const imbalance = totalDepth > 0 ? ((bidDepth - askDepth) / totalDepth) * 100 : 0;
  
  // Calculate spread
  const bestBid = bids[0]?.price || 0;
  const bestAsk = asks[0]?.price || 0;
  const spread = bestAsk - bestBid;
  const midPrice = (bestBid + bestAsk) / 2;
  const spreadPercentage = midPrice > 0 ? (spread / midPrice) * 100 : 0;
  
  return {
    exchange,
    bids: bidLevels,
    asks: askLevels,
    bidDepth,
    askDepth,
    imbalance,
    spread,
    spreadPercentage,
    midPrice
  };
}

/**
 * Calculate slippage for trade size
 */
export function calculateSlippage(
  tradeSize: number,
  currentPrice: number,
  orderBook: OrderBookDepth,
  side: 'buy' | 'sell'
): SlippageEstimate {
  const levels = side === 'buy' ? orderBook.asks : orderBook.bids;
  
  let remainingSize = tradeSize;
  let totalCost = 0;
  let worstPrice = currentPrice;
  
  for (const level of levels) {
    if (remainingSize <= 0) break;
    
    const fillSize = Math.min(remainingSize, level.volume);
    totalCost += fillSize * level.price;
    worstPrice = level.price;
    remainingSize -= fillSize;
  }
  
  if (remainingSize > 0) {
    // Not enough liquidity
    return {
      tradeSize,
      tradeSizeUSD: tradeSize * currentPrice,
      estimatedPrice: 0,
      slippage: 100,
      slippageUSD: tradeSize * currentPrice,
      worstPrice: 0,
      impactScore: 100
    };
  }
  
  const estimatedPrice = totalCost / tradeSize;
  const slippage = ((estimatedPrice - currentPrice) / currentPrice) * 100;
  const slippageUSD = Math.abs(slippage / 100) * tradeSize * currentPrice;
  
  // Calculate impact score (0-100)
  const impactScore = Math.min(100, Math.abs(slippage) * 10);
  
  return {
    tradeSize,
    tradeSizeUSD: tradeSize * currentPrice,
    estimatedPrice,
    slippage: side === 'buy' ? slippage : -slippage,
    slippageUSD,
    worstPrice,
    impactScore
  };
}

/**
 * Calculate slippage estimates for multiple trade sizes
 */
export function calculateMultipleSlippageEstimates(
  currentPrice: number,
  orderBook: OrderBookDepth,
  tradeSizes: number[] = [10000, 100000, 1000000, 10000000]
): SlippageEstimate[] {
  return tradeSizes.map(size => {
    const sizeInTokens = size / currentPrice;
    return calculateSlippage(sizeInTokens, currentPrice, orderBook, 'buy');
  });
}

/**
 * Identify liquidity pools
 */
export function identifyLiquidityPools(
  symbol: string,
  orderBooks: OrderBookDepth[],
  dexData: Array<{ exchange: string; pair: string; liquidity: number; volume24h: number; fee: number }>
): LiquidityPool[] {
  const pools: LiquidityPool[] = [];
  
  // CEX pools
  orderBooks.forEach(ob => {
    const depth = ob.bidDepth + ob.askDepth;
    pools.push({
      type: 'CEX',
      exchange: ob.exchange,
      pair: `${symbol}/USDT`,
      liquidity: depth * ob.midPrice,
      volume24h: 0, // Would be fetched from exchange API
      depth,
      fee: 0.001, // 0.1% typical
      optimalForSize: depth * 0.1 // 10% of depth
    });
  });
  
  // DEX pools
  dexData.forEach(dex => {
    pools.push({
      type: 'DEX',
      exchange: dex.exchange,
      pair: dex.pair,
      liquidity: dex.liquidity,
      volume24h: dex.volume24h,
      depth: dex.liquidity / 2, // Approximate
      fee: dex.fee,
      optimalForSize: dex.liquidity * 0.05 // 5% of liquidity
    });
  });
  
  return pools.sort((a, b) => b.liquidity - a.liquidity);
}

/**
 * Calculate optimal routing for large trade
 */
export function calculateOptimalRouting(
  tradeSize: number,
  currentPrice: number,
  pools: LiquidityPool[]
): {
  tradeSize: number;
  recommendedPools: Array<{ pool: string; percentage: number }>;
  estimatedSlippage: number;
  estimatedCost: number;
} {
  const tradeSizeUSD = tradeSize * currentPrice;
  const routing: Array<{ pool: string; percentage: number }> = [];
  
  // Sort pools by liquidity
  const sortedPools = [...pools].sort((a, b) => b.liquidity - a.liquidity);
  
  let remainingSize = tradeSizeUSD;
  let totalCost = 0;
  
  for (const pool of sortedPools) {
    if (remainingSize <= 0) break;
    
    // Allocate up to optimal size for this pool
    const allocation = Math.min(remainingSize, pool.optimalForSize);
    const percentage = (allocation / tradeSizeUSD) * 100;
    
    if (percentage > 1) { // Only include if > 1%
      routing.push({
        pool: `${pool.exchange} (${pool.type})`,
        percentage: Math.round(percentage * 10) / 10
      });
      
      // Estimate cost with slippage
      const slippageEstimate = (allocation / pool.liquidity) * 100;
      totalCost += allocation * (1 + slippageEstimate / 100);
      
      remainingSize -= allocation;
    }
  }
  
  const estimatedSlippage = ((totalCost - tradeSizeUSD) / tradeSizeUSD) * 100;
  
  return {
    tradeSize: tradeSizeUSD,
    recommendedPools: routing,
    estimatedSlippage,
    estimatedCost: totalCost
  };
}

/**
 * Detect spoofing patterns
 */
export function detectSpoofing(
  orderBook: OrderBookDepth,
  historicalBooks: OrderBookDepth[]
): ManipulationPattern | null {
  // Look for large orders that appear and disappear quickly
  // This is a simplified detection - production would use more sophisticated analysis
  
  const largeBidOrders = orderBook.bids.filter(b => b.volume > orderBook.bidDepth * 0.1);
  const largeAskOrders = orderBook.asks.filter(a => a.volume > orderBook.askDepth * 0.1);
  
  if (largeBidOrders.length > 3 || largeAskOrders.length > 3) {
    return {
      type: 'spoofing',
      confidence: 65,
      description: 'Multiple large orders detected that may be spoofing',
      evidence: [
        `${largeBidOrders.length} large bid orders (>10% of depth)`,
        `${largeAskOrders.length} large ask orders (>10% of depth)`,
        'Orders may be cancelled before execution'
      ],
      timeDetected: new Date().toISOString()
    };
  }
  
  return null;
}

/**
 * Detect layering patterns
 */
export function detectLayering(
  orderBook: OrderBookDepth
): ManipulationPattern | null {
  // Look for multiple orders at similar price levels
  const bidPriceGroups = groupByPrice(orderBook.bids, 0.001); // 0.1% price range
  const askPriceGroups = groupByPrice(orderBook.asks, 0.001);
  
  const suspiciousBidGroups = bidPriceGroups.filter(g => g.count > 5);
  const suspiciousAskGroups = askPriceGroups.filter(g => g.count > 5);
  
  if (suspiciousBidGroups.length > 0 || suspiciousAskGroups.length > 0) {
    return {
      type: 'layering',
      confidence: 60,
      description: 'Multiple orders at similar price levels detected',
      evidence: [
        `${suspiciousBidGroups.length} suspicious bid price levels`,
        `${suspiciousAskGroups.length} suspicious ask price levels`,
        'May indicate layering manipulation'
      ],
      timeDetected: new Date().toISOString()
    };
  }
  
  return null;
}

/**
 * Group orders by price
 */
function groupByPrice(
  orders: OrderLevel[],
  tolerance: number
): Array<{ price: number; count: number; volume: number }> {
  const groups: Array<{ price: number; count: number; volume: number }> = [];
  
  orders.forEach(order => {
    const existingGroup = groups.find(g => 
      Math.abs(g.price - order.price) / order.price < tolerance
    );
    
    if (existingGroup) {
      existingGroup.count++;
      existingGroup.volume += order.volume;
    } else {
      groups.push({ price: order.price, count: 1, volume: order.volume });
    }
  });
  
  return groups;
}

/**
 * Analyze market maker activity
 */
export function analyzeMarketMakerActivity(
  orderBooks: OrderBookDepth[],
  historicalBooks: OrderBookDepth[]
): MarketMakerActivity {
  const patterns: ManipulationPattern[] = [];
  
  // Check each order book for manipulation patterns
  orderBooks.forEach(ob => {
    const spoofing = detectSpoofing(ob, historicalBooks);
    if (spoofing) patterns.push(spoofing);
    
    const layering = detectLayering(ob);
    if (layering) patterns.push(layering);
  });
  
  const detected = patterns.length > 0;
  const confidence = detected
    ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
    : 0;
  
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (confidence > 80) riskLevel = 'critical';
  else if (confidence > 60) riskLevel = 'high';
  else if (confidence > 40) riskLevel = 'medium';
  
  const description = detected
    ? `${patterns.length} potential manipulation pattern${patterns.length > 1 ? 's' : ''} detected`
    : 'No significant manipulation patterns detected';
  
  return {
    detected,
    patterns,
    confidence,
    description,
    riskLevel
  };
}

/**
 * Calculate market impact score
 */
export function calculateMarketImpact(
  tradeSize: number,
  currentPrice: number,
  orderBook: OrderBookDepth,
  historicalImpacts: Array<{ size: number; impact: number }>
): MarketImpactScore {
  // Calculate theoretical impact
  const slippage = calculateSlippage(tradeSize / currentPrice, currentPrice, orderBook, 'buy');
  const impactPercentage = Math.abs(slippage.slippage);
  const impactScore = slippage.impactScore;
  
  // Historical validation
  const relevantImpacts = historicalImpacts.filter(h => 
    Math.abs(h.size - tradeSize) / tradeSize < 0.2 // Within 20% of trade size
  );
  
  const historicalValidation = relevantImpacts.length > 0 ? {
    averageImpact: relevantImpacts.reduce((sum, h) => sum + h.impact, 0) / relevantImpacts.length,
    maxImpact: Math.max(...relevantImpacts.map(h => h.impact)),
    minImpact: Math.min(...relevantImpacts.map(h => h.impact)),
    sampleSize: relevantImpacts.length
  } : {
    averageImpact: 0,
    maxImpact: 0,
    minImpact: 0,
    sampleSize: 0
  };
  
  // Generate recommendation
  let recommendation = '';
  if (impactScore > 80) {
    recommendation = 'CRITICAL IMPACT: Trade size too large for current liquidity. Consider splitting into smaller orders or using multiple exchanges.';
  } else if (impactScore > 60) {
    recommendation = 'HIGH IMPACT: Significant slippage expected. Consider reducing trade size or using optimal routing across multiple pools.';
  } else if (impactScore > 40) {
    recommendation = 'MODERATE IMPACT: Noticeable slippage expected. Consider using limit orders and splitting across time.';
  } else if (impactScore > 20) {
    recommendation = 'LOW IMPACT: Acceptable slippage for trade size. Proceed with standard execution.';
  } else {
    recommendation = 'MINIMAL IMPACT: Trade size well within market capacity. Execute normally.';
  }
  
  return {
    tradeSize,
    impactPercentage,
    impactScore,
    historicalValidation,
    recommendation
  };
}

/**
 * Generate comprehensive market microstructure report
 */
export async function generateMarketMicrostructureReport(
  symbol: string,
  currentPrice: number,
  orderBooksData: Array<{
    exchange: string;
    bids: Array<{ price: number; volume: number }>;
    asks: Array<{ price: number; volume: number }>;
  }>,
  dexData: Array<{ exchange: string; pair: string; liquidity: number; volume24h: number; fee: number }>
): Promise<MarketMicrostructureReport> {
  // Analyze all order books
  const orderBooks = orderBooksData.map(data =>
    analyzeOrderBookDepth(data.exchange, data.bids, data.asks)
  );
  
  // Calculate aggregated depth
  const totalBidDepth = orderBooks.reduce((sum, ob) => sum + ob.bidDepth, 0);
  const totalAskDepth = orderBooks.reduce((sum, ob) => sum + ob.askDepth, 0);
  const weightedSpread = orderBooks.reduce((sum, ob) => sum + ob.spreadPercentage * ob.bidDepth, 0) / totalBidDepth;
  const overallImbalance = ((totalBidDepth - totalAskDepth) / (totalBidDepth + totalAskDepth)) * 100;
  
  // Calculate slippage estimates
  const primaryOrderBook = orderBooks[0]; // Use largest exchange
  const slippageEstimates = calculateMultipleSlippageEstimates(currentPrice, primaryOrderBook);
  
  // Identify liquidity pools
  const liquidityPools = identifyLiquidityPools(symbol, orderBooks, dexData);
  
  // Calculate optimal routing for $1M trade
  const optimalRouting = calculateOptimalRouting(1000000 / currentPrice, currentPrice, liquidityPools);
  
  // Analyze market maker activity
  const marketMakerActivity = analyzeMarketMakerActivity(orderBooks, []); // Would pass historical data
  
  // Calculate market impact scores
  const marketImpact = [10000, 100000, 1000000, 10000000].map(size =>
    calculateMarketImpact(size, currentPrice, primaryOrderBook, [])
  );
  
  // Generate summary
  const summary = `Total liquidity: $${((totalBidDepth + totalAskDepth) * currentPrice / 2).toLocaleString()}. Weighted spread: ${weightedSpread.toFixed(3)}%. Order book imbalance: ${overallImbalance > 0 ? '+' : ''}${overallImbalance.toFixed(1)}% (${overallImbalance > 0 ? 'bid' : 'ask'} heavy). ${marketMakerActivity.detected ? `⚠️ ${marketMakerActivity.description}` : 'No manipulation detected.'}`;
  
  return {
    symbol,
    timestamp: new Date().toISOString(),
    orderBooks,
    aggregatedDepth: {
      totalBidDepth,
      totalAskDepth,
      weightedSpread,
      overallImbalance
    },
    slippageEstimates,
    liquidityPools,
    optimalRouting,
    marketMakerActivity,
    marketImpact,
    summary
  };
}
