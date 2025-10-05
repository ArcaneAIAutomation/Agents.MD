# Caesar API Quick Start Guide

## What is Caesar?

Caesar is a **research engine API** that searches, synthesizes, and cites information. It's perfect for:
- ✅ Crypto news briefs
- ✅ Market intelligence reports
- ✅ Due diligence research
- ✅ Regulatory monitoring

**NOT for**: Real-time price data, order books, or trade execution (use exchange APIs for that)

## Quick Reference

### Base URL
```
https://api.caesar.xyz
```

### Authentication
```
Authorization: Bearer sk-572d19cd4d21.0XRZ1wLU0Vwnr6TpYkw3L2sWNgcsvzpXVuhVMN93HII
```

### Beta Limits
- 5 concurrent research jobs
- 200 monthly Compute Units (CU)
- Requires 10,000 $CAESAR tokens (or email support)

## Available Endpoints

### 1. Crypto News Brief
Get structured crypto news for specific assets:

```bash
GET /api/caesar/crypto-news?assets=BTC,ETH,SOL&hours=12&format=json
```

**Parameters:**
- `assets` - Comma-separated list (default: BTC,ETH,SOL)
- `hours` - Lookback period (default: 12)
- `format` - json or markdown (default: json)

**Response:**
```json
{
  "success": true,
  "data": {
    "date_utc": "2025-01-05T...",
    "items": [
      {
        "asset": "BTC",
        "headline": "Bitcoin surges past $45k on ETF optimism",
        "summary": "Brief summary of the news...",
        "url": "https://source.com/article",
        "time_utc": "2025-01-05T10:30:00Z"
      }
    ],
    "job_id": "research_abc123"
  }
}
```

### 2. Market Research
Deep dive research on any crypto topic:

```bash
GET /api/caesar/market-research?topic=Ethereum%20Layer%202%20scaling&depth=3
```

**Parameters:**
- `topic` - Research question (required)
- `depth` - Compute units 1-10 (default: 3, higher = deeper research)

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "research_xyz789",
    "content": "Comprehensive research synthesis with citations...",
    "sources": [
      {
        "title": "Source article title",
        "url": "https://source.com",
        "citation_index": 1
      }
    ]
  }
}
```

## Usage Examples

### Get Latest Bitcoin News
```bash
curl http://localhost:3000/api/caesar/crypto-news?assets=BTC&hours=6
```

### Research DeFi Protocol
```bash
curl "http://localhost:3000/api/caesar/market-research?topic=Uniswap%20v4%20features&depth=5"
```

### Multi-Asset News Brief
```bash
curl http://localhost:3000/api/caesar/crypto-news?assets=BTC,ETH,SOL,AVAX&hours=24&format=json
```

## How It Works

1. **Submit Query**: Your endpoint creates a research job via Caesar API
2. **Caesar Researches**: Searches multiple sources, synthesizes information
3. **Poll for Results**: Endpoint polls until job completes (usually 1-5 minutes)
4. **Return Data**: Structured output with citations and sources

## Compute Units (CU)

- **1 CU** (~1 min): Quick summary, basic research
- **2-3 CU** (~2-3 min): Balanced speed/depth (recommended for news)
- **5+ CU** (~5+ min): Deep research with multiple passes
- **10 CU** (~10 min): Maximum depth (diminishing returns)

## Best Practices

### For News Briefs
- Use 2-3 CU for balanced results
- Specify exact assets to focus research
- Use system_prompt for structured JSON output
- Cache results for 5-10 minutes

### For Deep Research
- Use 3-5 CU for comprehensive analysis
- Be specific in your query
- Cache results for 30+ minutes
- Use sources array to show citations

### Error Handling
- Expect 429 (rate limit) - implement backoff
- Jobs can fail - check status before using results
- Timeout after reasonable period (5-10 minutes)
- Always validate response structure

## Integration with Trading

Caesar provides **intelligence**, not **execution**:

```
┌─────────────┐
│   Caesar    │ ← Research & News
│  (Research) │
└─────────────┘
       ↓
┌─────────────┐
│  Your App   │ ← Analysis & Decision
│  (AgentMDC) │
└─────────────┘
       ↓
┌─────────────┐
│  Exchange   │ ← Price Data & Trading
│ (Binance/   │
│  Coinbase)  │
└─────────────┘
```

**Recommended Stack:**
- **Caesar**: News, research, due diligence
- **CoinGecko/Kraken**: Real-time price data
- **Binance/Coinbase API**: Trade execution
- **OpenAI**: Additional AI analysis

## Testing

### Test News Endpoint
```bash
# Local
curl http://localhost:3000/api/caesar/crypto-news?assets=BTC&hours=1

# Production
curl https://agentmdc-4vf3ox2yc-arcane-ai-automations-projects.vercel.app/api/caesar/crypto-news?assets=BTC&hours=1
```

### Test Research Endpoint
```bash
# Local
curl "http://localhost:3000/api/caesar/market-research?topic=Bitcoin%20halving%202024&depth=2"

# Production
curl "https://agentmdc-4vf3ox2yc-arcane-ai-automations-projects.vercel.app/api/caesar/market-research?topic=Bitcoin%20halving%202024&depth=2"
```

## Next Steps

1. **Test the endpoints** - Try the curl commands above
2. **Create UI components** - Display news briefs in your dashboard
3. **Add more endpoints** - Regulatory intelligence, DeFi analysis, etc.
4. **Integrate with trading** - Combine Caesar research with exchange APIs

## Support

- **Caesar Docs**: https://docs.caesar.xyz
- **API Keys**: https://ask.caesar.xyz/app/api-keys
- **Vercel Dashboard**: https://vercel.com/arcane-ai-automations-projects/agentmdc
- **GitHub**: https://github.com/ArcaneAIAutomation/Agents.MD/tree/AgentMDC
