/**
 * UCIE Regenerate Caesar Prompt API
 * 
 * Regenerates Caesar AI prompt with GPT-5.1 analysis results
 * Called after GPT-5.1 completes to update the Caesar prompt
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getCachedAnalysis } from '../../../../lib/ucie/cacheUtils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;
  const { gptAnalysis } = req.body;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  if (!gptAnalysis) {
    return res.status(400).json({ error: 'GPT analysis is required' });
  }

  try {
    console.log(`🔄 Regenerating Caesar prompt for ${symbol} with GPT-5.1 analysis...`);

    // ✅ Read ALL data from database (30 min freshness for Caesar)
    const marketData = await getCachedAnalysis(symbol, 'market-data', undefined, undefined, 1800);
    const sentimentData = await getCachedAnalysis(symbol, 'sentiment', undefined, undefined, 1800);
    const technicalData = await getCachedAnalysis(symbol, 'technical', undefined, undefined, 1800);
    const newsData = await getCachedAnalysis(symbol, 'news', undefined, undefined, 1800);
    const onChainData = await getCachedAnalysis(symbol, 'on-chain', undefined, undefined, 1800);

    // Build comprehensive Caesar prompt
    let prompt = `# Comprehensive ${symbol} Market Intelligence Report\n\n`;
    prompt += `**Analysis Date**: ${new Date().toISOString()}\n`;
    prompt += `**Data Sources**: 13+ APIs (Market, Sentiment, Technical, News, On-Chain)\n`;
    prompt += `**AI Enhancement**: ChatGPT 5.1 with enhanced reasoning\n\n`;
    prompt += `---\n\n`;

    // Market Data Section
    if (marketData?.success && marketData?.priceAggregation) {
      const agg = marketData.priceAggregation;
      prompt += `## 📊 Market Data\n\n`;
      prompt += `- **Current Price**: $${(agg.averagePrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      prompt += `- **24h Change**: ${(agg.averageChange24h || 0) > 0 ? '+' : ''}${(agg.averageChange24h || 0).toFixed(2)}%\n`;
      prompt += `- **24h Volume**: $${((agg.totalVolume24h || 0) / 1e9).toFixed(2)}B\n`;
      prompt += `- **Market Cap**: $${((marketData.marketData?.marketCap || 0) / 1e9).toFixed(2)}B\n`;
      prompt += `- **Data Sources**: ${agg.prices?.length || 0} exchanges\n\n`;
    }

    // Sentiment Section
    if (sentimentData?.success && sentimentData?.sentiment) {
      const sentiment = sentimentData.sentiment;
      prompt += `## 💬 Social Sentiment (5 Sources)\n\n`;
      prompt += `- **Overall Score**: ${(sentiment.overallScore || 0).toFixed(0)}/100\n`;
      prompt += `- **Trend**: ${sentiment.trend || 'neutral'}\n`;
      prompt += `- **24h Mentions**: ${(sentimentData.volumeMetrics?.total24h || 0).toLocaleString('en-US')}\n`;
      
      if (sentiment.distribution) {
        prompt += `- **Distribution**: ${sentiment.distribution.positive || 0}% positive, ${sentiment.distribution.neutral || 0}% neutral, ${sentiment.distribution.negative || 0}% negative\n`;
      }
      
      // LunarCrush details
      if (sentimentData.lunarCrush) {
        const lc = sentimentData.lunarCrush;
        prompt += `\n### LunarCrush Metrics:\n`;
        prompt += `- Galaxy Score: ${lc.galaxyScore || 0}/100\n`;
        prompt += `- Social Volume: ${(lc.socialVolume || 0).toLocaleString('en-US')}\n`;
        prompt += `- Social Dominance: ${(lc.socialDominance || 0).toFixed(2)}%\n`;
        prompt += `- AltRank: ${lc.altRank || 'N/A'}\n`;
      }
      
      prompt += `\n`;
    }

    // Technical Analysis Section
    if (technicalData?.success && technicalData?.indicators) {
      const indicators = technicalData.indicators;
      prompt += `## 📈 Technical Analysis\n\n`;
      prompt += `- **RSI**: ${typeof indicators.rsi?.value === 'number' ? indicators.rsi.value.toFixed(2) : indicators.rsi || 'N/A'}\n`;
      prompt += `- **MACD Signal**: ${indicators.macd?.signal || 'neutral'}\n`;
      prompt += `- **Trend**: ${indicators.trend?.direction || 'neutral'}\n`;
      
      if (indicators.trend?.strength) {
        prompt += `- **Trend Strength**: ${indicators.trend.strength}\n`;
      }
      if (indicators.volatility) {
        prompt += `- **Volatility**: ${indicators.volatility.current || 'N/A'}\n`;
      }
      prompt += `\n`;
    }

    // News Section
    if (newsData?.success && newsData?.articles?.length > 0) {
      prompt += `## 📰 Recent News (Top 5)\n\n`;
      newsData.articles.slice(0, 5).forEach((article: any, i: number) => {
        prompt += `${i + 1}. **${article.title}**`;
        if (article.source) {
          prompt += ` (${article.source})`;
        }
        if (article.sentiment) {
          prompt += ` - Sentiment: ${article.sentiment}`;
        }
        prompt += `\n`;
      });
      prompt += `\n`;
    }

    // On-Chain Section
    if (onChainData?.success) {
      prompt += `## ⛓️ On-Chain Intelligence\n\n`;
      
      if (onChainData.whaleActivity) {
        const whale = onChainData.whaleActivity;
        prompt += `### Whale Activity:\n`;
        prompt += `- Total Transactions: ${whale.summary?.totalTransactions || whale.totalTransactions || 0}\n`;
        prompt += `- Total Value: $${((whale.summary?.totalValueUSD || whale.totalValueUSD || 0) / 1e6).toFixed(2)}M\n`;
        
        if (whale.summary?.exchangeDeposits !== undefined || whale.exchangeDeposits !== undefined) {
          const deposits = whale.summary?.exchangeDeposits || whale.exchangeDeposits || 0;
          const withdrawals = whale.summary?.exchangeWithdrawals || whale.exchangeWithdrawals || 0;
          const netFlow = withdrawals - deposits;
          prompt += `- Exchange Flow: ${netFlow > 0 ? '+' : ''}${netFlow} (${netFlow > 0 ? 'Bullish' : netFlow < 0 ? 'Bearish' : 'Neutral'})\n`;
        }
      }
      
      if (onChainData.networkMetrics) {
        const network = onChainData.networkMetrics;
        prompt += `\n### Network Metrics:\n`;
        prompt += `- Latest Block: ${network.latestBlockHeight || 'N/A'}\n`;
        prompt += `- Hash Rate: ${(network.hashRate || 0).toFixed(2)} TH/s\n`;
        prompt += `- Difficulty: ${(network.difficulty || 0).toLocaleString('en-US')}\n`;
      }
      
      prompt += `\n`;
    }

    // ✅ CRITICAL: Add GPT-5.1 Analysis Section
    prompt += `---\n\n`;
    prompt += `## 🤖 ChatGPT 5.1 AI Analysis (Enhanced Reasoning)\n\n`;
    prompt += `The following comprehensive analysis was generated by ChatGPT 5.1 with enhanced reasoning capabilities:\n\n`;
    prompt += `\`\`\`\n`;
    prompt += gptAnalysis;
    prompt += `\n\`\`\`\n\n`;
    prompt += `---\n\n`;

    // Research Instructions
    prompt += `## 🎯 Research Instructions\n\n`;
    prompt += `Please conduct comprehensive institutional-grade research on ${symbol} using the data provided above. Your analysis should:\n\n`;
    prompt += `1. **Build upon the GPT-5.1 analysis** - Use it as a foundation and expand with deeper research\n`;
    prompt += `2. **Verify key claims** - Cross-reference data points across multiple sources\n`;
    prompt += `3. **Identify patterns** - Look for correlations between market, sentiment, and on-chain data\n`;
    prompt += `4. **Assess risks** - Evaluate potential downside scenarios and risk factors\n`;
    prompt += `5. **Provide actionable insights** - Deliver clear, evidence-based recommendations\n`;
    prompt += `6. **Cite sources** - Reference specific data points and their sources\n\n`;
    prompt += `Focus on:\n`;
    prompt += `- Market structure and liquidity analysis\n`;
    prompt += `- Institutional activity and whale behavior\n`;
    prompt += `- Social sentiment trends and their reliability\n`;
    prompt += `- Technical setup and key levels\n`;
    prompt += `- Macro factors and correlations\n`;
    prompt += `- Risk/reward assessment\n\n`;
    prompt += `Deliver a comprehensive report suitable for institutional investors and professional traders.\n`;

    console.log(`✅ Caesar prompt regenerated (${prompt.length} characters)`);

    return res.status(200).json({
      success: true,
      caesarPrompt: prompt,
      promptLength: prompt.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error regenerating Caesar prompt:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to regenerate Caesar prompt'
    });
  }
}
