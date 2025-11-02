/**
 * AI-Powered Technical Indicator Interpretation
 * Uses GPT-4o to provide plain-language explanations of technical indicators
 * Requirements: 7.2
 */

import {
  RSIResult,
  MACDResult,
  BollingerBandsResult,
  EMAResult,
  StochasticResult,
  ATRResult,
  ADXResult,
  OBVResult,
  FibonacciResult,
  IchimokuResult,
  VolumeProfileResult
} from './technicalIndicators';

export interface AIInterpretation {
  summary: string;
  explanation: string;
  tradingImplication: string;
  confidence: number; // 0-100
  signals: {
    bullish: string[];
    bearish: string[];
    neutral: string[];
  };
}

export interface TechnicalIndicatorSummary {
  rsi?: RSIResult;
  macd?: MACDResult;
  bollingerBands?: BollingerBandsResult;
  ema?: EMAResult;
  stochastic?: StochasticResult;
  atr?: ATRResult;
  adx?: ADXResult;
  obv?: OBVResult;
  fibonacci?: FibonacciResult;
  ichimoku?: IchimokuResult;
  volumeProfile?: VolumeProfileResult;
}

/**
 * Generate AI-powered interpretation of all technical indicators
 */
export async function interpretTechnicalIndicators(
  symbol: string,
  indicators: TechnicalIndicatorSummary,
  currentPrice: number
): Promise<AIInterpretation> {
  try {
    const prompt = buildInterpretationPrompt(symbol, indicators, currentPrice);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert cryptocurrency technical analyst. Provide clear, actionable interpretations of technical indicators in plain language. Focus on what the indicators mean for traders and investors. Be concise but thorough.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse AI response into structured format
    return parseAIResponse(aiResponse, indicators);
  } catch (error) {
    console.error('Error interpreting indicators with AI:', error);
    
    // Fallback to rule-based interpretation
    return generateRuleBasedInterpretation(indicators);
  }
}

/**
 * Build prompt for GPT-4o
 */
function buildInterpretationPrompt(
  symbol: string,
  indicators: TechnicalIndicatorSummary,
  currentPrice: number
): string {
  let prompt = `Analyze the following technical indicators for ${symbol} (current price: $${currentPrice.toFixed(2)}):\n\n`;

  if (indicators.rsi) {
    prompt += `RSI: ${indicators.rsi.value.toFixed(2)} (${indicators.rsi.signal})\n`;
  }

  if (indicators.macd) {
    prompt += `MACD: ${indicators.macd.macd.toFixed(2)}, Signal: ${indicators.macd.signal.toFixed(2)}, Histogram: ${indicators.macd.histogram.toFixed(2)} (${indicators.macd.signalType})\n`;
  }

  if (indicators.bollingerBands) {
    prompt += `Bollinger Bands: Upper ${indicators.bollingerBands.upper.toFixed(2)}, Middle ${indicators.bollingerBands.middle.toFixed(2)}, Lower ${indicators.bollingerBands.lower.toFixed(2)} (${indicators.bollingerBands.signal})\n`;
  }

  if (indicators.ema) {
    prompt += `EMAs: 9=${indicators.ema.ema9.toFixed(2)}, 21=${indicators.ema.ema21.toFixed(2)}, 50=${indicators.ema.ema50.toFixed(2)}, 200=${indicators.ema.ema200.toFixed(2)} (${indicators.ema.trend})\n`;
  }

  if (indicators.stochastic) {
    prompt += `Stochastic: %K=${indicators.stochastic.k.toFixed(2)}, %D=${indicators.stochastic.d.toFixed(2)} (${indicators.stochastic.signal})\n`;
  }

  if (indicators.atr) {
    prompt += `ATR: ${indicators.atr.value.toFixed(2)} (${indicators.atr.volatility} volatility)\n`;
  }

  if (indicators.adx) {
    prompt += `ADX: ${indicators.adx.value.toFixed(2)} (${indicators.adx.trend} trend)\n`;
  }

  if (indicators.obv) {
    prompt += `OBV: ${indicators.obv.value.toFixed(0)} (${indicators.obv.trend})\n`;
  }

  if (indicators.ichimoku) {
    prompt += `Ichimoku: ${indicators.ichimoku.signal} signal, ${indicators.ichimoku.cloud} cloud\n`;
  }

  prompt += `\nProvide:\n`;
  prompt += `1. A brief summary (1-2 sentences)\n`;
  prompt += `2. Detailed explanation of what these indicators collectively suggest\n`;
  prompt += `3. Trading implications (what should traders consider?)\n`;
  prompt += `4. Confidence level (0-100) in this analysis\n`;
  prompt += `5. List bullish signals, bearish signals, and neutral signals separately\n\n`;
  prompt += `Format your response as:\n`;
  prompt += `SUMMARY: [summary]\n`;
  prompt += `EXPLANATION: [explanation]\n`;
  prompt += `TRADING: [trading implications]\n`;
  prompt += `CONFIDENCE: [number]\n`;
  prompt += `BULLISH: [signal1], [signal2], ...\n`;
  prompt += `BEARISH: [signal1], [signal2], ...\n`;
  prompt += `NEUTRAL: [signal1], [signal2], ...\n`;

  return prompt;
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(
  response: string,
  indicators: TechnicalIndicatorSummary
): AIInterpretation {
  const lines = response.split('\n');
  
  let summary = '';
  let explanation = '';
  let tradingImplication = '';
  let confidence = 75; // Default
  const bullish: string[] = [];
  const bearish: string[] = [];
  const neutral: string[] = [];

  for (const line of lines) {
    if (line.startsWith('SUMMARY:')) {
      summary = line.replace('SUMMARY:', '').trim();
    } else if (line.startsWith('EXPLANATION:')) {
      explanation = line.replace('EXPLANATION:', '').trim();
    } else if (line.startsWith('TRADING:')) {
      tradingImplication = line.replace('TRADING:', '').trim();
    } else if (line.startsWith('CONFIDENCE:')) {
      const confStr = line.replace('CONFIDENCE:', '').trim();
      confidence = parseInt(confStr) || 75;
    } else if (line.startsWith('BULLISH:')) {
      const signals = line.replace('BULLISH:', '').trim().split(',');
      bullish.push(...signals.map(s => s.trim()).filter(s => s));
    } else if (line.startsWith('BEARISH:')) {
      const signals = line.replace('BEARISH:', '').trim().split(',');
      bearish.push(...signals.map(s => s.trim()).filter(s => s));
    } else if (line.startsWith('NEUTRAL:')) {
      const signals = line.replace('NEUTRAL:', '').trim().split(',');
      neutral.push(...signals.map(s => s.trim()).filter(s => s));
    }
  }

  // Fallback if parsing failed
  if (!summary) {
    summary = response.substring(0, 200);
  }
  if (!explanation) {
    explanation = response;
  }

  return {
    summary,
    explanation,
    tradingImplication,
    confidence: Math.min(100, Math.max(0, confidence)),
    signals: { bullish, bearish, neutral }
  };
}

/**
 * Generate rule-based interpretation as fallback
 */
function generateRuleBasedInterpretation(
  indicators: TechnicalIndicatorSummary
): AIInterpretation {
  const bullish: string[] = [];
  const bearish: string[] = [];
  const neutral: string[] = [];

  // Analyze each indicator
  if (indicators.rsi) {
    if (indicators.rsi.signal === 'oversold') {
      bullish.push('RSI oversold - potential bounce');
    } else if (indicators.rsi.signal === 'overbought') {
      bearish.push('RSI overbought - potential correction');
    } else {
      neutral.push('RSI in neutral range');
    }
  }

  if (indicators.macd) {
    if (indicators.macd.signalType === 'bullish') {
      bullish.push('MACD bullish crossover');
    } else if (indicators.macd.signalType === 'bearish') {
      bearish.push('MACD bearish crossover');
    } else {
      neutral.push('MACD neutral');
    }
  }

  if (indicators.bollingerBands) {
    if (indicators.bollingerBands.signal === 'oversold') {
      bullish.push('Price below lower Bollinger Band');
    } else if (indicators.bollingerBands.signal === 'overbought') {
      bearish.push('Price above upper Bollinger Band');
    } else {
      neutral.push('Price within Bollinger Bands');
    }
  }

  if (indicators.ema) {
    if (indicators.ema.trend === 'bullish') {
      bullish.push('EMAs aligned bullishly');
    } else if (indicators.ema.trend === 'bearish') {
      bearish.push('EMAs aligned bearishly');
    } else {
      neutral.push('EMAs mixed');
    }
  }

  if (indicators.stochastic) {
    if (indicators.stochastic.signal === 'oversold') {
      bullish.push('Stochastic oversold');
    } else if (indicators.stochastic.signal === 'overbought') {
      bearish.push('Stochastic overbought');
    } else {
      neutral.push('Stochastic neutral');
    }
  }

  if (indicators.adx) {
    if (indicators.adx.trend === 'strong') {
      neutral.push('Strong trend detected (ADX)');
    } else {
      neutral.push('Weak or no trend (ADX)');
    }
  }

  if (indicators.obv) {
    if (indicators.obv.trend === 'bullish') {
      bullish.push('OBV trending up');
    } else if (indicators.obv.trend === 'bearish') {
      bearish.push('OBV trending down');
    } else {
      neutral.push('OBV flat');
    }
  }

  if (indicators.ichimoku) {
    if (indicators.ichimoku.signal === 'bullish') {
      bullish.push('Ichimoku bullish signal');
    } else if (indicators.ichimoku.signal === 'bearish') {
      bearish.push('Ichimoku bearish signal');
    } else {
      neutral.push('Ichimoku neutral');
    }
  }

  // Calculate overall sentiment
  const bullishCount = bullish.length;
  const bearishCount = bearish.length;
  const totalSignals = bullishCount + bearishCount + neutral.length;

  let summary: string;
  let explanation: string;
  let tradingImplication: string;
  let confidence: number;

  if (bullishCount > bearishCount && bullishCount > totalSignals * 0.4) {
    summary = 'Technical indicators show predominantly bullish signals.';
    explanation = `${bullishCount} bullish signals detected across multiple indicators, suggesting upward momentum. However, ${bearishCount} bearish signals warrant caution.`;
    tradingImplication = 'Consider long positions with appropriate risk management. Watch for confirmation from price action.';
    confidence = Math.min(90, 50 + (bullishCount * 10));
  } else if (bearishCount > bullishCount && bearishCount > totalSignals * 0.4) {
    summary = 'Technical indicators show predominantly bearish signals.';
    explanation = `${bearishCount} bearish signals detected across multiple indicators, suggesting downward pressure. ${bullishCount} bullish signals provide some support.`;
    tradingImplication = 'Consider short positions or wait for better entry points. Exercise caution with long positions.';
    confidence = Math.min(90, 50 + (bearishCount * 10));
  } else {
    summary = 'Technical indicators show mixed signals with no clear direction.';
    explanation = `Indicators are divided with ${bullishCount} bullish, ${bearishCount} bearish, and ${neutral.length} neutral signals. Market may be consolidating or transitioning.`;
    tradingImplication = 'Wait for clearer signals before taking positions. Consider range-bound trading strategies.';
    confidence = 60;
  }

  return {
    summary,
    explanation,
    tradingImplication,
    confidence,
    signals: { bullish, bearish, neutral }
  };
}

/**
 * Identify overbought/oversold conditions across indicators
 */
export function identifyExtremeConditions(
  indicators: TechnicalIndicatorSummary
): {
  overbought: boolean;
  oversold: boolean;
  extremeCount: number;
  details: string[];
} {
  const details: string[] = [];
  let overboughtCount = 0;
  let oversoldCount = 0;

  if (indicators.rsi) {
    if (indicators.rsi.signal === 'overbought') {
      overboughtCount++;
      details.push(`RSI overbought at ${indicators.rsi.value.toFixed(2)}`);
    } else if (indicators.rsi.signal === 'oversold') {
      oversoldCount++;
      details.push(`RSI oversold at ${indicators.rsi.value.toFixed(2)}`);
    }
  }

  if (indicators.stochastic) {
    if (indicators.stochastic.signal === 'overbought') {
      overboughtCount++;
      details.push(`Stochastic overbought (%K: ${indicators.stochastic.k.toFixed(2)})`);
    } else if (indicators.stochastic.signal === 'oversold') {
      oversoldCount++;
      details.push(`Stochastic oversold (%K: ${indicators.stochastic.k.toFixed(2)})`);
    }
  }

  if (indicators.bollingerBands) {
    if (indicators.bollingerBands.signal === 'overbought') {
      overboughtCount++;
      details.push('Price above upper Bollinger Band');
    } else if (indicators.bollingerBands.signal === 'oversold') {
      oversoldCount++;
      details.push('Price below lower Bollinger Band');
    }
  }

  return {
    overbought: overboughtCount >= 2,
    oversold: oversoldCount >= 2,
    extremeCount: overboughtCount + oversoldCount,
    details
  };
}

/**
 * Detect bullish/bearish signals across indicators
 */
export function detectTradingSignals(
  indicators: TechnicalIndicatorSummary
): {
  signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  strength: number; // 0-100
  reasons: string[];
} {
  let bullishScore = 0;
  let bearishScore = 0;
  const reasons: string[] = [];

  // RSI
  if (indicators.rsi) {
    if (indicators.rsi.value < 30) {
      bullishScore += 2;
      reasons.push('RSI oversold');
    } else if (indicators.rsi.value > 70) {
      bearishScore += 2;
      reasons.push('RSI overbought');
    }
  }

  // MACD
  if (indicators.macd) {
    if (indicators.macd.signalType === 'bullish') {
      bullishScore += 2;
      reasons.push('MACD bullish crossover');
    } else if (indicators.macd.signalType === 'bearish') {
      bearishScore += 2;
      reasons.push('MACD bearish crossover');
    }
  }

  // EMA
  if (indicators.ema) {
    if (indicators.ema.trend === 'bullish') {
      bullishScore += 3;
      reasons.push('EMAs aligned bullishly');
    } else if (indicators.ema.trend === 'bearish') {
      bearishScore += 3;
      reasons.push('EMAs aligned bearishly');
    }
  }

  // ADX
  if (indicators.adx && indicators.adx.trend === 'strong') {
    // Amplify existing signals if trend is strong
    if (bullishScore > bearishScore) {
      bullishScore += 1;
      reasons.push('Strong trend confirmation (ADX)');
    } else if (bearishScore > bullishScore) {
      bearishScore += 1;
      reasons.push('Strong trend confirmation (ADX)');
    }
  }

  // OBV
  if (indicators.obv) {
    if (indicators.obv.trend === 'bullish') {
      bullishScore += 1;
      reasons.push('Volume supports uptrend (OBV)');
    } else if (indicators.obv.trend === 'bearish') {
      bearishScore += 1;
      reasons.push('Volume supports downtrend (OBV)');
    }
  }

  // Ichimoku
  if (indicators.ichimoku) {
    if (indicators.ichimoku.signal === 'bullish') {
      bullishScore += 2;
      reasons.push('Ichimoku bullish');
    } else if (indicators.ichimoku.signal === 'bearish') {
      bearishScore += 2;
      reasons.push('Ichimoku bearish');
    }
  }

  // Determine signal
  const totalScore = bullishScore + bearishScore;
  const netScore = bullishScore - bearishScore;
  const strength = totalScore > 0 ? Math.abs(netScore) / totalScore * 100 : 0;

  let signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';

  if (netScore >= 5) {
    signal = 'strong_buy';
  } else if (netScore >= 2) {
    signal = 'buy';
  } else if (netScore <= -5) {
    signal = 'strong_sell';
  } else if (netScore <= -2) {
    signal = 'sell';
  } else {
    signal = 'neutral';
  }

  return { signal, strength, reasons };
}
