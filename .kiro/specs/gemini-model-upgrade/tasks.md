# Implementation Plan - Gemini Model Upgrade

## Overview

This implementation plan breaks down the Gemini 2.5 model upgrade into discrete, manageable coding tasks. Each task builds incrementally on previous work and includes specific requirements references.

## Current Status Summary

**✅ COMPLETED (8/10 main tasks):**
1. ✅ Environment configuration and validation (`utils/geminiConfig.ts`)
2. ✅ Structured JSON output validation (schema in `analyze-gemini.ts`)
3. ✅ Thinking mode integration (UI components in `WhaleWatchDashboard.tsx`)
4. ✅ Enhanced analysis prompts (comprehensive prompts in API routes)
5. ✅ Response metadata and transparency (ModelBadge, metadata display)
6. ✅ Deep Dive feature with blockchain data (`deep-dive-gemini.ts`, `blockchainData.ts`)
7. ✅ Documentation updates (`.env.example`, README files)
8. ✅ Model selection utility functions (`utils/geminiConfig.ts`)

**🔄 IN PROGRESS (2/10 main tasks):**
1. **Task 2.3** - Integrate model selection into `analyze-gemini.ts` API route
2. **Task 6** - Implement error handling and retry logic in `analyze-gemini.ts`

**Key Remaining Work:**
- Replace hardcoded `gemini-2.0-flash-exp` with dynamic model selection
- Implement retry logic with exponential backoff
- Add error type classification and comprehensive logging
- Apply model-specific configurations (temperature, topK, topP, maxOutputTokens)

**Estimated Time to Complete:** 3 hours

---

## Task List

- [x] 1. Update environment configuration and validation




  - Add new environment variables for Gemini 2.5 configuration
  - Implement API key validation (format check)
  - Add model selection environment variable
  - Update `.env.example` with new variables and documentation
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_







- [x] 2. Implement model selection logic in analyze-gemini.ts



  - [x] 2.1 Create `selectGeminiModel()` function with transaction size logic
    - ✅ Already implemented in `utils/geminiConfig.ts`
    - ✅ Default to `gemini-2.5-flash` for transactions < 100 BTC
    - ✅ Use `gemini-2.5-pro` for transactions >= 100 BTC
    - ✅ Support user preference override parameter
    - _Requirements: 1.1, 1.2, 6.1_
  

  - [x] 2.2 Add model configuration objects for Flash and Pro
    - ✅ Already implemented in `utils/geminiConfig.ts`
    - ✅ Define temperature, topK, topP, maxOutputTokens for each model
    - ✅ Create separate config objects for optimal performance
    - _Requirements: 1.3, 1.4, 5.2, 5.3, 5.4_
  
  - [x] 2.3 Update API route to use new model selection


    - Import `selectGeminiModel` and `getModelConfig` from `utils/geminiConfig`
    - Replace hardcoded `gemini-2.0-flash-exp` with dynamic selection
    - Use selected model in API endpoint URL
    - Apply model-specific configuration (temperature, topK, topP, maxOutputTokens)
    - _Requirements: 1.5_



- [x] 3. Implement structured JSON output validation








  - [x] 3.1 Define JSON schema for analysis response



    - Create schema with required fields: transaction_type, market_impact, confidence, reasoning, key_findings, trader_action
    - Add optional fields: price_levels, timeframe_analysis


    - Set validation rules (confidence 0-100, min array lengths)
    - _Requirements: 3.1, 3.3, 3.4_
  


  - [x] 3.2 Configure Gemini API with structured output

    - Set `responseMimeType: "application/json"`
    - Pass JSON schema in `responseSchema` parameter
    - _Requirements: 3.2_
  


  - [x] 3.3 Add response validation logic

    - Validate response against schema

    - Handle invalid responses with error logging


    - Return structured error on validation failure
    - _Requirements: 3.4, 3.5_



- [x] 4. Implement thinking mode integration





  - [x] 4.1 Add thinking mode configuration to API request


    - Enable thinking mode in generation config
    - Extract thinking content from API response
    - _Requirements: 2.1, 2.2_
  
  - [x] 4.2 Update response interface to include thinking field


    - Add optional `thinking` field to response type
    - Include `thinkingEnabled` in metadata
    - _Requirements: 2.2, 8.5_
  
  - [x] 4.3 Create ThinkingSection UI component

    - Build collapsible section with orange borders
    - Add "AI Reasoning Process" header with Brain icon
    - Implement expand/collapse functionality
    - Style with Bitcoin Sovereign design (black bg, orange border)
    - _Requirements: 2.3, 2.4_
  
  - [x] 4.4 Add thinking display to WhaleWatchDashboard

    - Integrate ThinkingSection component below analysis
    - Add state management for expand/collapse per transaction
    - Implement "Show More" truncation for long thinking content
    - _Requirements: 2.5_


- [x] 5. Enhance analysis prompts





  - [x] 5.1 Add current Bitcoin price context to prompt

    - Fetch current BTC price from market data API
    - Include price in prompt context
    - _Requirements: 4.1_
  
  - [x] 5.2 Request specific price levels in prompt


    - Ask for support and resistance levels
    - Request specific entry/exit prices
    - _Requirements: 4.2_
  
  - [x] 5.3 Add timeframe analysis to prompt

    - Request short-term (24-48h) analysis
    - Request medium-term (1-2 weeks) analysis
    - _Requirements: 4.2_
  
  - [x] 5.4 Request risk/reward ratios

    - Ask for specific R:R calculations
    - Request position sizing recommendations
    - _Requirements: 4.3_
  
  - [x] 5.5 Add historical precedent analysis

    - Request comparison to similar past transactions
    - Ask for pattern recognition insights
    - _Requirements: 4.4_
  



  - [x] 5.6 Add exchange-specific flow analysis


    - Detect exchange addresses in transaction
    - Request exchange-specific insights when applicable
    - _Requirements: 4.5_



- [ ] 6. Implement error handling and retry logic in analyze-gemini.ts
  - [ ] 6.1 Create retry logic with exponential backoff
    - Implement `callGeminiWithRetry()` wrapper function
    - Use exponential backoff (1s, 2s, 4s)
    - Maximum 2 retry attempts (configurable via GEMINI_MAX_RETRIES)
    - Only retry on retryable errors (429, 500, 502, 503, 504)
    - _Requirements: 5.5, 7.1_
  
  - [ ] 6.2 Add error type classification
    - Create `GeminiErrorType` enum (RATE_LIMIT, INVALID_API_KEY, SERVER_ERROR, TIMEOUT, INVALID_RESPONSE)
    - Classify errors by HTTP status code
    - Determine retryability for each error type
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 6.3 Implement timeout handling
    - Use AbortSignal.timeout() for API requests
    - Set 15-second timeout (configurable via GEMINI_TIMEOUT_MS)
    - Return structured error response on timeout
    - _Requirements: 7.4_
  
  - [ ] 6.4 Add comprehensive error logging
    - Log all errors with request/response details
    - Include model name, transaction hash, and error type
    - Log retry attempts and backoff delays
    - _Requirements: 7.5_
  
  - [ ] 6.5 Create fallback error responses
    - Return structured error response on failure
    - Include helpful error messages for users
    - Maintain response interface consistency
    - _Requirements: 7.2, 7.3_

- [x] 7. Add response metadata and transparency




  - [x] 7.1 Create ModelBadge UI component

    - Display model name (Gemini 2.5 Flash or Pro)
    - Show processing time in milliseconds


    - Style with orange badge for model name
    - _Requirements: 8.1, 8.4_
  
  - [x] 7.2 Add metadata to API response

    - Include model name, provider, timestamp
    - Add processing time calculation
    - Include thinkingEnabled flag

    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 7.3 Display confidence score with visual indicator

    - Show confidence percentage
    - Add color-coded indicator (green > 80, yellow 60-80, orange < 60)
    - _Requirements: 8.3_


  
  - [x] 7.4 Add "Reasoning Available" badge when thinking is enabled

    - Display badge next to model name
    - Link to thinking section
    - _Requirements: 8.5_



- [x] 8. Implement Deep Dive feature with blockchain data integration

  - [x] 8.1 Create blockchain data fetching functions
    - ✅ Implemented in `utils/blockchainData.ts`
    - ✅ `fetchAddressData()` gets transaction history from Blockchain.com API
    - ✅ Fetch last 10 transactions for source and destination addresses
    - ✅ Calculate 30-day volume for each address
    - ✅ Implement caching with 5-minute TTL
    - _Requirements: 10.1, 10.2, 10.3, 10.7_
  
  - [x] 8.2 Implement transaction pattern analysis
    - ✅ Implemented in `utils/blockchainData.ts`
    - ✅ `analyzeTransactionPatterns()` function
    - ✅ Detect accumulation patterns (more incoming than outgoing)
    - ✅ Detect distribution patterns (more outgoing than incoming)
    - ✅ Detect mixing behavior (many small transactions)
    - ✅ Identify exchange flow direction (deposit/withdrawal)
    - _Requirements: 6.2, 6.3, 6.4, 10.4_
  
  - [x] 8.3 Create Deep Dive API endpoint
    - ✅ Created `/api/whale-watch/deep-dive-gemini.ts`
    - ✅ Fetch blockchain data in parallel for both addresses
    - ✅ Build enhanced prompt with blockchain context
    - ✅ Call Gemini 2.5 Pro with 32K token limit
    - ✅ Return comprehensive analysis with blockchain data
    - _Requirements: 6.1, 6.6, 10.5, 10.8_
  
  - [x] 8.4 Build enhanced Deep Dive prompt
    - ✅ Include source and destination address history
    - ✅ Add 30-day volume and transaction counts
    - ✅ Include pattern detection results
    - ✅ Request fund flow tracing analysis
    - ✅ Request address behavior classification
    - ✅ Request market prediction with price levels
    - _Requirements: 6.2, 6.3, 6.10_
  
  - [x] 8.5 Create Deep Dive UI components
    - ✅ Built DeepDiveButton component in WhaleWatchDashboard
    - ✅ Created DeepDiveProgress indicator with multi-stage display
    - ✅ Built DeepDiveResults component with address behavior section
    - ✅ Added fund flow analysis display
    - ✅ Added market prediction section with support/resistance levels
    - ✅ Added strategic intelligence section
    - _Requirements: 6.1, 6.5, 6.7, 6.8, 6.10_
  
  - [x] 8.6 Implement progress tracking
    - ✅ Track stages: "Fetching blockchain data", "Analyzing history", etc.
    - ✅ Update UI with current stage
    - ✅ Show estimated time (10-15 seconds)
    - ✅ Display completion percentage
    - _Requirements: 6.7, 6.8, 10.8_
  
  - [x] 8.7 Add error handling for blockchain data
    - ✅ Handle Blockchain.com API failures gracefully
    - ✅ Proceed with analysis even if blockchain data unavailable
    - ✅ Display data source limitations in results
    - ✅ Implement exponential backoff for rate limits
    - _Requirements: 10.6, 10.10_
  
  - [x] 8.8 Implement cancel functionality
    - ✅ Add cancel button during Deep Dive analysis
    - ✅ Allow fallback to standard Gemini Flash analysis
    - ✅ Clean up pending requests on cancel
    - _Requirements: 6.9_

- [x] 9. Update documentation





  - [x] 9.1 Update `.env.example` with new variables


    - Add GEMINI_MODEL, GEMINI_ENABLE_THINKING, etc.
    - Include clear comments explaining each variable
    - _Requirements: 10.2_
  
  - [x] 9.2 Add inline code comments


    - Document model selection logic
    - Explain thinking mode configuration
    - Comment structured output schema
    - _Requirements: 10.1_
  
  - [x] 9.3 Create API request/response examples

    - Add example requests in code comments
    - Include example responses with thinking content
    - _Requirements: 10.3_
  
  - [x] 9.4 Document rate limits and costs

    - Add comments about Gemini API rate limits
    - Include cost estimates per analysis
    - _Requirements: 10.4_
  
  - [x] 9.5 Create troubleshooting guide


    - Document common API errors and solutions
    - Add debugging tips for developers
    - _Requirements: 10.5_

- [ ]* 10. Testing and validation
  - [ ]* 10.1 Write unit tests for model selection
    - Test Flash selection for small transactions
    - Test Pro selection for large transactions
    - Test user preference override
    - _Requirements: 1.1, 1.2, 6.1_
  
  - [ ]* 10.2 Write unit tests for JSON schema validation
    - Test valid analysis structure
    - Test invalid confidence values
    - Test missing required fields
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [ ]* 10.3 Write integration tests for API calls
    - Test successful analysis with Flash model
    - Test successful analysis with Pro model
    - Test retry logic with rate limit errors
    - _Requirements: 5.5, 7.1_
  
  - [ ]* 10.4 Manual testing on staging
    - Test with various transaction sizes
    - Verify thinking mode display
    - Test error handling scenarios
    - Verify mobile responsiveness
    - _Requirements: All_

---

## Implementation Notes

### Task Dependencies

- Tasks 1-3 can be done in parallel (independent)
- Task 4 depends on Task 3 (needs response structure)
- Task 5 can be done in parallel with Tasks 1-4
- Task 6 depends on Tasks 2-3 (needs API call structure)
- Task 7 depends on Task 2 (needs metadata structure)
- Task 8 depends on Tasks 2, 7 (needs model selection and UI)
- Task 9 can be done throughout (documentation)
- Task 10 should be done after all implementation tasks

### Estimated Time

- Task 1: ✅ Complete (1 hour)
- Task 2: 1 hour remaining (model selection integration)
- Task 3: ✅ Complete (2 hours)
- Task 4: ✅ Complete (3 hours)
- Task 5: ✅ Complete (2 hours)
- Task 6: 2 hours (error handling and retry logic)
- Task 7: ✅ Complete (2 hours)
- Task 8: ✅ Complete (6 hours - Deep Dive feature)
- Task 9: ✅ Complete (2 hours)
- Task 10: 4 hours (optional testing)

**Remaining: ~3 hours (core functionality) + 4 hours (optional testing)**
**Total Completed: ~24 hours**

### Testing Strategy

- Unit tests are marked as optional (*) to focus on core functionality
- Manual testing is required for all features
- Integration tests should be run on staging before production
- Monitor error rates and performance after deployment

---

**Status:** 🔄 In Progress - Final Integration Phase
**Total Tasks:** 10 main tasks, 43 sub-tasks (includes Deep Dive feature)
**Completed:** 8 main tasks, 35 sub-tasks ✅
**Remaining:** 2 main tasks, 8 sub-tasks (core: 2.3, 6.1-6.5)
**Optional Tasks:** 4 testing sub-tasks
**Estimated Duration:** 3 hours remaining (core functionality)
