# AI Trade Generation Engine (ATGE) - Requirements Document

## Introduction

The AI Trade Generation Engine (ATGE) is an advanced algorithmic trading signal system powered by GPT-4o artificial intelligence. This feature generates actionable trading signals for Bitcoin (with Ethereum support planned for future releases) and provides comprehensive backtesting capabilities to validate the accuracy and performance of generated trade suggestions.

The system will store all generated trades in a Supabase database, track their outcomes against historical market data, and present users with a sophisticated performance dashboard that demonstrates the real-world accuracy of AI-generated trading signals.

## Glossary

- **ATGE**: AI Trade Generation Engine - The core system that generates trading signals
- **Trade Signal**: A specific trading recommendation including entry price, exit targets, stop loss, and timeframe
- **Backtesting**: The process of validating trade signals against historical market data to determine success/failure
- **Success Rate**: The percentage of trade signals that reached their profit targets before hitting stop loss
- **Risk/Reward Ratio**: The ratio between potential profit and potential loss for a trade
- **Timeframe**: The expected duration for a trade to reach its targets (e.g., 1h, 4h, 1d, 1w)
- **Entry Price**: The recommended price level to enter a trade
- **Take Profit (TP)**: Target price levels where profits should be taken
- **Stop Loss (SL)**: Price level where the trade should be closed to limit losses
- **Confidence Score**: AI-generated probability score (0-100%) indicating confidence in the trade signal
- **Market Conditions**: Current state of the market (trending, ranging, volatile, etc.)
- **Technical Indicators**: Mathematical calculations based on price/volume (RSI, MACD, EMA, etc.)
- **Supabase Database**: PostgreSQL database used for storing trade data and performance metrics
- **Performance Dashboard**: Visual interface displaying historical trade performance and statistics

## Requirements

### Requirement 1: Trade Signal Generation System

**User Story:** As a trader, I want the AI to generate comprehensive trading signals for Bitcoin so that I can make informed trading decisions based on advanced AI analysis.

#### Acceptance Criteria

1. WHEN the user clicks "Unlock Trade Engine" and provides valid authentication, THE ATGE SHALL generate a complete trade signal within 10 seconds
2. WHEN generating a trade signal, THE ATGE SHALL analyze current market data from CoinMarketCap, CoinGecko, and Kraken APIs
3. WHEN generating a trade signal, THE ATGE SHALL analyze technical indicators including RSI, MACD, EMA, Bollinger Bands, and ATR
4. WHEN generating a trade signal, THE ATGE SHALL analyze social sentiment data from LunarCrush, Twitter/X, and Reddit APIs
5. WHEN generating a trade signal, THE ATGE SHALL analyze on-chain data from Blockchain.com API including whale movements

### Requirement 2: Comprehensive Trade Signal Data Structure

**User Story:** As a trader, I want each trade signal to include all necessary information so that I can execute the trade with clear entry, exit, and risk management parameters.

#### Acceptance Criteria

1. WHEN a trade signal is generated, THE ATGE SHALL include an entry price based on current market conditions
2. WHEN a trade signal is generated, THE ATGE SHALL include 3 take profit levels (TP1, TP2, TP3) with percentage allocations
3. WHEN a trade signal is generated, THE ATGE SHALL include a stop loss level with maximum loss percentage
4. WHEN a trade signal is generated, THE ATGE SHALL include a recommended timeframe (1h, 4h, 1d, 1w, or custom)
5. WHEN a trade signal is generated, THE ATGE SHALL include a confidence score (0-100%) based on AI analysis
6. WHEN a trade signal is generated, THE ATGE SHALL include a risk/reward ratio calculation
7. WHEN a trade signal is generated, THE ATGE SHALL include market condition assessment (trending/ranging/volatile)
8. WHEN a trade signal is generated, THE ATGE SHALL include key technical indicator values supporting the signal
9. WHEN a trade signal is generated, THE ATGE SHALL include AI reasoning explaining the trade logic
10. WHEN a trade signal is generated, THE ATGE SHALL include a unique trade ID for tracking purposes

### Requirement 3: Comprehensive Database Schema and Storage

**User Story:** As a system administrator, I want a complete database schema that stores every aspect of trade signals and their results so that we can provide full transparency and historical analysis to users.

#### Acceptance Criteria

1. WHEN the ATGE system is deployed, THE System SHALL create a `trade_signals` table in Supabase with the following columns:
   - `id` (UUID, primary key)
   - `user_id` (UUID, foreign key to users table)
   - `symbol` (VARCHAR, e.g., "BTC")
   - `status` (VARCHAR: "active", "completed_success", "completed_failure", "expired", "incomplete_data")
   - `entry_price` (DECIMAL)
   - `tp1_price` (DECIMAL)
   - `tp1_allocation` (DECIMAL, default 40%)
   - `tp2_price` (DECIMAL)
   - `tp2_allocation` (DECIMAL, default 30%)
   - `tp3_price` (DECIMAL)
   - `tp3_allocation` (DECIMAL, default 30%)
   - `stop_loss_price` (DECIMAL)
   - `stop_loss_percentage` (DECIMAL)
   - `timeframe` (VARCHAR: "1h", "4h", "1d", "1w")
   - `timeframe_hours` (INTEGER)
   - `confidence_score` (INTEGER, 0-100)
   - `risk_reward_ratio` (DECIMAL)
   - `market_condition` (VARCHAR: "trending", "ranging", "volatile")
   - `ai_reasoning` (TEXT)
   - `ai_model_version` (VARCHAR)
   - `generated_at` (TIMESTAMP WITH TIME ZONE)
   - `expires_at` (TIMESTAMP WITH TIME ZONE)
   - `created_at` (TIMESTAMP WITH TIME ZONE)
   - `updated_at` (TIMESTAMP WITH TIME ZONE)

2. WHEN the ATGE system is deployed, THE System SHALL create a `trade_results` table in Supabase with the following columns:
   - `id` (UUID, primary key)
   - `trade_signal_id` (UUID, foreign key to trade_signals)
   - `actual_entry_price` (DECIMAL)
   - `actual_exit_price` (DECIMAL)
   - `tp1_hit` (BOOLEAN)
   - `tp1_hit_at` (TIMESTAMP WITH TIME ZONE)
   - `tp1_hit_price` (DECIMAL)
   - `tp2_hit` (BOOLEAN)
   - `tp2_hit_at` (TIMESTAMP WITH TIME ZONE)
   - `tp2_hit_price` (DECIMAL)
   - `tp3_hit` (BOOLEAN)
   - `tp3_hit_at` (TIMESTAMP WITH TIME ZONE)
   - `tp3_hit_price` (DECIMAL)
   - `stop_loss_hit` (BOOLEAN)
   - `stop_loss_hit_at` (TIMESTAMP WITH TIME ZONE)
   - `stop_loss_hit_price` (DECIMAL)
   - `profit_loss_usd` (DECIMAL)
   - `profit_loss_percentage` (DECIMAL)
   - `trade_duration_minutes` (INTEGER)
   - `trade_size_usd` (DECIMAL, default 1000)
   - `fees_usd` (DECIMAL)
   - `slippage_usd` (DECIMAL)
   - `net_profit_loss_usd` (DECIMAL)
   - `data_source` (VARCHAR: "CoinMarketCap", "CoinGecko")
   - `data_resolution` (VARCHAR: "1m", "5m", "1h")
   - `data_quality_score` (INTEGER, 0-100)
   - `backtested_at` (TIMESTAMP WITH TIME ZONE)
   - `created_at` (TIMESTAMP WITH TIME ZONE)

3. WHEN the ATGE system is deployed, THE System SHALL create a `trade_technical_indicators` table in Supabase with the following columns:
   - `id` (UUID, primary key)
   - `trade_signal_id` (UUID, foreign key to trade_signals)
   - `rsi_value` (DECIMAL)
   - `macd_value` (DECIMAL)
   - `macd_signal` (DECIMAL)
   - `ema_20` (DECIMAL)
   - `ema_50` (DECIMAL)
   - `ema_200` (DECIMAL)
   - `bollinger_upper` (DECIMAL)
   - `bollinger_middle` (DECIMAL)
   - `bollinger_lower` (DECIMAL)
   - `atr_value` (DECIMAL)
   - `volume_24h` (DECIMAL)
   - `market_cap` (DECIMAL)
   - `created_at` (TIMESTAMP WITH TIME ZONE)

4. WHEN the ATGE system is deployed, THE System SHALL create a `trade_market_snapshot` table in Supabase with the following columns:
   - `id` (UUID, primary key)
   - `trade_signal_id` (UUID, foreign key to trade_signals)
   - `current_price` (DECIMAL)
   - `price_change_24h` (DECIMAL)
   - `volume_24h` (DECIMAL)
   - `market_cap` (DECIMAL)
   - `social_sentiment_score` (INTEGER, 0-100)
   - `whale_activity_count` (INTEGER)
   - `fear_greed_index` (INTEGER, 0-100)
   - `snapshot_at` (TIMESTAMP WITH TIME ZONE)
   - `created_at` (TIMESTAMP WITH TIME ZONE)

5. WHEN the ATGE system is deployed, THE System SHALL create a `trade_historical_prices` table in Supabase for storing backtesting data:
   - `id` (UUID, primary key)
   - `trade_signal_id` (UUID, foreign key to trade_signals)
   - `timestamp` (TIMESTAMP WITH TIME ZONE)
   - `open_price` (DECIMAL)
   - `high_price` (DECIMAL)
   - `low_price` (DECIMAL)
   - `close_price` (DECIMAL)
   - `volume` (DECIMAL)
   - `data_source` (VARCHAR)
   - `created_at` (TIMESTAMP WITH TIME ZONE)

6. WHEN a trade signal is generated, THE System SHALL store the complete signal data in the `trade_signals` table
7. WHEN a trade signal is generated, THE System SHALL store all technical indicators in the `trade_technical_indicators` table
8. WHEN a trade signal is generated, THE System SHALL store the market snapshot in the `trade_market_snapshot` table
9. WHEN a trade signal is generated, THE System SHALL record the generation timestamp with millisecond precision
10. WHEN a trade signal is generated, THE System SHALL record the user ID who generated the signal
11. WHEN a trade signal is generated, THE System SHALL initialize the signal status as "active"
12. WHEN backtesting a trade, THE System SHALL store all historical price data used in the `trade_historical_prices` table
13. WHEN backtesting completes, THE System SHALL store all results in the `trade_results` table
14. WHEN displaying trades to users, THE System SHALL join all related tables to show complete trade information
15. WHEN displaying trades to users, THE System SHALL ensure ALL trades from the database are visible - no filtering or hiding

### Requirement 4: Automated Backtesting System with 100% Real Data

**User Story:** As a trader, I want the system to automatically validate trade signals against 100% real historical market data so that I can see the actual profit or loss that would have occurred with real money.

#### Acceptance Criteria

1. WHEN a trade signal reaches its timeframe expiration, THE ATGE SHALL automatically initiate backtesting using 100% real historical price data
2. WHEN backtesting a trade signal, THE ATGE SHALL retrieve minute-by-minute historical price data from CoinMarketCap API for maximum accuracy
3. WHEN backtesting a trade signal, THE ATGE SHALL use a standardized trade size of $1000 USD for all calculations
4. WHEN backtesting a trade signal, THE ATGE SHALL determine the exact timestamp when stop loss was hit (if applicable)
5. WHEN backtesting a trade signal, THE ATGE SHALL determine the exact timestamp when each take profit level was reached (if applicable)
6. WHEN backtesting a trade signal, THE ATGE SHALL calculate the actual dollar profit or loss based on $1000 trade size
7. WHEN backtesting a trade signal, THE ATGE SHALL calculate the actual profit/loss percentage achieved
8. WHEN backtesting a trade signal, THE ATGE SHALL calculate the exact time duration from entry to exit
9. WHEN stop loss is hit before any take profit, THE ATGE SHALL calculate the full loss amount (e.g., -$50 for 5% SL)
10. WHEN take profit levels are hit, THE ATGE SHALL calculate weighted profit based on allocation percentages (e.g., TP1 40%, TP2 30%, TP3 30%)
11. WHEN backtesting a trade signal, THE ATGE SHALL verify data integrity by checking for gaps in historical data
12. WHEN backtesting a trade signal, THE ATGE SHALL update the signal status to "completed_success" (profit) or "completed_failure" (loss)
13. WHEN backtesting a trade signal, THE ATGE SHALL store all backtesting results including exact entry/exit prices and timestamps in the `trade_results` table
14. WHEN backtesting encounters missing or incomplete historical data, THE ATGE SHALL mark the signal as "incomplete_data" and exclude it from performance statistics
15. WHEN backtesting is complete, THE ATGE SHALL update aggregate performance statistics including total profit/loss in USD

### Requirement 5: Guaranteed Trade Display and Timeframe Tracking

**User Story:** As a trader, I want to see ALL trades including their results within the specified timeframe so that I can verify the AI's accuracy without any hidden or missing data.

#### Acceptance Criteria

1. WHEN viewing the ATGE interface, THE System SHALL display a count of total trades in the database prominently
2. WHEN viewing the trade history, THE System SHALL display ALL trades from the database with no exceptions
3. WHEN a trade is generated with a 1-hour timeframe, THE System SHALL monitor it for exactly 1 hour and then complete backtesting
4. WHEN a trade is generated with a 4-hour timeframe, THE System SHALL monitor it for exactly 4 hours and then complete backtesting
5. WHEN a trade is generated with a 1-day timeframe, THE System SHALL monitor it for exactly 24 hours and then complete backtesting
6. WHEN a trade is generated with a 1-week timeframe, THE System SHALL monitor it for exactly 7 days and then complete backtesting
7. WHEN a trade's timeframe expires, THE System SHALL automatically trigger backtesting within 5 minutes
8. WHEN backtesting is triggered, THE System SHALL retrieve historical price data for the exact timeframe period
9. WHEN displaying a trade, THE System SHALL show the exact timeframe remaining (e.g., "2h 34m remaining")
10. WHEN displaying a completed trade, THE System SHALL show whether it completed within the timeframe or expired
11. WHEN a trade expires without hitting targets, THE System SHALL mark it as "expired" and calculate the result based on the price at expiration
12. WHEN displaying trade results, THE System SHALL show the exact timestamp when each target was hit or when the timeframe expired
13. WHEN a user filters trades, THE System SHALL still show the total count of ALL trades in the database
14. WHEN a user views "Active Trades", THE System SHALL show all trades currently within their timeframe
15. WHEN a user views "Completed Trades", THE System SHALL show all trades that have finished backtesting
16. WHEN the database contains 100 trades, THE System SHALL display all 100 trades (with pagination if needed)
17. WHEN a new trade is generated, THE System SHALL immediately appear in the trade history
18. WHEN a trade completes backtesting, THE System SHALL immediately update the display with results
19. WHEN displaying the trade count, THE System SHALL show: "Total Trades: X | Active: Y | Completed: Z"
20. WHEN the system starts up, THE System SHALL check for any expired trades and complete their backtesting

### Requirement 6: Smart Historical Data Fetching and Trade Analysis

**User Story:** As a trader, I want the system to intelligently fetch historical data for all trades when I access the ATGE so that I can see accurate results without overwhelming API rate limits.

#### Acceptance Criteria

1. WHEN a user clicks the ATGE menu option, THE System SHALL initiate a background job to fetch historical data for all active and recently completed trades
2. WHEN fetching historical data, THE System SHALL use CoinMarketCap API as the primary source
3. WHEN fetching historical data, THE System SHALL use CoinGecko API as a fallback if CoinMarketCap fails
4. WHEN fetching historical data, THE System SHALL request minute-level OHLCV data for the timeframe of each trade
5. WHEN fetching historical data, THE System SHALL batch API requests to stay within rate limits (max 10 requests per minute)
6. WHEN fetching historical data, THE System SHALL prioritize trades that are closest to expiration
7. WHEN fetching historical data, THE System SHALL cache the data in the `trade_historical_prices` table for 24 hours
8. WHEN historical data is fetched, THE System SHALL analyze it to determine if any targets were hit
9. WHEN analyzing historical data, THE System SHALL check if the high price reached any take profit levels
10. WHEN analyzing historical data, THE System SHALL check if the low price hit the stop loss level
11. WHEN a target is detected as hit, THE System SHALL record the exact timestamp and price in the `trade_results` table
12. WHEN a target is detected as hit, THE System SHALL update the trade status to "completed_success" or "completed_failure"
13. WHEN all targets are analyzed, THE System SHALL calculate the final profit/loss based on which targets were hit
14. WHEN displaying the ATGE interface, THE System SHALL show a loading indicator while historical data is being fetched
15. WHEN historical data fetching is complete, THE System SHALL display all updated trade results
16. WHEN a user generates a new trade, THE System SHALL immediately fetch historical data for that trade's timeframe
17. WHEN a trade's timeframe expires, THE System SHALL trigger a final historical data fetch to determine the outcome
18. WHEN displaying active trades, THE System SHALL show the last updated timestamp (e.g., "Last checked: 2 minutes ago")
19. WHEN a user refreshes the ATGE page, THE System SHALL re-fetch historical data for active trades if more than 5 minutes have passed
20. WHEN API rate limits are approached, THE System SHALL queue requests and process them sequentially to avoid errors

### Requirement 6: Performance Dashboard - Prominent Success Metrics Display

**User Story:** As a trader, I want to see bold, prominent performance statistics that immediately show me the superior accuracy and profitability of the AI Trade Generation Engine.

#### Acceptance Criteria

1. WHEN viewing the ATGE interface, THE System SHALL display a prominent performance summary card at the top showing key metrics
2. WHEN viewing the performance summary, THE System SHALL display total number of trade signals generated in large, bold text
3. WHEN viewing the performance summary, THE System SHALL display total number of completed trades (backtested with 100% real data)
4. WHEN viewing the performance summary, THE System SHALL display overall success rate percentage in EXTRA LARGE, bold text with color coding (green if >60%, yellow if 50-60%, red if <50%)
5. WHEN viewing the performance summary, THE System SHALL display total profit/loss in USD in EXTRA LARGE, bold text (e.g., **+$3,247.50** or **-$892.30**)
6. WHEN viewing the performance summary, THE System SHALL display total profit/loss percentage with prominent color coding
7. WHEN viewing the performance summary, THE System SHALL display "Winning Trades" count in bright green
8. WHEN viewing the performance summary, THE System SHALL display "Losing Trades" count in bright red
9. WHEN viewing the performance summary, THE System SHALL display average profit per winning trade in USD with green background
10. WHEN viewing the performance summary, THE System SHALL display average loss per losing trade in USD with red background
11. WHEN viewing the performance summary, THE System SHALL display largest winning trade in USD with a "🏆 Best Trade" badge
12. WHEN viewing the performance summary, THE System SHALL display largest losing trade in USD with a "⚠️ Worst Trade" badge
13. WHEN viewing the performance summary, THE System SHALL display average confidence score comparison: "Winning Trades: 78% | Losing Trades: 62%"
14. WHEN viewing the performance summary, THE System SHALL display average time to target for successful trades (e.g., "Avg Win Time: 6h 23m")
15. WHEN viewing the performance summary, THE System SHALL display best performing timeframe with actual USD profit (e.g., "Best: 4h timeframe (+$1,847)")
16. WHEN viewing the performance summary, THE System SHALL display worst performing timeframe with actual USD loss (e.g., "Worst: 1h timeframe (-$423)")
17. WHEN viewing the performance summary, THE System SHALL display hypothetical account growth: "Starting $10,000 → Current $13,247 (+32.47%)"
18. WHEN viewing the performance summary, THE System SHALL display return on investment (ROI) percentage in large, bold text
19. WHEN viewing the performance summary, THE System SHALL display win/loss ratio (e.g., "Win/Loss Ratio: 2.3:1")
20. WHEN viewing the performance summary, THE System SHALL display current winning streak or losing streak (e.g., "🔥 5 Wins in a Row!")
21. WHEN the success rate is above 65%, THE System SHALL display a "Superior Performance" badge
22. WHEN the total profit exceeds $2000, THE System SHALL display a "Highly Profitable" badge
23. WHEN viewing the performance summary, THE System SHALL update in real-time as new trades complete
24. WHEN viewing the performance summary, THE System SHALL include a timestamp showing when statistics were last updated

### Requirement 7: AI-Powered Trade Analysis and Insights

**User Story:** As a trader, I want the system to use advanced AI to analyze trade performance and provide insights so that I can understand why trades succeeded or failed.

#### Acceptance Criteria

1. WHEN a trade completes backtesting, THE System SHALL use GPT-4o to analyze the trade outcome
2. WHEN analyzing a trade, THE System SHALL provide the AI with complete context: entry/exit prices, targets hit, market conditions, technical indicators, and timeframe
3. WHEN analyzing a successful trade, THE System SHALL generate an AI explanation of why the trade was profitable
4. WHEN analyzing a failed trade, THE System SHALL generate an AI explanation of why the trade hit stop loss
5. WHEN analyzing a trade, THE System SHALL identify key factors that contributed to the outcome (e.g., "Strong RSI divergence", "Whale accumulation", "Market sentiment shift")
6. WHEN displaying a trade in the history, THE System SHALL show the AI analysis alongside the numerical results
7. WHEN viewing the performance dashboard, THE System SHALL use AI to generate an overall performance summary
8. WHEN generating the performance summary, THE System SHALL use GPT-4o to analyze patterns across all trades
9. WHEN generating the performance summary, THE System SHALL identify which market conditions the AI performs best in
10. WHEN generating the performance summary, THE System SHALL identify which timeframes have the highest success rate
11. WHEN generating the performance summary, THE System SHALL provide recommendations for improving future trade signals
12. WHEN a user clicks "View All Trades", THE System SHALL display AI-generated insights for the overall trading strategy
13. WHEN displaying AI analysis, THE System SHALL use clear, concise language that traders can understand
14. WHEN displaying AI analysis, THE System SHALL highlight key insights in bold or colored text
15. WHEN the AI analysis is generated, THE System SHALL store it in the database for future reference

### Requirement 8: Complete Trade Visibility - Public Performance Record

**User Story:** As a trader, I want to see EVERY trade signal ever generated with complete transparency of results so that I can verify the superior accuracy of the AI Trade Generation Engine.

#### Acceptance Criteria

1. WHEN viewing the ATGE interface, THE System SHALL display a prominent "View All Trades" button that shows the complete trade history
2. WHEN viewing the trade history, THE System SHALL display ALL trade signals ever generated - no trades hidden or excluded
3. WHEN viewing the trade history table, THE System SHALL display trades in reverse chronological order (newest first)
4. WHEN viewing the trade history table, THE System SHALL display trade ID, generation date/time, and current status for each signal
5. WHEN viewing the trade history table, THE System SHALL display entry price, all 3 take profit levels, and stop loss for each signal
6. WHEN viewing the trade history table, THE System SHALL display confidence score with bold color coding (green >70%, yellow 50-70%, red <50%)
7. WHEN viewing the trade history table, THE System SHALL display actual profit/loss in USD with prominent formatting (e.g., **+$87.50**, **-$42.30**)
8. WHEN viewing the trade history table, THE System SHALL display actual profit/loss percentage (e.g., +8.75%, -4.23%)
9. WHEN viewing the trade history table, THE System SHALL display exact time to completion for completed trades (e.g., "2h 34m", "1d 5h")
10. WHEN viewing the trade history table, THE System SHALL display which targets were hit with exact prices and timestamps (e.g., "TP1: $95,234 @ 14:23", "TP2: $96,100 @ 16:45")
11. WHEN viewing the trade history table, THE System SHALL display the exact entry and exit prices used in backtesting
12. WHEN viewing the trade history table, THE System SHALL use bold color-coding for entire rows (bright green for profit, bright red for loss, orange for active, grey for pending)
13. WHEN viewing the trade history table, THE System SHALL display a running total of cumulative profit/loss at the bottom
14. WHEN viewing the trade history table, THE System SHALL allow filtering by status (all, active, completed_success, completed_failure, expired)
15. WHEN viewing the trade history table, THE System SHALL allow filtering by timeframe (all, 1h, 4h, 1d, 1w)
16. WHEN viewing the trade history table, THE System SHALL allow filtering by date range with preset options (7d, 30d, 90d, all time)
17. WHEN viewing the trade history table, THE System SHALL allow filtering by profit/loss range (e.g., show only profitable trades, show only losses)
18. WHEN viewing the trade history table, THE System SHALL allow sorting by any column (date, profit, confidence, duration)
19. WHEN clicking a trade in the history table, THE System SHALL display a detailed modal with price chart showing entry/exit markers
20. WHEN viewing a trade detail modal, THE System SHALL display the complete AI reasoning that led to the trade signal
21. WHEN viewing a trade detail modal, THE System SHALL display all technical indicators and their values at signal generation time
22. WHEN viewing a trade detail modal, THE System SHALL display a timeline showing when each target was hit or when stop loss was triggered
23. WHEN viewing the trade history, THE System SHALL provide a "Download Full History" button for complete transparency
24. WHEN no filters are applied, THE System SHALL show ALL trades by default - complete transparency is the priority

### Requirement 8: "Proof of Performance" - Showcasing Superior Accuracy

**User Story:** As a trader, I want to see compelling visual proof that the AI Trade Generation Engine is superior to other trading platforms so that I can trust its predictions with confidence.

#### Acceptance Criteria

1. WHEN viewing the ATGE interface, THE System SHALL display a dedicated "Proof of Performance" section prominently
2. WHEN viewing the Proof of Performance section, THE System SHALL display a real-time accuracy meter showing current success rate with animated gauge
3. WHEN viewing the Proof of Performance section, THE System SHALL display a "Live Track Record" banner showing: "X Trades Analyzed | Y% Success Rate | $Z Total Profit"
4. WHEN viewing the Proof of Performance section, THE System SHALL display recent winning trades in a scrolling ticker (e.g., "Trade #1234: +$127.50 (12.75%) ✓")
5. WHEN viewing the Proof of Performance section, THE System SHALL display a comparison chart: "Our AI vs Market Average" showing superior performance
6. WHEN viewing the Proof of Performance section, THE System SHALL display a "Verified Results" badge with link to complete trade history
7. WHEN viewing the Proof of Performance section, THE System SHALL display testimonial-style stats: "87 Profitable Trades This Month"
8. WHEN viewing the Proof of Performance section, THE System SHALL display a "Transparency Score: 100%" badge indicating all trades are visible
9. WHEN viewing the Proof of Performance section, THE System SHALL display a "Data Integrity: Verified" badge indicating 100% real historical data
10. WHEN viewing the Proof of Performance section, THE System SHALL display a rolling 7-day performance summary with daily breakdown
11. WHEN viewing the Proof of Performance section, THE System SHALL display a "Best Performing Day" highlight (e.g., "Jan 15: +$847 from 5 trades")
12. WHEN viewing the Proof of Performance section, THE System SHALL display a "Consistency Score" showing how reliably the AI performs
13. WHEN viewing the Proof of Performance section, THE System SHALL display a "Risk Management Score" showing how well stop losses protect capital
14. WHEN the AI achieves exceptional performance (>70% success rate), THE System SHALL display a "Elite Performance" badge
15. WHEN the AI achieves 10 consecutive winning trades, THE System SHALL display a "Hot Streak" badge with animation
16. WHEN viewing the Proof of Performance section, THE System SHALL provide a "Challenge Us" button linking to complete trade history for verification
17. WHEN viewing the Proof of Performance section, THE System SHALL display a "No Hidden Trades" guarantee statement
18. WHEN viewing the Proof of Performance section, THE System SHALL display a "Real Money, Real Results" statement emphasizing $1000 per trade
19. WHEN viewing the Proof of Performance section, THE System SHALL display a "Last Updated" timestamp showing real-time data
20. WHEN viewing the Proof of Performance section, THE System SHALL include social proof elements like "Join 1,247 traders using our AI"

### Requirement 9: Performance Dashboard - Compelling Visual Analytics

**User Story:** As a trader, I want to see stunning visual representations of trade performance that clearly demonstrate the AI's superior accuracy and profitability.

#### Acceptance Criteria

1. WHEN viewing the performance dashboard, THE System SHALL display a large, animated success rate chart showing performance trend over time with smooth transitions
2. WHEN viewing the performance dashboard, THE System SHALL display a prominent profit/loss curve showing cumulative returns with green/red color gradient
3. WHEN viewing the performance dashboard, THE System SHALL display an equity curve showing hypothetical account growth from $10,000 starting capital
4. WHEN viewing the performance dashboard, THE System SHALL display a confidence score vs outcome scatter plot showing correlation between AI confidence and success
5. WHEN viewing the performance dashboard, THE System SHALL display a timeframe performance comparison bar chart with USD profit amounts
6. WHEN viewing the performance dashboard, THE System SHALL display a large win/loss ratio pie chart with percentage labels
7. WHEN viewing the performance dashboard, THE System SHALL display a monthly performance heatmap with color intensity showing profit levels
8. WHEN viewing the performance dashboard, THE System SHALL display a risk/reward ratio scatter plot showing each trade's risk vs actual return
9. WHEN viewing the performance dashboard, THE System SHALL display a "Winning Trades Timeline" showing when successful trades occurred
10. WHEN viewing the performance dashboard, THE System SHALL display a "Profit Distribution" histogram showing frequency of different profit levels
11. WHEN viewing the performance dashboard, THE System SHALL display a "Time to Target" chart showing how quickly trades reach profit
12. WHEN viewing the performance dashboard, THE System SHALL display a "Market Condition Performance" breakdown (trending vs ranging vs volatile)
13. WHEN viewing the performance dashboard, THE System SHALL display a "Daily Performance" bar chart showing profit/loss by day of week
14. WHEN viewing the performance dashboard, THE System SHALL display a "Hourly Performance" heatmap showing best times for trade signals
15. WHEN viewing the performance dashboard, THE System SHALL allow toggling between different time periods (7d, 30d, 90d, all time) with smooth animations
16. WHEN viewing the performance dashboard, THE System SHALL allow exporting charts as high-resolution PNG images
17. WHEN viewing the performance dashboard, THE System SHALL display a "Performance Comparison" chart showing AI vs buy-and-hold strategy
18. WHEN viewing the performance dashboard, THE System SHALL display a "Drawdown Chart" showing maximum capital decline periods
19. WHEN viewing the performance dashboard, THE System SHALL use Bitcoin orange (#F7931A) for positive performance and red for negative
20. WHEN viewing the performance dashboard, THE System SHALL animate chart updates when new trades complete

### Requirement 9: Performance Dashboard - Advanced Metrics

**User Story:** As an advanced trader, I want to see sophisticated performance metrics so that I can deeply analyze the AI's trading strategy effectiveness.

#### Acceptance Criteria

1. WHEN viewing advanced metrics, THE ATGE SHALL display Sharpe Ratio for the trading strategy
2. WHEN viewing advanced metrics, THE ATGE SHALL display maximum drawdown percentage
3. WHEN viewing advanced metrics, THE ATGE SHALL display average win size vs average loss size
4. WHEN viewing advanced metrics, THE ATGE SHALL display consecutive wins and losses streaks
5. WHEN viewing advanced metrics, THE ATGE SHALL display profit factor (gross profit / gross loss)
6. WHEN viewing advanced metrics, THE ATGE SHALL display expectancy (average profit per trade)
7. WHEN viewing advanced metrics, THE ATGE SHALL display recovery factor (net profit / max drawdown)
8. WHEN viewing advanced metrics, THE ATGE SHALL display correlation between confidence score and success rate
9. WHEN viewing advanced metrics, THE ATGE SHALL display performance by market volatility levels
10. WHEN viewing advanced metrics, THE ATGE SHALL display performance by time of day/week

### Requirement 10: Ethereum Support (Greyed Out - In Development)

**User Story:** As a trader, I want to see that Ethereum support is planned so that I know the feature will expand beyond Bitcoin in the future.

#### Acceptance Criteria

1. WHEN viewing the ATGE interface, THE System SHALL display an Ethereum option button
2. WHEN viewing the Ethereum option, THE System SHALL display it in a greyed-out/disabled state
3. WHEN viewing the Ethereum option, THE System SHALL display "In Development" badge or tooltip
4. WHEN a user hovers over the Ethereum option, THE System SHALL display a tooltip explaining it's coming soon
5. WHEN a user clicks the Ethereum option, THE System SHALL display a modal explaining the feature is under development

### Requirement 11: Trade Signal Generation - AI Integration

**User Story:** As a system, I want to leverage the best available AI models so that trade signals are generated using the most advanced analysis capabilities.

#### Acceptance Criteria

1. WHEN generating a trade signal, THE ATGE SHALL use OpenAI GPT-4o as the primary AI model
2. WHEN GPT-4o is unavailable, THE ATGE SHALL use Gemini AI as a fallback
3. WHEN generating a trade signal, THE ATGE SHALL provide the AI with comprehensive market context including price data, technical indicators, sentiment data, and on-chain metrics
4. WHEN generating a trade signal, THE ATGE SHALL use a specialized system prompt optimized for trading signal generation
5. WHEN generating a trade signal, THE ATGE SHALL request structured JSON output from the AI
6. WHEN the AI response is received, THE ATGE SHALL validate the JSON structure before storing
7. WHEN the AI response is invalid, THE ATGE SHALL retry up to 3 times with adjusted prompts
8. WHEN all retries fail, THE ATGE SHALL display an error message to the user

### Requirement 12: Authentication and Access Control

**User Story:** As a platform owner, I want to control access to the Trade Engine so that only authorized users can generate trade signals.

#### Acceptance Criteria

1. WHEN a user clicks "Unlock Trade Engine", THE System SHALL display a password input modal
2. WHEN a user enters the correct password, THE System SHALL enable the trade generation interface
3. WHEN a user enters an incorrect password, THE System SHALL display an error message
4. WHEN a user enters an incorrect password 5 times, THE System SHALL temporarily lock the feature for 15 minutes
5. WHEN the trade engine is unlocked, THE System SHALL maintain the unlocked state for the user's session
6. WHEN a user logs out, THE System SHALL require re-authentication to access the trade engine
7. WHEN an authenticated user generates a trade, THE System SHALL record their user ID with the trade signal

### Requirement 13: Rate Limiting and Resource Management

**User Story:** As a system administrator, I want to prevent abuse of the trade generation system so that API costs remain manageable and system performance is maintained.

#### Acceptance Criteria

1. WHEN a user generates a trade signal, THE System SHALL enforce a 60-second cooldown before allowing another generation
2. WHEN a user attempts to generate during cooldown, THE System SHALL display remaining time
3. WHEN a user generates more than 10 trades in 24 hours, THE System SHALL display a warning about rate limits
4. WHEN a user reaches 20 trades in 24 hours, THE System SHALL prevent further generation until the 24-hour window resets
5. WHEN backtesting is running, THE System SHALL limit concurrent backtesting operations to 5 trades at a time
6. WHEN API rate limits are approached, THE System SHALL queue requests and process them sequentially

### Requirement 14: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback when errors occur so that I understand what went wrong and what actions I can take.

#### Acceptance Criteria

1. WHEN trade generation fails due to API errors, THE System SHALL display a user-friendly error message
2. WHEN trade generation fails, THE System SHALL log detailed error information for debugging
3. WHEN backtesting fails due to missing data, THE System SHALL mark the trade as "incomplete" and explain why
4. WHEN the database is unavailable, THE System SHALL display a maintenance message
5. WHEN network connectivity is lost, THE System SHALL display an offline indicator
6. WHEN trade generation is in progress, THE System SHALL display a loading indicator with estimated time
7. WHEN trade generation completes, THE System SHALL display a success message with trade summary

### Requirement 15: Mobile Responsiveness

**User Story:** As a mobile user, I want the ATGE interface and performance dashboard to work seamlessly on my device so that I can access trading signals on the go.

#### Acceptance Criteria

1. WHEN viewing the ATGE on mobile, THE System SHALL display a mobile-optimized layout
2. WHEN viewing the performance dashboard on mobile, THE System SHALL display charts in a stacked vertical layout
3. WHEN viewing the trade history table on mobile, THE System SHALL display a card-based layout instead of a table
4. WHEN interacting with the ATGE on mobile, THE System SHALL ensure all touch targets are minimum 48px × 48px
5. WHEN viewing charts on mobile, THE System SHALL allow pinch-to-zoom and swipe gestures
6. WHEN generating a trade on mobile, THE System SHALL optimize API calls to minimize data usage

### Requirement 16: Data Export and Reporting

**User Story:** As a trader, I want to export trade data and performance reports so that I can analyze the data in external tools or share it with others.

#### Acceptance Criteria

1. WHEN viewing the performance dashboard, THE System SHALL provide an "Export Data" button
2. WHEN exporting data, THE System SHALL allow selection of CSV, JSON, or PDF format
3. WHEN exporting to CSV, THE System SHALL include all trade signals with complete details
4. WHEN exporting to JSON, THE System SHALL include structured data suitable for programmatic analysis
5. WHEN exporting to PDF, THE System SHALL include performance summary, charts, and trade history
6. WHEN exporting data, THE System SHALL allow filtering by date range and status
7. WHEN export is complete, THE System SHALL download the file to the user's device

### Requirement 17: Performance Optimization

**User Story:** As a user, I want the ATGE to load quickly and respond smoothly so that I have a seamless trading experience.

#### Acceptance Criteria

1. WHEN loading the ATGE interface, THE System SHALL display the initial view within 2 seconds
2. WHEN loading the performance dashboard, THE System SHALL use lazy loading for charts
3. WHEN displaying the trade history table, THE System SHALL implement pagination with 25 trades per page
4. WHEN generating a trade signal, THE System SHALL cache market data for 60 seconds to reduce API calls
5. WHEN backtesting trades, THE System SHALL process them in batches to avoid database overload
6. WHEN displaying charts, THE System SHALL use efficient rendering libraries (e.g., Chart.js, Recharts)
7. WHEN the user navigates away, THE System SHALL cancel pending API requests to save resources

### Requirement 18: Notification System (Optional Enhancement)

**User Story:** As a trader, I want to receive notifications when my trade signals hit targets so that I can take action in real-time.

#### Acceptance Criteria

1. WHEN a trade signal hits a take profit level, THE System SHALL send a browser notification (if enabled)
2. WHEN a trade signal hits stop loss, THE System SHALL send a browser notification (if enabled)
3. WHEN a trade signal is about to expire, THE System SHALL send a notification 1 hour before expiration
4. WHEN viewing settings, THE System SHALL allow users to enable/disable notifications
5. WHEN viewing settings, THE System SHALL allow users to select which events trigger notifications

### Requirement 19: Historical Data Integration - 100% Real Data Guarantee

**User Story:** As a system, I want to access 100% real, verified historical price data so that backtesting results are completely accurate and trustworthy.

#### Acceptance Criteria

1. WHEN backtesting a trade, THE System SHALL retrieve minute-level OHLCV (Open, High, Low, Close, Volume) data from CoinMarketCap API
2. WHEN minute-level data is unavailable, THE System SHALL use 5-minute interval data as first fallback
3. WHEN 5-minute data is unavailable, THE System SHALL use hourly data as second fallback
4. WHEN using lower resolution data, THE System SHALL clearly indicate this in the backtesting results
5. WHEN historical data is retrieved, THE System SHALL verify data integrity by checking for price anomalies (e.g., >20% price jumps in 1 minute)
6. WHEN historical data is retrieved, THE System SHALL cache it in the database for 7 days to reduce API calls
7. WHEN backtesting requires data older than 90 days, THE System SHALL use CoinGecko API as a fallback source
8. WHEN using multiple data sources, THE System SHALL cross-validate prices to ensure accuracy
9. WHEN historical data has gaps, THE System SHALL NOT interpolate or estimate prices - instead mark the trade as "incomplete_data"
10. WHEN backtesting a trade, THE System SHALL use the actual high/low prices within each time interval to determine if targets were hit
11. WHEN backtesting a trade, THE System SHALL account for realistic slippage (0.1% for entry/exit) to simulate real trading conditions
12. WHEN backtesting a trade, THE System SHALL account for trading fees (0.1% per transaction) in profit/loss calculations
13. WHEN backtesting results are stored, THE System SHALL include a data quality score (0-100%) based on data resolution and completeness
14. WHEN data quality score is below 90%, THE System SHALL display a warning on the trade result
15. WHEN displaying backtesting results, THE System SHALL always indicate the data source and resolution used (e.g., "CoinMarketCap 1-minute data")

### Requirement 20: Standardized Trade Size and P/L Calculations

**User Story:** As a trader, I want all trades to use a standardized $1000 size so that I can easily compare performance and understand real monetary outcomes.

#### Acceptance Criteria

1. WHEN backtesting any trade signal, THE System SHALL use exactly $1000 USD as the trade size
2. WHEN calculating profit/loss, THE System SHALL use the formula: P/L = $1000 × (exit_price - entry_price) / entry_price
3. WHEN a trade hits stop loss, THE System SHALL calculate the exact loss amount (e.g., 5% SL = -$50 loss)
4. WHEN a trade hits take profit levels, THE System SHALL calculate weighted profit based on allocation percentages
5. WHEN a trade hits TP1 (40% allocation), THE System SHALL calculate: TP1_profit = $400 × (TP1_price - entry_price) / entry_price
6. WHEN a trade hits TP2 (30% allocation), THE System SHALL calculate: TP2_profit = $300 × (TP2_price - entry_price) / entry_price
7. WHEN a trade hits TP3 (30% allocation), THE System SHALL calculate: TP3_profit = $300 × (TP3_price - entry_price) / entry_price
8. WHEN multiple take profit levels are hit, THE System SHALL sum all partial profits for total P/L
9. WHEN calculating total portfolio performance, THE System SHALL sum all individual trade P/L amounts
10. WHEN displaying cumulative returns, THE System SHALL show: Starting Capital + Total P/L (e.g., $10,000 + $1,247 = $11,247)
11. WHEN calculating ROI, THE System SHALL use the formula: ROI = (Total P/L / Total Capital Deployed) × 100%
12. WHEN a trade is partially filled (e.g., only TP1 hit), THE System SHALL calculate profit on filled portion and return remaining capital
13. WHEN displaying trade results, THE System SHALL always show both USD amount and percentage (e.g., "+$87.50 (+8.75%)")
14. WHEN accounting for fees, THE System SHALL deduct 0.1% on entry and 0.1% on exit from the P/L
15. WHEN accounting for slippage, THE System SHALL reduce profit or increase loss by 0.1% to simulate real market conditions

### Requirement 21: Real Data Verification and Transparency

**User Story:** As a trader, I want complete transparency about data sources and backtesting methodology so that I can trust the accuracy of performance results.

#### Acceptance Criteria

1. WHEN viewing any trade result, THE System SHALL display the exact data source used (e.g., "CoinMarketCap API")
2. WHEN viewing any trade result, THE System SHALL display the data resolution (e.g., "1-minute intervals")
3. WHEN viewing any trade result, THE System SHALL display the data quality score (0-100%)
4. WHEN viewing any trade result, THE System SHALL display whether fees and slippage were included in calculations
5. WHEN viewing the performance dashboard, THE System SHALL display a "Methodology" section explaining backtesting approach
6. WHEN viewing the performance dashboard, THE System SHALL display a disclaimer: "Past performance does not guarantee future results"
7. WHEN viewing the performance dashboard, THE System SHALL provide a link to detailed backtesting methodology documentation
8. WHEN backtesting is complete, THE System SHALL store the raw historical price data used for verification purposes
9. WHEN a user questions a result, THE System SHALL allow viewing the exact price data and calculations used
10. WHEN displaying aggregate statistics, THE System SHALL clearly indicate if any trades were excluded due to incomplete data

### Requirement 22: AI Model Versioning and A/B Testing

**User Story:** As a system administrator, I want to track which AI model version generated each trade so that I can compare performance across model updates.

#### Acceptance Criteria

1. WHEN generating a trade signal, THE System SHALL record the AI model version (e.g., "gpt-4o-2024-11-20")
2. WHEN viewing the performance dashboard, THE System SHALL allow filtering by AI model version
3. WHEN viewing the performance dashboard, THE System SHALL display a comparison chart of different model versions
4. WHEN a new AI model is deployed, THE System SHALL allow A/B testing by randomly assigning users to different models
5. WHEN A/B testing is active, THE System SHALL track and compare performance metrics between model versions

---

## Summary

This requirements document defines a comprehensive AI Trade Generation Engine with advanced backtesting capabilities using **100% real historical market data** and **standardized $1000 trade sizes** for complete transparency and accuracy. The system will initially support Bitcoin with Ethereum support planned for future releases.

### Core Principles

1. **100% Real Data**: All backtesting uses verified historical price data from CoinMarketCap and CoinGecko APIs with minute-level resolution
2. **Standardized Trade Size**: Every trade uses exactly $1000 USD for consistent, comparable results
3. **Real Money Tracking**: All profit/loss calculations show actual USD amounts (e.g., +$87.50, -$42.30)
4. **Complete Transparency**: Data sources, resolution, quality scores, and methodology are always visible
5. **Realistic Conditions**: Includes trading fees (0.1%) and slippage (0.1%) in all calculations

### Key Features

- **AI-Powered Signals**: GPT-4o generates comprehensive trade signals with entry, 3 take profit levels, stop loss, timeframe, and confidence score
- **Automated Backtesting**: Every trade is automatically validated against real historical data to determine actual profit or loss
- **Real-Time Monitoring**: Active trades are monitored every 60 seconds to detect when targets are hit
- **Performance Dashboard**: Sophisticated analytics showing total P/L in USD, success rate, best/worst timeframes, and hypothetical account growth
- **Trade History**: Complete record of every trade with exact entry/exit prices, timestamps, and monetary outcomes
- **Visual Analytics**: Charts, graphs, and heatmaps showing performance trends over time
- **Advanced Metrics**: Sharpe Ratio, maximum drawdown, profit factor, expectancy, and more
- **Data Verification**: Cross-validation of price data, quality scoring, and anomaly detection
- **Mobile-Responsive**: Full functionality on all devices with touch-optimized interface
- **Export Capabilities**: Download trade data and reports in CSV, JSON, or PDF format

### What Makes This Superior to Any Other Trading Platform

This system sets a new standard for algorithmic trading platforms by providing **complete transparency and proof of performance** that no competitor can match:

#### 1. **100% Trade Visibility**
- **Every single trade** is visible to users - no cherry-picking, no hiding losses
- Complete trade history with exact entry/exit prices and timestamps
- Real-time updates as trades complete and targets are hit
- "No Hidden Trades" guarantee prominently displayed

#### 2. **Real Money, Real Results**
- Every trade uses standardized $1000 size for honest comparison
- Shows actual USD profit/loss (e.g., +$87.50, -$42.30), not just percentages
- Includes realistic trading fees (0.1%) and slippage (0.1%)
- Displays hypothetical account growth from $10,000 starting capital

#### 3. **100% Real Historical Data**
- All backtesting uses verified minute-level price data from CoinMarketCap/CoinGecko
- No simulations, no estimates, no interpolation
- Data quality scores and source transparency for every trade
- Cross-validation between multiple data sources

#### 4. **Proof of Performance Section**
- Real-time accuracy meter showing current success rate
- "Live Track Record" banner with total trades, success rate, and profit
- Recent winning trades displayed in scrolling ticker
- "Verified Results" and "Data Integrity: Verified" badges
- Performance comparison charts showing AI vs market average

#### 5. **Compelling Visual Analytics**
- Animated charts showing performance trends over time
- Equity curve demonstrating account growth
- Confidence score correlation analysis
- Monthly performance heatmaps
- Time-to-target analysis showing how quickly trades profit

#### 6. **Advanced Performance Metrics**
- Sharpe Ratio, maximum drawdown, profit factor
- Win/loss ratio, average win vs average loss
- Consecutive win/loss streaks
- Performance by timeframe, market condition, and time of day
- Consistency and risk management scores

#### 7. **Complete Transparency**
- Full methodology documentation
- Data source and resolution displayed for every trade
- Raw historical price data stored for verification
- "Challenge Us" button linking to complete trade history
- "Transparency Score: 100%" badge

#### 8. **Superior User Experience**
- Prominent performance summary with key metrics in large, bold text
- Color-coded results (green for profit, red for loss)
- Real-time updates as trades complete
- Mobile-responsive design for on-the-go access
- Export capabilities for external analysis

#### 9. **Honest Reporting**
- Shows both winning AND losing trades
- Clearly marks incomplete data
- Displays worst performing timeframes alongside best
- No misleading statistics or cherry-picked results
- "Past performance does not guarantee future results" disclaimer

#### 10. **Competitive Advantage**
- More detailed performance metrics than any competing platform
- Real-time proof of accuracy that competitors can't match
- Complete trade history that builds trust over time
- Standardized $1000 trades make performance easy to understand
- Visual proof that the AI actually makes money

### The Ultimate Question Answered

This system definitively answers the critical question that every trader asks:

**"Does the AI actually make money, or just sound convincing?"**

By showing **every trade**, using **100% real data**, and displaying **actual USD profit/loss**, we provide irrefutable proof of the AI Trade Generation Engine's superior performance. No other platform offers this level of transparency and verification.

**Result**: Traders can see exactly how accurate the AI is, how much money it makes (or loses), and make informed decisions based on complete, verified historical performance.
