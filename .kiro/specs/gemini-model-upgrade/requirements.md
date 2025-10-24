# Gemini Model Upgrade - Requirements Document

## Introduction

Upgrade the Whale Watch Gemini AI integration from the experimental `gemini-2.0-flash-exp` model to the latest stable Gemini 2.5 models with enhanced capabilities including thinking mode, structured outputs, and improved reasoning.

## Glossary

- **Gemini API**: Google's generative AI API for text generation and analysis
- **Whale Watch**: Bitcoin whale transaction tracking and analysis feature
- **Thinking Mode**: Advanced reasoning capability where the model shows its thought process
- **Structured Outputs**: JSON schema validation for consistent response formats
- **Token Context**: Maximum input/output token limits for the model

## Requirements

### Requirement 1: Model Selection and Configuration

**User Story:** As a platform administrator, I want to use the latest stable Gemini models so that we have access to the most advanced AI capabilities and avoid deprecated experimental models.

#### Acceptance Criteria

1. WHEN the system initializes the Gemini API client, THE System SHALL use `gemini-2.5-flash` as the primary model
2. WHERE advanced reasoning is required, THE System SHALL support `gemini-2.5-pro` as an optional upgrade
3. THE System SHALL configure the model with a 1,048,576 token input limit
4. THE System SHALL configure the model with a 65,536 token output limit
5. THE System SHALL remove references to deprecated `gemini-2.0-flash-exp` model

### Requirement 2: Thinking Mode Integration

**User Story:** As a trader, I want to see the AI's reasoning process so that I can understand how it arrived at its analysis conclusions.

#### Acceptance Criteria

1. WHEN requesting whale transaction analysis, THE System SHALL enable thinking mode in the API request
2. WHEN the analysis completes, THE System SHALL extract and display the thinking process separately from the final analysis
3. THE System SHALL present the thinking process in a collapsible section labeled "AI Reasoning Process"
4. THE System SHALL style the thinking section with Bitcoin Sovereign design (orange borders, black background)
5. WHERE thinking content exceeds 500 characters, THE System SHALL truncate with "Show More" expansion

### Requirement 3: Structured Output Validation

**User Story:** As a developer, I want guaranteed JSON schema compliance so that the API responses are always parseable and consistent.

#### Acceptance Criteria

1. WHEN calling the Gemini API, THE System SHALL define a JSON schema for the expected response structure
2. THE System SHALL use the `response_mime_type: "application/json"` configuration
3. THE System SHALL define a schema with required fields: transaction_type, market_impact, confidence, reasoning, key_findings, trader_action
4. WHERE the API returns invalid JSON, THE System SHALL log the error and return a structured error response
5. THE System SHALL validate that confidence values are between 0 and 100

### Requirement 4: Enhanced Analysis Prompts

**User Story:** As a trader, I want more detailed and actionable whale analysis so that I can make better-informed trading decisions.

#### Acceptance Criteria

1. WHEN analyzing a whale transaction, THE System SHALL include current Bitcoin price context in the prompt
2. THE System SHALL request specific price levels and timeframes in the analysis
3. THE System SHALL ask for risk/reward ratios in trading recommendations
4. THE System SHALL request historical precedent comparisons for similar transactions
5. WHERE exchange addresses are detected, THE System SHALL request exchange-specific flow analysis

### Requirement 5: Model Performance Optimization

**User Story:** As a platform administrator, I want optimized API performance so that users receive fast analysis results without excessive costs.

#### Acceptance Criteria

1. WHEN using `gemini-2.5-flash`, THE System SHALL complete analysis in under 3 seconds
2. THE System SHALL set temperature to 0.7 for balanced creativity and consistency
3. THE System SHALL set topK to 40 and topP to 0.95 for optimal token selection
4. THE System SHALL limit maxOutputTokens to 8,192 for cost efficiency
5. WHERE analysis fails, THE System SHALL implement exponential backoff retry logic with maximum 2 retries

### Requirement 6: Dual Model Support with Deep Dive

**User Story:** As a power user, I want the option to use Gemini 2.5 Pro with Deep Dive analysis so that I can trace blockchain movements beyond the initial transaction and understand the full transaction chain.

#### Acceptance Criteria

1. WHERE transaction amount exceeds 100 BTC, THE System SHALL offer "Deep Dive Analysis" option using `gemini-2.5-pro`
2. WHEN "Deep Dive" is selected, THE System SHALL analyze blockchain movements 2-3 hops beyond the initial transaction
3. THE System SHALL trace funds to/from the transaction addresses for historical context
4. THE System SHALL identify patterns in address behavior (accumulation, distribution, mixing)
5. THE System SHALL display a badge indicating "Gemini 2.5 Pro - Deep Dive" mode
6. THE System SHALL configure Pro model with higher maxOutputTokens (32,768) for comprehensive analysis
7. THE System SHALL display estimated analysis time (10-15 seconds) before starting Deep Dive
8. THE System SHALL show progress indicator during Deep Dive analysis
9. THE System SHALL allow users to cancel Deep Dive and fallback to standard analysis
10. THE System SHALL include transaction chain visualization data in Deep Dive results

### Requirement 7: Error Handling and Fallbacks

**User Story:** As a user, I want reliable analysis even when API issues occur so that I always receive actionable intelligence.

#### Acceptance Criteria

1. WHERE Gemini API returns 429 rate limit error, THE System SHALL wait 5 seconds and retry once
2. WHERE Gemini API returns 500 server error, THE System SHALL fallback to cached analysis patterns
3. WHERE API key is invalid, THE System SHALL display clear error message with setup instructions
4. WHERE network timeout occurs after 15 seconds, THE System SHALL return partial analysis with disclaimer
5. THE System SHALL log all API errors to console with request/response details for debugging

### Requirement 8: Response Metadata and Transparency

**User Story:** As a trader, I want to know which AI model analyzed my transaction so that I can assess the reliability of the analysis.

#### Acceptance Criteria

1. WHEN analysis completes, THE System SHALL display the model name (Gemini 2.5 Flash or Pro)
2. THE System SHALL display the analysis timestamp
3. THE System SHALL display the confidence score with visual indicator (color-coded)
4. THE System SHALL display processing time in milliseconds
5. WHERE thinking mode is used, THE System SHALL display a "Reasoning Available" badge

### Requirement 9: Environment Configuration

**User Story:** As a developer, I want clear environment variable configuration so that I can easily set up and deploy the Gemini integration.

#### Acceptance Criteria

1. THE System SHALL read Gemini API key from `GEMINI_API_KEY` environment variable
2. THE System SHALL read model preference from `GEMINI_MODEL` environment variable with default `gemini-2.5-flash`
3. THE System SHALL read thinking mode preference from `GEMINI_ENABLE_THINKING` with default `true`
4. WHERE environment variables are missing, THE System SHALL log clear error messages
5. THE System SHALL validate API key format (starts with "AIzaSy") on startup

### Requirement 10: Deep Dive Blockchain Data Integration

**User Story:** As a trader, I want Deep Dive analysis to include actual blockchain data so that the AI has real transaction history to analyze.

#### Acceptance Criteria

1. WHEN Deep Dive is initiated, THE System SHALL fetch transaction history for source and destination addresses
2. THE System SHALL retrieve up to 10 most recent transactions for each address
3. THE System SHALL calculate total volume moved by each address in the last 30 days
4. THE System SHALL identify if addresses are associated with known exchanges or entities
5. THE System SHALL include this blockchain data in the Gemini Pro prompt for analysis
6. WHERE blockchain API fails, THE System SHALL proceed with available data and note limitations
7. THE System SHALL cache blockchain data for 5 minutes to avoid redundant API calls
8. THE System SHALL display "Analyzing blockchain history..." status during data fetch
9. THE System SHALL include data sources in the analysis metadata
10. THE System SHALL respect Blockchain.com API rate limits with exponential backoff

### Requirement 11: Documentation and Examples

**User Story:** As a developer, I want comprehensive documentation so that I can understand and maintain the Gemini integration.

#### Acceptance Criteria

1. THE System SHALL include inline code comments explaining model selection logic
2. THE System SHALL document all configuration parameters in `.env.example`
3. THE System SHALL provide example API requests and responses in code comments
4. THE System SHALL document rate limits and cost implications
5. THE System SHALL include troubleshooting guide for common API errors

---

**Status:** ✅ Requirements Complete
**Next Phase:** Design Document
**Estimated Complexity:** Medium
**Dependencies:** Existing Gemini API integration, Whale Watch Dashboard
