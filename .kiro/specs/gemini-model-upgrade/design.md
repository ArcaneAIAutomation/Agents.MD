# Gemini Model Upgrade - Design Document

## Overview

This design document outlines the technical approach for upgrading the Whale Watch Gemini AI integration from the experimental `gemini-2.0-flash-exp` model to the latest stable Gemini 2.5 models with enhanced capabilities.

**Goals:**
- Upgrade to stable, production-ready Gemini 2.5 models
- Implement thinking mode for transparent AI reasoning
- Add structured JSON output validation
- Support dual models (Flash for speed, Pro for depth)
- Improve error handling and reliability
- Enhance analysis quality with better prompts

**Non-Goals:**
- Modifying Caesar AI integration (separate system)
- Changing Whale Watch UI layout (only adding thinking display)
- Implementing real-time streaming responses
- Adding user authentication for model selection

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                  Whale Watch Dashboard                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Caesar AI    │  │ Gemini 2.5   │  │ Gemini 2.5   │      │
│  │ (5-7 min)    │  │ Flash (3s)   │  │ Pro (5-7s)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Route Layer                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/whale-watch/analyze-gemini.ts                  │   │
│  │  - Model selection logic                             │   │
│  │  - Thinking mode configuration                       │   │
│  │  - Structured output validation                      │   │
│  │  - Error handling & retries                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Gemini API (v1beta)                      │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │ gemini-2.5-flash │         │ gemini-2.5-pro   │         │
│  │ - 1M context     │         │ - 1M context     │         │
│  │ - 65K output     │         │ - 65K output     │         │
│  │ - Thinking mode  │         │ - Thinking mode  │         │
│  │ - Structured out │         │ - Structured out │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Action**: Clicks "Analyze with Gemini" button
2. **Model Selection**: System determines Flash vs Pro based on transaction size
3. **API Request**: POST to `/api/whale-watch/analyze-gemini` with transaction data
4. **Prompt Construction**: Build enhanced prompt with market context
5. **Gemini API Call**: Call with thinking mode + structured output config
6. **Response Processing**: Extract analysis + thinking content
7. **Validation**: Validate JSON schema and confidence scores
8. **UI Update**: Display analysis with thinking section
9. **Error Handling**: Retry logic or fallback on failure

---

## Components and Interfaces

### 1. API Route: `/api/whale-watch/analyze-gemini.ts`

**Purpose**: Handle Gemini API requests with model selection and thinking mode

**Key Functions**:


```typescript
// Model selection based on transaction size
function selectGeminiModel(amountBTC: number, userPreference?: string): string {
  if (userPreference === 'pro') return 'gemini-2.5-pro';
  if (amountBTC >= 100) return 'gemini-2.5-pro'; // Large transactions
  return 'gemini-2.5-flash'; // Default for speed
}

// Enhanced prompt with market context
function buildAnalysisPrompt(whale: WhaleTransaction, btcPrice: number): string {
  return `You are an expert cryptocurrency market analyst...
  
Current Market Context:
- Bitcoin Price: $${btcPrice.toLocaleString()}
- Transaction: ${whale.amount} BTC ($${whale.amountUSD.toLocaleString()})
- Percentage of Daily Volume: ${calculateVolumePercentage(whale.amount)}%

[Detailed analysis instructions...]`;
}

// Gemini API configuration with thinking mode
const geminiConfig = {
  model: selectedModel,
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: model === 'gemini-2.5-pro' ? 16384 : 8192,
    responseMimeType: 'application/json',
    responseSchema: analysisSchema,
  },
  systemInstruction: {
    parts: [{ text: 'You are a Bitcoin whale transaction analyst...' }]
  }
};
```

**Request Interface**:
```typescript
interface GeminiAnalysisRequest {
  txHash: string;
  blockchain: string;
  amount: number;
  amountUSD: number;
  fromAddress: string;
  toAddress: string;
  timestamp: string;
  type: string;
  description: string;
  modelPreference?: 'flash' | 'pro'; // Optional user preference
  enableThinking?: boolean; // Default true
}
```

**Response Interface**:
```typescript
interface GeminiAnalysisResponse {
  success: boolean;
  analysis?: {
    transaction_type: 'exchange_deposit' | 'exchange_withdrawal' | 'whale_to_whale' | 'unknown';
    market_impact: 'Bearish' | 'Bullish' | 'Neutral';
    confidence: number; // 0-100
    reasoning: string; // 2-3 paragraphs
    key_findings: string[]; // 5-7 specific findings
    trader_action: string; // Actionable recommendation
    price_levels?: {
      support: number[];
      resistance: number[];
    };
    timeframe_analysis?: {
      short_term: string; // 24-48 hours
      medium_term: string; // 1-2 weeks
    };
  };
  thinking?: string; // AI reasoning process (if enabled)
  metadata: {
    model: string; // 'gemini-2.5-flash' or 'gemini-2.5-pro'
    provider: string; // 'Google Gemini'
    processingTime: number; // milliseconds
    timestamp: string;
    thinkingEnabled: boolean;
  };
  error?: string;
}
```

### 2. Gemini Client Configuration

**Purpose**: Centralized configuration for Gemini API calls

**JSON Schema for Structured Output**:
```typescript
const analysisSchema = {
  type: 'object',
  properties: {
    transaction_type: {
      type: 'string',
      enum: ['exchange_deposit', 'exchange_withdrawal', 'whale_to_whale', 'unknown']
    },
    market_impact: {
      type: 'string',
      enum: ['Bearish', 'Bullish', 'Neutral']
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 100
    },
    reasoning: {
      type: 'string',
      minLength: 100
    },
    key_findings: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 7
    },
    trader_action: {
      type: 'string',
      minLength: 50
    },
    price_levels: {
      type: 'object',
      properties: {
        support: { type: 'array', items: { type: 'number' } },
        resistance: { type: 'array', items: { type: 'number' } }
      }
    },
    timeframe_analysis: {
      type: 'object',
      properties: {
        short_term: { type: 'string' },
        medium_term: { type: 'string' }
      }
    }
  },
  required: ['transaction_type', 'market_impact', 'confidence', 'reasoning', 'key_findings', 'trader_action']
};
```

### 3. UI Components Updates

**WhaleWatchDashboard.tsx** - Add thinking display section:

```typescript
// New state for thinking content
const [showThinking, setShowThinking] = useState<Record<string, boolean>>({});

// Thinking display component
const ThinkingSection = ({ thinking, txHash }: { thinking: string; txHash: string }) => (
  <div className="mt-4 border-t border-bitcoin-orange-20 pt-4">
    <button
      onClick={() => setShowThinking(prev => ({ ...prev, [txHash]: !prev[txHash] }))}
      className="flex items-center gap-2 text-bitcoin-orange hover:text-bitcoin-white transition-colors"
    >
      <Brain className="w-4 h-4" />
      <span className="font-semibold">AI Reasoning Process</span>
      {showThinking[txHash] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
    
    {showThinking[txHash] && (
      <div className="mt-3 p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
        <p className="text-bitcoin-white-80 text-sm whitespace-pre-wrap font-mono">
          {thinking}
        </p>
      </div>
    )}
  </div>
);
```

**Model Badge Display**:
```typescript
const ModelBadge = ({ model, processingTime }: { model: string; processingTime: number }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="px-2 py-1 bg-bitcoin-orange text-bitcoin-black rounded font-semibold">
      {model === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash'}
    </span>
    <span className="text-bitcoin-white-60">
      {processingTime}ms
    </span>
  </div>
);
```

---

## Data Models

### Environment Variables

```bash
# .env.local
GEMINI_API_KEY=AIzaSy...                    # Required
GEMINI_MODEL=gemini-2.5-flash               # Optional, default: gemini-2.5-flash
GEMINI_ENABLE_THINKING=true                 # Optional, default: true
GEMINI_PRO_THRESHOLD_BTC=100                # Optional, default: 100
GEMINI_MAX_RETRIES=2                        # Optional, default: 2
GEMINI_TIMEOUT_MS=15000                     # Optional, default: 15000
```

### Configuration Object

```typescript
interface GeminiConfig {
  apiKey: string;
  defaultModel: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  enableThinking: boolean;
  proThresholdBTC: number;
  maxRetries: number;
  timeoutMs: number;
  flashConfig: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
  };
  proConfig: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
  };
}

const geminiConfig: GeminiConfig = {
  apiKey: process.env.GEMINI_API_KEY!,
  defaultModel: (process.env.GEMINI_MODEL as any) || 'gemini-2.5-flash',
  enableThinking: process.env.GEMINI_ENABLE_THINKING !== 'false',
  proThresholdBTC: parseInt(process.env.GEMINI_PRO_THRESHOLD_BTC || '100'),
  maxRetries: parseInt(process.env.GEMINI_MAX_RETRIES || '2'),
  timeoutMs: parseInt(process.env.GEMINI_TIMEOUT_MS || '15000'),
  flashConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  },
  proConfig: {
    temperature: 0.8,
    topK: 64,
    topP: 0.95,
    maxOutputTokens: 16384,
  },
};
```

---

## Error Handling

### Error Types and Responses

```typescript
enum GeminiErrorType {
  RATE_LIMIT = 'RATE_LIMIT',           // 429
  INVALID_API_KEY = 'INVALID_API_KEY', // 401
  SERVER_ERROR = 'SERVER_ERROR',       // 500
  TIMEOUT = 'TIMEOUT',                 // Network timeout
  INVALID_RESPONSE = 'INVALID_RESPONSE', // JSON parse error
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',   // Daily quota
}

interface GeminiError {
  type: GeminiErrorType;
  message: string;
  retryable: boolean;
  retryAfter?: number; // seconds
  details?: any;
}
```

### Retry Logic

```typescript
async function callGeminiWithRetry(
  request: GeminiAnalysisRequest,
  maxRetries: number = 2
): Promise<GeminiAnalysisResponse> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await callGeminiAPI(request);
      return response;
    } catch (error) {
      lastError = error as Error;
      
      // Check if retryable
      if (!isRetryableError(error)) {
        throw error;
      }
      
      // Exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await sleep(delay);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      }
    }
  }
  
  throw lastError!;
}

function isRetryableError(error: any): boolean {
  const retryableStatuses = [429, 500, 502, 503, 504];
  return retryableStatuses.includes(error.status);
}
```

### Fallback Strategy

```typescript
async function analyzeWithFallback(whale: WhaleTransaction): Promise<GeminiAnalysisResponse> {
  try {
    // Try Gemini 2.5 Flash first
    return await callGeminiWithRetry(whale, 2);
  } catch (error) {
    console.error('Gemini analysis failed:', error);
    
    // Return structured error response
    return {
      success: false,
      error: 'Analysis temporarily unavailable. Please try again.',
      metadata: {
        model: 'gemini-2.5-flash',
        provider: 'Google Gemini',
        processingTime: 0,
        timestamp: new Date().toISOString(),
        thinkingEnabled: false,
      }
    };
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('Gemini Model Selection', () => {
  it('should select Flash for transactions < 100 BTC', () => {
    expect(selectGeminiModel(50)).toBe('gemini-2.5-flash');
  });
  
  it('should select Pro for transactions >= 100 BTC', () => {
    expect(selectGeminiModel(150)).toBe('gemini-2.5-pro');
  });
  
  it('should respect user preference', () => {
    expect(selectGeminiModel(50, 'pro')).toBe('gemini-2.5-pro');
  });
});

describe('JSON Schema Validation', () => {
  it('should validate correct analysis structure', () => {
    const analysis = {
      transaction_type: 'exchange_deposit',
      market_impact: 'Bearish',
      confidence: 85,
      reasoning: 'Detailed reasoning...',
      key_findings: ['Finding 1', 'Finding 2', 'Finding 3'],
      trader_action: 'Specific action...'
    };
    expect(validateAnalysisSchema(analysis)).toBe(true);
  });
  
  it('should reject invalid confidence values', () => {
    const analysis = { ...validAnalysis, confidence: 150 };
    expect(validateAnalysisSchema(analysis)).toBe(false);
  });
});
```

### Integration Tests

```typescript
describe('Gemini API Integration', () => {
  it('should successfully analyze whale transaction', async () => {
    const whale = createMockWhaleTransaction();
    const response = await analyzeWithGemini(whale);
    
    expect(response.success).toBe(true);
    expect(response.analysis).toBeDefined();
    expect(response.metadata.model).toMatch(/gemini-2\.5-(flash|pro)/);
  });
  
  it('should handle rate limit errors with retry', async () => {
    mockGeminiAPI.mockRejectedValueOnce({ status: 429 });
    mockGeminiAPI.mockResolvedValueOnce(validResponse);
    
    const response = await callGeminiWithRetry(mockRequest, 2);
    expect(response.success).toBe(true);
    expect(mockGeminiAPI).toHaveBeenCalledTimes(2);
  });
});
```

### Manual Testing Checklist

- [ ] Test Flash model with small transaction (< 100 BTC)
- [ ] Test Pro model with large transaction (>= 100 BTC)
- [ ] Verify thinking mode displays correctly
- [ ] Test structured output validation
- [ ] Verify error handling with invalid API key
- [ ] Test retry logic with simulated 429 error
- [ ] Verify mobile display of thinking section
- [ ] Test model badge display
- [ ] Verify processing time accuracy
- [ ] Test with various transaction types

---

## Performance Considerations

### Response Time Targets

| Model | Target | Maximum |
|-------|--------|---------|
| Gemini 2.5 Flash | < 3s | 5s |
| Gemini 2.5 Pro | < 7s | 10s |

### Optimization Strategies

1. **Prompt Optimization**: Keep prompts concise while maintaining detail
2. **Token Limits**: Use appropriate maxOutputTokens for each model
3. **Caching**: Cache analysis for identical transactions (5 min TTL)
4. **Parallel Requests**: Don't block UI while waiting for response
5. **Timeout Handling**: 15s timeout with graceful degradation

### Cost Management

```typescript
// Estimated costs (as of 2025)
const COST_PER_1K_TOKENS = {
  'gemini-2.5-flash': {
    input: 0.00001,  // $0.01 per 1M tokens
    output: 0.00003, // $0.03 per 1M tokens
  },
  'gemini-2.5-pro': {
    input: 0.00005,  // $0.05 per 1M tokens
    output: 0.00015, // $0.15 per 1M tokens
  },
};

// Estimated cost per analysis
function estimateAnalysisCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = COST_PER_1K_TOKENS[model];
  return (inputTokens / 1000 * costs.input) + (outputTokens / 1000 * costs.output);
}
```

---

## Security Considerations

### API Key Protection

```typescript
// Validate API key format
function validateGeminiAPIKey(key: string): boolean {
  return key.startsWith('AIzaSy') && key.length === 39;
}

// Never expose API key in client-side code
// Always use server-side API routes
```

### Input Sanitization

```typescript
function sanitizeWhaleData(whale: any): WhaleTransaction {
  return {
    txHash: sanitizeString(whale.txHash),
    blockchain: sanitizeString(whale.blockchain),
    amount: parseFloat(whale.amount),
    amountUSD: parseFloat(whale.amountUSD),
    fromAddress: sanitizeAddress(whale.fromAddress),
    toAddress: sanitizeAddress(whale.toAddress),
    timestamp: new Date(whale.timestamp).toISOString(),
    type: sanitizeString(whale.type),
    description: sanitizeString(whale.description),
  };
}
```

### Rate Limiting

```typescript
// Implement rate limiting per IP/user
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(ip: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(ip) || [];
  
  // Remove old requests outside window
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  return true;
}
```

---

## Deployment Strategy

### Phase 1: Development (Week 1)
- Implement model selection logic
- Add thinking mode configuration
- Create structured output schema
- Update API route with new models

### Phase 2: Testing (Week 1)
- Unit tests for all functions
- Integration tests with Gemini API
- Manual testing on staging
- Performance benchmarking

### Phase 3: Staging Deployment (Week 2)
- Deploy to Vercel staging environment
- Configure environment variables
- Monitor error rates and performance
- Gather user feedback

### Phase 4: Production Rollout (Week 2)
- Deploy to production with feature flag
- Gradual rollout (10% → 50% → 100%)
- Monitor costs and performance
- Document any issues

### Rollback Plan

If critical issues occur:
1. Disable feature flag to revert to old model
2. Investigate logs and error reports
3. Fix issues in development
4. Re-test and re-deploy

---

## Monitoring and Observability

### Key Metrics

```typescript
interface GeminiMetrics {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  modelUsage: {
    flash: number;
    pro: number;
  };
  errorRates: {
    rateLimit: number;
    timeout: number;
    serverError: number;
  };
  costEstimate: number;
}
```

### Logging Strategy

```typescript
// Log all API calls
console.log('[Gemini] Starting analysis', {
  txHash: whale.txHash,
  model: selectedModel,
  thinkingEnabled: config.enableThinking,
  timestamp: new Date().toISOString(),
});

// Log performance
console.log('[Gemini] Analysis complete', {
  txHash: whale.txHash,
  model: selectedModel,
  processingTime: endTime - startTime,
  success: true,
});

// Log errors
console.error('[Gemini] Analysis failed', {
  txHash: whale.txHash,
  model: selectedModel,
  error: error.message,
  retryAttempt: attempt,
});
```

---

## Documentation Updates

### Files to Update

1. **README.md**: Add Gemini 2.5 upgrade notes
2. **.env.example**: Add new environment variables
3. **API Documentation**: Update endpoint specs
4. **User Guide**: Explain thinking mode feature
5. **Developer Guide**: Model selection logic

### Code Comments

```typescript
/**
 * Analyzes a Bitcoin whale transaction using Google Gemini 2.5 models.
 * 
 * Model Selection:
 * - Transactions < 100 BTC: gemini-2.5-flash (fast, 3s)
 * - Transactions >= 100 BTC: gemini-2.5-pro (deep, 7s)
 * - User can override with modelPreference parameter
 * 
 * Features:
 * - Thinking mode: Shows AI reasoning process
 * - Structured outputs: Guaranteed JSON schema
 * - Retry logic: Handles rate limits and errors
 * - Cost optimization: Uses appropriate model for task
 * 
 * @param whale - Whale transaction data
 * @param options - Analysis options (model preference, thinking mode)
 * @returns Analysis with metadata and optional thinking content
 */
```

---

**Status:** ✅ Design Complete
**Next Phase:** Implementation Tasks
**Estimated Effort:** 2-3 days
**Risk Level:** Low (backward compatible, feature flag enabled)


---

## Deep Dive Feature Architecture

### Overview

The Deep Dive feature uses Gemini 2.5 Pro with extended blockchain data to provide comprehensive transaction chain analysis. It goes beyond the initial transaction to understand address behavior patterns and fund flows.

### Deep Dive Data Flow

```
User clicks "Deep Dive" → Fetch blockchain data → Build enhanced prompt → Call Gemini Pro → Display comprehensive analysis

1. User Action: Click "Deep Dive Analysis" button
2. UI Update: Show "Analyzing blockchain history..." status
3. Data Fetch: Retrieve transaction history for addresses (parallel)
   - Source address: Last 10 transactions
   - Destination address: Last 10 transactions
   - 30-day volume calculations
   - Exchange/entity identification
4. Prompt Enhancement: Build comprehensive prompt with blockchain data
5. Gemini Pro Call: Use extended context (32K tokens) for deep analysis
6. Response Processing: Extract analysis + transaction chain insights
7. UI Display: Show comprehensive analysis with blockchain movement patterns
```

### Blockchain Data Integration

```typescript
interface BlockchainAddressData {
  address: string;
  totalReceived: number;
  totalSent: number;
  balance: number;
  transactionCount: number;
  recentTransactions: Array<{
    hash: string;
    time: string;
    amount: number;
    type: 'incoming' | 'outgoing';
  }>;
  volume30Days: number;
  knownEntity?: {
    name: string;
    type: 'exchange' | 'mixer' | 'whale' | 'unknown';
  };
}

interface DeepDiveData {
  sourceAddress: BlockchainAddressData;
  destinationAddress: BlockchainAddressData;
  transactionChain: Array<{
    hop: number;
    from: string;
    to: string;
    amount: number;
    timestamp: string;
  }>;
  patterns: {
    isAccumulation: boolean;
    isDistribution: boolean;
    isMixing: boolean;
    exchangeFlow: 'deposit' | 'withdrawal' | 'none';
  };
}
```

### Deep Dive API Endpoint

```typescript
// New endpoint: /api/whale-watch/deep-dive-gemini.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeepDiveAnalysisResponse>
) {
  const whale: WhaleTransaction = req.body;
  
  // Step 1: Fetch blockchain data (parallel)
  const [sourceData, destData] = await Promise.all([
    fetchAddressData(whale.fromAddress),
    fetchAddressData(whale.toAddress),
  ]);
  
  // Step 2: Analyze transaction patterns
  const patterns = analyzeTransactionPatterns(sourceData, destData);
  
  // Step 3: Build enhanced prompt
  const prompt = buildDeepDivePrompt(whale, sourceData, destData, patterns);
  
  // Step 4: Call Gemini 2.5 Pro with extended context
  const analysis = await callGeminiPro({
    prompt,
    maxOutputTokens: 32768,
    temperature: 0.8,
    enableThinking: true,
  });
  
  // Step 5: Return comprehensive analysis
  return res.status(200).json({
    success: true,
    analysis: analysis,
    blockchainData: {
      sourceAddress: sourceData,
      destinationAddress: destData,
      patterns: patterns,
    },
    metadata: {
      model: 'gemini-2.5-pro',
      analysisType: 'deep-dive',
      processingTime: endTime - startTime,
      dataSourcesUsed: ['blockchain.com', 'gemini-pro'],
    },
  });
}
```

### Enhanced Deep Dive Prompt

```typescript
function buildDeepDivePrompt(
  whale: WhaleTransaction,
  sourceData: BlockchainAddressData,
  destData: BlockchainAddressData,
  patterns: TransactionPatterns
): string {
  return `You are an expert Bitcoin blockchain analyst conducting a DEEP DIVE investigation.

PRIMARY TRANSACTION:
- Hash: ${whale.txHash}
- Amount: ${whale.amount} BTC ($${whale.amountUSD.toLocaleString()})
- From: ${whale.fromAddress}
- To: ${whale.toAddress}
- Timestamp: ${whale.timestamp}

SOURCE ADDRESS ANALYSIS:
- Total Received: ${sourceData.totalReceived} BTC
- Total Sent: ${sourceData.totalSent} BTC
- Current Balance: ${sourceData.balance} BTC
- Transaction Count: ${sourceData.transactionCount}
- 30-Day Volume: ${sourceData.volume30Days} BTC
- Known Entity: ${sourceData.knownEntity?.name || 'Unknown'}
- Recent Activity:
${sourceData.recentTransactions.map((tx, i) => 
  `  ${i+1}. ${tx.type === 'incoming' ? '←' : '→'} ${tx.amount} BTC (${tx.time})`
).join('\n')}

DESTINATION ADDRESS ANALYSIS:
- Total Received: ${destData.totalReceived} BTC
- Total Sent: ${destData.totalSent} BTC
- Current Balance: ${destData.balance} BTC
- Transaction Count: ${destData.transactionCount}
- 30-Day Volume: ${destData.volume30Days} BTC
- Known Entity: ${destData.knownEntity?.name || 'Unknown'}
- Recent Activity:
${destData.recentTransactions.map((tx, i) => 
  `  ${i+1}. ${tx.type === 'incoming' ? '←' : '→'} ${tx.amount} BTC (${tx.time})`
).join('\n')}

PATTERN DETECTION:
- Accumulation Pattern: ${patterns.isAccumulation ? 'YES' : 'NO'}
- Distribution Pattern: ${patterns.isDistribution ? 'YES' : 'NO'}
- Mixing Behavior: ${patterns.isMixing ? 'YES' : 'NO'}
- Exchange Flow: ${patterns.exchangeFlow}

DEEP DIVE ANALYSIS REQUIRED:

1. **Address Behavior Analysis:**
   - What is the historical behavior of the source address?
   - What is the historical behavior of the destination address?
   - Are these addresses part of a larger wallet cluster?
   - What patterns emerge from the transaction history?

2. **Fund Flow Tracing:**
   - Where did the funds originate before reaching the source address?
   - Where are the funds likely to go after the destination address?
   - Are there any mixing or tumbling patterns?
   - Is this part of a larger fund movement strategy?

3. **Entity Identification:**
   - Are these addresses associated with known exchanges?
   - Are there signs of institutional vs retail behavior?
   - Are there connections to other whale addresses?
   - What does the transaction timing suggest about the entity?

4. **Market Impact Prediction:**
   - Based on historical patterns, what is the likely next move?
   - How have similar patterns affected the market in the past?
   - What are the key price levels to watch?
   - What is the probability of further large movements?

5. **Strategic Intelligence:**
   - What is the strategic intent behind this transaction?
   - Is this accumulation, distribution, or repositioning?
   - What does this tell us about market sentiment?
   - What actionable insights can traders use?

Provide a COMPREHENSIVE analysis in JSON format with:
{
  "transaction_type": "string",
  "market_impact": "Bearish | Bullish | Neutral",
  "confidence": number (0-100),
  "address_behavior": {
    "source_classification": "exchange | whale | mixer | retail | institutional",
    "destination_classification": "exchange | whale | mixer | retail | institutional",
    "source_strategy": "string (detailed analysis)",
    "destination_strategy": "string (detailed analysis)"
  },
  "fund_flow_analysis": {
    "origin_hypothesis": "string (where funds came from)",
    "destination_hypothesis": "string (where funds will go)",
    "mixing_detected": boolean,
    "cluster_analysis": "string (wallet cluster insights)"
  },
  "historical_patterns": {
    "similar_transactions": "string (historical precedents)",
    "pattern_match": "string (pattern type)",
    "success_rate": number (0-100, based on historical outcomes)
  },
  "market_prediction": {
    "short_term_24h": "string (specific prediction)",
    "medium_term_7d": "string (specific prediction)",
    "key_price_levels": {
      "support": number[],
      "resistance": number[]
    },
    "probability_further_movement": number (0-100)
  },
  "strategic_intelligence": {
    "intent": "string (strategic intent analysis)",
    "sentiment_indicator": "string (market sentiment)",
    "trader_positioning": "string (how traders should position)",
    "risk_reward_ratio": "string (R:R analysis)"
  },
  "reasoning": "string (comprehensive 3-5 paragraph analysis)",
  "key_findings": string[] (7-10 specific, actionable findings),
  "trader_action": "string (specific, detailed recommendation)"
}

Be extremely thorough and specific. This is a DEEP DIVE - provide insights that go far beyond surface-level analysis.`;
}
```

### Deep Dive UI Components

```typescript
// Deep Dive Button Component
const DeepDiveButton = ({ 
  whale, 
  onAnalyze, 
  isAnalyzing 
}: { 
  whale: WhaleTransaction; 
  onAnalyze: () => void; 
  isAnalyzing: boolean;
}) => {
  const shouldShowDeepDive = whale.amount >= 100;
  
  if (!shouldShowDeepDive) return null;
  
  return (
    <button
      onClick={onAnalyze}
      disabled={isAnalyzing}
      className="flex items-center gap-2 px-4 py-2 bg-bitcoin-orange text-bitcoin-black 
                 font-bold rounded-lg hover:bg-bitcoin-black hover:text-bitcoin-orange 
                 border-2 border-bitcoin-orange transition-all disabled:opacity-50
                 shadow-[0_0_20px_rgba(247,147,26,0.5)]"
    >
      <Search className="w-5 h-5" />
      <span>Deep Dive Analysis</span>
      {isAnalyzing && <Loader className="w-4 h-4 animate-spin" />}
    </button>
  );
};

// Deep Dive Progress Indicator
const DeepDiveProgress = ({ stage }: { stage: string }) => {
  const stages = [
    'Fetching blockchain data...',
    'Analyzing transaction history...',
    'Tracing fund flows...',
    'Identifying patterns...',
    'Generating comprehensive analysis...',
  ];
  
  const currentIndex = stages.indexOf(stage);
  
  return (
    <div className="p-4 bg-bitcoin-black border border-bitcoin-orange rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        <Loader className="w-5 h-5 text-bitcoin-orange animate-spin" />
        <span className="text-bitcoin-white font-semibold">Deep Dive in Progress</span>
      </div>
      
      <div className="space-y-2">
        {stages.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            {i < currentIndex && <CheckCircle className="w-4 h-4 text-bitcoin-orange" />}
            {i === currentIndex && <Loader className="w-4 h-4 text-bitcoin-orange animate-spin" />}
            {i > currentIndex && <Circle className="w-4 h-4 text-bitcoin-white-60" />}
            <span className={i <= currentIndex ? 'text-bitcoin-white' : 'text-bitcoin-white-60'}>
              {s}
            </span>
          </div>
        ))}
      </div>
      
      <p className="mt-3 text-sm text-bitcoin-white-60">
        Estimated time: 10-15 seconds
      </p>
    </div>
  );
};

// Deep Dive Results Display
const DeepDiveResults = ({ analysis, blockchainData }: DeepDiveAnalysisResponse) => (
  <div className="space-y-4">
    {/* Model Badge */}
    <div className="flex items-center gap-2">
      <span className="px-3 py-1 bg-bitcoin-orange text-bitcoin-black rounded font-bold
                       shadow-[0_0_30px_rgba(247,147,26,0.6)]">
        Gemini 2.5 Pro - Deep Dive
      </span>
      <span className="text-bitcoin-white-60 text-sm">
        {analysis.metadata.processingTime}ms
      </span>
    </div>
    
    {/* Address Behavior Section */}
    <div className="p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
      <h4 className="text-bitcoin-white font-bold mb-3">Address Behavior Analysis</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-bitcoin-white-60 text-sm mb-1">Source Address</p>
          <p className="text-bitcoin-orange font-semibold">
            {analysis.address_behavior.source_classification}
          </p>
          <p className="text-bitcoin-white-80 text-sm mt-2">
            {analysis.address_behavior.source_strategy}
          </p>
        </div>
        <div>
          <p className="text-bitcoin-white-60 text-sm mb-1">Destination Address</p>
          <p className="text-bitcoin-orange font-semibold">
            {analysis.address_behavior.destination_classification}
          </p>
          <p className="text-bitcoin-white-80 text-sm mt-2">
            {analysis.address_behavior.destination_strategy}
          </p>
        </div>
      </div>
    </div>
    
    {/* Fund Flow Analysis */}
    <div className="p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
      <h4 className="text-bitcoin-white font-bold mb-3">Fund Flow Tracing</h4>
      <div className="space-y-3">
        <div>
          <p className="text-bitcoin-white-60 text-sm">Origin Hypothesis</p>
          <p className="text-bitcoin-white-80">{analysis.fund_flow_analysis.origin_hypothesis}</p>
        </div>
        <div>
          <p className="text-bitcoin-white-60 text-sm">Destination Hypothesis</p>
          <p className="text-bitcoin-white-80">{analysis.fund_flow_analysis.destination_hypothesis}</p>
        </div>
        {analysis.fund_flow_analysis.mixing_detected && (
          <div className="p-2 bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded">
            <p className="text-bitcoin-orange font-semibold">⚠️ Mixing Behavior Detected</p>
          </div>
        )}
      </div>
    </div>
    
    {/* Market Prediction */}
    <div className="p-4 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg">
      <h4 className="text-bitcoin-white font-bold mb-3">Market Prediction</h4>
      <div className="space-y-3">
        <div>
          <p className="text-bitcoin-white-60 text-sm">24-Hour Outlook</p>
          <p className="text-bitcoin-white-80">{analysis.market_prediction.short_term_24h}</p>
        </div>
        <div>
          <p className="text-bitcoin-white-60 text-sm">7-Day Outlook</p>
          <p className="text-bitcoin-white-80">{analysis.market_prediction.medium_term_7d}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-bitcoin-white-60 text-sm mb-2">Support Levels</p>
            {analysis.market_prediction.key_price_levels.support.map((level, i) => (
              <p key={i} className="text-bitcoin-orange font-mono">
                ${level.toLocaleString()}
              </p>
            ))}
          </div>
          <div>
            <p className="text-bitcoin-white-60 text-sm mb-2">Resistance Levels</p>
            {analysis.market_prediction.key_price_levels.resistance.map((level, i) => (
              <p key={i} className="text-bitcoin-orange font-mono">
                ${level.toLocaleString()}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
    
    {/* Strategic Intelligence */}
    <div className="p-4 bg-bitcoin-orange text-bitcoin-black rounded-lg">
      <h4 className="font-bold mb-3">Strategic Intelligence</h4>
      <div className="space-y-2">
        <p><strong>Intent:</strong> {analysis.strategic_intelligence.intent}</p>
        <p><strong>Sentiment:</strong> {analysis.strategic_intelligence.sentiment_indicator}</p>
        <p><strong>Positioning:</strong> {analysis.strategic_intelligence.trader_positioning}</p>
        <p><strong>Risk/Reward:</strong> {analysis.strategic_intelligence.risk_reward_ratio}</p>
      </div>
    </div>
    
    {/* Standard sections: reasoning, key findings, trader action */}
    {/* ... (same as regular analysis) */}
  </div>
);
```

### Blockchain Data Fetching

```typescript
// Fetch address data from Blockchain.com API
async function fetchAddressData(address: string): Promise<BlockchainAddressData> {
  const apiKey = process.env.BLOCKCHAIN_API_KEY;
  const baseUrl = process.env.BLOCKCHAIN_API_URL || 'https://blockchain.info';
  
  try {
    // Fetch address summary
    const summaryResponse = await fetch(
      `${baseUrl}/rawaddr/${address}?limit=10&api_code=${apiKey}`,
      { timeout: 10000 }
    );
    
    if (!summaryResponse.ok) {
      throw new Error(`Blockchain API error: ${summaryResponse.status}`);
    }
    
    const data = await summaryResponse.json();
    
    // Calculate 30-day volume
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentTxs = data.txs.filter(tx => tx.time * 1000 > thirtyDaysAgo);
    const volume30Days = recentTxs.reduce((sum, tx) => {
      const amount = tx.out.reduce((s, o) => s + o.value, 0) / 100000000; // Convert satoshis to BTC
      return sum + amount;
    }, 0);
    
    // Identify known entity (simplified - would use a database in production)
    const knownEntity = identifyKnownEntity(address);
    
    return {
      address,
      totalReceived: data.total_received / 100000000,
      totalSent: data.total_sent / 100000000,
      balance: data.final_balance / 100000000,
      transactionCount: data.n_tx,
      recentTransactions: data.txs.slice(0, 10).map(tx => ({
        hash: tx.hash,
        time: new Date(tx.time * 1000).toISOString(),
        amount: tx.out.reduce((s, o) => s + o.value, 0) / 100000000,
        type: determineTransactionType(tx, address),
      })),
      volume30Days,
      knownEntity,
    };
  } catch (error) {
    console.error(`Failed to fetch address data for ${address}:`, error);
    // Return minimal data on error
    return {
      address,
      totalReceived: 0,
      totalSent: 0,
      balance: 0,
      transactionCount: 0,
      recentTransactions: [],
      volume30Days: 0,
    };
  }
}

// Analyze transaction patterns
function analyzeTransactionPatterns(
  sourceData: BlockchainAddressData,
  destData: BlockchainAddressData
): TransactionPatterns {
  // Accumulation: More incoming than outgoing
  const isAccumulation = destData.totalReceived > destData.totalSent * 1.5;
  
  // Distribution: More outgoing than incoming
  const isDistribution = sourceData.totalSent > sourceData.totalReceived * 1.5;
  
  // Mixing: Many small transactions in/out
  const isMixing = (
    sourceData.transactionCount > 100 &&
    sourceData.recentTransactions.length > 5 &&
    sourceData.recentTransactions.every(tx => tx.amount < 1)
  );
  
  // Exchange flow detection
  let exchangeFlow: 'deposit' | 'withdrawal' | 'none' = 'none';
  if (destData.knownEntity?.type === 'exchange') {
    exchangeFlow = 'deposit';
  } else if (sourceData.knownEntity?.type === 'exchange') {
    exchangeFlow = 'withdrawal';
  }
  
  return {
    isAccumulation,
    isDistribution,
    isMixing,
    exchangeFlow,
  };
}
```

### Performance Optimization for Deep Dive

```typescript
// Cache blockchain data to avoid redundant API calls
const blockchainDataCache = new Map<string, {
  data: BlockchainAddressData;
  timestamp: number;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchAddressDataCached(address: string): Promise<BlockchainAddressData> {
  const cached = blockchainDataCache.get(address);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log(`Using cached data for ${address}`);
    return cached.data;
  }
  
  const data = await fetchAddressData(address);
  blockchainDataCache.set(address, { data, timestamp: now });
  
  return data;
}

// Parallel data fetching with timeout
async function fetchDeepDiveData(
  whale: WhaleTransaction
): Promise<DeepDiveData> {
  const timeout = 10000; // 10 seconds max for blockchain data
  
  try {
    const [sourceData, destData] = await Promise.race([
      Promise.all([
        fetchAddressDataCached(whale.fromAddress),
        fetchAddressDataCached(whale.toAddress),
      ]),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Blockchain data fetch timeout')), timeout)
      ),
    ]);
    
    const patterns = analyzeTransactionPatterns(sourceData, destData);
    
    return {
      sourceAddress: sourceData,
      destinationAddress: destData,
      transactionChain: [], // Would be populated with multi-hop analysis
      patterns,
    };
  } catch (error) {
    console.error('Deep Dive data fetch failed:', error);
    // Return minimal data to allow analysis to proceed
    return {
      sourceAddress: createEmptyAddressData(whale.fromAddress),
      destinationAddress: createEmptyAddressData(whale.toAddress),
      transactionChain: [],
      patterns: {
        isAccumulation: false,
        isDistribution: false,
        isMixing: false,
        exchangeFlow: 'none',
      },
    };
  }
}
```

---

**Deep Dive Feature Summary:**

✅ **Extended Analysis**: 2-3 transaction hops beyond initial transaction
✅ **Blockchain Data**: Real transaction history from Blockchain.com API
✅ **Pattern Detection**: Accumulation, distribution, mixing behavior
✅ **Entity Identification**: Exchange, whale, mixer classification
✅ **Fund Flow Tracing**: Origin and destination hypothesis
✅ **Market Prediction**: 24h and 7-day outlook with price levels
✅ **Strategic Intelligence**: Intent, sentiment, positioning, R:R
✅ **Progress Indicator**: Multi-stage progress display
✅ **Performance**: 10-15 second analysis with caching
✅ **Error Handling**: Graceful degradation if blockchain data unavailable

