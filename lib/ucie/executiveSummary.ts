/**
 * Executive Summary Generation
 * 
 * Uses GPT-4o to generate comprehensive executive summaries from UCIE analysis data.
 * Identifies top findings, opportunities, risks, and actionable insights.
 */

export interface ExecutiveSummaryInput {
  symbol: string;
  marketData: {
    price: number;
    change24h: number;
    marketCap: number;
    volume24h: number;
  };
  consensus: {
    recommendation: string;
    overallScore: number;
    confidence: number;
  };
  technical: {
    signal: string;
    indicators: any;
  };
  sentiment: {
    overallScore: number;
    trends: any[];
  };
  onChain: {
    holderConcentration: any;
    whaleActivity: string;
  };
  research?: {
    technologyOverview: string;
    riskFactors: string[];
  };
  risk: {
    overallScore: number;
    volatility: any;
  };
  predictions?: {
    price24h: any;
    price7d: any;
    price30d: any;
  };
}

export interface ExecutiveSummary {
  topFindings: string[];
  opportunities: string[];
  risks: string[];
  actionableInsights: string[];
  oneLineSummary: string;
}

/**
 * Generate executive summary using GPT-4o
 */
export async function generateExecutiveSummary(
  input: ExecutiveSummaryInput
): Promise<ExecutiveSummary> {
  try {
    const prompt = buildPrompt(input);
    const systemPrompt = buildSystemPrompt();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the JSON response
    const summary = JSON.parse(content);

    return {
      topFindings: summary.topFindings || [],
      opportunities: summary.opportunities || [],
      risks: summary.risks || [],
      actionableInsights: summary.actionableInsights || [],
      oneLineSummary: summary.oneLineSummary || '',
    };
  } catch (error) {
    console.error('Error generating executive summary:', error);
    // Return fallback summary
    return generateFallbackSummary(input);
  }
}

/**
 * Build the system prompt for GPT-4o
 */
function buildSystemPrompt(): string {
  return `You are an expert cryptocurrency analyst generating executive summaries for the Universal Crypto Intelligence Engine (UCIE).

Your task is to analyze comprehensive cryptocurrency data and generate a concise, actionable executive summary.

Return your response as a JSON object with the following structure:
{
  "topFindings": ["finding 1", "finding 2", "finding 3", "finding 4", "finding 5"],
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "actionableInsights": ["insight 1", "insight 2", "insight 3"],
  "oneLineSummary": "A single sentence summarizing the overall analysis"
}

Guidelines:
- Top Findings: 5 most important discoveries from the analysis
- Opportunities: 3 potential upside scenarios or entry points
- Risks: 3 key risks or concerns to be aware of
- Actionable Insights: 3 specific actions traders/investors should consider
- One-Line Summary: A single, powerful sentence capturing the essence

Be specific, data-driven, and actionable. Use clear, professional language.`;
}

/**
 * Build the analysis prompt with all data
 */
function buildPrompt(input: ExecutiveSummaryInput): string {
  const {
    symbol,
    marketData,
    consensus,
    technical,
    sentiment,
    onChain,
    research,
    risk,
    predictions,
  } = input;

  return `Analyze ${symbol} and generate an executive summary.

MARKET DATA:
- Current Price: $${marketData.price.toLocaleString()}
- 24h Change: ${marketData.change24h.toFixed(2)}%
- Market Cap: $${(marketData.marketCap / 1e9).toFixed(2)}B
- 24h Volume: $${(marketData.volume24h / 1e6).toFixed(2)}M

CONSENSUS RECOMMENDATION:
- Overall: ${consensus.recommendation.toUpperCase()} (Score: ${consensus.overallScore}/100)
- Confidence: ${consensus.confidence}%

TECHNICAL ANALYSIS:
- Signal: ${technical.signal}
- Key Indicators: ${JSON.stringify(technical.indicators)}

SENTIMENT ANALYSIS:
- Overall Score: ${sentiment.overallScore}/100
- Trend: ${sentiment.trends.length > 0 ? sentiment.trends[0] : 'Neutral'}

ON-CHAIN METRICS:
- Holder Concentration: ${JSON.stringify(onChain.holderConcentration)}
- Whale Activity: ${onChain.whaleActivity}

${research ? `FUNDAMENTAL RESEARCH:
- Technology: ${research.technologyOverview.substring(0, 200)}...
- Risk Factors: ${research.riskFactors.join(', ')}` : ''}

RISK ASSESSMENT:
- Risk Score: ${risk.overallScore}/100
- Volatility: ${JSON.stringify(risk.volatility)}

${predictions ? `PRICE PREDICTIONS:
- 24h: $${predictions.price24h.mid?.toLocaleString() || 'N/A'}
- 7d: $${predictions.price7d.mid?.toLocaleString() || 'N/A'}
- 30d: $${predictions.price30d.mid?.toLocaleString() || 'N/A'}` : ''}

Generate a comprehensive executive summary focusing on the most important insights for traders and investors.`;
}

/**
 * Generate a fallback summary when AI fails
 */
function generateFallbackSummary(input: ExecutiveSummaryInput): ExecutiveSummary {
  const { symbol, marketData, consensus, technical, sentiment, risk } = input;

  const topFindings: string[] = [];
  const opportunities: string[] = [];
  const risks: string[] = [];
  const actionableInsights: string[] = [];

  // Top findings
  topFindings.push(
    `${symbol} is currently trading at $${marketData.price.toLocaleString()} with ${marketData.change24h > 0 ? 'a' : 'a'} ${Math.abs(marketData.change24h).toFixed(2)}% ${marketData.change24h > 0 ? 'gain' : 'loss'} in 24h`
  );

  topFindings.push(
    `Consensus recommendation is ${consensus.recommendation.toUpperCase()} with ${consensus.confidence}% confidence`
  );

  topFindings.push(
    `Technical analysis shows ${technical.signal} signal with multiple indicators aligning`
  );

  topFindings.push(
    `Social sentiment is ${sentiment.overallScore > 60 ? 'positive' : sentiment.overallScore < 40 ? 'negative' : 'neutral'} at ${sentiment.overallScore}/100`
  );

  topFindings.push(
    `Risk score is ${risk.overallScore}/100, indicating ${risk.overallScore > 70 ? 'high' : risk.overallScore > 40 ? 'moderate' : 'low'} risk`
  );

  // Opportunities
  if (consensus.overallScore >= 60) {
    opportunities.push('Strong consensus signals potential upside opportunity');
  }
  if (sentiment.overallScore < 40 && technical.signal === 'buy') {
    opportunities.push('Sentiment-price divergence may indicate contrarian opportunity');
  }
  if (marketData.change24h < -5) {
    opportunities.push('Recent price dip could present entry point for long-term holders');
  }

  // Risks
  if (risk.overallScore > 70) {
    risks.push('High volatility and risk metrics suggest caution');
  }
  if (sentiment.overallScore > 80 && technical.signal === 'sell') {
    risks.push('Extreme sentiment with bearish technicals may signal distribution');
  }
  if (marketData.volume24h < marketData.marketCap * 0.01) {
    risks.push('Low trading volume relative to market cap indicates liquidity concerns');
  }

  // Actionable insights
  if (consensus.recommendation === 'strong_buy' || consensus.recommendation === 'buy') {
    actionableInsights.push('Consider accumulating positions with proper risk management');
  } else if (consensus.recommendation === 'sell' || consensus.recommendation === 'strong_sell') {
    actionableInsights.push('Consider reducing exposure or taking profits');
  } else {
    actionableInsights.push('Monitor closely for clearer signals before taking action');
  }

  actionableInsights.push('Set alerts for key price levels and sentiment shifts');
  actionableInsights.push('Review on-chain metrics regularly for whale activity changes');

  // One-line summary
  const oneLineSummary = `${symbol} shows ${consensus.recommendation.replace('_', ' ')} signal with ${consensus.confidence}% confidence, ${sentiment.overallScore > 60 ? 'positive' : sentiment.overallScore < 40 ? 'negative' : 'neutral'} sentiment, and ${risk.overallScore > 70 ? 'high' : risk.overallScore > 40 ? 'moderate' : 'low'} risk profile.`;

  return {
    topFindings,
    opportunities,
    risks,
    actionableInsights,
    oneLineSummary,
  };
}

/**
 * Format executive summary for display
 */
export function formatExecutiveSummary(summary: ExecutiveSummary): string {
  let formatted = '# Executive Summary\n\n';

  formatted += `**${summary.oneLineSummary}**\n\n`;

  formatted += '## Top 5 Findings\n';
  summary.topFindings.forEach((finding, i) => {
    formatted += `${i + 1}. ${finding}\n`;
  });

  formatted += '\n## Opportunities\n';
  summary.opportunities.forEach((opp, i) => {
    formatted += `${i + 1}. ${opp}\n`;
  });

  formatted += '\n## Risks\n';
  summary.risks.forEach((risk, i) => {
    formatted += `${i + 1}. ${risk}\n`;
  });

  formatted += '\n## Actionable Insights\n';
  summary.actionableInsights.forEach((insight, i) => {
    formatted += `${i + 1}. ${insight}\n`;
  });

  return formatted;
}

/**
 * Generate summary for multiple tokens (comparison)
 */
export async function generateComparativeSummary(
  inputs: ExecutiveSummaryInput[]
): Promise<string> {
  if (inputs.length === 0) return '';
  if (inputs.length === 1) {
    const summary = await generateExecutiveSummary(inputs[0]);
    return formatExecutiveSummary(summary);
  }

  try {
    const prompt = `Compare and contrast the following cryptocurrencies:

${inputs.map((input, i) => `
${i + 1}. ${input.symbol}
- Price: $${input.marketData.price.toLocaleString()}
- Recommendation: ${input.consensus.recommendation}
- Sentiment: ${input.sentiment.overallScore}/100
- Risk: ${input.risk.overallScore}/100
`).join('\n')}

Provide a comparative analysis highlighting:
1. Which token has the strongest overall profile
2. Key differences in risk/reward profiles
3. Which is best for short-term vs long-term
4. Any notable correlations or divergences

Return as plain text, not JSON.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert cryptocurrency analyst providing comparative analysis.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating comparative summary:', error);
    return 'Unable to generate comparative summary at this time.';
  }
}
