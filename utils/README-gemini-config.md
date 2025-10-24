# Gemini API Configuration Guide

## Overview

This guide explains how to configure and use the Gemini 2.5 API for Whale Watch transaction analysis. The configuration system provides environment variable validation, model selection, and performance optimization.

## Quick Start

### 1. Get Your API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key (starts with `AIzaSy`)

### 2. Configure Environment Variables

Add to your `.env.local` file:

```bash
# Required
GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567

# Optional (with defaults)
GEMINI_MODEL=gemini-2.5-flash
GEMINI_ENABLE_THINKING=true
GEMINI_PRO_THRESHOLD_BTC=100
```

### 3. Validate Configuration

The configuration is automatically validated on startup in development mode. You can also manually validate:

```typescript
import { validateGeminiOnStartup } from './utils/validateGeminiStartup';

// Validate and log results
validateGeminiOnStartup();

// Validate and throw on error
validateGeminiOnStartup(true);
```

## Environment Variables

### Required Variables

#### `GEMINI_API_KEY`
- **Required**: Yes
- **Format**: Must start with `AIzaSy` and be 39 characters long
- **Example**: `AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567`
- **Get Key**: https://aistudio.google.com/app/apikey

### Optional Variables

#### `GEMINI_MODEL`
- **Default**: `gemini-2.5-flash`
- **Options**: `gemini-2.5-flash` | `gemini-2.5-pro`
- **Description**: Default model to use for analysis
- **Flash**: Fast (3s), optimized for transactions < 100 BTC
- **Pro**: Deep (7s), comprehensive analysis for large transactions

#### `GEMINI_ENABLE_THINKING`
- **Default**: `true`
- **Type**: Boolean
- **Description**: Enable thinking mode to show AI's reasoning process
- **UI Impact**: Displays collapsible "AI Reasoning Process" section

#### `GEMINI_PRO_THRESHOLD_BTC`
- **Default**: `100`
- **Range**: 1 - 10000
- **Description**: Minimum BTC amount to offer Deep Dive with Pro model
- **Example**: Set to `50` to offer Deep Dive for 50+ BTC transactions

#### `GEMINI_MAX_RETRIES`
- **Default**: `2`
- **Range**: 0 - 5
- **Description**: Maximum retry attempts for failed API calls
- **Behavior**: Uses exponential backoff (1s, 2s, 4s)

#### `GEMINI_TIMEOUT_MS`
- **Default**: `15000` (15 seconds)
- **Range**: 1000 - 60000
- **Description**: Request timeout in milliseconds
- **Behavior**: Returns partial analysis with disclaimer on timeout

#### `GEMINI_MAX_REQUESTS_PER_MINUTE`
- **Default**: `60`
- **Range**: 1 - 1000
- **Description**: Rate limit for API requests
- **Note**: Adjust based on your API quota

#### `GEMINI_FLASH_MAX_OUTPUT_TOKENS`
- **Default**: `8192`
- **Range**: 1024 - 65536
- **Description**: Maximum output tokens for Flash model
- **Cost Impact**: Lower values reduce cost but may truncate analysis

#### `GEMINI_PRO_MAX_OUTPUT_TOKENS`
- **Default**: `32768`
- **Range**: 1024 - 65536
- **Description**: Maximum output tokens for Pro model
- **Use Case**: Deep Dive comprehensive analysis

## Usage Examples

### Basic Configuration Loading

```typescript
import { loadGeminiConfig, getGeminiConfig } from './utils/geminiConfig';

// Load configuration (throws on error)
const config = loadGeminiConfig();

// Or use cached singleton
const config = getGeminiConfig();

console.log('Using model:', config.defaultModel);
console.log('Thinking enabled:', config.enableThinking);
```

### Model Selection

```typescript
import { selectGeminiModel } from './utils/geminiConfig';

// Automatic selection based on transaction size
const model = selectGeminiModel(150); // Returns 'gemini-2.5-pro' (>= 100 BTC)
const model = selectGeminiModel(50);  // Returns 'gemini-2.5-flash' (< 100 BTC)

// User preference override
const model = selectGeminiModel(50, 'pro'); // Returns 'gemini-2.5-pro'
```

### API Key Validation

```typescript
import { validateGeminiAPIKey } from './utils/geminiConfig';

const isValid = validateGeminiAPIKey('AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567');
// Returns: true

const isValid = validateGeminiAPIKey('invalid-key');
// Returns: false
```

### Startup Validation

```typescript
import { validateGeminiOnStartup, printGeminiConfigHelp } from './utils/validateGeminiStartup';

// Validate configuration
const isValid = validateGeminiOnStartup();

if (!isValid) {
  // Print help for configuration
  printGeminiConfigHelp();
}
```

### Get Model Configuration

```typescript
import { getGeminiConfig, getModelConfig } from './utils/geminiConfig';

const config = getGeminiConfig();
const flashConfig = getModelConfig('gemini-2.5-flash', config);

console.log('Temperature:', flashConfig.temperature);
console.log('Max tokens:', flashConfig.maxOutputTokens);
```

## Configuration Object Structure

```typescript
interface GeminiConfig {
  apiKey: string;
  defaultModel: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  enableThinking: boolean;
  proThresholdBTC: number;
  maxRetries: number;
  timeoutMs: number;
  maxRequestsPerMinute: number;
  flashConfig: {
    temperature: 0.7;
    topK: 40;
    topP: 0.95;
    maxOutputTokens: 8192;
  };
  proConfig: {
    temperature: 0.8;
    topK: 64;
    topP: 0.95;
    maxOutputTokens: 32768;
  };
}
```

## Model Comparison

| Feature | Flash (gemini-2.5-flash) | Pro (gemini-2.5-pro) |
|---------|-------------------------|---------------------|
| **Speed** | ~3 seconds | ~7 seconds |
| **Use Case** | Transactions < 100 BTC | Transactions >= 100 BTC |
| **Analysis Depth** | Standard | Deep Dive |
| **Max Output Tokens** | 8,192 | 32,768 |
| **Temperature** | 0.7 | 0.8 |
| **Cost** | Lower | Higher |
| **Blockchain History** | No | Yes (10 transactions) |
| **Multi-hop Tracing** | No | Yes (2-3 hops) |

## Error Handling

### Missing API Key

```
Error: [Gemini Config] GEMINI_API_KEY environment variable is required.
Get your API key from: https://aistudio.google.com/app/apikey
```

**Solution**: Add `GEMINI_API_KEY` to `.env.local`

### Invalid API Key Format

```
Error: [Gemini Config] Invalid GEMINI_API_KEY format.
API key must start with "AIzaSy" and be 39 characters long.
```

**Solution**: Verify your API key is correct and complete

### Invalid Model Name

```
Warning: [Gemini Config] Invalid GEMINI_MODEL="gemini-3.0", using default: gemini-2.5-flash
```

**Solution**: Use `gemini-2.5-flash` or `gemini-2.5-pro`

### Invalid Numeric Values

```
Warning: [Gemini Config] Invalid GEMINI_PRO_THRESHOLD_BTC=-10, using default: 100
```

**Solution**: Ensure numeric values are within valid ranges

## Performance Optimization

### Cost Management

```bash
# Reduce output tokens to lower costs
GEMINI_FLASH_MAX_OUTPUT_TOKENS=4096
GEMINI_PRO_MAX_OUTPUT_TOKENS=16384
```

### Speed Optimization

```bash
# Use Flash model by default
GEMINI_MODEL=gemini-2.5-flash

# Increase Pro threshold to use Flash more often
GEMINI_PRO_THRESHOLD_BTC=200
```

### Reliability

```bash
# Increase retries for unstable connections
GEMINI_MAX_RETRIES=3

# Increase timeout for slow networks
GEMINI_TIMEOUT_MS=20000
```

## Troubleshooting

### Configuration Not Loading

1. Check `.env.local` file exists in project root
2. Verify environment variables are set correctly
3. Restart development server after changes
4. Check console for validation errors

### API Key Not Working

1. Verify key starts with `AIzaSy`
2. Check key is 39 characters long
3. Ensure no extra spaces or quotes
4. Verify key is active in Google AI Studio

### Model Selection Issues

1. Check `GEMINI_MODEL` value is valid
2. Verify `GEMINI_PRO_THRESHOLD_BTC` is set correctly
3. Review console logs for model selection decisions

## Best Practices

1. **Always validate on startup**: Use `validateGeminiOnStartup()` in development
2. **Use environment-specific configs**: Different settings for dev/staging/prod
3. **Monitor costs**: Track token usage and adjust limits accordingly
4. **Handle errors gracefully**: Implement fallbacks for API failures
5. **Cache configuration**: Use `getGeminiConfig()` singleton to avoid reloading
6. **Log model selection**: Track which model is used for each analysis
7. **Test both models**: Verify Flash and Pro work correctly
8. **Document custom settings**: Comment why you changed defaults

## Related Documentation

- [Gemini Model Upgrade Design](.kiro/specs/gemini-model-upgrade/design.md)
- [Gemini Model Upgrade Requirements](.kiro/specs/gemini-model-upgrade/requirements.md)
- [Google Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Environment Variables Guide](.env.example)

## Support

For issues or questions:
1. Check validation errors in console
2. Review this documentation
3. Check `.env.example` for correct format
4. Verify API key in Google AI Studio
5. Review Gemini API documentation

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
