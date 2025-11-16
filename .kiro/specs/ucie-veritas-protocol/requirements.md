# UCIE Veritas Protocol - Requirements Document

## Introduction

The **Veritas Protocol** is a revolutionary data integrity and cross-validation system for the Universal Crypto Intelligence Engine (UCIE). It transforms UCIE from a data aggregation platform into an institutional-grade analysis engine that prioritizes truth and logical consistency above all else.

The Veritas Protocol operates on a fundamental principle: **TRUTH BEFORE ANALYSIS**. Never analyze data you have not first validated. This system implements rigorous cross-validation checks, logical consistency tests, and transparent discrepancy reporting to ensure that every analysis is built on a foundation of verified, coherent data.

## Glossary

- **Veritas Protocol**: The complete data integrity and validation system
- **Data Integrity Check**: Automated validation of data consistency and logical coherence
- **Cross-Validation**: Comparing data from multiple independent sources to verify accuracy
- **Logical Impossibility**: A data state that violates fundamental logic (e.g., volume exists but no transactions)
- **Discrepancy Alert**: A warning when data sources conflict or logical checks fail
- **Triangulation**: Confirming a data point through multiple independent sources
- **Correlation Check**: Verifying that related data streams show expected relationships
- **Data Quality Score**: A 0-100 metric indicating the reliability of the analysis
- **Veritas Confidence Score**: Final confidence rating based on data quality and consistency
- **Market-to-Chain Consistency**: Verification that market data aligns with on-chain activity
- **Sentiment Consistency**: Verification that social sentiment aligns with actual social activity
- **Fatal Data Error**: A critical inconsistency that prevents reliable analysis
- **Backward Compatibility**: Ensuring existing UCIE components continue to function without modification
- **Non-Breaking Enhancement**: Adding validation layer without disrupting current data flow
- **Validation Layer**: New middleware that wraps existing data fetching without replacing it

## Core Principles

### Backward Compatibility Guarantee

**CRITICAL**: The Veritas Protocol MUST be implemented as a non-breaking enhancement layer that:
- Does NOT modify existing UCIE components unless to improve them
- Does NOT break current data fetching or API endpoints
- Does NOT require changes to existing UI components
- DOES add validation middleware that wraps existing functionality
- DOES enhance data quality without disrupting current workflows
- DOES provide opt-in validation features that can be gradually adopted

All existing UCIE functionality (market data, social sentiment, on-chain analytics, technical analysis, predictions, risk assessment, derivatives, DeFi metrics) MUST continue to work exactly as before, with Veritas Protocol adding an optional validation layer on top.

## Requirements

### Requirement 1: Market Data Cross-Validation

**User Story:** As an institutional investor, I want market data validated across multiple sources, so that I can trust the price and volume data used in my analysis.

#### Acceptance Criteria

1. WHEN market data is requested, THE UCIE SHALL query at least 3 independent sources (CoinMarketCap, CoinGecko, Kraken) within 2 seconds
2. WHEN price differences exceed 1.5% between sources, THE UCIE SHALL declare a "Market Data Discrepancy Alert" and use Kraken as tie-breaker
3. WHEN volume differences exceed 10% between sources, THE UCIE SHALL flag the discrepancy and report which sources are misaligned
4. WHEN data sources agree within tolerance, THE UCIE SHALL create a verified, averaged market data object with 99.9% confidence
5. THE UCIE SHALL display data source attribution for every market metric showing which APIs provided the data

### Requirement 2: Social Sentiment Validation

**User Story:** As a trader, I want social sentiment data validated for logical consistency, so that I don't make decisions based on contradictory or impossible metrics.

#### Acceptance Criteria

1. WHEN social sentiment is fetched, THE UCIE SHALL query LunarCrush API for sentiment score, galaxy score, and 24h mention count
2. WHEN social sentiment is fetched, THE UCIE SHALL query Reddit API for top 10 posts from r/Bitcoin and r/CryptoCurrency
3. IF LunarCrush mention_count equals 0 BUT sentiment_distribution contains non-zero values, THE UCIE SHALL declare a "Fatal Social Data Error" and discard social data
4. WHEN Reddit sentiment contradicts LunarCrush sentiment by more than 30 points, THE UCIE SHALL declare a "Social Sentiment Mismatch Alert" and report both findings
5. THE UCIE SHALL use GPT-4o to perform sentiment analysis on Reddit post titles and compare against LunarCrush score with 85% accuracy

### Requirement 3: Blockchain Intelligence Validation

**User Story:** As a whale watcher, I want on-chain data validated against market activity, so that I can trust whale accumulation and distribution signals.

#### Acceptance Criteria

1. WHEN on-chain data is requested, THE UCIE SHALL query Blockchain.com API for hash rate, mempool size, and large transactions (>$1M) in last 24 hours
2. THE UCIE SHALL categorize each large transaction as exchange deposit (inflow), withdrawal (outflow), or peer-to-peer transfer
3. IF 24h market volume exceeds $20B AND calculated exchange flows equal 0, THE UCIE SHALL declare a "Fatal On-Chain Data Error" and flag data as unreliable
4. THE UCIE SHALL compare verified 24h volume from market data to on-chain exchange flows and calculate consistency score (0-100)
5. WHEN on-chain data passes validation, THE UCIE SHALL generate accumulation/distribution signals with confidence scores above 80%

### Requirement 4: News Sentiment Correlation

**User Story:** As a news trader, I want news sentiment validated against price action and on-chain activity, so that I can identify genuine market-moving events versus noise.

#### Acceptance Criteria

1. WHEN news is aggregated, THE UCIE SHALL fetch top 20 headlines from NewsAPI in last 24 hours
2. THE UCIE SHALL use GPT-4o to classify each headline as Bullish, Bearish, or Neutral with confidence scores
3. WHEN news is overwhelmingly bearish (>70% bearish) BUT on-chain shows heavy accumulation, THE UCIE SHALL highlight the divergence as primary finding
4. WHEN news is overwhelmingly bullish (>70% bullish) BUT on-chain shows heavy distribution, THE UCIE SHALL highlight the divergence as primary finding
5. THE UCIE SHALL generate a dominant market narrative summary explaining the relationship between news, sentiment, and on-chain activity

### Requirement 5: Data Quality Summary

**User Story:** As a risk manager, I want a clear data quality summary at the start of every analysis, so that I know which data sources are reliable and which failed validation.

#### Acceptance Criteria

1. WHEN analysis begins, THE UCIE SHALL execute all validation checks before generating any analysis
2. THE UCIE SHALL generate a Data Quality Summary listing all alerts and errors found during validation
3. THE UCIE SHALL explicitly state which data sources were discarded due to contradictory metrics or fatal errors
4. THE UCIE SHALL calculate an overall Data Quality Score (0-100) based on percentage of data that passed validation
5. WHEN Data Quality Score is below 70%, THE UCIE SHALL display a prominent warning that analysis reliability is compromised

### Requirement 6: Coherent Narrative Synthesis

**User Story:** As an analyst, I want the AI to synthesize a coherent narrative connecting all validated data, so that I can understand the complete market picture.

#### Acceptance Criteria

1. WHEN all data is validated, THE UCIE SHALL feed validated data into GPT-4o for final synthesis
2. THE UCIE SHALL connect validated market, social, news, and on-chain data into a coherent narrative
3. WHEN data sources contradict, THE UCIE SHALL highlight the contradiction as the main story rather than inventing a bridge
4. THE UCIE SHALL derive technical analysis, risk assessments, and trading implications ONLY from data that passed validation
5. THE UCIE SHALL explicitly state when certain analysis types are unavailable due to discarded data (e.g., "On-chain data was discarded, therefore no whale accumulation claims can be made")

### Requirement 7: No Hallucination Policy

**User Story:** As a professional trader, I want the AI to never make claims about data that was discarded or unavailable, so that I can trust every statement in the analysis.

#### Acceptance Criteria

1. IF on-chain data was discarded, THE UCIE SHALL be forbidden from making any claims about whale accumulation or selling pressure
2. IF social data was discarded, THE UCIE SHALL be forbidden from commenting on community engagement or social sentiment
3. IF market data was discarded, THE UCIE SHALL be forbidden from making price predictions or technical analysis
4. THE UCIE SHALL explicitly state "Data unavailable" or "Data unreliable" for any metric that failed validation
5. THE UCIE SHALL never fill gaps with assumptions or invented narratives when data is missing

### Requirement 8: Veritas Confidence Score

**User Story:** As an investor, I want a single confidence score that tells me how reliable the entire analysis is, so that I can weight my decisions accordingly.

#### Acceptance Criteria

1. WHEN analysis completes, THE UCIE SHALL calculate a Veritas Confidence Score (0-100) based on data quality and consistency
2. THE UCIE SHALL weight the confidence score based on: data source agreement (40%), logical consistency (30%), cross-validation success (20%), and completeness (10%)
3. THE UCIE SHALL display the Veritas Confidence Score prominently at the top of the analysis
4. WHEN Veritas Confidence Score is below 60%, THE UCIE SHALL recommend against making trading decisions based on the analysis
5. THE UCIE SHALL provide a breakdown explaining which factors contributed to the confidence score

### Requirement 9: Triangulation Requirement

**User Story:** As a data scientist, I want every critical data point confirmed by multiple sources, so that I know trends are real and not artifacts of a single API.

#### Acceptance Criteria

1. THE UCIE SHALL require at least 2 independent sources to confirm any price trend before declaring it valid
2. THE UCIE SHALL require at least 2 independent sources to confirm any sentiment trend before declaring it valid
3. THE UCIE SHALL require at least 2 independent sources to confirm any on-chain trend before declaring it valid
4. WHEN only 1 source is available for a metric, THE UCIE SHALL label it as "Single Source - Unconfirmed" with reduced confidence
5. THE UCIE SHALL prioritize multi-source confirmed data over single-source data in all analysis and recommendations

### Requirement 10: Transparent Discrepancy Reporting

**User Story:** As a compliance officer, I want all data discrepancies reported transparently, so that I can audit the analysis process and understand data quality issues.

#### Acceptance Criteria

1. WHEN any validation check fails, THE UCIE SHALL log the discrepancy with timestamp, data sources involved, and specific values
2. THE UCIE SHALL display all discrepancies in a dedicated "Data Quality Report" section of the analysis
3. THE UCIE SHALL categorize discrepancies by severity: Info, Warning, Error, Fatal
4. THE UCIE SHALL provide recommendations for each discrepancy (e.g., "Wait for data refresh", "Use alternative source", "Discard analysis")
5. THE UCIE SHALL maintain a historical log of discrepancies to identify problematic data sources over time

### Requirement 11: Automated Validation Workflow

**User Story:** As a system administrator, I want the validation workflow to execute automatically in the correct order, so that no analysis is generated without proper validation.

#### Acceptance Criteria

1. THE UCIE SHALL execute validation steps in strict order: Market Data → Social Sentiment → Blockchain Intelligence → News Analysis → Final Synthesis
2. THE UCIE SHALL not proceed to the next step until the current step's validation is complete
3. THE UCIE SHALL halt the entire analysis if a Fatal Data Error is encountered and cannot be resolved
4. THE UCIE SHALL provide real-time progress updates showing which validation step is currently executing
5. THE UCIE SHALL complete the entire validation workflow within 15 seconds under normal conditions

### Requirement 16: Backward Compatibility and Non-Breaking Implementation

**User Story:** As a UCIE user, I want the Veritas Protocol to enhance my analysis without breaking any existing features, so that I can continue using UCIE while benefiting from improved data quality.

#### Acceptance Criteria

1. THE UCIE SHALL implement Veritas Protocol as a validation middleware layer that wraps existing data fetching functions without modifying them
2. THE UCIE SHALL ensure all existing API endpoints (`/api/ucie/market-data`, `/api/ucie/sentiment`, etc.) continue to return data in the same format
3. THE UCIE SHALL add new optional fields to API responses (e.g., `veritasValidation`, `dataQualityScore`) without removing or changing existing fields
4. THE UCIE SHALL allow existing UI components to function without modification while optionally displaying validation results if present
5. THE UCIE SHALL provide a feature flag (`ENABLE_VERITAS_PROTOCOL`) to enable/disable validation without code changes

### Requirement 17: Graceful Degradation

**User Story:** As a developer, I want the Veritas Protocol to degrade gracefully if validation fails, so that users still receive analysis even if validation cannot be completed.

#### Acceptance Criteria

1. WHEN validation checks fail due to API errors or timeouts, THE UCIE SHALL continue with existing data fetching behavior
2. THE UCIE SHALL log validation failures without blocking the analysis pipeline
3. THE UCIE SHALL display a warning "Veritas Protocol validation unavailable" when validation cannot be performed
4. THE UCIE SHALL fall back to existing UCIE behavior (no validation) if Veritas Protocol encounters critical errors
5. THE UCIE SHALL ensure that validation failures never cause the entire analysis to fail or return errors to users

### Requirement 12: Impossibility Detection

**User Story:** As a quantitative analyst, I want the system to detect logical impossibilities in the data, so that I don't waste time analyzing nonsensical data.

#### Acceptance Criteria

1. THE UCIE SHALL detect when trading volume exists but no transactions are recorded (impossibility)
2. THE UCIE SHALL detect when social mentions are zero but sentiment distribution is non-zero (impossibility)
3. THE UCIE SHALL detect when market cap is calculated but circulating supply is zero (impossibility)
4. THE UCIE SHALL detect when exchange flows are zero but trading volume is massive (impossibility)
5. WHEN any impossibility is detected, THE UCIE SHALL immediately flag it as a Fatal Data Error and discard the affected data stream

### Requirement 13: Correlation Verification

**User Story:** As a market analyst, I want the system to verify that related data streams show expected correlations, so that I can trust the data is internally consistent.

#### Acceptance Criteria

1. WHEN major bearish news is detected, THE UCIE SHALL verify that on-chain activity shows corresponding patterns (increased exchange deposits or decreased withdrawals)
2. WHEN major bullish news is detected, THE UCIE SHALL verify that on-chain activity shows corresponding patterns (decreased exchange deposits or increased withdrawals)
3. WHEN social sentiment is extremely bullish, THE UCIE SHALL verify that trading volume and price action show corresponding increases
4. WHEN social sentiment is extremely bearish, THE UCIE SHALL verify that trading volume shows corresponding patterns
5. WHEN correlations are absent or inverted, THE UCIE SHALL highlight this as a key finding requiring explanation

### Requirement 14: Source Reliability Tracking

**User Story:** As a data engineer, I want the system to track which data sources are most reliable over time, so that we can prioritize trustworthy sources.

#### Acceptance Criteria

1. THE UCIE SHALL maintain a reliability score (0-100) for each data source based on historical validation success rate
2. THE UCIE SHALL track how often each source agrees with consensus vs. provides outlier data
3. THE UCIE SHALL automatically deprioritize sources with reliability scores below 70%
4. THE UCIE SHALL display source reliability scores in the Data Quality Report
5. THE UCIE SHALL recommend removing or replacing sources with reliability scores below 50% after 30 days

### Requirement 15: Cautious Implications

**User Story:** As a conservative investor, I want the system to derive implications cautiously, only from validated data, so that I don't receive overly confident predictions based on shaky data.

#### Acceptance Criteria

1. THE UCIE SHALL generate technical analysis ONLY when market data passes validation with 80%+ confidence
2. THE UCIE SHALL generate risk assessments ONLY when volatility and correlation data passes validation with 80%+ confidence
3. THE UCIE SHALL generate trading implications ONLY when at least 3 of 4 data streams (market, social, on-chain, news) pass validation
4. THE UCIE SHALL reduce confidence scores by 20% for every data stream that fails validation
5. THE UCIE SHALL explicitly state the limitations of any implications due to missing or unreliable data

---

## Implementation Priority

**Phase 1 (Critical - Week 1-2):**
- Requirement 16: Backward compatibility and non-breaking implementation (MUST BE FIRST)
- Requirement 17: Graceful degradation
- Requirements 1, 2, 3: Core data validation for market, social, and on-chain data
- Requirement 11: Automated validation workflow
- Requirement 12: Impossibility detection

**Phase 2 (High Priority - Week 3-4):**
- Requirement 5: Data Quality Summary
- Requirement 8: Veritas Confidence Score
- Requirement 10: Transparent discrepancy reporting

**Phase 3 (Medium Priority - Week 5-6):**
- Requirement 4: News sentiment correlation
- Requirement 6: Coherent narrative synthesis
- Requirement 7: No hallucination policy

**Phase 4 (Enhancement - Week 7-8):**
- Requirement 9: Triangulation requirement
- Requirement 13: Correlation verification
- Requirement 14: Source reliability tracking
- Requirement 15: Cautious implications

---

## Non-Breaking Implementation Strategy

The Veritas Protocol will be implemented using the following non-breaking approach:

1. **Validation Middleware Layer**: Create new validation utilities in `lib/ucie/veritas/` that wrap existing data fetching functions
2. **Optional API Response Fields**: Add new fields to API responses without modifying existing fields
3. **Feature Flag**: Use `ENABLE_VERITAS_PROTOCOL` environment variable to enable/disable validation
4. **Backward Compatible UI**: Existing UI components work without changes; new validation UI is optional
5. **Graceful Fallback**: If validation fails, system falls back to existing UCIE behavior

**Example Implementation Pattern:**
```typescript
// Existing function continues to work
async function fetchMarketData(symbol: string) {
  // ... existing code unchanged
}

// New validation wrapper (optional)
async function fetchMarketDataWithVeritas(symbol: string) {
  const data = await fetchMarketData(symbol); // Use existing function
  
  if (process.env.ENABLE_VERITAS_PROTOCOL === 'true') {
    const validation = await validateMarketData(data); // Add validation
    return { ...data, veritasValidation: validation }; // Add optional field
  }
  
  return data; // Return existing format if validation disabled
}
```

---

**Total Requirements**: 17 major requirements with 85 acceptance criteria
**Complexity Level**: HIGH - Requires sophisticated validation logic and AI integration
**Estimated Development Time**: 8 weeks for full implementation
**Priority**: CRITICAL - This transforms UCIE into an institutional-grade platform
**Innovation Level**: Revolutionary - No other crypto analysis platform has this level of data integrity validation
**Backward Compatibility**: GUARANTEED - All existing UCIE features continue to work without modification

