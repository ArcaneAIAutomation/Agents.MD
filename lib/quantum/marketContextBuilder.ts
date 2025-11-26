/**
 * Market Context Builder for GPT-5.1 Analysis
 * 
 * Builds comprehensive market context from aggregated data
 * Handles missing data gracefully with fallbacks
 * Optimized for GPT-5.1 with medium reasoning effort
 */

import { AggregatedMarketData } from './dataAggregator';

/**
 * Create comprehensive market context for GPT-5.1 analysis
 * Safely handles missing or zero values
 */
export function createMarketContext(aggregatedData: AggregatedMarketData): string {
  const currentPrice = aggregatedData.price.median || 0;
  const volume24h = aggregatedData.volume.average || 0;
  const marketCap = aggregatedData.marketCap.average || 0;
  const dataQualityScore = aggregatedData.dataQuality.score || 0;
  
  // Safely format numbers (handle zeros)
  const formatNumber = (num: number): string => {
    return num > 0 ? num.toLocaleString() : 'N/A';
  };
  
  const formatPercent = (num: number): string => {
    return num !== 0 ? num.toFixed(2) : '0.00';
  };
  
  return `
# Bitcoin Market Analysis Context

## Current Market Data
- **Price (Median)**: $${formatNumber(currentPrice)}
- **Price (CMC)**: $${formatNumber(aggregatedData.price.cmc)}
- **Price (CoinGecko)**: $${formatNumber(aggregatedData.price.coingecko)}
- **Price (Kraken)**: $${formatNumber(aggregatedData.price.kraken)}
- **Price Divergence**: ${aggregatedData.price.divergence.toFixed(3)}% (${aggregatedData.price.divergenceStatus})
- **24h Volume**: $${formatNumber(volume24h)}
- **Market Cap**: $${formatNumber(marketCap)}
- **Data Quality Score**: ${dataQualityScore}%

## Price Changes
- **1h Change**: ${formatPercent(aggregatedData.priceChanges.change_1h)}%
- **24h Change**: ${formatPercent(aggregatedData.priceChanges.change_24h)}%
- **7d Change**: ${formatPercent(aggregatedData.priceChanges.change_7d)}%
- **30d Change**: ${formatPercent(aggregatedData.priceChanges.change_30d)}%

## On-Chain Metrics
- **Mempool Size**: ${formatNumber(aggregatedData.onChain.mempoolSize)} transactions
- **Network Difficulty**: ${formatNumber(aggregatedData.onChain.difficulty)}
- **Hash Rate**: ${formatNumber(aggregatedData.onChain.hashRate)} TH/s
- **Block Height**: ${formatNumber(aggregatedData.onChain.blockHeight)}
- **Avg Block Time**: ${aggregatedData.onChain.avgBlockTime || 10} minutes

## Social Sentiment
- **Sentiment Score**: ${aggregatedData.sentiment.score || 50}/100
- **Social Dominance**: ${formatPercent(aggregatedData.sentiment.socialDominance)}%
- **Galaxy Score**: ${aggregatedData.sentiment.galaxyScore || 0}/100
- **Alt Rank**: ${aggregatedData.sentiment.altRank || 0}
- **Social Volume**: ${formatNumber(aggregatedData.sentiment.socialVolume)}

## Data Quality Assessment
- **Status**: ${aggregatedData.dataQuality.status}
- **API Status**: CMC=${aggregatedData.dataQuality.apiStatus.cmc}, CoinGecko=${aggregatedData.dataQuality.apiStatus.coingecko}, Kraken=${aggregatedData.dataQuality.apiStatus.kraken}, Blockchain=${aggregatedData.dataQuality.apiStatus.blockchain}, LunarCrush=${aggregatedData.dataQuality.apiStatus.lunarcrush}
${aggregatedData.dataQuality.issues.length > 0 ? `- **Issues**: ${aggregatedData.dataQuality.issues.join(', ')}` : ''}

## Analysis Requirements
You are a quantum-superior trading intelligence system analyzing Bitcoin markets using multi-dimensional pattern recognition. Your task is to generate a comprehensive trade signal based on the above data.

**CRITICAL**: You must respond with ONLY valid JSON. No markdown, no code blocks, no explanations outside the JSON structure.

Return a JSON object with the following structure:
{
  "direction": "LONG" or "SHORT",
  "entryZonePercent": {
    "min": number (percentage below current price, e.g., -2 for 2% below),
    "max": number (percentage above current price, e.g., 2 for 2% above),
    "optimal": number (percentage from current price, e.g., 0 for current price)
  },
  "targetPercents": {
    "tp1": number (percentage gain, e.g., 5 for 5% gain),
    "tp2": number (percentage gain, e.g., 8 for 8% gain),
    "tp3": number (percentage gain, e.g., 12 for 12% gain)
  },
  "stopLossPercent": number (percentage loss, e.g., -5 for 5% loss),
  "timeframe": "1h" | "4h" | "1d" | "1w",
  "confidence": number (0-100),
  "quantumReasoning": "string (detailed multi-probability state analysis)",
  "mathematicalJustification": "string (mathematical formulas and calculations)",
  "wavePatternCollapse": "CONTINUATION" | "BREAK" | "UNCERTAIN"
}
`.trim();
}
