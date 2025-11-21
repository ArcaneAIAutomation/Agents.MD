# ATGE GPT Trade Analysis Engine - Requirements

## Introduction

The ATGE (AI Trade Generation Engine) currently generates trade signals and performs historical backtesting to determine if trades closed in profit or loss. However, users lack insights into **why** trades succeeded or failed. This specification adds a comprehensive GPT-powered analysis system that provides actionable insights on trade outcomes.

This will be implemented in **4 sequential phases**:
1. **Phase 1**: Lightweight Post-Trade Analysis (MVP)
2. **Phase 2**: Vision-Enabled Chart Analysis
3. **Phase 3**: Real-Time Monitoring + Analysis
4. **Phase 4**: Batch Analysis with Pattern Recognition

---

## Glossary

- **Trade Analysis**: AI-generated insights explaining why a trade succeeded or failed
- **GPT-4o**: OpenAI's GPT-4 Optimized model for text analysis
- **GPT-4o Vision**: OpenAI's GPT-4 model with image analysis capabilities
- **Backtesting Result**: Historical simulation showing actual trade outcome
- **Technical Context**: Market indicators (RSI, MACD, EMA) at trade generation time
- **Market Snapshot**: Market conditions (price, volume, sentiment) at trade generation time
- **Trade Event**: Significant occurrence during trade execution (TP hit, SL hit, etc.)
- **Pattern Recognition**: Identifying common characteristics across multiple trades
- **Success Pattern**: Characteristics shared by profitable trades
- **Failure Pattern**: Characteristics shared by losing trades

---

## Phase 1: Lightweight Post-Trade Analysis

### Requirement 1.1: Post-Backtest Analysis Trigger

**User Story:** As a trader, I want automatic AI analysis after my trade completes backtesting, so that I understand why it succeeded or failed.

#### Acceptance Criteria

1. WHEN a trade backtest completes successfully, THE System SHALL automatically trigger GPT-4o analysis
2. WHEN the analysis is triggered, THE System SHALL pass complete trade data to GPT-4o
3. WHEN GPT-4o returns analysis, THE System SHALL store it in the database
4. WHEN analysis fails, THE System SHALL log the error and continue without blocking the user
5. WHEN a trade already has analysis, THE System SHALL not re-analyze unless explicitly requested

---

### Requirement 1.2: Analysis Data Context

**User Story:** As a system, I want to provide GPT-4o with comprehensive trade context, so that the analysis is accurate and actionable.

#### Acceptance Criteria

1. WHEN preparing analysis context, THE System SHALL include entry price, exit price, and all target prices
2. WHEN preparing analysis context, THE System SHALL include technical indicators (RSI, MACD, EMA, Bollinger Bands, ATR)
3. WHEN preparing analysis context, THE System SHALL include market snapshot (price, volume, market cap, sentiment)
4. WHEN preparing analysis context, THE System SHALL include actual trade outcome (which TPs hit, SL hit, P/L)
5. WHEN preparing analysis context, THE System SHALL include trade duration and timeframe
6. WHEN preparing analysis context, THE System SHALL format data as structured JSON for GPT-4o
7. WHEN technical indicators are missing, THE System SHALL note this in the context

---

### Requirement 1.3: GPT-4o Analysis Generation

**User Story:** As a trader, I want concise, actionable analysis of my trade, so that I can learn from the outcome.

#### Acceptance Criteria

1. WHEN generating analysis, THE System SHALL use GPT-4o (not GPT-3.5)
2. WHEN generating analysis, THE System SHALL request 200-300 word responses
3. WHEN generating analysis, THE System SHALL request structured format (sections: Summary, Success Factors, Key Observations, Recommendations)
4. WHEN the trade was profitable, THE Analysis SHALL explain why it succeeded
5. WHEN the trade was unprofitable, THE Analysis SHALL explain why it failed
6. WHEN the trade expired without hitting targets, THE Analysis SHALL explain market conditions that prevented execution
7. WHEN generating analysis, THE System SHALL include confidence score (0-100%)
8. WHEN generating analysis, THE System SHALL complete within 5 seconds

---

### Requirement 1.4: Analysis Storage and Display

**User Story:** As a trader, I want to view AI analysis in the Trade Details modal, so that I can understand my trade outcomes.

#### Acceptance Criteria

1. WHEN storing analysis, THE System SHALL add `ai_analysis` column to `atge_trade_signals` table
2. WHEN storing analysis, THE System SHALL store analysis text, confidence score, and generation timestamp
3. WHEN displaying trade details, THE Modal SHALL show AI analysis section if available
4. WHEN displaying analysis, THE Modal SHALL show analysis text with proper formatting
5. WHEN displaying analysis, THE Modal SHALL show confidence score as percentage
6. WHEN displaying analysis, THE Modal SHALL show "Analysis in progress..." if not yet complete
7. WHEN analysis is unavailable, THE Modal SHALL show "Analysis not available" with explanation
8. WHEN displaying analysis, THE Modal SHALL use Bitcoin Sovereign styling (black background, orange accents)

---

### Requirement 1.5: Manual Analysis Trigger

**User Story:** As a trader, I want to manually request analysis for a trade, so that I can get fresh insights or re-analyze after learning more.

#### Acceptance Criteria

1. WHEN viewing trade details, THE Modal SHALL show "Analyze Trade" button
2. WHEN the button is clicked, THE System SHALL trigger GPT-4o analysis
3. WHEN analysis is in progress, THE Button SHALL show loading state
4. WHEN analysis completes, THE Modal SHALL update with new analysis
5. WHEN analysis fails, THE System SHALL show error message to user
6. WHEN a trade already has analysis, THE Button SHALL show "Re-analyze Trade"

---

## Phase 2: Vision-Enabled Chart Analysis

### Requirement 2.1: Chart Generation System

**User Story:** As a system, I want to generate price charts for trades, so that GPT-4o Vision can analyze visual patterns.

#### Acceptance Criteria

1. WHEN generating a chart, THE System SHALL use Chart.js server-side rendering
2. WHEN generating a chart, THE System SHALL include OHLCV candlesticks for the trade timeframe
3. WHEN generating a chart, THE System SHALL overlay entry price, TP1/2/3, and stop loss as horizontal lines
4. WHEN generating a chart, THE System SHALL mark when each target was hit with vertical lines
5. WHEN generating a chart, THE System SHALL include EMA 20, 50, 200 as colored lines
6. WHEN generating a chart, THE System SHALL include volume bars at the bottom
7. WHEN generating a chart, THE System SHALL use Bitcoin Sovereign color scheme (black background, orange accents)
8. WHEN generating a chart, THE System SHALL output as PNG image (1200x800px)
9. WHEN chart generation fails, THE System SHALL fall back to text-only analysis

---

### Requirement 2.2: Chart Storage and Management

**User Story:** As a system, I want to store generated charts efficiently, so that they can be displayed to users.

#### Acceptance Criteria

1. WHEN a chart is generated, THE System SHALL upload it to Vercel Blob storage
2. WHEN uploading a chart, THE System SHALL use filename format: `atge-chart-{tradeId}-{timestamp}.png`
3. WHEN uploading a chart, THE System SHALL set public read access
4. WHEN a chart is uploaded, THE System SHALL store the URL in `atge_trade_signals.chart_url`
5. WHEN a chart already exists for a trade, THE System SHALL overwrite it on re-analysis
6. WHEN displaying trade details, THE Modal SHALL show the chart image if available
7. WHEN chart storage fails, THE System SHALL log error and continue with text-only analysis

---

### Requirement 2.3: GPT-4o Vision Analysis

**User Story:** As a trader, I want AI to analyze the actual price chart, so that I get visual pattern insights.

#### Acceptance Criteria

1. WHEN chart is available, THE System SHALL use GPT-4o Vision API
2. WHEN calling Vision API, THE System SHALL send chart image + trade data context
3. WHEN calling Vision API, THE System SHALL request analysis of visual patterns
4. WHEN calling Vision API, THE System SHALL request identification of support/resistance levels
5. WHEN calling Vision API, THE System SHALL request candlestick pattern recognition
6. WHEN calling Vision API, THE System SHALL request volume pattern analysis
7. WHEN Vision analysis completes, THE System SHALL store it separately from text analysis
8. WHEN displaying analysis, THE Modal SHALL show both text and visual insights
9. WHEN Vision API fails, THE System SHALL fall back to text-only analysis

---

### Requirement 2.4: Visual Analysis Display

**User Story:** As a trader, I want to see the chart alongside AI visual analysis, so that I can verify the insights.

#### Acceptance Criteria

1. WHEN displaying visual analysis, THE Modal SHALL show chart image prominently
2. WHEN displaying visual analysis, THE Modal SHALL show visual insights below the chart
3. WHEN displaying visual analysis, THE Modal SHALL highlight identified patterns
4. WHEN displaying visual analysis, THE Modal SHALL show support/resistance levels mentioned
5. WHEN displaying visual analysis, THE Modal SHALL allow zooming the chart image
6. WHEN chart is not available, THE Modal SHALL show text-only analysis

---

## Phase 3: Real-Time Monitoring + Analysis

### Requirement 3.1: Real-Time Price Monitoring

**User Story:** As a system, I want to monitor trade prices in real-time, so that I can capture all significant events.

#### Acceptance Criteria

1. WHEN a trade is generated, THE System SHALL start real-time price monitoring
2. WHEN monitoring, THE System SHALL fetch price data every 1 minute for 15m timeframe trades
3. WHEN monitoring, THE System SHALL fetch price data every 5 minutes for 1h+ timeframe trades
4. WHEN monitoring, THE System SHALL check if TP1/2/3 or SL is hit
5. WHEN a target is hit, THE System SHALL log the event with exact timestamp and price
6. WHEN the trade timeframe expires, THE System SHALL stop monitoring
7. WHEN monitoring fails, THE System SHALL retry with exponential backoff
8. WHEN monitoring is stopped, THE System SHALL mark the trade as monitoring_complete

---

### Requirement 3.2: Trade Event Logging

**User Story:** As a system, I want to log all significant trade events, so that analysis can reference the complete timeline.

#### Acceptance Criteria

1. WHEN creating event log, THE System SHALL create `atge_trade_events` table
2. WHEN a target is hit, THE System SHALL log event type, timestamp, price, and context
3. WHEN price moves significantly (>1%), THE System SHALL log the movement
4. WHEN volume spikes (>50% increase), THE System SHALL log the spike
5. WHEN whale activity is detected, THE System SHALL log the transaction
6. WHEN sentiment changes significantly, THE System SHALL log the change
7. WHEN retrieving events, THE System SHALL return them in chronological order
8. WHEN displaying events, THE Modal SHALL show timeline visualization

---

### Requirement 3.3: Real-Time Analysis Generation

**User Story:** As a trader, I want AI analysis that includes the complete trade timeline, so that I understand the full story.

#### Acceptance Criteria

1. WHEN generating real-time analysis, THE System SHALL include all logged events
2. WHEN generating real-time analysis, THE System SHALL create timeline narrative
3. WHEN generating real-time analysis, THE System SHALL identify key turning points
4. WHEN generating real-time analysis, THE System SHALL explain why each target was/wasn't hit
5. WHEN generating real-time analysis, THE System SHALL note any unusual market activity
6. WHEN generating real-time analysis, THE System SHALL compare expected vs actual execution
7. WHEN generating real-time analysis, THE System SHALL provide 400-500 word detailed analysis

---

### Requirement 3.4: Real-Time Analysis Display

**User Story:** As a trader, I want to see a timeline of trade events with AI insights, so that I can understand the trade progression.

#### Acceptance Criteria

1. WHEN displaying real-time analysis, THE Modal SHALL show interactive timeline
2. WHEN displaying timeline, THE Modal SHALL mark entry, TP hits, SL hits, and expiry
3. WHEN displaying timeline, THE Modal SHALL show price at each event
4. WHEN displaying timeline, THE Modal SHALL show time elapsed from entry
5. WHEN displaying timeline, THE Modal SHALL highlight significant events (whale activity, volume spikes)
6. WHEN displaying timeline, THE Modal SHALL show AI commentary for each phase
7. WHEN user hovers over event, THE Modal SHALL show detailed context

---

## Phase 4: Batch Analysis with Pattern Recognition

### Requirement 4.1: Batch Analysis Trigger

**User Story:** As a trader, I want to analyze multiple trades at once, so that I can identify patterns in my trading.

#### Acceptance Criteria

1. WHEN user requests batch analysis, THE System SHALL accept trade count parameter (10, 20, 50, 100, all)
2. WHEN user requests batch analysis, THE System SHALL accept filter parameters (symbol, timeframe, date range)
3. WHEN batch analysis is triggered, THE System SHALL fetch matching trades from database
4. WHEN batch analysis is triggered, THE System SHALL analyze trades in batches of 10
5. WHEN batch analysis is in progress, THE System SHALL show progress indicator
6. WHEN batch analysis completes, THE System SHALL store aggregate insights
7. WHEN batch analysis fails, THE System SHALL retry failed batches

---

### Requirement 4.2: Pattern Recognition Analysis

**User Story:** As a trader, I want AI to identify success and failure patterns, so that I can improve my trading strategy.

#### Acceptance Criteria

1. WHEN analyzing batch, THE System SHALL identify common characteristics of winning trades
2. WHEN analyzing batch, THE System SHALL identify common characteristics of losing trades
3. WHEN analyzing batch, THE System SHALL calculate win rate for each pattern
4. WHEN analyzing batch, THE System SHALL identify optimal entry conditions
5. WHEN analyzing batch, THE System SHALL identify risk factors to avoid
6. WHEN analyzing batch, THE System SHALL provide statistical confidence for each pattern
7. WHEN analyzing batch, THE System SHALL rank patterns by predictive power

---

### Requirement 4.3: Aggregate Statistics

**User Story:** As a trader, I want comprehensive statistics across all my trades, so that I can measure my performance.

#### Acceptance Criteria

1. WHEN generating aggregate stats, THE System SHALL calculate overall win rate
2. WHEN generating aggregate stats, THE System SHALL calculate average profit per winning trade
3. WHEN generating aggregate stats, THE System SHALL calculate average loss per losing trade
4. WHEN generating aggregate stats, THE System SHALL calculate profit factor (total profit / total loss)
5. WHEN generating aggregate stats, THE System SHALL identify best performing symbol
6. WHEN generating aggregate stats, THE System SHALL identify best performing timeframe
7. WHEN generating aggregate stats, THE System SHALL identify best performing market conditions
8. WHEN generating aggregate stats, THE System SHALL show performance trends over time

---

### Requirement 4.4: Batch Analysis Display

**User Story:** As a trader, I want to view batch analysis results with clear visualizations, so that I can quickly understand patterns.

#### Acceptance Criteria

1. WHEN displaying batch analysis, THE System SHALL show aggregate statistics dashboard
2. WHEN displaying batch analysis, THE System SHALL show success pattern cards
3. WHEN displaying batch analysis, THE System SHALL show failure pattern cards
4. WHEN displaying batch analysis, THE System SHALL show performance charts (win rate over time, P/L distribution)
5. WHEN displaying batch analysis, THE System SHALL show top 5 best trades
6. WHEN displaying batch analysis, THE System SHALL show top 5 worst trades
7. WHEN displaying batch analysis, THE System SHALL allow filtering by pattern
8. WHEN displaying batch analysis, THE System SHALL allow exporting results as PDF

---

### Requirement 4.5: Actionable Recommendations

**User Story:** As a trader, I want specific recommendations based on my trading patterns, so that I can improve my results.

#### Acceptance Criteria

1. WHEN generating recommendations, THE System SHALL suggest optimal entry conditions
2. WHEN generating recommendations, THE System SHALL suggest conditions to avoid
3. WHEN generating recommendations, THE System SHALL suggest position sizing adjustments
4. WHEN generating recommendations, THE System SHALL suggest timeframe preferences
5. WHEN generating recommendations, THE System SHALL suggest risk management improvements
6. WHEN generating recommendations, THE System SHALL prioritize by potential impact
7. WHEN generating recommendations, THE System SHALL provide confidence score for each

---

## Cross-Phase Requirements

### Requirement 5.1: Cost Management

**User Story:** As a system administrator, I want to control AI analysis costs, so that the feature remains sustainable.

#### Acceptance Criteria

1. WHEN calling GPT-4o, THE System SHALL use gpt-4o model (not gpt-4-turbo)
2. WHEN calling GPT-4o, THE System SHALL set max_tokens to 500 for Phase 1
3. WHEN calling GPT-4o, THE System SHALL set max_tokens to 800 for Phase 2-3
4. WHEN calling GPT-4o, THE System SHALL set max_tokens to 1500 for Phase 4
5. WHEN calling GPT-4o, THE System SHALL implement rate limiting (max 100 analyses per hour)
6. WHEN calling GPT-4o, THE System SHALL cache analyses to avoid re-analysis
7. WHEN API costs exceed threshold, THE System SHALL alert administrators

---

### Requirement 5.2: Error Handling

**User Story:** As a system, I want robust error handling for AI analysis, so that failures don't impact user experience.

#### Acceptance Criteria

1. WHEN GPT-4o API fails, THE System SHALL retry up to 3 times with exponential backoff
2. WHEN all retries fail, THE System SHALL log error and continue without analysis
3. WHEN analysis times out (>30 seconds), THE System SHALL cancel and log timeout
4. WHEN invalid response is received, THE System SHALL log error and request re-analysis
5. WHEN rate limit is hit, THE System SHALL queue analysis for later processing
6. WHEN displaying errors to users, THE System SHALL show user-friendly messages
7. WHEN errors occur, THE System SHALL never block trade generation or backtesting

---

### Requirement 5.3: Performance Optimization

**User Story:** As a system, I want AI analysis to be fast and efficient, so that users get results quickly.

#### Acceptance Criteria

1. WHEN generating Phase 1 analysis, THE System SHALL complete within 5 seconds
2. WHEN generating Phase 2 analysis, THE System SHALL complete within 10 seconds
3. WHEN generating Phase 3 analysis, THE System SHALL complete within 15 seconds
4. WHEN generating Phase 4 analysis, THE System SHALL complete within 60 seconds
5. WHEN multiple analyses are requested, THE System SHALL process them in parallel (max 5 concurrent)
6. WHEN analysis is cached, THE System SHALL return results within 100ms
7. WHEN system is under load, THE System SHALL queue analyses and process in order

---

### Requirement 5.4: Database Schema Updates

**User Story:** As a developer, I want proper database schema for storing analyses, so that data is organized and queryable.

#### Acceptance Criteria

1. WHEN updating schema, THE System SHALL add `ai_analysis` TEXT column to `atge_trade_signals`
2. WHEN updating schema, THE System SHALL add `ai_analysis_confidence` INTEGER column
3. WHEN updating schema, THE System SHALL add `ai_analysis_generated_at` TIMESTAMPTZ column
4. WHEN updating schema, THE System SHALL add `chart_url` TEXT column
5. WHEN updating schema, THE System SHALL add `visual_analysis` TEXT column
6. WHEN updating schema, THE System SHALL create `atge_trade_events` table for Phase 3
7. WHEN updating schema, THE System SHALL create `atge_batch_analyses` table for Phase 4
8. WHEN updating schema, THE System SHALL create indexes for performance

---

## Success Criteria

The implementation is successful when:

### Phase 1 Success Criteria
- ✅ All completed trades automatically receive AI analysis
- ✅ Analysis appears in Trade Details modal within 5 seconds
- ✅ Analysis provides clear explanation of trade outcome
- ✅ Manual re-analysis works correctly
- ✅ Cost per analysis is under $0.02

### Phase 2 Success Criteria
- ✅ Charts are generated for all analyzed trades
- ✅ GPT-4o Vision provides visual pattern insights
- ✅ Charts display correctly in Trade Details modal
- ✅ Visual analysis completes within 10 seconds
- ✅ Cost per analysis is under $0.10

### Phase 3 Success Criteria
- ✅ Real-time monitoring captures all trade events
- ✅ Timeline visualization shows complete trade story
- ✅ Analysis includes event-by-event commentary
- ✅ Monitoring doesn't impact system performance
- ✅ Cost per analysis is under $0.05

### Phase 4 Success Criteria
- ✅ Batch analysis identifies clear success/failure patterns
- ✅ Aggregate statistics are accurate and comprehensive
- ✅ Recommendations are actionable and prioritized
- ✅ Batch analysis completes within 60 seconds for 20 trades
- ✅ Cost per batch analysis is under $0.10

### Overall Success Criteria
- ✅ No TypeScript errors
- ✅ No runtime errors or crashes
- ✅ All analyses stored correctly in database
- ✅ UI displays all analysis types correctly
- ✅ System handles errors gracefully
- ✅ Performance meets requirements
- ✅ Costs remain sustainable

---

## Technical Constraints

1. **API**: Must use OpenAI GPT-4o (not GPT-3.5 or GPT-4-turbo)
2. **Database**: Must use existing Supabase PostgreSQL database
3. **Storage**: Must use Vercel Blob for chart images
4. **Styling**: Must follow Bitcoin Sovereign design system (black, orange, white only)
5. **Performance**: Must not block trade generation or backtesting
6. **Cost**: Must keep total AI costs under $50/month for 1000 trades
7. **Compatibility**: Must work with existing ATGE backtesting system

---

## References

- Existing ATGE System: `.kiro/specs/atge-trade-details-fix/`
- OpenAI API Documentation: https://platform.openai.com/docs/api-reference
- GPT-4o Vision Guide: https://platform.openai.com/docs/guides/vision
- Chart.js Documentation: https://www.chartjs.org/docs/latest/
- Vercel Blob Documentation: https://vercel.com/docs/storage/vercel-blob
- Bitcoin Sovereign Design: `.kiro/steering/bitcoin-sovereign-design.md`
