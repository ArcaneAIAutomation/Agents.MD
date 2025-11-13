# ATGE Requirements Addendum - Technical Indicators & Data Quality Population

**Date**: January 28, 2025  
**Status**: 🔴 Critical - Data Not Populating  
**Priority**: P0 - Blocks User Experience

---

## Problem Statement

The Trade Details modal is displaying "N/A" and "Pending" values for critical fields that should show real data:

1. **Technical Indicators** - RSI, MACD, EMA 20 showing "N/A"
2. **Data Source** - Showing "Pending" instead of actual source
3. **Data Resolution** - Showing "Pending" instead of actual resolution
4. **Quality Score** - Showing "N/A" instead of calculated score

This creates a poor user experience and fails to demonstrate the comprehensive data analysis capabilities of the ATGE system.

---

## Enhanced Requirements

### Requirement 23: Technical Indicators - Complete Population and Display

**User Story:** As a trader, I want to see the exact technical indicator values that the AI used when generating the trade signal so that I can verify the analysis and understand the reasoning.

#### Acceptance Criteria

1. WHEN a trade signal is generated, THE System SHALL fetch current RSI (14-period) value from market data APIs
2. WHEN a trade signal is generated, THE System SHALL calculate MACD (12, 26, 9) values including signal line and histogram
3. WHEN a trade signal is generated, THE System SHALL calculate EMA 20, EMA 50, and EMA 200 values
4. WHEN a trade signal is generated, THE System SHALL calculate Bollinger Bands (20-period, 2 standard deviations)
5. WHEN a trade signal is generated, THE System SHALL calculate ATR (14-period) for volatility assessment
6. WHEN a trade signal is generated, THE System SHALL calculate volume SMA ratio (current volume / 20-period SMA)
7. WHEN a trade signal is generated, THE System SHALL store ALL technical indicators in the `trade_technical_indicators` table
8. WHEN a trade signal is generated, THE System SHALL link technical indicators to the trade signal via `trade_signal_id` foreign key
9. WHEN displaying the Trade Details modal, THE System SHALL retrieve technical indicators from the database
10. WHEN displaying the Trade Details modal, THE System SHALL show RSI value with color coding (>70 red, <30 green, 30-70 yellow)
11. WHEN displaying the Trade Details modal, THE System SHALL show MACD value, signal line, and histogram
12. WHEN displaying the Trade Details modal, THE System SHALL show EMA 20 value with comparison to current price
13. WHEN displaying the Trade Details modal, THE System SHALL show Bollinger Band position (upper, middle, lower)
14. WHEN displaying the Trade Details modal, THE System SHALL show ATR value for volatility context
15. WHEN technical indicators are unavailable, THE System SHALL display "Data Unavailable" with explanation instead of "N/A"

**Technical Implementation Notes:**
- Use TradingView's technical analysis library or calculate manually
- Fetch OHLCV data from CoinMarketCap/CoinGecko for calculations
- Store raw values with 4-8 decimal precision
- Cache calculations for 60 seconds to reduce API calls

---

### Requirement 24: Data Source Attribution - Complete Transparency

**User Story:** As a trader, I want to know exactly which data source was used for backtesting so that I can verify the accuracy and reliability of the results.

#### Acceptance Criteria

1. WHEN generating a trade signal, THE System SHALL record the primary data source used (CoinMarketCap, CoinGecko, or Kraken)
2. WHEN generating a trade signal, THE System SHALL record the data resolution used (1-minute, 5-minute, or 1-hour)
3. WHEN backtesting a trade, THE System SHALL record the data source used for historical price data
4. WHEN backtesting a trade, THE System SHALL record the data resolution used for backtesting
5. WHEN backtesting a trade, THE System SHALL store data source and resolution in the `trade_results` table
6. WHEN displaying the Trade Details modal, THE System SHALL show the exact data source name (e.g., "CoinMarketCap API")
7. WHEN displaying the Trade Details modal, THE System SHALL show the exact data resolution (e.g., "1-minute intervals")
8. WHEN displaying the Trade Details modal, THE System SHALL show a timestamp of when data was last updated
9. WHEN multiple data sources are used, THE System SHALL list all sources with their respective contributions
10. WHEN a fallback data source is used, THE System SHALL clearly indicate this with a note

**Technical Implementation Notes:**
- Add `data_source` VARCHAR(50) column to `trade_market_snapshot` table
- Add `data_resolution` VARCHAR(20) column to `trade_market_snapshot` table
- Add `data_last_updated` TIMESTAMP column to `trade_market_snapshot` table
- Update API integration to track and store source information

---

### Requirement 25: Data Quality Scoring - Automated Assessment

**User Story:** As a trader, I want to see a quality score for the data used in backtesting so that I can assess the reliability of the trade results.

#### Acceptance Criteria

1. WHEN backtesting a trade, THE System SHALL calculate a data quality score (0-100%)
2. WHEN calculating quality score, THE System SHALL award 40 points for using 1-minute resolution data
3. WHEN calculating quality score, THE System SHALL award 30 points for using 5-minute resolution data
4. WHEN calculating quality score, THE System SHALL award 20 points for using 1-hour resolution data
5. WHEN calculating quality score, THE System SHALL award 30 points for complete data coverage (no gaps)
6. WHEN calculating quality score, THE System SHALL deduct 10 points for each data gap detected
7. WHEN calculating quality score, THE System SHALL award 20 points for using primary data source (CoinMarketCap)
8. WHEN calculating quality score, THE System SHALL award 15 points for using secondary source (CoinGecko)
9. WHEN calculating quality score, THE System SHALL award 10 points for data freshness (<5 minutes old)
10. WHEN calculating quality score, THE System SHALL store the score in the `trade_results` table
11. WHEN displaying the Trade Details modal, THE System SHALL show the quality score with color coding (>90 green, 70-90 yellow, <70 red)
12. WHEN displaying the Trade Details modal, THE System SHALL show a breakdown of quality score components
13. WHEN quality score is below 70%, THE System SHALL display a warning about data reliability
14. WHEN quality score is below 50%, THE System SHALL mark the trade result as "Low Confidence"
15. WHEN displaying aggregate statistics, THE System SHALL exclude trades with quality scores below 50%

**Quality Score Formula:**
```
Quality Score = 
  Resolution Score (40 max) +
  Coverage Score (30 max) +
  Source Score (20 max) +
  Freshness Score (10 max)
```

**Technical Implementation Notes:**
- Add `data_quality_score` INTEGER column to `trade_results` table
- Add `data_quality_breakdown` JSONB column to store component scores
- Implement quality scoring function in backtesting service
- Update UI to display quality score with visual indicators

---

### Requirement 26: API Integration - Technical Indicators Fetching

**User Story:** As a system, I want to fetch technical indicators from reliable sources so that trade signals are based on accurate, real-time data.

#### Acceptance Criteria

1. WHEN generating a trade signal, THE System SHALL fetch OHLCV data from CoinMarketCap API (primary)
2. WHEN CoinMarketCap API fails, THE System SHALL fallback to CoinGecko API
3. WHEN CoinGecko API fails, THE System SHALL fallback to Kraken API
4. WHEN fetching OHLCV data, THE System SHALL request at least 200 data points for indicator calculations
5. WHEN fetching OHLCV data, THE System SHALL use 1-minute resolution for maximum accuracy
6. WHEN calculating RSI, THE System SHALL use the standard 14-period formula
7. WHEN calculating MACD, THE System SHALL use 12-period fast EMA, 26-period slow EMA, and 9-period signal line
8. WHEN calculating EMAs, THE System SHALL use 20, 50, and 200 periods
9. WHEN calculating Bollinger Bands, THE System SHALL use 20-period SMA with 2 standard deviations
10. WHEN calculating ATR, THE System SHALL use 14-period true range
11. WHEN API rate limits are reached, THE System SHALL queue requests and retry with exponential backoff
12. WHEN calculations fail, THE System SHALL log detailed error information for debugging
13. WHEN calculations fail, THE System SHALL display "Calculation Error" instead of "N/A"
14. WHEN calculations succeed, THE System SHALL cache results for 60 seconds
15. WHEN displaying indicators, THE System SHALL show calculation timestamp

**Technical Implementation Notes:**
- Create `lib/atge/technicalIndicators.ts` module
- Implement indicator calculation functions
- Add error handling and fallback logic
- Integrate with existing API clients
- Add caching layer for performance

---

### Requirement 27: Database Schema Enhancement - Missing Columns

**User Story:** As a system, I want to store all necessary data fields so that the Trade Details modal can display complete information.

#### Acceptance Criteria

1. WHEN the database is initialized, THE System SHALL ensure `trade_market_snapshot` table has `data_source` column
2. WHEN the database is initialized, THE System SHALL ensure `trade_market_snapshot` table has `data_resolution` column
3. WHEN the database is initialized, THE System SHALL ensure `trade_market_snapshot` table has `data_last_updated` column
4. WHEN the database is initialized, THE System SHALL ensure `trade_results` table has `data_quality_score` column
5. WHEN the database is initialized, THE System SHALL ensure `trade_results` table has `data_quality_breakdown` column
6. WHEN the database is initialized, THE System SHALL ensure `trade_technical_indicators` table has all required columns
7. WHEN a trade signal is generated, THE System SHALL populate ALL columns in `trade_technical_indicators` table
8. WHEN a trade signal is generated, THE System SHALL populate ALL columns in `trade_market_snapshot` table
9. WHEN backtesting completes, THE System SHALL populate ALL columns in `trade_results` table
10. WHEN querying trade data, THE System SHALL join all related tables to retrieve complete information

**Database Migration Required:**
```sql
-- Add missing columns to trade_market_snapshot
ALTER TABLE trade_market_snapshot 
ADD COLUMN IF NOT EXISTS data_source VARCHAR(50),
ADD COLUMN IF NOT EXISTS data_resolution VARCHAR(20),
ADD COLUMN IF NOT EXISTS data_last_updated TIMESTAMP WITH TIME ZONE;

-- Add missing columns to trade_results
ALTER TABLE trade_results 
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER,
ADD COLUMN IF NOT EXISTS data_quality_breakdown JSONB;

-- Ensure trade_technical_indicators has all columns
-- (Already defined in schema, verify existence)
```

---

### Requirement 28: UI Enhancement - Real-Time Data Display

**User Story:** As a trader, I want to see technical indicators and data quality information immediately when viewing trade details so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN opening the Trade Details modal, THE System SHALL fetch complete trade data including technical indicators
2. WHEN opening the Trade Details modal, THE System SHALL display a loading state while fetching data
3. WHEN technical indicators are loaded, THE System SHALL display RSI with color-coded background
4. WHEN technical indicators are loaded, THE System SHALL display MACD with signal line comparison
5. WHEN technical indicators are loaded, THE System SHALL display EMA 20 with trend indicator
6. WHEN technical indicators are loaded, THE System SHALL display Bollinger Band position
7. WHEN technical indicators are loaded, THE System SHALL display ATR with volatility assessment
8. WHEN data source is loaded, THE System SHALL display the exact source name with logo/icon
9. WHEN data resolution is loaded, THE System SHALL display the resolution with explanation
10. WHEN quality score is loaded, THE System SHALL display the score with color-coded badge
11. WHEN quality score is below 90%, THE System SHALL display a breakdown of score components
12. WHEN any data is unavailable, THE System SHALL display "Data Unavailable" with reason
13. WHEN data fails to load, THE System SHALL display an error message with retry button
14. WHEN data is stale (>5 minutes old), THE System SHALL display a "Refresh" button
15. WHEN user clicks "Refresh", THE System SHALL re-fetch all data and update the display

**UI Component Updates Required:**
- Update `TradeDetailModal.tsx` to fetch and display technical indicators
- Add loading states for each data section
- Add error states with retry functionality
- Add color-coded badges for quality scores
- Add tooltips explaining each indicator

---

## Implementation Priority

### Phase 1: Database & API Integration (P0 - Critical)
1. Add missing database columns (30 minutes)
2. Implement technical indicator calculation functions (2 hours)
3. Integrate indicator fetching into trade generation (1 hour)
4. Store indicators in database during trade generation (1 hour)

### Phase 2: Data Quality Scoring (P1 - High)
1. Implement quality scoring algorithm (1 hour)
2. Calculate and store quality scores during backtesting (1 hour)
3. Add data source and resolution tracking (30 minutes)

### Phase 3: UI Enhancement (P1 - High)
1. Update TradeDetailModal to fetch technical indicators (1 hour)
2. Add loading and error states (30 minutes)
3. Display technical indicators with color coding (1 hour)
4. Display data source and quality information (30 minutes)

### Phase 4: Testing & Validation (P2 - Medium)
1. Test indicator calculations against known values (1 hour)
2. Test data quality scoring (30 minutes)
3. Test UI display with various data states (1 hour)
4. End-to-end testing (1 hour)

**Total Estimated Time**: 12-14 hours

---

## Success Criteria

### ✅ Definition of Done

1. **Technical Indicators Section**
   - RSI displays actual value with color coding
   - MACD displays actual value with signal line
   - EMA 20 displays actual value with trend indicator
   - All indicators show calculation timestamp

2. **Data Source & Quality Section**
   - Data Source shows actual API name (e.g., "CoinMarketCap API")
   - Data Resolution shows actual resolution (e.g., "1-minute intervals")
   - Quality Score shows calculated score with color-coded badge
   - Quality breakdown available on hover/click

3. **Database**
   - All technical indicators stored in `trade_technical_indicators` table
   - Data source and resolution stored in `trade_market_snapshot` table
   - Quality score stored in `trade_results` table
   - No NULL values for required fields

4. **User Experience**
   - No "N/A" or "Pending" placeholders visible
   - Loading states show while fetching data
   - Error states provide clear feedback and retry options
   - All data displays within 2 seconds of modal opening

---

## Testing Plan

### Unit Tests
- Test technical indicator calculation functions
- Test quality score calculation algorithm
- Test data source tracking logic

### Integration Tests
- Test API integration for fetching OHLCV data
- Test database storage of technical indicators
- Test database retrieval for Trade Details modal

### End-to-End Tests
1. Generate a new trade signal
2. Verify technical indicators are calculated and stored
3. Open Trade Details modal
4. Verify all fields display real data (no "N/A" or "Pending")
5. Verify quality score is calculated and displayed
6. Verify data source and resolution are shown

### Manual Testing Checklist
- [ ] Generate trade signal and verify indicators in database
- [ ] Open Trade Details modal and verify all fields populated
- [ ] Test with different data sources (CMC, CoinGecko, Kraken)
- [ ] Test with different data resolutions (1m, 5m, 1h)
- [ ] Test error states (API failure, missing data)
- [ ] Test loading states (slow network)
- [ ] Test quality score display with various scores
- [ ] Test mobile responsiveness

---

## Risk Mitigation

### Potential Issues

1. **API Rate Limits**
   - Risk: Fetching OHLCV data for indicator calculations may hit rate limits
   - Mitigation: Implement caching (60 seconds), use fallback APIs, queue requests

2. **Calculation Performance**
   - Risk: Calculating indicators for 200+ data points may be slow
   - Mitigation: Use efficient algorithms, cache results, calculate asynchronously

3. **Data Gaps**
   - Risk: Historical data may have gaps affecting indicator accuracy
   - Mitigation: Detect gaps, interpolate if necessary, mark quality score accordingly

4. **Database Performance**
   - Risk: Storing large amounts of technical indicator data may slow queries
   - Mitigation: Add indexes on foreign keys, use pagination, optimize queries

---

## Documentation Updates Required

1. Update API documentation with technical indicator endpoints
2. Update database schema documentation with new columns
3. Update user guide with explanation of technical indicators
4. Update developer guide with indicator calculation formulas
5. Create troubleshooting guide for data quality issues

---

**Status**: 📋 Ready for Implementation  
**Next Step**: Begin Phase 1 - Database & API Integration  
**Owner**: Development Team  
**Reviewer**: Product Owner

