/**
 * Comprehensive help content for UCIE metrics and features
 * Provides plain-language explanations for all technical indicators and data points
 */

export interface HelpContent {
  title: string;
  description: string;
  learnMoreUrl?: string;
}

export const helpContent: Record<string, HelpContent> = {
  // Market Data
  price: {
    title: 'Current Price',
    description: 'The current market price aggregated from multiple exchanges. We use volume-weighted average price (VWAP) for accuracy.',
    learnMoreUrl: 'https://www.investopedia.com/terms/v/vwap.asp'
  },
  marketCap: {
    title: 'Market Capitalization',
    description: 'Total value of all coins in circulation. Calculated by multiplying current price by circulating supply.',
    learnMoreUrl: 'https://www.investopedia.com/terms/m/marketcapitalization.asp'
  },
  volume24h: {
    title: '24-Hour Trading Volume',
    description: 'Total dollar value of all trades in the last 24 hours across all exchanges. Higher volume indicates more liquidity.',
    learnMoreUrl: 'https://www.investopedia.com/terms/v/volume.asp'
  },
  circulatingSupply: {
    title: 'Circulating Supply',
    description: 'Number of coins currently available and circulating in the market. Does not include locked or burned tokens.',
  },
  
  // Technical Indicators
  rsi: {
    title: 'Relative Strength Index (RSI)',
    description: 'Momentum indicator measuring speed and magnitude of price changes. Values above 70 suggest overbought conditions, below 30 suggest oversold.',
    learnMoreUrl: 'https://www.investopedia.com/terms/r/rsi.asp'
  },
  macd: {
    title: 'MACD (Moving Average Convergence Divergence)',
    description: 'Trend-following momentum indicator showing the relationship between two moving averages. Crossovers signal potential buy/sell opportunities.',
    learnMoreUrl: 'https://www.investopedia.com/terms/m/macd.asp'
  },
  bollingerBands: {
    title: 'Bollinger Bands',
    description: 'Volatility indicator with upper and lower bands around a moving average. Price touching bands may indicate overbought/oversold conditions.',
    learnMoreUrl: 'https://www.investopedia.com/terms/b/bollingerbands.asp'
  },
  ema: {
    title: 'Exponential Moving Average (EMA)',
    description: 'Weighted moving average giving more importance to recent prices. Common periods: 9, 21, 50, 200 days.',
    learnMoreUrl: 'https://www.investopedia.com/terms/e/ema.asp'
  },
  stochastic: {
    title: 'Stochastic Oscillator',
    description: 'Momentum indicator comparing closing price to price range over time. Values above 80 indicate overbought, below 20 indicate oversold.',
    learnMoreUrl: 'https://www.investopedia.com/terms/s/stochasticoscillator.asp'
  },
  atr: {
    title: 'Average True Range (ATR)',
    description: 'Volatility indicator measuring average price movement. Higher ATR means higher volatility and larger price swings.',
    learnMoreUrl: 'https://www.investopedia.com/terms/a/atr.asp'
  },
  
  // On-Chain Metrics
  holderDistribution: {
    title: 'Holder Distribution',
    description: 'Breakdown of token ownership across different wallet sizes. High concentration in few wallets indicates centralization risk.',
  },
  whaleTransactions: {
    title: 'Whale Transactions',
    description: 'Large transactions (>1% of supply) that may indicate major market moves. Whales are addresses holding significant amounts.',
  },
  exchangeFlows: {
    title: 'Exchange Inflows/Outflows',
    description: 'Net movement of tokens to/from exchanges. Inflows may indicate selling pressure, outflows suggest accumulation.',
  },
  giniCoefficient: {
    title: 'Gini Coefficient',
    description: 'Measure of wealth inequality from 0 (perfect equality) to 1 (perfect inequality). Lower values indicate better distribution.',
    learnMoreUrl: 'https://en.wikipedia.org/wiki/Gini_coefficient'
  },
  
  // Social Sentiment
  sentimentScore: {
    title: 'Overall Sentiment Score',
    description: 'Aggregated sentiment from social media, news, and community discussions. Ranges from -100 (very bearish) to +100 (very bullish).',
  },
  socialVolume: {
    title: 'Social Volume',
    description: 'Number of social media mentions and discussions. Spikes may indicate increased interest or upcoming events.',
  },
  influencerSentiment: {
    title: 'Influencer Sentiment',
    description: 'Sentiment analysis of key crypto influencers and thought leaders. Their opinions often move markets.',
  },
  
  // Risk Metrics
  riskScore: {
    title: 'Overall Risk Score',
    description: 'Composite risk assessment from 0 (low risk) to 100 (high risk). Considers volatility, liquidity, concentration, and regulatory factors.',
  },
  volatility: {
    title: 'Volatility',
    description: 'Measure of price fluctuation over time. Higher volatility means larger price swings and higher risk.',
    learnMoreUrl: 'https://www.investopedia.com/terms/v/volatility.asp'
  },
  maxDrawdown: {
    title: 'Maximum Drawdown',
    description: 'Largest peak-to-trough decline in price. Indicates worst-case historical loss scenario.',
    learnMoreUrl: 'https://www.investopedia.com/terms/m/maximum-drawdown-mdd.asp'
  },
  correlation: {
    title: 'Correlation',
    description: 'Statistical relationship with other assets (BTC, ETH, stocks). Values near 1 indicate strong positive correlation.',
    learnMoreUrl: 'https://www.investopedia.com/terms/c/correlation.asp'
  },
  
  // Derivatives
  fundingRate: {
    title: 'Funding Rate',
    description: 'Periodic payment between long and short positions in perpetual futures. Positive rates indicate bullish sentiment.',
    learnMoreUrl: 'https://www.investopedia.com/terms/f/funding-rate.asp'
  },
  openInterest: {
    title: 'Open Interest',
    description: 'Total number of outstanding derivative contracts. Increasing OI with rising prices suggests strong trend.',
    learnMoreUrl: 'https://www.investopedia.com/terms/o/openinterest.asp'
  },
  liquidationLevels: {
    title: 'Liquidation Levels',
    description: 'Price levels where leveraged positions will be forcibly closed. Clusters indicate potential cascade liquidations.',
  },
  longShortRatio: {
    title: 'Long/Short Ratio',
    description: 'Ratio of long positions to short positions. Values >1 indicate more longs (bullish), <1 indicates more shorts (bearish).',
  },
  
  // DeFi Metrics
  tvl: {
    title: 'Total Value Locked (TVL)',
    description: 'Total dollar value of assets locked in DeFi protocols. Higher TVL indicates more trust and usage.',
    learnMoreUrl: 'https://www.investopedia.com/terms/t/total-value-locked-tvl.asp'
  },
  protocolRevenue: {
    title: 'Protocol Revenue',
    description: 'Fees and revenue generated by the protocol. Higher revenue indicates strong product-market fit.',
  },
  utilityScore: {
    title: 'Token Utility Score',
    description: 'Assessment of token use cases (governance, staking, fees, collateral). Higher scores indicate more utility.',
  },
  developmentActivity: {
    title: 'Development Activity',
    description: 'Measure of GitHub commits, active developers, and code quality. Higher activity suggests active development.',
  },
  
  // Predictions
  pricePrediction: {
    title: 'Price Prediction',
    description: 'AI-powered price forecast using machine learning models trained on historical data. Includes confidence intervals.',
  },
  patternRecognition: {
    title: 'Pattern Recognition',
    description: 'Identification of chart patterns (head & shoulders, triangles, etc.) with historical accuracy rates.',
  },
  scenarioAnalysis: {
    title: 'Scenario Analysis',
    description: 'Bull, base, and bear case price targets with probability distributions based on multiple factors.',
  },
  
  // Consensus
  consensusScore: {
    title: 'Consensus Score',
    description: 'Aggregated signal from technical, fundamental, sentiment, and on-chain analysis. Single actionable recommendation.',
  },
  signalStrength: {
    title: 'Signal Strength',
    description: 'Confidence level of the consensus recommendation. Higher values indicate stronger agreement across indicators.',
  },
  
  // News & Research
  impactAssessment: {
    title: 'News Impact Assessment',
    description: 'AI-powered analysis of news sentiment and potential market impact. Categorized as bullish, bearish, or neutral.',
  },
  caesarResearch: {
    title: 'Caesar AI Research',
    description: 'Deep research analysis with source verification covering technology, team, partnerships, and risks.',
  },
  
  // Tokenomics
  inflationRate: {
    title: 'Inflation Rate',
    description: 'Rate at which new tokens are created. Higher inflation can dilute existing holders.',
  },
  burnRate: {
    title: 'Burn Rate',
    description: 'Rate at which tokens are permanently removed from circulation. Deflationary mechanism.',
  },
  tokenVelocity: {
    title: 'Token Velocity',
    description: 'How quickly tokens change hands. Lower velocity often correlates with higher value retention.',
  },
  
  // Regulatory
  regulatoryRisk: {
    title: 'Regulatory Risk',
    description: 'Assessment of legal and regulatory challenges across jurisdictions. Higher risk may impact future operations.',
  },
  securitiesRisk: {
    title: 'Securities Risk',
    description: 'Likelihood of being classified as a security under Howey Test. Securities face stricter regulations.',
  },
  
  // Anomalies
  anomalyDetection: {
    title: 'Anomaly Detection',
    description: 'AI-powered identification of unusual patterns across all metrics. May indicate opportunities or risks.',
  },
  sentimentDivergence: {
    title: 'Sentiment Divergence',
    description: 'Mismatch between social sentiment and price action. Can signal accumulation or distribution phases.',
  }
};

/**
 * Get help content for a specific metric
 */
export function getHelpContent(key: string): HelpContent | null {
  return helpContent[key] || null;
}

/**
 * Get all help content keys
 */
export function getAllHelpKeys(): string[] {
  return Object.keys(helpContent);
}
