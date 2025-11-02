# UCIE Caesar AI Integration

## Overview

This directory contains the Caesar AI research integration for the Universal Crypto Intelligence Engine (UCIE). Caesar AI provides deep, comprehensive research on cryptocurrency tokens with source citations and confidence scoring.

## Components

### 1. CaesarResearchPanel.tsx
Main display component for Caesar AI research results.

**Features:**
- Technology overview with detailed analysis
- Team and leadership information
- Partnerships and ecosystem details
- Risk factors with visual warnings
- Source citations with clickable links
- Confidence score visualization
- Loading and error states

**Usage:**
```tsx
import CaesarResearchPanel from './components/UCIE/CaesarResearchPanel';

<CaesarResearchPanel
  symbol="BTC"
  research={researchData}
  loading={false}
  error={null}
/>
```

### 2. CaesarResearchExample.tsx
Example component demonstrating complete Caesar research workflow.

**Features:**
- Token symbol search input
- Automatic research fetching
- Cache indicator
- Refresh functionality
- Instructions for users

**Usage:**
```tsx
import CaesarResearchExample from './components/UCIE/CaesarResearchExample';

<CaesarResearchExample />
```

## Library Functions

### lib/ucie/caesarClient.ts
Core Caesar AI client utilities for UCIE.

**Key Functions:**

#### `generateCryptoResearchQuery(symbol: string): string`
Generates comprehensive research query for a cryptocurrency token.

#### `generateSystemPrompt(): string`
Creates system prompt for structured JSON output.

#### `createCryptoResearch(symbol: string, computeUnits?: number)`
Creates a Caesar research job.
- **symbol**: Token symbol (e.g., "BTC")
- **computeUnits**: 1-10 (default 5 for deep analysis)
- **Returns**: `{ jobId, status }`

#### `pollCaesarResearch(jobId: string, maxWaitTime?: number, pollInterval?: number)`
Polls research job until completion.
- **jobId**: Research job ID
- **maxWaitTime**: Max wait in seconds (default 600 = 10 minutes)
- **pollInterval**: Poll interval in ms (default 3000 = 3 seconds)
- **Returns**: Completed `ResearchJob`

#### `parseCaesarResearch(job: ResearchJob): UCIECaesarResearch`
Parses Caesar research results into UCIE format.

#### `performCryptoResearch(symbol: string, computeUnits?: number, maxWaitTime?: number)`
Complete workflow: create, poll, and parse research.
- **Returns**: `UCIECaesarResearch`

#### `handleResearchError(error: unknown): UCIECaesarResearch`
Generates fallback data for error cases.

**Example:**
```typescript
import { performCryptoResearch } from './lib/ucie/caesarClient';

// Complete research workflow
const research = await performCryptoResearch('BTC', 5, 600);
console.log(research.technologyOverview);
console.log(research.confidence);
```

## API Endpoints

### GET /api/ucie/research/[symbol]
Fetches Caesar AI research for a cryptocurrency token.

**Parameters:**
- `symbol` (path): Token symbol (e.g., "BTC", "ETH")

**Response:**
```typescript
{
  success: true,
  data: {
    technologyOverview: string,
    teamLeadership: string,
    partnerships: string,
    marketPosition: string,
    riskFactors: string[],
    recentDevelopments: string,
    sources: Array<{
      title: string,
      url: string,
      relevance: number,
      citationIndex: number
    }>,
    confidence: number
  },
  cached: boolean,
  timestamp: string
}
```

**Caching:**
- Results are cached for 24 hours
- Cache is in-memory (consider Redis for production)
- Cached responses include `cached: true` flag

**Example:**
```typescript
const response = await fetch('/api/ucie/research/BTC');
const data = await response.json();

if (data.success) {
  console.log('Research:', data.data);
  console.log('Cached:', data.cached);
}
```

## React Hooks

### useCaesarResearch(symbol, enabled)
React hook for fetching Caesar AI research.

**Parameters:**
- `symbol`: Token symbol (e.g., "BTC") or null
- `enabled`: Whether to fetch automatically (default: true)

**Returns:**
```typescript
{
  research: UCIECaesarResearch | null,
  loading: boolean,
  error: string | null,
  cached: boolean,
  refetch: () => Promise<void>
}
```

**Example:**
```tsx
import { useCaesarResearch } from './hooks/useCaesarResearch';

function MyComponent() {
  const { research, loading, error, cached, refetch } = useCaesarResearch('BTC');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!research) return null;

  return (
    <div>
      <h1>{research.technologyOverview}</h1>
      {cached && <button onClick={refetch}>Refresh</button>}
    </div>
  );
}
```

## Data Types

### UCIECaesarResearch
```typescript
interface UCIECaesarResearch {
  technologyOverview: string;
  teamLeadership: string;
  partnerships: string;
  marketPosition: string;
  riskFactors: string[];
  recentDevelopments: string;
  sources: Array<{
    title: string;
    url: string;
    relevance: number;
    citationIndex: number;
  }>;
  confidence: number; // 0-100
  rawContent?: string;
}
```

### UCIECaesarStatus
```typescript
interface UCIECaesarStatus {
  jobId: string;
  status: ResearchStatus;
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
}
```

## Configuration

### Environment Variables
```bash
# Caesar API Key (required)
CAESAR_API_KEY=sk-your-api-key-here

# Optional: Base URL (defaults to https://api.caesar.xyz)
CAESAR_API_BASE_URL=https://api.caesar.xyz
```

### Compute Units
- **1 CU**: ~1 minute, basic research
- **2 CU**: ~2 minutes, balanced speed/depth
- **5 CU**: ~5 minutes, deep research (recommended for UCIE)
- **7 CU**: ~7 minutes, comprehensive analysis
- **10 CU**: ~10 minutes, maximum depth

## Performance Considerations

### Timeouts
- Default max wait time: 10 minutes (600 seconds)
- Polling interval: 3 seconds
- API endpoint timeout: Vercel serverless limit (10s Hobby, 60s Pro)

### Caching Strategy
- **Cache TTL**: 24 hours
- **Cache Storage**: In-memory Map (consider Redis for production)
- **Cache Key**: Uppercase token symbol
- **Cache Invalidation**: Automatic after TTL expiration

### Error Handling
- Network errors: Retry with exponential backoff
- Timeout errors: Return fallback data
- API errors: Log and return error response
- Parse errors: Use raw content as fallback

## Best Practices

### 1. Always Handle Loading States
```tsx
if (loading) {
  return <LoadingSpinner />;
}
```

### 2. Provide Error Fallbacks
```tsx
if (error) {
  return <ErrorMessage error={error} />;
}
```

### 3. Show Cache Indicators
```tsx
{cached && (
  <div>
    Cached results • <button onClick={refetch}>Refresh</button>
  </div>
)}
```

### 4. Validate Input
```typescript
const symbolRegex = /^[A-Z0-9]{1,10}$/i;
if (!symbolRegex.test(symbol)) {
  throw new Error('Invalid symbol format');
}
```

### 5. Use Appropriate Compute Units
- Quick analysis: 2 CU
- Standard analysis: 5 CU (recommended)
- Deep dive: 7-10 CU

## Testing

### Manual Testing
```bash
# Test API endpoint
curl http://localhost:3000/api/ucie/research/BTC

# Test with different symbols
curl http://localhost:3000/api/ucie/research/ETH
curl http://localhost:3000/api/ucie/research/SOL
```

### Component Testing
```tsx
import { render, screen } from '@testing-library/react';
import CaesarResearchPanel from './CaesarResearchPanel';

test('displays research data', () => {
  const mockResearch = {
    technologyOverview: 'Test overview',
    confidence: 85,
    // ... other fields
  };

  render(<CaesarResearchPanel symbol="BTC" research={mockResearch} />);
  
  expect(screen.getByText('Test overview')).toBeInTheDocument();
  expect(screen.getByText('85%')).toBeInTheDocument();
});
```

## Troubleshooting

### Issue: Research takes too long
**Solution**: Reduce compute units or increase timeout
```typescript
const research = await performCryptoResearch('BTC', 2, 300); // 2 CU, 5 min timeout
```

### Issue: Cache not working
**Solution**: Check cache TTL and ensure symbol is uppercase
```typescript
const normalizedSymbol = symbol.toUpperCase();
const cached = getCachedResearch(normalizedSymbol);
```

### Issue: API timeout on Vercel
**Solution**: Use polling approach instead of waiting for completion
```typescript
// Don't wait in API route, return job ID immediately
const { jobId } = await createCryptoResearch(symbol);
return res.json({ jobId, status: 'queued' });

// Poll from client side
const job = await pollCaesarResearch(jobId);
```

### Issue: Parse errors
**Solution**: Check system prompt format and handle parse failures
```typescript
try {
  const parsed = JSON.parse(job.transformed_content);
} catch (error) {
  // Fallback to raw content
  return { technologyOverview: job.content, ... };
}
```

## Future Enhancements

1. **Redis Caching**: Replace in-memory cache with Redis for distributed caching
2. **Streaming Results**: Stream research results as they become available
3. **Progress Updates**: Real-time progress updates via WebSocket
4. **Batch Research**: Support multiple tokens in single request
5. **Custom Queries**: Allow users to customize research queries
6. **Export Formats**: PDF, JSON, Markdown export options
7. **Historical Tracking**: Track research over time for trend analysis

## Related Documentation

- [Caesar API Reference](../../.kiro/steering/caesar-api-reference.md)
- [UCIE Design Document](../../.kiro/specs/universal-crypto-intelligence/design.md)
- [UCIE Requirements](../../.kiro/specs/universal-crypto-intelligence/requirements.md)
- [API Integration Guide](../../.kiro/steering/api-integration.md)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Caesar API documentation: https://docs.caesar.xyz
3. Check Vercel function logs for API errors
4. Review browser console for client-side errors

---

**Status**: ✅ Complete and Ready for Use
**Version**: 1.0.0
**Last Updated**: January 2025
