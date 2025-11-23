# ATGE GPT-5.1 Trade Verification & Analysis System - Requirements

## Introduction

The ATGE (AI Trade Generation Engine) currently generates trade signals using GPT-4o and performs historical backtesting. This specification upgrades the system to **GPT-5.1** with enhanced reasoning capabilities and implements a comprehensive **trade verification system** that tracks profit/loss in real-time, validates trades against live market data, and provides actionable insights on trade performance.

**Key Objectives:**
1. **Upgrade to GPT-5.1**: Enhanced AI reasoning for better trade signal quality
2. **Trade Verification**: Real-time profit/loss tracking with hourly updates
3. **Performance Analytics**: Dashboard showing win rate, profit factor, and trade statistics
4. **100% Data Accuracy**: Strict validation against live market data
5. **User-Triggered Refresh**: On-demand updates when users log in

This will be implemented in **3 sequential phases**:
1. **Phase 1**: GPT-5.1 Upgrade + Basic Trade Verification (MVP)
2. **Phase 2**: Hourly Verification + Performance Dashboard
3. **Phase 3**: Advanced Analytics + Pattern Recognition

---

## Glossary

- **GPT-5.1**: OpenAI's latest model with enhanced reasoning capabilities (upgraded from GPT-4o)
- **Trade Verification**: Real-time validation of trade outcomes against live market data
- **Profit/Loss Tracking**: Continuous monitoring of trade performance with P/L calculations
- **Hourly Verification**: Automated system that checks trade status every hour
- **User-Triggered Refresh**: Manual refresh when user logs in to get latest trade updates
- **Performance Dashboard**: UI showing aggregate trade statistics (win rate, profit factor, etc.)
- **Data Accuracy**: 100% requirement - all data must come from live APIs, no fallbacks
- **Trade Status**: Active, TP1 Hit, TP2 Hit, TP3 Hit, Stop Loss Hit, Expired
- **Win Rate**: Percentage of trades that hit at least TP1
- **Profit Factor**: Total profit divided by total loss
- **SOPR**: Spent Output Profit Ratio (Bitcoin on-chain metric)
- **MVRV Z-Score**: Market Value to Realized Value Z-Score (Bitcoin valuation metric)

---

## Phase 1: GPT-5.1 Upgrade + Basic Trade Verification

### Requirement 1.1: GPT-5.1 Model Upgrade

**User Story:** As a trader, I want trade signals generated with GPT-5.1's enhanced reasoning capabilities, so that I get higher quality trade recommendations.

#### Acceptance Criteria

1. WHEN generating trade signals, THE System SHALL use GPT-5.1 model (not GPT-4o)
2. WHEN calling GPT-5.1, THE System SHALL use OpenAI Responses API with proper headers
3. WHEN calling GPT-5.1, THE System SHALL set reasoning effort to "medium" for balanced speed/quality
4. WHEN calling GPT-5.1, THE System SHALL use bulletproof response parsing utilities
5. WHEN GPT-5.1 returns response, THE System SHALL use extractResponseText() for parsing
6. WHEN validating response, THE System SHALL use validateResponseText() for error handling
7. WHEN GPT-5.1 API fails, THE System SHALL retry up to 3 times with exponential backoff

---

### Requirement 1.2: Trade Verification System

**User Story:** As a trader, I want to see if my generated trades would have been profitable, so that I can evaluate the AI's performance.

#### Acceptance Criteria

1. WHEN a trade is generated, THE System SHALL store it in the database with status "active"
2. WHEN verifying trades, THE System SHALL fetch current market price from live APIs
3. WHEN current price hits TP1, THE System SHALL update trade status to "tp1_hit" and record timestamp
4. WHEN current price hits TP2, THE System SHALL update trade status to "tp2_hit" and record timestamp
5. WHEN current price hits TP3, THE System SHALL update trade status to "tp3_hit" and record timestamp
6. WHEN current price hits stop loss, THE System SHALL update trade status to "stop_loss_hit" and record timestamp
7. WHEN trade expires (24 hours), THE System SHALL update trade status to "expired"
8. WHEN calculating P/L, THE System SHALL use actual hit prices and entry price
9. WHEN displaying P/L, THE System SHALL show both USD amount and percentage

---

### Requirement 1.3: 100% Data Accuracy Enforcement

**User Story:** As a trader, I want all trade verification data to be 100% accurate from live APIs, so that I can trust the profit/loss calculations.

#### Acceptance Criteria

1. WHEN fetching market data, THE System SHALL use CoinMarketCap API as primary source
2. WHEN CoinMarketCap fails, THE System SHALL use CoinGecko API as fallback
3. WHEN both APIs fail, THE System SHALL mark trade as "verification_failed" and NOT use fallback data
4. WHEN validating price data, THE System SHALL check timestamp is within last 5 minutes
5. WHEN price spread exceeds 3%, THE System SHALL reject data and retry
6. WHEN storing verification data, THE System SHALL include data source and timestamp
7. WHEN displaying P/L, THE System SHALL show data source and last update time

---

### Requirement 1.4: Trade Verification API Endpoint

**User Story:** As a system, I want a dedicated API endpoint for trade verification, so that verification logic is centralized and maintainable.

#### Acceptance Criteria

1. WHEN creating endpoint, THE System SHALL create `/api/atge/verify-trades` endpoint
2. WHEN endpoint is called, THE System SHALL fetch all active trades from database
3. WHEN verifying each trade, THE System SHALL fetch current market price
4. WHEN checking targets, THE System SHALL compare current price against TP1/TP2/TP3 and stop loss
5. WHEN target is hit, THE System SHALL update trade status and record exact hit price and timestamp
6. WHEN all trades are verified, THE System SHALL return summary (total verified, hits, misses)
7. WHEN verification fails, THE System SHALL log error and continue with next trade

---

### Requirement 1.5: Enhanced Trade Dashboard

**User Story:** As a trader, I want to see my trade performance statistics on the dashboard, so that I can evaluate the AI's effectiveness.

#### Acceptance Criteria

1. WHEN displaying dashboard, THE System SHALL show total trades generated
2. WHEN displaying dashboard, THE System SHALL show win rate (trades hitting at least TP1)
3. WHEN displaying dashboard, THE System SHALL show total profit/loss in USD
4. WHEN displaying dashboard, THE System SHALL show profit factor (total profit / total loss)
5. WHEN displaying dashboard, THE System SHALL show average profit per winning trade
6. WHEN displaying dashboard, THE System SHALL show average loss per losing trade
7. WHEN displaying dashboard, THE System SHALL show best performing symbol (BTC vs ETH)
8. WHEN displaying dashboard, THE System SHALL show recent trade history with P/L
9. WHEN displaying dashboard, THE System SHALL use Bitcoin Sovereign styling

---

## Phase 2: Hourly Verification + Performance Dashboard

### Requirement 2.1: Hourly Verification Cron Job

**User Story:** As a trader, I want trades to be automatically verified every hour, so that I get timely updates on trade performance without manual intervention.

#### Acceptance Criteria

1. WHEN setting up cron job, THE System SHALL create Vercel cron configuration for hourly execution
2. WHEN cron job runs, THE System SHALL call `/api/atge/verify-trades` endpoint
3. WHEN cron job runs, THE System SHALL verify all active trades (not expired, not stopped out)
4. WHEN cron job completes, THE System SHALL log verification summary (trades checked, updates made)
5. WHEN cron job fails, THE System SHALL retry once after 5 minutes
6. WHEN cron job fails twice, THE System SHALL send alert notification
7. WHEN cron job runs, THE System SHALL complete within 30 seconds to avoid timeout

---

### Requirement 2.2: User-Triggered Refresh

**User Story:** As a trader, I want to manually refresh trade data when I log in, so that I see the latest profit/loss information immediately.

#### Acceptance Criteria

1. WHEN user logs in, THE System SHALL show "Refresh Trades" button on dashboard
2. WHEN user clicks refresh button, THE System SHALL call `/api/atge/verify-trades` endpoint
3. WHEN refresh is triggered, THE Button SHALL show loading state with spinner
4. WHEN refresh completes, THE Dashboard SHALL update with latest trade data
5. WHEN refresh completes, THE System SHALL show success message with timestamp
6. WHEN refresh fails, THE System SHALL show error message and allow retry
7. WHEN refresh is in progress, THE Button SHALL be disabled to prevent duplicate requests

---

### Requirement 2.3: Advanced Technical Indicators

**User Story:** As a trader, I want trade verification to include advanced indicators like SOPR and MVRV Z-Score, so that I get deeper market insights.

#### Acceptance Criteria

1. WHEN verifying Bitcoin trades, THE System SHALL fetch SOPR (Spent Output Profit Ratio) from Glassnode API
2. WHEN verifying Bitcoin trades, THE System SHALL fetch MVRV Z-Score from Glassnode API
3. WHEN SOPR > 1, THE System SHALL mark as "profitable spending" (bullish signal)
4. WHEN SOPR < 1, THE System SHALL mark as "loss-taking" (bearish signal)
5. WHEN MVRV Z-Score > 7, THE System SHALL mark as "overvalued" (potential top)
6. WHEN MVRV Z-Score < 0, THE System SHALL mark as "undervalued" (potential bottom)
7. WHEN displaying trade details, THE Modal SHALL show SOPR and MVRV Z-Score values
8. WHEN Glassnode API fails, THE System SHALL continue verification without these indicators

---

### Requirement 2.4: Performance Analytics Dashboard

**User Story:** As a trader, I want a comprehensive performance dashboard, so that I can analyze my trading strategy effectiveness.

#### Acceptance Criteria

1. WHEN displaying analytics, THE Dashboard SHALL show win rate chart (line graph over time)
2. WHEN displaying analytics, THE Dashboard SHALL show profit/loss distribution (histogram)
3. WHEN displaying analytics, THE Dashboard SHALL show best/worst trades (top 5 each)
4. WHEN displaying analytics, THE Dashboard SHALL show symbol performance comparison (BTC vs ETH)
5. WHEN displaying analytics, THE Dashboard SHALL show timeframe performance (15m, 1h, 4h, 1d)
6. WHEN displaying analytics, THE Dashboard SHALL show average trade duration
7. WHEN displaying analytics, THE Dashboard SHALL show total API cost for trade generation
8. WHEN displaying analytics, THE Dashboard SHALL allow filtering by date range
9. WHEN displaying analytics, THE Dashboard SHALL allow exporting data as CSV

---

## Phase 3: Advanced Analytics + Pattern Recognition

### Requirement 3.1: GPT-5.1 Trade Analysis

**User Story:** As a trader, I want GPT-5.1 to analyze why my trades succeeded or failed, so that I can learn from the outcomes.

#### Acceptance Criteria

1. WHEN a trade completes (TP hit or SL hit), THE System SHALL trigger GPT-5.1 analysis
2. WHEN calling GPT-5.1, THE System SHALL use "high" reasoning effort for comprehensive analysis
3. WHEN preparing context, THE System SHALL include entry/exit prices, indicators, and market conditions
4. WHEN preparing context, THE System SHALL include actual outcome (which TP hit, P/L amount)
5. WHEN GPT-5.1 returns analysis, THE System SHALL store it in `ai_analysis` column
6. WHEN displaying trade details, THE Modal SHALL show AI analysis with confidence score
7. WHEN analysis fails, THE System SHALL retry up to 3 times
8. WHEN all retries fail, THE System SHALL mark analysis as "failed" and continue

---

### Requirement 3.2: Pattern Recognition

**User Story:** As a trader, I want the system to identify patterns in winning vs losing trades, so that I can improve my strategy.

#### Acceptance Criteria

1. WHEN analyzing patterns, THE System SHALL group trades by outcome (winning, losing, expired)
2. WHEN analyzing winning trades, THE System SHALL identify common technical indicators
3. WHEN analyzing losing trades, THE System SHALL identify common risk factors
4. WHEN analyzing patterns, THE System SHALL calculate statistical significance (p-value < 0.05)
5. WHEN displaying patterns, THE Dashboard SHALL show top 5 success factors
6. WHEN displaying patterns, THE Dashboard SHALL show top 5 failure factors
7. WHEN displaying patterns, THE Dashboard SHALL show confidence level for each pattern

---

### Requirement 3.3: Batch Trade Analysis

**User Story:** As a trader, I want to analyze multiple trades at once, so that I can identify trends and patterns.

#### Acceptance Criteria

1. WHEN user requests batch analysis, THE System SHALL accept filter parameters (symbol, date range, status)
2. WHEN batch analysis is triggered, THE System SHALL fetch matching trades from database
3. WHEN analyzing batch, THE System SHALL calculate aggregate statistics (win rate, profit factor, etc.)
4. WHEN analyzing batch, THE System SHALL identify best performing conditions (RSI range, MACD signal, etc.)
5. WHEN analyzing batch, THE System SHALL generate recommendations for strategy improvement
6. WHEN batch analysis completes, THE System SHALL display results in dashboard
7. WHEN batch analysis fails, THE System SHALL show error message and allow retry

---

### Requirement 3.4: Actionable Recommendations

**User Story:** As a trader, I want specific recommendations based on my trading history, so that I can improve my results.

#### Acceptance Criteria

1. WHEN generating recommendations, THE System SHALL suggest optimal entry conditions
2. WHEN generating recommendations, THE System SHALL suggest conditions to avoid
3. WHEN generating recommendations, THE System SHALL suggest position sizing adjustments
4. WHEN generating recommendations, THE System SHALL suggest timeframe preferences
5. WHEN generating recommendations, THE System SHALL suggest risk management improvements
6. WHEN generating recommendations, THE System SHALL prioritize by potential impact
7. WHEN generating recommendations, THE System SHALL provide confidence score for each

---

---

## Cross-Phase Requirements

### Requirement 4.1: Cost Management

**User Story:** As a system administrator, I want to control AI and API costs, so that the feature remains sustainable.

#### Acceptance Criteria

1. WHEN calling GPT-5.1, THE System SHALL use gpt-5.1 model with appropriate reasoning effort
2. WHEN generating trade signals, THE System SHALL use "medium" reasoning effort (3-5 seconds)
3. WHEN analyzing completed trades, THE System SHALL use "high" reasoning effort (5-10 seconds)
4. WHEN calling GPT-5.1, THE System SHALL set max_completion_tokens to 2000
5. WHEN calling market data APIs, THE System SHALL implement caching (5 minute TTL)
6. WHEN calling Glassnode API, THE System SHALL cache SOPR/MVRV data (1 hour TTL)
7. WHEN API costs exceed $100/month, THE System SHALL send alert notification

---

### Requirement 4.2: Error Handling

**User Story:** As a system, I want robust error handling for all operations, so that failures don't impact user experience.

#### Acceptance Criteria

1. WHEN GPT-5.1 API fails, THE System SHALL retry up to 3 times with exponential backoff
2. WHEN all retries fail, THE System SHALL log error and continue without analysis
3. WHEN market data API fails, THE System SHALL try fallback API before failing
4. WHEN both market APIs fail, THE System SHALL mark verification as "failed" and NOT use fallback data
5. WHEN verification times out (>30 seconds), THE System SHALL cancel and log timeout
6. WHEN displaying errors to users, THE System SHALL show user-friendly messages
7. WHEN errors occur, THE System SHALL never block trade generation or verification

---

### Requirement 4.3: Performance Optimization

**User Story:** As a system, I want all operations to be fast and efficient, so that users get results quickly.

#### Acceptance Criteria

1. WHEN generating trade signals, THE System SHALL complete within 10 seconds
2. WHEN verifying trades, THE System SHALL complete within 30 seconds for 100 trades
3. WHEN analyzing completed trades, THE System SHALL complete within 15 seconds
4. WHEN loading dashboard, THE System SHALL complete within 2 seconds
5. WHEN refreshing data, THE System SHALL use cached data when available
6. WHEN multiple operations are requested, THE System SHALL process them in parallel
7. WHEN system is under load, THE System SHALL queue operations and process in order

---

### Requirement 4.4: Database Schema Updates

**User Story:** As a developer, I want proper database schema for storing trade data, so that data is organized and queryable.

#### Acceptance Criteria

1. WHEN updating schema, THE System SHALL add `status` ENUM column to `atge_trade_signals` (active, tp1_hit, tp2_hit, tp3_hit, stop_loss_hit, expired)
2. WHEN updating schema, THE System SHALL add `tp1_hit_at` TIMESTAMPTZ column
3. WHEN updating schema, THE System SHALL add `tp1_hit_price` DECIMAL column
4. WHEN updating schema, THE System SHALL add `tp2_hit_at` TIMESTAMPTZ column
5. WHEN updating schema, THE System SHALL add `tp2_hit_price` DECIMAL column
6. WHEN updating schema, THE System SHALL add `tp3_hit_at` TIMESTAMPTZ column
7. WHEN updating schema, THE System SHALL add `tp3_hit_price` DECIMAL column
8. WHEN updating schema, THE System SHALL add `stop_loss_hit_at` TIMESTAMPTZ column
9. WHEN updating schema, THE System SHALL add `stop_loss_hit_price` DECIMAL column
10. WHEN updating schema, THE System SHALL add `profit_loss_usd` DECIMAL column
11. WHEN updating schema, THE System SHALL add `profit_loss_percentage` DECIMAL column
12. WHEN updating schema, THE System SHALL add `ai_analysis` TEXT column
13. WHEN updating schema, THE System SHALL add `ai_analysis_confidence` INTEGER column
14. WHEN updating schema, THE System SHALL add `sopr_value` DECIMAL column (Bitcoin only)
15. WHEN updating schema, THE System SHALL add `mvrv_z_score` DECIMAL column (Bitcoin only)
16. WHEN updating schema, THE System SHALL add `last_verified_at` TIMESTAMPTZ column
17. WHEN updating schema, THE System SHALL add `verification_data_source` VARCHAR column
18. WHEN updating schema, THE System SHALL create indexes on status, symbol, created_at for performance

---

## Success Criteria

The implementation is successful when:

### Phase 1 Success Criteria
- ✅ All trade signals generated using GPT-5.1 model
- ✅ Trade verification system tracks profit/loss accurately
- ✅ 100% data accuracy enforced (no fallback data)
- ✅ Dashboard shows win rate, profit factor, and P/L
- ✅ Trade Details modal displays complete verification data
- ✅ Cost per trade signal is under $0.05

### Phase 2 Success Criteria
- ✅ Hourly cron job verifies all active trades
- ✅ User-triggered refresh works correctly
- ✅ SOPR and MVRV Z-Score integrated for Bitcoin trades
- ✅ Performance analytics dashboard displays comprehensive statistics
- ✅ Verification completes within 30 seconds for 100 trades
- ✅ Cost per verification cycle is under $0.10

### Phase 3 Success Criteria
- ✅ GPT-5.1 analyzes completed trades with high reasoning effort
- ✅ Pattern recognition identifies success/failure factors
- ✅ Batch analysis provides actionable recommendations
- ✅ Analysis appears in Trade Details modal within 15 seconds
- ✅ Recommendations are prioritized by potential impact
- ✅ Cost per analysis is under $0.15

### Overall Success Criteria
- ✅ No TypeScript errors
- ✅ No runtime errors or crashes
- ✅ All trade data stored correctly in database
- ✅ UI displays all verification data correctly
- ✅ System handles errors gracefully
- ✅ Performance meets requirements
- ✅ Costs remain under $100/month
- ✅ Data accuracy is 100% (no fallback data used)

---

## Technical Constraints

1. **AI Model**: Must use OpenAI GPT-5.1 with Responses API (not GPT-4o or GPT-4-turbo)
2. **Response Parsing**: Must use bulletproof utilities from `utils/openai.ts`
3. **Database**: Must use existing Supabase PostgreSQL database
4. **Market Data**: Must use CoinMarketCap (primary) and CoinGecko (fallback) APIs
5. **Data Accuracy**: Must enforce 100% accuracy - NO fallback data allowed
6. **Styling**: Must follow Bitcoin Sovereign design system (black, orange, white only)
7. **Performance**: Must not block trade generation or verification
8. **Cost**: Must keep total costs under $100/month
9. **Compatibility**: Must work with existing ATGE system

---

## References

- **Existing ATGE System**: `.kiro/specs/atge-trade-details-fix/`
- **GPT-5.1 Migration Guide**: `GPT-5.1-MIGRATION-GUIDE.md`
- **OpenAI Responses API**: `OPENAI-RESPONSES-API-UTILITY.md`
- **Data Quality Enforcement**: `.kiro/steering/data-quality-enforcement.md`
- **OpenAI API Documentation**: https://platform.openai.com/docs/api-reference
- **CoinMarketCap API**: https://coinmarketcap.com/api/documentation/v1/
- **CoinGecko API**: https://www.coingecko.com/en/api/documentation
- **Glassnode API**: https://docs.glassnode.com/api/
- **Bitcoin Sovereign Design**: `.kiro/steering/bitcoin-sovereign-design.md`
- **UCIE System**: `.kiro/steering/ucie-system.md`
