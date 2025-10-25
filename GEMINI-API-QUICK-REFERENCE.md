# Gemini API Quick Reference Guide

## 🚀 Quick Start

### Environment Setup
```bash
# Required
GEMINI_API_KEY=AIzaSy...  # Get from https://ai.google.dev

# Optional (with defaults)
GEMINI_MODEL=gemini-2.5-flash
GEMINI_ENABLE_THINKING=true
GEMINI_PRO_THRESHOLD_BTC=100
GEMINI_MAX_RETRIES=2
GEMINI_TIMEOUT_MS=15000
GEMINI_FLASH_MAX_OUTPUT_TOKENS=8192
GEMINI_PRO_MAX_OUTPUT_TOKENS=32768
```

### API Endpoint
```
POST /api/whale-watch/analyze-gemini
```

### Request Body
```json
{
  "txHash": "abc123...",
  "blockchain": "Bitcoin",
  "amount": 150.5,
  "amountUSD": 14297500,
  "fromAddress": "1A1zP1...",
  "toAddress": "bc1qxy2...",
  "timestamp": "2025-01-24T12:00:00Z",
  "type": "Large Transfer",
  "description": "Whale movement detected"
}
```

### Response (Success)
```json
{
  "success": true,
  "analysis": {
    "transaction_type": "exchange_withdrawal",
    "market_impact": "Bullish",
    "confidence": 85,
    "reasoning": "...",
    "key_findings": ["...", "..."],
    "trader_action": "...",
    "price_levels": { "support": [...], "resistance": [...] },
    "timeframe_analysis": { "short_term": "...", "medium_term": "..." },
    "risk_reward": { "ratio": "1:4", "position_size": "3-5%", ... },
    "historical_context": { ... }
  },
  "thinking": "Step-by-step reasoning...",
  "metadata": {
    "model": "gemini-2.5-pro",
    "provider": "Google Gemini",
    "timestamp": "2025-01-24T12:00:05Z",
    "processingTime": 5234,
    "thinkingEnabled": true,
    "tokenUsage": {
      "promptTokens": 2000,
      "completionTokens": 1500,
      "totalTokens": 3500
    },
    "finishReason": "STOP",
    "safetyRatings": [...]
  },
  "timestamp": "2025-01-24T12:00:05Z"
}
```

### Response (Error)
```json
{
  "success": false,
  "error": "API rate limit exceeded. Please wait a moment and try again.",
  "metadata": {
    "model": "gemini-2.5-flash",
    "provider": "Google Gemini",
    "timestamp": "2025-01-24T12:00:05Z",
    "processingTime": 1234,
    "errorType": "RATE_LIMIT"
  },
  "timestamp": "2025-01-24T12:00:05Z"
}
```

## 📊 Model Selection

| Transaction Size | Model | Speed | Cost/Request | Max Tokens |
|-----------------|-------|-------|--------------|------------|
| < 100 BTC | gemini-2.5-flash | ~3s | ~$0.0001 | 8,192 |
| ≥ 100 BTC | gemini-2.5-pro | ~7s | ~$0.0004 | 32,768 |

## 💰 Cost Estimates

### Per Request
- **Flash**: ~$0.0001 (2K input + 1K output tokens)
- **Pro**: ~$0.0004 (2K input + 2K output tokens)

### Monthly (1,000 requests)
- **Flash**: ~$0.10/month
- **Pro**: ~$0.40/month
- **Mixed (900 Flash + 100 Pro)**: ~$0.13/month

## 🔄 Error Handling

### Error Types
| Type | Retryable | HTTP Status | Description |
|------|-----------|-------------|-------------|
| RATE_LIMIT | ✅ Yes | 429 | API rate limit exceeded |
| TIMEOUT | ✅ Yes | 504 | Request timeout |
| SERVER_ERROR | ✅ Yes | 503 | Gemini server error |
| NETWORK_ERROR | ✅ Yes | 503 | Network connectivity issue |
| INVALID_API_KEY | ❌ No | 500 | Authentication failure |
| INVALID_RESPONSE | ❌ No | 400 | Bad request/response |
| VALIDATION_ERROR | ❌ No | 500 | Schema validation failure |

### Retry Strategy
- **Attempts**: 3 total (1 initial + 2 retries)
- **Backoff**: Exponential (1s, 2s, 4s, 8s)
- **Timeout**: 15 seconds per attempt
- **Rate Limit**: Respects Retry-After header

## 🛡️ Safety Filters

### Threshold: BLOCK_ONLY_HIGH
- Allows financial analysis content
- Blocks high-confidence harmful content
- Prevents false positives

### Categories
- HARM_CATEGORY_HARASSMENT
- HARM_CATEGORY_HATE_SPEECH
- HARM_CATEGORY_SEXUALLY_EXPLICIT
- HARM_CATEGORY_DANGEROUS_CONTENT

### Blocked Response
```json
{
  "success": false,
  "error": "Analysis blocked: Response blocked by safety filters. This may indicate the transaction data triggered safety filters. Please try again or contact support.",
  "timestamp": "2025-01-24T12:00:05Z"
}
```

## 📈 Monitoring

### Key Metrics
- **Token Usage**: promptTokens, completionTokens, totalTokens
- **Processing Time**: Milliseconds from request to response
- **Cost**: Calculated per request
- **Finish Reason**: STOP, MAX_TOKENS, SAFETY, RECITATION, OTHER
- **Error Rate**: By error type

### Logging
```javascript
// Request
console.log('🎯 Selected model: gemini-2.5-flash (transaction: 50 BTC)');
console.log('⚙️ Model config:', { temperature: 0.7, maxOutputTokens: 8192 });

// Response
console.log('✅ Gemini analysis completed successfully in 3234ms');
console.log('📊 Total tokens used: 3500 (prompt: 2000, completion: 1500)');
console.log('💰 Estimated cost: $0.000105');

// Error
console.error('❌ Gemini API error: 429 - Rate limit exceeded');
console.error('❌ Error classified as: RATE_LIMIT');
```

## 🔧 Configuration

### Model Selection
```typescript
import { selectGeminiModel, getModelConfig, getGeminiConfig } from '../../../utils/geminiConfig';

const config = getGeminiConfig();
const model = selectGeminiModel(transactionAmount, undefined, config);
const modelConfig = getModelConfig(model, config);
```

### Custom Threshold
```bash
# Use Pro for transactions >= 50 BTC
GEMINI_PRO_THRESHOLD_BTC=50
```

### Disable Thinking Mode
```bash
GEMINI_ENABLE_THINKING=false
```

### Increase Timeout
```bash
# 30 second timeout
GEMINI_TIMEOUT_MS=30000
```

### Reduce Max Retries
```bash
# Only 1 retry
GEMINI_MAX_RETRIES=1
```

## 🧪 Testing

### cURL Example
```bash
curl -X POST http://localhost:3000/api/whale-watch/analyze-gemini \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "test123",
    "blockchain": "Bitcoin",
    "amount": 150.5,
    "amountUSD": 14297500,
    "fromAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "toAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "timestamp": "2025-01-24T12:00:00Z",
    "type": "Large Transfer",
    "description": "Whale movement detected"
  }'
```

### JavaScript Example
```javascript
const response = await fetch('/api/whale-watch/analyze-gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    txHash: 'test123',
    blockchain: 'Bitcoin',
    amount: 150.5,
    amountUSD: 14297500,
    fromAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    toAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    timestamp: '2025-01-24T12:00:00Z',
    type: 'Large Transfer',
    description: 'Whale movement detected'
  })
});

const data = await response.json();
console.log(data);
```

## 🚨 Common Issues

### Issue: Rate Limit Exceeded
**Solution**: Wait 60 seconds or upgrade to pay-as-you-go tier

### Issue: Timeout
**Solution**: Increase `GEMINI_TIMEOUT_MS` or check network connection

### Issue: Invalid API Key
**Solution**: Verify `GEMINI_API_KEY` in `.env.local`

### Issue: Response Blocked
**Solution**: Review transaction data for potentially sensitive content

### Issue: MAX_TOKENS
**Solution**: Increase `GEMINI_FLASH_MAX_OUTPUT_TOKENS` or `GEMINI_PRO_MAX_OUTPUT_TOKENS`

## 📚 Resources

- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Pricing](https://ai.google.dev/pricing)
- [Quickstart](https://ai.google.dev/gemini-api/docs/quickstart)
- [Structured Outputs](https://ai.google.dev/gemini-api/docs/structured-output)
- [Safety Settings](https://ai.google.dev/gemini-api/docs/safety-settings)

## 📞 Support

For issues or questions:
1. Check logs in console
2. Review error type in response
3. Consult [GEMINI-API-IMPROVEMENTS.md](./GEMINI-API-IMPROVEMENTS.md)
4. Check official Gemini API documentation

---

**Last Updated**: January 25, 2025
**Version**: 1.0.0
