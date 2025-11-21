/**
 * ATGE Analysis Prompts
 * 
 * GPT-4o prompt templates for different analysis phases
 */

import { AnalysisContext, formatContextForAI } from './analysisContextBuilder';

/**
 * Phase 1: Lightweight Post-Trade Analysis Prompt
 * 
 * Generates concise 200-300 word analysis explaining trade outcome
 */
export function getPhase1AnalysisPrompt(context: AnalysisContext): string {
  const contextText = formatContextForAI(context);
  
  const isProfitable = (context.outcome.profitLoss || 0) > 0;
  const isLoss = (context.outcome.profitLoss || 0) < 0;
  const isExpired = context.outcome.status === 'expired';
  
  return `You are an expert cryptocurrency trader analyzing a completed trade. Provide a concise, actionable analysis in 200-300 words.

${contextText}

## Your Task

Analyze this ${context.trade.symbol} ${context.trade.direction} trade and explain ${
  isProfitable ? 'why it succeeded' :
  isLoss ? 'why it failed' :
  isExpired ? 'why it expired without hitting targets' :
  'the outcome'
}.

## Required Format

Provide your analysis in this exact structure:

**Summary** (1-2 sentences)
[Brief overview of the trade outcome]

**${isProfitable ? 'Success' : isLoss ? 'Failure' : 'Key'} Factors** (3-4 bullet points)
- [Factor 1]
- [Factor 2]
- [Factor 3]

**Key Observations** (2-3 bullet points)
- [Observation 1]
- [Observation 2]

**Recommendation** (1-2 sentences)
[Actionable advice for similar future trades]

**Confidence Score**: [0-100]%

## Guidelines

1. Be specific - reference actual prices, indicators, and percentages
2. Focus on technical factors (RSI, MACD, EMA alignment, volume, volatility)
3. Consider market conditions (sentiment, whale activity, fear & greed)
4. Explain causation, not just correlation
5. Keep it concise - traders want quick insights
6. End with a confidence score (0-100%) for your analysis
7. If data is missing, note it but don't let it stop your analysis

## Example Confidence Scores
- 90-100%: All data available, clear technical setup, obvious outcome
- 70-89%: Most data available, good technical setup, expected outcome
- 50-69%: Some data missing, mixed signals, uncertain outcome
- 0-49%: Significant data missing, unclear setup, unexpected outcome

Provide your analysis now:`;
}

/**
 * Phase 2: Vision-Enabled Chart Analysis Prompt
 * 
 * Analyzes visual patterns from price chart image
 */
export function getPhase2VisionPrompt(context: AnalysisContext): string {
  const contextText = formatContextForAI(context);
  
  return `You are an expert technical analyst examining a cryptocurrency price chart. Analyze the visual patterns and provide insights.

${contextText}

## Your Task

Analyze the price chart image and identify:
1. Visual price action patterns (triangles, flags, head & shoulders, etc.)
2. Support and resistance levels
3. Candlestick formations (engulfing, doji, hammer, etc.)
4. Volume patterns and confirmations
5. EMA alignment and crossovers
6. How the trade played out visually

## Required Format

**Chart Analysis** (2-3 sentences)
[Describe what you see in the chart]

**Visual Patterns Identified** (2-3 bullet points)
- [Pattern 1]
- [Pattern 2]

**Support/Resistance Levels** (2-3 bullet points)
- [Level 1]
- [Level 2]

**Volume Analysis** (1-2 sentences)
[Describe volume patterns]

**Visual Confirmation** (1-2 sentences)
[How the chart confirms or contradicts the trade outcome]

Keep your analysis focused on what you can see in the chart. Be specific about price levels and patterns.`;
}

/**
 * Phase 3: Real-Time Analysis Prompt
 * 
 * Analyzes trade with complete event timeline
 */
export function getPhase3RealtimePrompt(context: AnalysisContext, events: any[]): string {
  const contextText = formatContextForAI(context);
  
  // Format events
  let eventsText = `## Trade Events Timeline\n\n`;
  events.forEach((event, index) => {
    const timestamp = new Date(event.timestamp).toLocaleTimeString();
    eventsText += `${index + 1}. [${timestamp}] ${event.event_type}: $${event.price?.toLocaleString() || 'N/A'}`;
    if (event.context) eventsText += ` - ${event.context}`;
    eventsText += `\n`;
  });
  
  return `You are an expert cryptocurrency trader analyzing a trade with complete real-time event data. Provide a detailed 400-500 word analysis.

${contextText}

${eventsText}

## Your Task

Analyze this trade's complete timeline and provide:
1. Timeline narrative - tell the story of what happened
2. Key turning points - identify critical moments
3. Explanation of each target hit/miss
4. Analysis of unusual market activity
5. Comparison of expected vs actual execution

## Required Format

**Timeline Narrative** (3-4 sentences)
[Tell the story chronologically]

**Key Turning Points** (3-4 bullet points)
- [Turning point 1 with time and price]
- [Turning point 2 with time and price]

**Target Analysis** (for each TP/SL)
- TP1: [Why it was/wasn't hit]
- TP2: [Why it was/wasn't hit]
- TP3: [Why it was/wasn't hit]
- Stop Loss: [Why it was/wasn't hit]

**Market Activity** (2-3 sentences)
[Notable events: whale activity, volume spikes, sentiment changes]

**Expected vs Actual** (2-3 sentences)
[How the trade played out compared to expectations]

**Lessons Learned** (2-3 bullet points)
- [Lesson 1]
- [Lesson 2]

Be detailed and specific. Reference exact times and prices from the timeline.`;
}

/**
 * Phase 4: Batch Pattern Analysis Prompt
 * 
 * Analyzes multiple trades to identify patterns
 */
export function getPhase4PatternPrompt(trades: any[]): string {
  // Summarize trades
  const winningTrades = trades.filter(t => (t.result?.netProfitLossUsd || 0) > 0);
  const losingTrades = trades.filter(t => (t.result?.netProfitLossUsd || 0) < 0);
  const winRate = (winningTrades.length / trades.length * 100).toFixed(1);
  
  let tradesText = `## Trade Summary\n\n`;
  tradesText += `Total Trades: ${trades.length}\n`;
  tradesText += `Winning Trades: ${winningTrades.length}\n`;
  tradesText += `Losing Trades: ${losingTrades.length}\n`;
  tradesText += `Win Rate: ${winRate}%\n\n`;
  
  // Add individual trade summaries
  tradesText += `## Individual Trades\n\n`;
  trades.forEach((trade, index) => {
    const profitLoss = trade.result?.netProfitLossUsd || 0;
    const profitLossPercentage = trade.result?.profitLossPercentage || 0;
    
    tradesText += `### Trade ${index + 1}: ${trade.symbol} ${trade.direction}\n`;
    tradesText += `- Entry: $${parseFloat(trade.entry_price).toLocaleString()}\n`;
    tradesText += `- Outcome: ${profitLoss >= 0 ? 'WIN' : 'LOSS'} ($${profitLoss.toFixed(2)}, ${profitLossPercentage.toFixed(2)}%)\n`;
    tradesText += `- Timeframe: ${trade.timeframe}\n`;
    
    if (trade.indicators) {
      tradesText += `- RSI: ${trade.indicators.rsiValue?.toFixed(2) || 'N/A'}\n`;
      tradesText += `- MACD: ${trade.indicators.macdHistogram?.toFixed(2) || 'N/A'}\n`;
    }
    
    tradesText += `\n`;
  });
  
  return `You are an expert cryptocurrency trading analyst. Analyze these ${trades.length} trades to identify patterns and provide actionable recommendations.

${tradesText}

## Your Task

Identify patterns that lead to success and failure. Provide statistical insights and actionable recommendations.

## Required Format

**Overall Performance** (3-4 sentences)
[Summarize the overall trading performance]

**Success Pattern Identified** (Primary pattern with highest win rate)
Characteristics of winning trades:
- [Characteristic 1 with win rate %]
- [Characteristic 2 with win rate %]
- [Characteristic 3 with win rate %]
- [Characteristic 4 with win rate %]

**Failure Pattern Identified** (Primary pattern with highest loss rate)
Characteristics of losing trades:
- [Characteristic 1 with loss rate %]
- [Characteristic 2 with loss rate %]
- [Characteristic 3 with loss rate %]

**Statistical Insights** (3-4 bullet points)
- [Insight 1 with numbers]
- [Insight 2 with numbers]
- [Insight 3 with numbers]

**Actionable Recommendations** (Priority ordered)
1. [Recommendation 1 - highest impact]
2. [Recommendation 2 - medium impact]
3. [Recommendation 3 - lower impact]

**Confidence in Patterns**: [0-100]%

## Guidelines

1. Be specific with percentages and statistics
2. Identify patterns that are statistically significant (not random)
3. Focus on actionable insights traders can use
4. Prioritize recommendations by potential impact
5. Provide confidence score for your pattern identification
6. If sample size is small (<20 trades), note this limitation

Provide your analysis now:`;
}
