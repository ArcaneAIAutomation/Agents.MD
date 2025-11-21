# GPT-5.1 Quick Reference Guide

**For Developers**: Quick reference for using GPT-5.1 in the codebase

---

## Import the Shared Client

**Always use the shared OpenAI client** - never create your own instance:

```typescript
import { openai, callOpenAI, OPENAI_MODEL } from '../lib/openai';
```

---

## Basic Usage

### Simple API Call

```typescript
import { callOpenAI } from '../lib/openai';

const response = await callOpenAI(
  'Analyze this cryptocurrency market data...',
  4000 // max_output_tokens
);

console.log('Content:', response.content);
console.log('Model:', response.model);
console.log('Tokens:', response.tokensUsed);
```

### With Messages Array

```typescript
const response = await callOpenAI(
  [
    { role: 'user', content: 'Analyze BTC market conditions' }
  ],
  4000
);
```

### With Reasoning Effort

```typescript
const response = await callOpenAI(
  input,
  4000,
  'high' // reasoning effort: none, low, medium, high
);

// Access reasoning output
if (response.reasoning) {
  console.log('AI Reasoning:', response.reasoning);
}
```

### With Verbosity Control

```typescript
const response = await callOpenAI(
  input,
  4000,
  'medium', // reasoning effort
  'high'    // verbosity: low, medium, high
);
```

---

## Environment Variables

### Required

```bash
OPENAI_API_KEY=sk-...
```

### Optional (with defaults)

```bash
# Model Configuration
OPENAI_MODEL=gpt-5.1                    # Primary model
OPENAI_FALLBACK_MODEL=gpt-5-mini        # Fallback model

# Reasoning Configuration
REASONING_EFFORT=none                   # none, low, medium, high

# Verbosity Configuration
VERBOSITY=medium                        # low, medium, high

# Timeout Configuration
OPENAI_TIMEOUT=120000                   # 120 seconds
FALLBACK_TIMEOUT=30000                  # 30 seconds
```

---

## Response Format

```typescript
{
  content: string;        // AI-generated content
  tokensUsed: number;     // Total tokens consumed
  model: string;          // Actual model used (e.g., "gpt-5.1")
  reasoning?: string;     // Chain of thought reasoning (if available)
  responseId: string;     // Response ID for CoT passing
}
```

---

## Error Handling

### Automatic Fallback

The client automatically falls back to gpt-5-mini if gpt-5.1 fails:

```typescript
try {
  const response = await callOpenAI(input, 4000);
  // Will try gpt-5.1 first, then gpt-5-mini if it fails
} catch (error) {
  console.error('Both models failed:', error);
  // Implement your own fallback (e.g., Gemini AI)
}
```

### Manual Fallback

```typescript
let response;
try {
  response = await callOpenAI(input, 4000);
} catch (error) {
  console.error('OpenAI failed, using Gemini:', error);
  response = await callGeminiAPI(input);
}
```

---

## Timeout Handling

### With Promise.race

```typescript
const response = await Promise.race([
  callOpenAI(input, 4000),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 120000)
  )
]);
```

### With AbortSignal

```typescript
const response = await callOpenAI(
  input,
  4000,
  'medium',
  'medium'
);
// Timeout is handled internally (120s default)
```

---

## Common Patterns

### Trade Signal Generation

```typescript
import { callOpenAI } from '../lib/openai';

async function generateTradeSignal(context: string) {
  const response = await callOpenAI(
    [
      {
        role: 'user',
        content: `Generate a trade signal based on:\n${context}`
      }
    ],
    2000,
    'medium' // Use medium reasoning for trade signals
  );
  
  // Parse JSON response
  const signal = JSON.parse(response.content);
  
  // Include reasoning in output
  if (response.reasoning) {
    signal.aiReasoning += `\n\n[AI Reasoning]: ${response.reasoning}`;
  }
  
  return signal;
}
```

### Market Analysis

```typescript
async function analyzeMarket(symbol: string, data: any) {
  const response = await callOpenAI(
    `Analyze ${symbol} market conditions:\n${JSON.stringify(data)}`,
    4000,
    'high', // Use high reasoning for complex analysis
    'high'  // Use high verbosity for detailed output
  );
  
  return {
    analysis: response.content,
    reasoning: response.reasoning,
    model: response.model
  };
}
```

### Post-Trade Analysis

```typescript
async function analyzeCompletedTrade(trade: any) {
  const response = await callOpenAI(
    [
      {
        role: 'user',
        content: `Analyze this completed trade:\n${JSON.stringify(trade)}`
      }
    ],
    2000,
    'medium' // Medium reasoning for trade analysis
  );
  
  return JSON.parse(response.content);
}
```

---

## Reasoning Effort Guide

### When to Use Each Level

| Level | Use Case | Response Time | Quality |
|-------|----------|---------------|---------|
| **none** | Simple queries, fast responses | 5-10s | Good |
| **low** | Basic analysis, quick insights | 10-20s | Better |
| **medium** | Standard analysis, trade signals | 20-40s | Great |
| **high** | Complex analysis, critical decisions | 40-120s | Excellent |

### Examples

```typescript
// Fast response (none)
const quickSummary = await callOpenAI(input, 1000, 'none');

// Standard analysis (medium)
const tradeSignal = await callOpenAI(input, 2000, 'medium');

// Deep analysis (high)
const comprehensiveAnalysis = await callOpenAI(input, 4000, 'high');
```

---

## Verbosity Guide

### When to Use Each Level

| Level | Use Case | Output Length | Detail |
|-------|----------|---------------|--------|
| **low** | Summaries, quick answers | Short | Concise |
| **medium** | Standard responses | Medium | Balanced |
| **high** | Detailed analysis, reports | Long | Comprehensive |

### Examples

```typescript
// Concise output (low)
const summary = await callOpenAI(input, 1000, 'none', 'low');

// Balanced output (medium)
const analysis = await callOpenAI(input, 2000, 'medium', 'medium');

// Detailed output (high)
const report = await callOpenAI(input, 4000, 'high', 'high');
```

---

## Best Practices

### ✅ DO

- Use the shared `callOpenAI()` function
- Set appropriate reasoning effort for your use case
- Handle errors with fallback logic
- Include reasoning output in analysis
- Use timeouts for long-running requests
- Log model version for debugging

### ❌ DON'T

- Create your own OpenAI client instance
- Hardcode model names in your code
- Ignore reasoning output
- Skip error handling
- Use synchronous calls
- Forget to handle timeouts

---

## Debugging

### Check Model Version

```typescript
const response = await callOpenAI(input, 4000);
console.log('Model used:', response.model);
// Output: "gpt-5.1" or "gpt-5-mini (fallback)"
```

### Check Reasoning Output

```typescript
const response = await callOpenAI(input, 4000, 'high');
if (response.reasoning) {
  console.log('Reasoning process:', response.reasoning);
} else {
  console.log('No reasoning output (reasoning effort may be "none")');
}
```

### Check Token Usage

```typescript
const response = await callOpenAI(input, 4000);
console.log('Tokens used:', response.tokensUsed);
console.log('Cost estimate:', (response.tokensUsed / 1000000) * 2.50);
```

---

## Migration from Old Code

### Before (GPT-4)

```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4000
  })
});

const data = await response.json();
const content = data.choices[0].message.content;
```

### After (GPT-5.1)

```typescript
import { callOpenAI } from '../lib/openai';

const response = await callOpenAI(prompt, 4000);
const content = response.content;
```

**Benefits**:
- ✅ Automatic fallback to gpt-5-mini
- ✅ Reasoning output support
- ✅ Configurable via environment variables
- ✅ Better error handling
- ✅ Consistent across codebase

---

## Testing

### Unit Test Example

```typescript
import { callOpenAI } from '../lib/openai';

describe('OpenAI Client', () => {
  it('should generate valid response', async () => {
    const response = await callOpenAI('Test prompt', 1000);
    
    expect(response.content).toBeDefined();
    expect(response.model).toContain('gpt-5');
    expect(response.tokensUsed).toBeGreaterThan(0);
  });
  
  it('should include reasoning when requested', async () => {
    const response = await callOpenAI('Test prompt', 1000, 'high');
    
    expect(response.reasoning).toBeDefined();
  });
});
```

---

## Performance Tips

### 1. Use Appropriate Reasoning Effort

```typescript
// Fast queries - use 'none'
const quickAnswer = await callOpenAI(input, 1000, 'none');

// Complex analysis - use 'high'
const deepAnalysis = await callOpenAI(input, 4000, 'high');
```

### 2. Optimize Token Usage

```typescript
// Request only what you need
const response = await callOpenAI(
  input,
  1000, // Lower max_output_tokens for shorter responses
  'low' // Lower reasoning effort for faster responses
);
```

### 3. Implement Caching

```typescript
const cache = new Map();

async function getCachedAnalysis(key: string, input: string) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const response = await callOpenAI(input, 4000);
  cache.set(key, response);
  
  return response;
}
```

---

## Support

### Documentation

- **This Guide**: `GPT-5.1-QUICK-REFERENCE.md`
- **Migration Guide**: `GPT-5.1-MIGRATION-COMPLETE.md`
- **Core Client**: `lib/openai.ts`
- **OpenAI Docs**: https://platform.openai.com/docs/models/gpt-5-1

### Common Issues

**Issue**: "Model not found"
**Solution**: Check OPENAI_MODEL environment variable

**Issue**: "Timeout"
**Solution**: Increase OPENAI_TIMEOUT or use lower reasoning effort

**Issue**: "No reasoning output"
**Solution**: Set REASONING_EFFORT to 'low', 'medium', or 'high'

---

**Last Updated**: January 27, 2025  
**Version**: GPT-5.1  
**Status**: ✅ Production Ready
