# API Usage Tracking

This document tracks all external API integrations across the Trading Intelligence Hub platform.

## 📊 **API Overview**

| API Service | Free Tier Limit | Current Usage | Status | Priority |
|-------------|-----------------|---------------|---------|----------|
| **OpenAI** | Pay-per-use | High (5 endpoints) | ✅ Active | 🔴 Critical |
| **NewsAPI** | 100 req/day | Medium (4 endpoints) | ✅ Active | 🟡 Important |
| **Alpha Vantage** | 25 req/day | Medium (3 endpoints) | ⚠️ Rate Limited | 🟡 Important |
| **CoinGecko** | 10-50 req/min | Low (2 endpoints) | ✅ Active | 🟢 Supporting |

---

## 🤖 **OpenAI API Usage**

**Purpose**: AI-powered market analysis and trading signal generation  
**Models**: `gpt-3.5-turbo`, `gpt-4o`  
**API Key**: `OPENAI_API_KEY`  
**Cost Model**: Pay-per-token usage  
**Status**: 🔴 **Critical** - Core platform functionality

### **Endpoints Using OpenAI:**

#### 1. **BTC Analysis API** (`/api/btc-analysis.ts`)
- **Model**: `gpt-3.5-turbo`
- **Function**: Bitcoin market analysis and trading insights
- **Token Usage**: High (complex market analysis prompts)
- **Fallback**: Static analysis if OpenAI fails

#### 2. **ETH Analysis API** (`/api/eth-analysis.ts`)
- **Model**: `gpt-3.5-turbo`
- **Function**: Ethereum market analysis and trading insights
- **Token Usage**: High (complex market analysis prompts)
- **Fallback**: Static analysis if OpenAI fails

#### 3. **Trade Generation API** (`/api/trade-generation.ts`)
- **Model**: `gpt-3.5-turbo`
- **Function**: AI-powered trading signal generation
- **Token Usage**: High (sophisticated reasoning)
- **Fallback**: None (core feature)

#### 4. **Trade Generation New API** (`/api/trade-generation-new.ts`)
- **Model**: `gpt-4o` (enhanced version)
- **Function**: Advanced AI trading signal generation
- **Token Usage**: Very High (GPT-4o reasoning)
- **Fallback**: Falls back to original trade generation

#### 5. **Nexo Regulatory API** (`/api/nexo-regulatory.ts`)
- **Model**: `gpt-3.5-turbo`
- **Function**: Regulatory news analysis and compliance insights
- **Token Usage**: Medium (regulatory analysis)
- **Fallback**: Static regulatory updates

### **OpenAI Cost Optimization:**
- Consider caching analysis results for similar market conditions
- Implement rate limiting to control token usage
- Use GPT-3.5-turbo for most analysis, GPT-4o only for premium features

---

## 📰 **NewsAPI Usage**

**Purpose**: Real-time cryptocurrency news aggregation  
**Rate Limit**: 100 requests per day (free tier)  
**API Key**: `NEWS_API_KEY`  
**Status**: 🟡 **Important** - News content and market sentiment

### **Endpoints Using NewsAPI:**

#### 1. **Crypto Herald API** (`/api/crypto-herald.ts`) - Primary
- **Query**: `bitcoin+OR+cryptocurrency+OR+crypto`
- **Time Range**: Last 10 days (including today)
- **Articles**: 20 → processed to 12
- **Language**: English only (`language=en`)
- **Usage**: ~10-20 requests/day
- **Fallback**: Alpha Vantage → Demo articles

#### 2. **BTC Analysis API** (`/api/btc-analysis.ts`)
- **Query**: `bitcoin+BTC+price+analysis`
- **Time Range**: Last 10 days (including today)
- **Articles**: 10
- **Language**: English only (`language=en`)
- **Usage**: ~5-10 requests/day
- **Fallback**: Alpha Vantage news → Static analysis

#### 3. **ETH Analysis API** (`/api/eth-analysis.ts`)
- **Query**: `ethereum+ETH+price+analysis`
- **Time Range**: Last 10 days (including today)
- **Articles**: 10
- **Language**: English only (`language=en`)
- **Usage**: ~5-10 requests/day
- **Fallback**: Alpha Vantage news → Static analysis

#### 4. **Nexo Regulatory API** (`/api/nexo-regulatory.ts`)
- **Queries**: Multiple regulatory searches (10-day range)
  - `Nexo+UK+regulatory+FCA`
  - `Nexo+cryptocurrency+regulation`
  - `FCA+cryptocurrency+regulation+UK`
  - `"Financial+Conduct+Authority"+crypto`
- **Time Range**: Last 10 days (including today)
- **Language**: English only (`language=en`)
- **Usage**: ~5-10 requests/day
- **Fallback**: Static regulatory content

### **NewsAPI Capacity:**
- **Current Usage**: ~25-50 requests/day
- **Available Capacity**: 50-75 requests/day remaining
- **Status**: 🟢 Well within limits

---

## 📈 **Alpha Vantage API Usage**

**Purpose**: Financial news sentiment analysis and market data  
**Rate Limit**: 25 requests per day (free tier)  
**API Key**: `ALPHA_VANTAGE_API_KEY`  
**Status**: ⚠️ **Rate Limited** - Often hits daily limit

### **Endpoints Using Alpha Vantage:**

#### 1. **Crypto Herald API** (`/api/crypto-herald.ts`) - Primary
- **Function**: `NEWS_SENTIMENT`
- **Tickers**: `CRYPTO:BTC,CRYPTO:ETH`
- **Topics**: `blockchain,technology`
- **Articles**: 20 → processed to 15
- **Usage**: ~10-15 requests/day
- **Status**: Often rate limited, falls back to NewsAPI

#### 2. **BTC Analysis API** (`/api/btc-analysis.ts`)
- **Function**: `NEWS_SENTIMENT`
- **Tickers**: `CRYPTO:BTC`
- **Usage**: ~5-10 requests/day
- **Status**: Rate limited, falls back to NewsAPI

#### 3. **ETH Analysis API** (`/api/eth-analysis.ts`)
- **Function**: `NEWS_SENTIMENT`
- **Tickers**: `CRYPTO:ETH`
- **Usage**: ~5-10 requests/day
- **Status**: Rate limited, falls back to NewsAPI

### **Alpha Vantage Limitations:**
- **Daily Limit**: 25 requests (easily exceeded)
- **Current Usage**: ~20-35 requests/day (over limit)
- **Impact**: All endpoints gracefully fall back to NewsAPI
- **Recommendation**: Consider premium tier or optimize usage

---

## 🪙 **CoinGecko API Usage**

**Purpose**: Real-time cryptocurrency market data  
**Rate Limit**: 10-50 requests per minute (generous)  
**API Key**: None required (public API)  
**Status**: 🟢 **Reliable** - No rate limit issues

### **Endpoints Using CoinGecko:**

#### 1. **Crypto Herald API** (`/api/crypto-herald.ts`)
- **Endpoint**: `/coins/markets`
- **Data**: Top 8 cryptocurrencies by market cap
- **Refresh**: Per Herald request
- **Fallback**: Static market data

#### 2. **Market Data Components** (Implied usage)
- **Real-time Prices**: BTC, ETH, SOL, XRP, ADA prices
- **24h Changes**: Price change percentages
- **Usage**: Low, well within limits

---

## 🔄 **API Fallback Strategy**

### **News APIs Hierarchy:**
```
Primary: Alpha Vantage (sentiment analysis)
    ↓ (rate limited)
Fallback: NewsAPI (broad news coverage)
    ↓ (rate limited)
Final: Demo Articles (always available)
```

### **Market Data Hierarchy:**
```
Primary: CoinGecko (real-time data)
    ↓ (API failure)
Fallback: Static market data
```

### **AI Analysis Hierarchy:**
```
Primary: OpenAI (dynamic analysis)
    ↓ (API failure)
Fallback: Static analysis templates
```

---

## 📊 **Daily API Usage Estimate**

| API | Estimated Daily Requests | Limit | Usage % |
|-----|-------------------------|--------|---------|
| OpenAI | ~50-100 API calls | Pay-per-use | N/A |
| NewsAPI | ~25-50 requests | 100/day | 25-50% |
| Alpha Vantage | ~20-35 requests | 25/day | 80-140% ⚠️ |
| CoinGecko | ~10-20 requests | ~1440/day | <2% |

---

## 🚨 **Critical API Dependencies**

### **High Priority (Platform Fails Without):**
1. **OpenAI** - Core AI analysis functionality
2. **CoinGecko** - Market data for analysis

### **Medium Priority (Graceful Degradation):**
3. **NewsAPI** - News content (has fallbacks)
4. **Alpha Vantage** - Enhanced sentiment (has fallbacks)

---

## 🔧 **Optimization Recommendations**

### **Immediate Actions:**
1. **Alpha Vantage**: Hitting rate limits daily
   - Consider premium tier ($25/month for 75 requests/day)
   - Or optimize usage priority (Herald only)

2. **NewsAPI**: Well within limits
   - Current usage is sustainable
   - Can handle growth

3. **OpenAI**: Monitor token costs
   - Implement caching for similar requests
   - Consider prompt optimization

### **Future Considerations:**
- **API Key Rotation**: Implement multiple API keys for higher limits
- **Caching Strategy**: Cache news and analysis for similar queries
- **Usage Analytics**: Track actual API usage vs estimates

---

## 📝 **Environment Variables Required**

```bash
# Critical APIs
OPENAI_API_KEY=sk-proj-...           # OpenAI for AI analysis
NEWS_API_KEY=...                     # NewsAPI for news content
ALPHA_VANTAGE_API_KEY=...           # Alpha Vantage for sentiment

# Optional APIs
CRYPTO_NEWS_API_KEY=...             # Alternative news source
BRAVE_SEARCH_API_KEY=...            # Web search capability
SCRAPINGBEE_API_KEY=...             # Web scraping service
```

---

## 📈 **Growth Planning**

### **Current Capacity:**
- Can handle ~100-200 daily active users with current API limits
- OpenAI costs will scale with usage

### **Scale-Up Triggers:**
- **NewsAPI**: Upgrade at 80+ requests/day
- **Alpha Vantage**: Upgrade immediately (already over limit)
- **OpenAI**: Monitor monthly costs

### **Premium Tier Costs:**
- **NewsAPI Business**: $449/month (unlimited)
- **Alpha Vantage Premium**: $25/month (75 requests/day)
- **OpenAI**: Variable based on token usage

---

*Last Updated: August 22, 2025*  
*Next Review: Weekly during active development*
