# UCIE Caesar Prompt Example

**Created**: December 7, 2025  
**Status**: 📝 **CAESAR PROMPT DOCUMENTATION**  
**Purpose**: Complete example of Caesar AI research prompt

---

## 🎯 Caesar Prompt Generation Process

### When Generated

Caesar prompt is generated AFTER:
1. ✅ All 5 data sources collected (Phase 2)
2. ✅ Data stored in database (Phase 3)
3. ✅ GPT-5.1 analysis completed (Phase 4)
4. ✅ User reviews preview modal (Phase 5)
5. ✅ User clicks "Start Caesar Deep Dive" button (Phase 6)

### Endpoint

```http
POST /api/ucie/regenerate-caesar-prompt/BTC
```

**Purpose**: Regenerates Caesar prompt with ALL collected data + GPT-5.1 analysis

**Data Freshness**: 30-minute rule (data must be <30 minutes old)

---

## 📝 Complete Caesar Prompt Example (Bitcoin)

```markdown
# Bitcoin (BTC) Deep Dive Analysis Request

## Executive Summary

You are conducting a comprehensive deep dive analysis of Bitcoin (BTC) using multiple data sources collected over the past 30 minutes. Your goal is to provide actionable insights for cryptocurrency traders and investors.

**Data Collection Summary**:
- ✅ Market Data: 100% quality (3/3 sources)
- ✅ Sentiment Analysis: 100% quality (5/5 sources)
- ✅ Technical Analysis: 100% quality (calculated)
- ✅ News Intelligence: 95% quality (3/3 sources with AI assessment)
- ✅ On-Chain Metrics: 100% quality (Bitcoin blockchain)
- ✅ GPT-5.1 Analysis: Completed (85% confidence)

**Overall Data Quality**: 98% (all sources operational)

---

## 🤖 GPT-5.1 Analysis Results

**Analysis Completed**: December 7, 2025 at 14:32:15 UTC  
**Processing Time**: 1.8 seconds  
**Confidence Score**: 85%

### Executive Summary

Bitcoin shows strong bullish momentum with institutional demand driving prices higher. Technical indicators confirm uptrend with RSI at 58.5 (neutral) and MACD showing bullish crossover. Social sentiment is positive at 72/100 with Fear & Greed Index at 68 (Greed). On-chain metrics show 3 whale transactions totaling $28.5M in the last 30 minutes, indicating accumulation.

### Key Insights

1. Institutional ETF inflows reached $2.1B, driving price above $95,000
2. Technical breakout confirmed with all EMAs aligned bullishly
3. Social sentiment strongly positive with 117 posts and 402M interactions
4. Whale accumulation detected with 3 large transactions (>50 BTC each)
5. Fear & Greed Index at 68 indicates market greed but not extreme

### Market Outlook (24-48 hours)

Short-term outlook is bullish with continued upward momentum likely over the next 24-48 hours. Price may test $96,500 resistance level. Watch for profit-taking at psychological $100,000 level.

### Risk Factors

1. Overbought conditions may trigger short-term correction
2. High leverage in derivatives markets increases volatility risk
3. Regulatory uncertainty remains a long-term concern

### Opportunities

1. Breakout above $96,500 could trigger momentum to $100,000
2. Institutional adoption accelerating with ETF demand
3. On-chain metrics support continued accumulation phase

### Technical Summary

All major indicators bullish. RSI at 58.5 (neutral, room to run). MACD bullish crossover. EMAs aligned (9>21>50). Bollinger Bands middle position. Multi-timeframe consensus: bullish.

### Sentiment Summary

Overall sentiment 72/100 (bullish). Fear & Greed Index 68 (Greed). LunarCrush Galaxy Score 65. Reddit mentions up 45 in 24h. Social volume increasing.

### Trading Recommendation

**BUY** - Strong bullish momentum supported by technical, sentiment, and on-chain data.
- Entry: $95,000-$95,500
- Target: $96,500-$98,000
- Stop-loss: $93,500

---

## 📊 Market Data (CoinMarketCap, CoinGecko, Kraken)

**Last Updated**: December 7, 2025 at 14:30:00 UTC  
**Data Quality**: 100% (3/3 sources successful)

### Price Aggregation

- **Average Price**: $95,234.56
- **Median Price**: $95,230.00
- **Price Spread**: $45.23 (0.05%)
- **Consensus**: Strong (all sources within 0.05%)

### Individual Source Data

**CoinMarketCap** (Primary):
- Price: $95,250.00
- 24h Volume: $28,500,000,000
- Market Cap: $1,875,000,000,000
- 24h Change: +3.2%
- 7d Change: +5.8%

**CoinGecko** (Secondary):
- Price: $95,230.00
- 24h Volume: $28,450,000,000
- Market Cap: $1,874,500,000,000
- 24h Change: +3.1%
- 7d Change: +5.7%

**Kraken** (Exchange):
- Price: $95,224.00
- 24h Volume: $1,200,000,000
- Bid: $95,220.00
- Ask: $95,228.00
- Spread: $8.00 (0.008%)

### Supply Metrics

- **Circulating Supply**: 19,600,000 BTC
- **Total Supply**: 21,000,000 BTC
- **Max Supply**: 21,000,000 BTC
- **Supply Percentage**: 93.33% mined
- **Remaining**: 1,400,000 BTC (6.67%)

### 24-Hour Range

- **High**: $96,500.00
- **Low**: $94,200.00
- **Range**: $2,300.00 (2.4%)
- **Current Position**: 45% from low to high

---

## 💬 Sentiment Analysis (Fear & Greed, LunarCrush, Reddit, CoinMarketCap, CoinGecko)

**Last Updated**: December 7, 2025 at 14:30:00 UTC  
**Data Quality**: 100% (5/5 sources successful)

### Overall Sentiment

- **Sentiment Score**: 72/100 (Bullish)
- **Classification**: BULLISH
- **Trend**: Increasing (+5 points in 24h)
- **Confidence**: High (all sources agree)

### Fear & Greed Index (25% weight)

- **Value**: 68/100
- **Classification**: Greed
- **Previous**: 65/100 (yesterday)
- **Trend**: Increasing greed
- **Interpretation**: Market participants are greedy but not at extreme levels. Historically, values above 75 indicate potential correction risk.

### LunarCrush Social Metrics (20% weight)

- **Galaxy Score**: 65/100
- **Social Score**: 70/100
- **Sentiment Score**: 68/100
- **Average Sentiment**: 3.4/5.0 (positive)
- **Social Volume**: 402,000,000 interactions
- **Total Posts**: 117 (last 48 hours)
- **Post Types**:
  - TikTok Videos: 90 posts
  - Tweets: 10 posts
  - YouTube Videos: 10 posts
  - Reddit Posts: 7 posts
- **Trending Score**: 75/100
- **Social Dominance**: 54.2%
- **Alt Rank**: #1 (most discussed cryptocurrency)

### CoinMarketCap Sentiment (20% weight)

- **Sentiment Score**: 75/100
- **Price Momentum**: Strong positive (+3.2% in 24h)
- **Volume Change**: +12.5% (increasing interest)
- **Market Cap Dominance**: 54.2%
- **Interpretation**: Strong institutional interest with increasing volume

### CoinGecko Community Metrics (20% weight)

- **Sentiment Score**: 70/100
- **Community Score**: 68/100
- **Developer Score**: 85/100
- **Public Interest Score**: 4.2/5.0
- **Sentiment Votes Up**: 72%
- **Sentiment Votes Down**: 28%
- **Interpretation**: Strong community support and active development

### Reddit Community Sentiment (15% weight)

- **Mentions (24h)**: 45 posts
- **Sentiment Score**: 68/100
- **Active Subreddits**: r/cryptocurrency, r/CryptoMarkets, r/Bitcoin
- **Top Post Sentiment**: Bullish (85% positive)
- **Comment Sentiment**: Bullish (72% positive)
- **Interpretation**: Community is optimistic about short-term price action

---

## 📈 Technical Analysis (Calculated Indicators)

**Last Updated**: December 7, 2025 at 14:30:00 UTC  
**Timeframe**: 1-hour candles  
**Data Quality**: 100% (all indicators calculated)

### RSI (Relative Strength Index)

- **Value**: 58.5
- **Signal**: Neutral
- **Overbought**: No (>70)
- **Oversold**: No (<30)
- **Interpretation**: Healthy momentum with room to run higher

### MACD (Moving Average Convergence Divergence)

- **MACD Line**: 245.32
- **Signal Line**: 198.45
- **Histogram**: +46.87
- **Trend**: Bullish
- **Crossover**: Bullish (MACD above signal)
- **Interpretation**: Strong bullish momentum confirmed

### EMA (Exponential Moving Averages)

- **EMA 9**: $95,100.00
- **EMA 21**: $94,800.00
- **EMA 50**: $94,200.00
- **Alignment**: Bullish (9 > 21 > 50)
- **Trend**: Bullish
- **Interpretation**: All EMAs aligned bullishly, confirming uptrend

### Bollinger Bands

- **Upper Band**: $96,500.00
- **Middle Band**: $95,200.00
- **Lower Band**: $93,900.00
- **Current Position**: Middle (near upper)
- **Squeeze**: No (bands expanding)
- **Interpretation**: Price approaching upper band, potential resistance

### Trading Signals

- **Overall Signal**: BUY
- **Confidence**: 75%
- **Bullish Signals**: 8
- **Bearish Signals**: 2
- **Neutral Signals**: 2

### Multi-Timeframe Consensus

- **Overall**: Bullish
- **15-minute**: Bullish
- **1-hour**: Bullish
- **4-hour**: Neutral
- **1-day**: Bullish
- **Interpretation**: Strong bullish consensus across most timeframes

---

## 📰 News Intelligence (NewsAPI, LunarCrush, CryptoCompare)

**Last Updated**: December 7, 2025 at 14:30:00 UTC  
**Data Quality**: 95% (3/3 sources, 25 articles)

### News Summary

- **Total Articles**: 25 (last 24 hours)
- **Bullish**: 12 articles (48%)
- **Bearish**: 3 articles (12%)
- **Neutral**: 10 articles (40%)
- **Average Impact Score**: 72/100
- **Overall Sentiment**: Bullish

### Top 5 Articles (with AI Assessment)

**1. "Bitcoin Surges Past $95,000 on ETF Inflows"**
- Source: CoinDesk
- Published: December 7, 2025 at 13:00:00 UTC
- Category: Market
- Sentiment: Bullish
- Impact Score: 85/100
- Confidence: 90%
- Summary: Bitcoin reached new highs as institutional investors poured $2.1B into spot ETFs
- Key Points:
  - Record ETF inflows of $2.1B
  - Institutional adoption accelerating
  - Technical breakout confirmed
- Market Implications: Continued upward momentum likely
- Timeframe: Short-term (24-48 hours)

**2. "Whale Accumulation Detected: $28.5M in Large Transactions"**
- Source: CryptoQuant
- Published: December 7, 2025 at 12:30:00 UTC
- Category: On-Chain
- Sentiment: Bullish
- Impact Score: 80/100
- Confidence: 85%
- Summary: Three large Bitcoin transactions (>50 BTC each) detected in last 30 minutes
- Key Points:
  - 3 whale transactions totaling 300 BTC
  - Total value: $28.5M
  - Pattern suggests accumulation
- Market Implications: Whales are buying, potential price support
- Timeframe: Short-term (24-48 hours)

**3. "Technical Breakout: All EMAs Aligned Bullishly"**
- Source: TradingView
- Published: December 7, 2025 at 11:45:00 UTC
- Category: Technical
- Sentiment: Bullish
- Impact Score: 75/100
- Confidence: 88%
- Summary: Bitcoin's exponential moving averages show perfect bullish alignment
- Key Points:
  - EMA 9 > EMA 21 > EMA 50
  - MACD bullish crossover
  - RSI at 58.5 (neutral, room to run)
- Market Implications: Technical setup supports continued uptrend
- Timeframe: Short-term to medium-term

**4. "Fear & Greed Index Hits 68: Market in Greed Territory"**
- Source: Alternative.me
- Published: December 7, 2025 at 10:00:00 UTC
- Category: Sentiment
- Sentiment: Neutral
- Impact Score: 65/100
- Confidence: 80%
- Summary: Market sentiment indicator shows greed but not extreme levels
- Key Points:
  - Fear & Greed at 68/100
  - Up from 65 yesterday
  - Not yet at extreme greed (>75)
- Market Implications: Positive sentiment but watch for overheating
- Timeframe: Short-term

**5. "Regulatory Clarity Improves: SEC Approves More ETF Applications"**
- Source: Bloomberg
- Published: December 7, 2025 at 09:15:00 UTC
- Category: Regulatory
- Sentiment: Bullish
- Impact Score: 70/100
- Confidence: 85%
- Summary: SEC continues to approve spot Bitcoin ETF applications, improving regulatory clarity
- Key Points:
  - 3 new ETF applications approved
  - Total spot ETFs now at 15
  - Regulatory environment improving
- Market Implications: Increased institutional access and legitimacy
- Timeframe: Medium-term to long-term

---

## ⛓️ On-Chain Metrics (Blockchain.com - Bitcoin Only)

**Last Updated**: December 7, 2025 at 14:30:00 UTC  
**Data Quality**: 100% (Bitcoin blockchain data)

### Network Metrics

- **Latest Block Height**: 820,450
- **Latest Block Time**: December 7, 2025 at 14:30:00 UTC
- **Average Block Time**: 10 minutes
- **Hash Rate**: 450 EH/s (exahashes per second)
- **Difficulty**: 72,000,000,000,000
- **Difficulty Adjustment**: +2.5% (next adjustment in 1,200 blocks)

### Mempool Analysis

- **Mempool Size**: 85,000 transactions
- **Mempool Bytes**: 125,000,000 bytes
- **Congestion Level**: Medium
- **Average Fee**: 20 sat/vB
- **Recommended Fee**: 25 sat/vB (next block)
- **Interpretation**: Moderate network activity, fees reasonable

### Supply Metrics

- **Total Circulating**: 19,600,000 BTC
- **Max Supply**: 21,000,000 BTC
- **Percentage Mined**: 93.33%
- **Remaining**: 1,400,000 BTC
- **Next Halving**: April 2028 (estimated)

### Whale Activity (Last 30 Minutes)

- **Timeframe**: 30 minutes
- **Minimum Threshold**: 50 BTC
- **Total Transactions**: 3
- **Total Value (BTC)**: 300 BTC
- **Total Value (USD)**: $28,570,368
- **Largest Transaction**: 150 BTC ($14,285,184)
- **Interpretation**: Significant whale accumulation detected

**Transaction Details**:

1. **Transaction 1**:
   - Amount: 150 BTC ($14,285,184)
   - From: Unknown wallet
   - To: Cold storage address
   - Type: Accumulation
   - Timestamp: 14:15:00 UTC

2. **Transaction 2**:
   - Amount: 100 BTC ($9,523,456)
   - From: Exchange wallet
   - To: Unknown wallet
   - Type: Withdrawal (bullish)
   - Timestamp: 14:20:00 UTC

3. **Transaction 3**:
   - Amount: 50 BTC ($4,761,728)
   - From: Unknown wallet
   - To: Unknown wallet
   - Type: Transfer
   - Timestamp: 14:25:00 UTC

---

## 🎯 Research Instructions for Caesar AI

### Primary Objectives

1. **Validate GPT-5.1 Analysis**: Review the GPT-5.1 analysis and determine if you agree with its conclusions. Provide your own independent assessment.

2. **Deep Dive Research**: Conduct comprehensive research using your knowledge base and web search capabilities to:
   - Verify all data points and claims
   - Find additional context and historical patterns
   - Identify potential risks not mentioned
   - Discover opportunities not yet recognized

3. **Market Context**: Place Bitcoin's current situation in broader market context:
   - How does this compare to previous bull/bear cycles?
   - What are the macro factors influencing price?
   - What are institutional investors doing?
   - What are the regulatory developments?

4. **Actionable Insights**: Provide specific, actionable recommendations for:
   - Entry points and timing
   - Position sizing
   - Risk management (stop-loss levels)
   - Profit targets
   - Time horizons

### Research Questions

1. **Price Action**: Is the current price movement sustainable? What are the key support and resistance levels?

2. **Institutional Activity**: What are institutions doing? Are they accumulating or distributing?

3. **On-Chain Analysis**: What do whale transactions tell us? Are they accumulating or preparing to sell?

4. **Sentiment Analysis**: Is the current sentiment justified by fundamentals? Are we approaching euphoria?

5. **Technical Setup**: Is the technical setup strong enough to support continued upside?

6. **Risk Assessment**: What are the main risks to the bullish thesis? What could trigger a correction?

7. **Opportunities**: What are the best opportunities for traders and investors right now?

### Output Format

Please provide your research in the following format:

1. **Executive Summary** (2-3 paragraphs)
2. **Agreement/Disagreement with GPT-5.1** (with reasoning)
3. **Key Findings** (5-7 bullet points)
4. **Market Context** (historical comparison)
5. **Risk Analysis** (detailed risk assessment)
6. **Opportunities** (specific actionable opportunities)
7. **Trading Recommendations** (entry, targets, stop-loss)
8. **Sources** (list all sources used)

### Research Depth

- **Minimum Research Time**: 15 minutes
- **Maximum Research Time**: 20 minutes
- **Compute Units**: 2-3 (balanced depth and speed)
- **Sources**: Use multiple authoritative sources
- **Verification**: Cross-reference all major claims

---

**End of Caesar Prompt**

---

## 📊 Prompt Statistics

- **Total Length**: ~15,000 characters
- **Sections**: 8 major sections
- **Data Sources**: 5 (market, sentiment, technical, news, on-chain)
- **GPT-5.1 Analysis**: Included (complete results)
- **Research Instructions**: Detailed (objectives, questions, format)
- **Expected Processing Time**: 15-20 minutes
- **Expected Output**: 3,000-5,000 words

---

**Status**: ✅ **COMPLETE CAESAR PROMPT EXAMPLE**  
**Data Freshness**: <30 minutes (all sources)  
**GPT-5.1 Analysis**: Included (85% confidence)  
**Research Depth**: Comprehensive (15-20 minutes)  
**Output Format**: Structured with sources
