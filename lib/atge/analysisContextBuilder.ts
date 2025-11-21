/**
 * ATGE Analysis Context Builder
 * 
 * Builds structured context for GPT-4o trade analysis
 * Handles missing data gracefully and formats for AI consumption
 */

export interface AnalysisContext {
  trade: {
    id: string;
    symbol: string;
    direction: 'LONG' | 'SHORT';
    timeframe: string;
    entryPrice: number;
    stopLoss: number;
    tp1: number;
    tp2: number;
    tp3: number;
    generatedAt: string;
    expiresAt: string;
  };
  indicators?: {
    rsi?: number;
    macd?: number;
    macdSignal?: number;
    macdHistogram?: number;
    ema20?: number;
    ema50?: number;
    ema200?: number;
    bollingerUpper?: number;
    bollingerMiddle?: number;
    bollingerLower?: number;
    atrValue?: number;
    volume24h?: number;
    marketCap?: number;
  };
  snapshot?: {
    price: number;
    priceChange24h?: number;
    volume24h?: number;
    marketCap?: number;
    high24h?: number;
    low24h?: number;
    socialSentimentScore?: number;
    whaleActivityCount?: number;
    fearGreedIndex?: number;
    timestamp: string;
  };
  outcome: {
    status: string;
    tp1Hit: boolean;
    tp1HitAt?: string;
    tp1HitPrice?: number;
    tp2Hit: boolean;
    tp2HitAt?: string;
    tp2HitPrice?: number;
    tp3Hit: boolean;
    tp3HitAt?: string;
    tp3HitPrice?: number;
    stopLossHit: boolean;
    stopLossHitAt?: string;
    stopLossHitPrice?: number;
    profitLoss?: number;
    profitLossPercentage?: number;
    tradeDurationMinutes?: number;
  };
}

/**
 * Build analysis context from trade data
 * 
 * @param tradeData - Complete trade data from database
 * @returns Structured context for GPT-4o analysis
 */
export function buildAnalysisContext(tradeData: any): AnalysisContext {
  // Build trade details
  const trade = {
    id: tradeData.id || 'unknown',
    symbol: tradeData.symbol || 'BTC',
    direction: tradeData.direction || 'LONG',
    timeframe: tradeData.timeframe || '1h',
    entryPrice: parseFloat(tradeData.entry_price) || 0,
    stopLoss: parseFloat(tradeData.stop_loss) || 0,
    tp1: parseFloat(tradeData.take_profit_1) || 0,
    tp2: parseFloat(tradeData.take_profit_2) || 0,
    tp3: parseFloat(tradeData.take_profit_3) || 0,
    generatedAt: tradeData.generated_at || new Date().toISOString(),
    expiresAt: tradeData.expires_at || new Date().toISOString(),
  };

  // Build indicators (handle missing data)
  const indicators = tradeData.indicators ? {
    rsi: tradeData.indicators.rsiValue,
    macd: tradeData.indicators.macdValue,
    macdSignal: tradeData.indicators.macdSignal,
    macdHistogram: tradeData.indicators.macdHistogram,
    ema20: tradeData.indicators.ema20,
    ema50: tradeData.indicators.ema50,
    ema200: tradeData.indicators.ema200,
    bollingerUpper: tradeData.indicators.bollingerUpper,
    bollingerMiddle: tradeData.indicators.bollingerMiddle,
    bollingerLower: tradeData.indicators.bollingerLower,
    atrValue: tradeData.indicators.atrValue,
    volume24h: tradeData.indicators.volume24h,
    marketCap: tradeData.indicators.marketCap,
  } : undefined;

  // Build snapshot (handle missing data)
  const snapshot = tradeData.snapshot ? {
    price: tradeData.snapshot.price || tradeData.snapshot.currentPrice,
    priceChange24h: tradeData.snapshot.priceChange24h,
    volume24h: tradeData.snapshot.volume24h,
    marketCap: tradeData.snapshot.marketCap,
    high24h: tradeData.snapshot.high24h,
    low24h: tradeData.snapshot.low24h,
    socialSentimentScore: tradeData.snapshot.socialSentimentScore,
    whaleActivityCount: tradeData.snapshot.whaleActivityCount,
    fearGreedIndex: tradeData.snapshot.fearGreedIndex,
    timestamp: tradeData.snapshot.timestamp || tradeData.snapshot.snapshotAt || new Date().toISOString(),
  } : undefined;

  // Build outcome
  const outcome = {
    status: tradeData.status || 'active',
    tp1Hit: tradeData.result?.tp1Hit || false,
    tp1HitAt: tradeData.result?.tp1HitAt,
    tp1HitPrice: tradeData.result?.tp1HitPrice,
    tp2Hit: tradeData.result?.tp2Hit || false,
    tp2HitAt: tradeData.result?.tp2HitAt,
    tp2HitPrice: tradeData.result?.tp2HitPrice,
    tp3Hit: tradeData.result?.tp3Hit || false,
    tp3HitAt: tradeData.result?.tp3HitAt,
    tp3HitPrice: tradeData.result?.tp3HitPrice,
    stopLossHit: tradeData.result?.stopLossHit || false,
    stopLossHitAt: tradeData.result?.stopLossHitAt,
    stopLossHitPrice: tradeData.result?.stopLossHitPrice,
    profitLoss: tradeData.result?.netProfitLossUsd || tradeData.result?.profitLossUsd,
    profitLossPercentage: tradeData.result?.profitLossPercentage,
    tradeDurationMinutes: tradeData.result?.tradeDurationMinutes,
  };

  return {
    trade,
    indicators,
    snapshot,
    outcome,
  };
}

/**
 * Format context as human-readable text for GPT-4o
 * 
 * @param context - Structured analysis context
 * @returns Formatted text for AI prompt
 */
export function formatContextForAI(context: AnalysisContext): string {
  let formatted = `# Trade Analysis Context\n\n`;

  // Trade Details
  formatted += `## Trade Details\n`;
  formatted += `- Symbol: ${context.trade.symbol}\n`;
  formatted += `- Direction: ${context.trade.direction}\n`;
  formatted += `- Timeframe: ${context.trade.timeframe}\n`;
  formatted += `- Entry Price: $${context.trade.entryPrice.toLocaleString()}\n`;
  formatted += `- Stop Loss: $${context.trade.stopLoss.toLocaleString()}\n`;
  formatted += `- Take Profit 1: $${context.trade.tp1.toLocaleString()}\n`;
  formatted += `- Take Profit 2: $${context.trade.tp2.toLocaleString()}\n`;
  formatted += `- Take Profit 3: $${context.trade.tp3.toLocaleString()}\n`;
  formatted += `- Generated: ${new Date(context.trade.generatedAt).toLocaleString()}\n\n`;

  // Technical Indicators
  if (context.indicators) {
    formatted += `## Technical Indicators (at trade generation)\n`;
    if (context.indicators.rsi !== undefined) formatted += `- RSI (14): ${context.indicators.rsi.toFixed(2)}\n`;
    if (context.indicators.macd !== undefined) formatted += `- MACD: ${context.indicators.macd.toFixed(2)}\n`;
    if (context.indicators.macdHistogram !== undefined) formatted += `- MACD Histogram: ${context.indicators.macdHistogram.toFixed(2)}\n`;
    if (context.indicators.ema20 !== undefined) formatted += `- EMA 20: $${context.indicators.ema20.toLocaleString()}\n`;
    if (context.indicators.ema50 !== undefined) formatted += `- EMA 50: $${context.indicators.ema50.toLocaleString()}\n`;
    if (context.indicators.ema200 !== undefined) formatted += `- EMA 200: $${context.indicators.ema200.toLocaleString()}\n`;
    if (context.indicators.atrValue !== undefined) formatted += `- ATR (14): ${context.indicators.atrValue.toLocaleString()}\n`;
    formatted += `\n`;
  } else {
    formatted += `## Technical Indicators\n- Not available\n\n`;
  }

  // Market Snapshot
  if (context.snapshot) {
    formatted += `## Market Snapshot (at trade generation)\n`;
    formatted += `- Price: $${context.snapshot.price.toLocaleString()}\n`;
    if (context.snapshot.priceChange24h !== undefined) formatted += `- 24h Change: ${context.snapshot.priceChange24h.toFixed(2)}%\n`;
    if (context.snapshot.volume24h !== undefined) formatted += `- 24h Volume: $${(context.snapshot.volume24h / 1e9).toFixed(2)}B\n`;
    if (context.snapshot.marketCap !== undefined) formatted += `- Market Cap: $${(context.snapshot.marketCap / 1e9).toFixed(2)}B\n`;
    if (context.snapshot.socialSentimentScore !== undefined) formatted += `- Social Sentiment: ${context.snapshot.socialSentimentScore}/100\n`;
    if (context.snapshot.fearGreedIndex !== undefined) formatted += `- Fear & Greed Index: ${context.snapshot.fearGreedIndex}\n`;
    formatted += `\n`;
  } else {
    formatted += `## Market Snapshot\n- Not available\n\n`;
  }

  // Trade Outcome
  formatted += `## Trade Outcome\n`;
  formatted += `- Status: ${context.outcome.status}\n`;
  formatted += `- TP1 Hit: ${context.outcome.tp1Hit ? 'Yes' : 'No'}${context.outcome.tp1HitAt ? ` (at $${context.outcome.tp1HitPrice?.toLocaleString()})` : ''}\n`;
  formatted += `- TP2 Hit: ${context.outcome.tp2Hit ? 'Yes' : 'No'}${context.outcome.tp2HitAt ? ` (at $${context.outcome.tp2HitPrice?.toLocaleString()})` : ''}\n`;
  formatted += `- TP3 Hit: ${context.outcome.tp3Hit ? 'Yes' : 'No'}${context.outcome.tp3HitAt ? ` (at $${context.outcome.tp3HitPrice?.toLocaleString()})` : ''}\n`;
  formatted += `- Stop Loss Hit: ${context.outcome.stopLossHit ? 'Yes' : 'No'}${context.outcome.stopLossHitAt ? ` (at $${context.outcome.stopLossHitPrice?.toLocaleString()})` : ''}\n`;
  
  if (context.outcome.profitLoss !== undefined) {
    formatted += `- Profit/Loss: $${context.outcome.profitLoss.toFixed(2)} (${context.outcome.profitLossPercentage?.toFixed(2)}%)\n`;
  }
  
  if (context.outcome.tradeDurationMinutes !== undefined) {
    const hours = Math.floor(context.outcome.tradeDurationMinutes / 60);
    const minutes = context.outcome.tradeDurationMinutes % 60;
    formatted += `- Duration: ${hours}h ${minutes}m\n`;
  }

  return formatted;
}
