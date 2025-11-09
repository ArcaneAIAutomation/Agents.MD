# Kiro Agent Steering - Complete System Guide

**Last Updated**: January 27, 2025  
**Version**: 2.0  
**Priority**: CRITICAL - Read before any development work

---

## 🎯 What is Agents.MD?

Agents.MD (Bitcoin Sovereign Technology) is a comprehensive cryptocurrency intelligence platform featuring:
- **Whale Watch**: Real-time Bitcoin whale transaction tracking with Gemini AI analysis
- **UCIE**: Universal Crypto Intelligence Engine (comprehensive multi-source analysis)
- **Secure Authentication**: Access code-based user system with session management
- **Multi-Source Data**: 13+ API integrations (92.9% uptime)
- **AI-Powered Analysis**: Caesar AI, OpenAI GPT-4o, Gemini AI

---

## 🚨 CRITICAL SYSTEM RULES

### Rule #1: UCIE System Architecture (MOST IMPORTANT)

**If working on UCIE (Universal Crypto Intelligence Engine), you MUST follow these rules:**

#### AI Analysis Happens LAST
**OpenAI/ChatGPT/Caesar AI analysis MUST happen LAST, ONLY after ALL API data has been fetched and stored in the Supabase database.**

**Why**: AI needs complete context (all 10 data sources) for maximum analysis quality.

**Execution Order**:
```
Phase 1: Market Data → Cache in DB → ✅
Phase 2: Sentiment & News → Cache in DB → ✅
Phase 3: Technical, On-Chain, Risk, Predictions, Derivatives, DeFi → Cache in DB → ✅
⏸️ CHECKPOINT: Verify data quality ≥ 70%
Phase 4: Retrieve ALL data → Aggregate context → Call AI → ✅
```

**NEVER**:
- ❌ Call AI before data is cached
- ❌ Call AI in parallel with data fetching
- ❌ Call AI with partial context

**ALWAYS**:
- ✅ Fetch and cache ALL data first
- ✅ Verify data quality (minimum 70%)
- ✅ Aggregate complete context
- ✅ THEN call AI with full context

#### Database is Source of Truth
**All UCIE data MUST be stored in Supabase database. NEVER use in-memory cache.**

**Why**: Serverless functions restart frequently, in-memory cache is lost.

**ALWAYS**:
```typescript
// ✅ CORRECT
const cached = await getCachedAnalysis('BTC', 'market-data');
await setCachedAnalysis('BTC', 'market-data', data, 300, 100);
```

**NEVER**:
```typescript
// ❌ WRONG
const cache = new Map();
cache.set('BTC', data); // Lost on serverless restart
```

#### Use Utility Functions
**NEVER write direct database queries. ALWAYS use provided utilities.**

**Required Imports**:
```typescript
import { getCachedAnalysis, setCachedAnalysis } from '../lib/ucie/cacheUtils';
import { getComprehensiveContext, formatContextForAI } from '../lib/ucie/contextAggregator';
```

**See**: `.kiro/steering/ucie-system.md` for complete UCIE documentation.

### Rule #2: Authentication System

**All protected routes require authentication check:**

```typescript
import { verifyAuth } from '../lib/auth';

export default async function handler(req, res) {
  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Continue with authenticated logic
}
```

### Rule #3: Error Handling

**All API endpoints must have comprehensive error handling:**

```typescript
export default async function handler(req, res) {
  try {
    // Main logic
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
```

### Rule #4: Environment Variables

**All sensitive data must be in environment variables:**

```typescript
// ✅ CORRECT
const apiKey = process.env.COINGECKO_API_KEY;

// ❌ WRONG
const apiKey = 'hardcoded-key';
```

---

## 📊 System Architecture

### Database (Supabase PostgreSQL)

**Connection**: `lib/db.ts` - Connection pool with retry logic

**Key Tables**:
- `users` - User accounts and authentication
- `access_codes` - Authentication access codes
- `sessions` - User sessions (1-hour expiration)
- `auth_logs` - Authentication event logging
- `ucie_analysis_cache` - UCIE cached analysis results (TTL: 5min-24h)
- `ucie_phase_data` - UCIE session-based phase data (TTL: 1h)
- `ucie_watchlist` - User crypto watchlists
- `ucie_alerts` - User alerts and notifications

### API Structure

**Authentication**:
- `/api/auth/register` - Register with access code
- `/api/auth/login` - Login with email/password
- `/api/auth/logout` - Logout and clear session
- `/api/auth/me` - Get current user info

**Whale Watch**:
- `/api/whale-watch/detect` - Detect whale transactions
- `/api/whale-watch/analyze` - Start Gemini AI analysis
- `/api/whale-watch/analysis/[jobId]` - Poll analysis results

**UCIE (Phase 1-3 - Data Fetching)**:
- `/api/ucie/market-data/[symbol]` - Market data (CoinGecko, CMC, Kraken)
- `/api/ucie/sentiment/[symbol]` - Social sentiment (LunarCrush, Twitter, Reddit)
- `/api/ucie/news/[symbol]` - News articles (NewsAPI, CryptoCompare)
- `/api/ucie/technical/[symbol]` - Technical indicators (calculated)
- `/api/ucie/on-chain/[symbol]` - Blockchain data (Etherscan, Blockchain.com)
- `/api/ucie/risk/[symbol]` - Risk assessment (calculated)
- `/api/ucie/predictions/[symbol]` - Price predictions (calculated)
- `/api/ucie/derivatives/[symbol]` - Derivatives data (CoinGlass, Binance)
- `/api/ucie/defi/[symbol]` - DeFi metrics (DeFiLlama)

**UCIE (Phase 4 - AI Analysis)**:
- `/api/ucie/research/[symbol]` - Caesar AI research (ONLY after all data cached)

### Frontend Structure

**Pages**:
- `/` - Landing page
- `/whale-watch` - Whale transaction dashboard
- `/ucie` - Universal Crypto Intelligence Engine
- `/auth/login` - Login page
- `/auth/register` - Registration page

**Components**:
- `components/WhaleWatch/` - Whale tracking components
- `components/UCIE/` - Crypto intelligence components
- `components/auth/` - Authentication components
- `components/ui/` - Shared UI components

---

## 🔧 Key Utilities

### Database (`lib/db.ts`)

```typescript
import { query, queryOne, queryMany, transaction } from '../lib/db';

// Execute query
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);

// Get single row
const user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);

// Get multiple rows
const users = await queryMany('SELECT * FROM users');

// Transaction
await transaction(async (client) => {
  await client.query('INSERT INTO...');
  await client.query('UPDATE...');
});
```

### Authentication (`lib/auth.ts`)

```typescript
import { verifyAuth, generateToken, hashPassword } from '../lib/auth';

// Verify authentication
const authResult = await verifyAuth(req);
if (!authResult.success) {
  return res.status(401).json({ error: 'Unauthorized' });
}

// Generate JWT token
const token = generateToken(userId);

// Hash password
const hashedPassword = await hashPassword(password);
```

### UCIE Cache (`lib/ucie/cacheUtils.ts`)

```typescript
import { getCachedAnalysis, setCachedAnalysis } from '../lib/ucie/cacheUtils';

// Read from cache
const cached = await getCachedAnalysis('BTC', 'market-data');

// Write to cache
await setCachedAnalysis('BTC', 'market-data', data, 300, 100);
```

### UCIE Context (`lib/ucie/contextAggregator.ts`)

```typescript
import { getComprehensiveContext, formatContextForAI } from '../lib/ucie/contextAggregator';

// Get all cached data
const context = await getComprehensiveContext('BTC');

// Verify data quality
if (context.dataQuality < 70) {
  throw new Error('Insufficient data for analysis');
}

// Format for AI
const prompt = formatContextForAI(context);
```

---

## 🧪 Testing

### Database Tests

```bash
# Verify database connection
npx tsx scripts/test-database-access.ts

# Verify UCIE cache
npx tsx scripts/verify-database-storage.ts
```

### API Tests

```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test UCIE market data
curl http://localhost:3000/api/ucie/market-data/BTC

# Test UCIE research (should wait for data)
curl http://localhost:3000/api/ucie/research/BTC
```

---

## 🚨 Common Mistakes to Avoid

### UCIE-Related Mistakes

1. **Using In-Memory Cache**
   ```typescript
   // ❌ WRONG
   const cache = new Map();
   cache.set('BTC', data);
   
   // ✅ CORRECT
   await setCachedAnalysis('BTC', 'market-data', data, 300, 100);
   ```

2. **Calling AI Before Data is Ready**
   ```typescript
   // ❌ WRONG
   const research = await callCaesarAPI(symbol); // No context
   
   // ✅ CORRECT
   const context = await getComprehensiveContext(symbol);
   if (context.dataQuality < 70) throw new Error('Insufficient data');
   const research = await callCaesarAPI(formatContextForAI(context));
   ```

3. **Direct Database Queries**
   ```typescript
   // ❌ WRONG
   const result = await query('SELECT * FROM ucie_analysis_cache...');
   
   // ✅ CORRECT
   const cached = await getCachedAnalysis(symbol, type);
   ```

### General Mistakes

1. **Missing Authentication**
   ```typescript
   // ❌ WRONG
   export default async function handler(req, res) {
     // No auth check
   }
   
   // ✅ CORRECT
   export default async function handler(req, res) {
     const authResult = await verifyAuth(req);
     if (!authResult.success) return res.status(401).json({error: 'Unauthorized'});
   }
   ```

2. **Missing Error Handling**
   ```typescript
   // ❌ WRONG
   const data = await fetchAPI(); // Can throw
   
   // ✅ CORRECT
   try {
     const data = await fetchAPI();
   } catch (error) {
     console.error('API Error:', error);
     return res.status(500).json({error: 'Failed to fetch data'});
   }
   ```

3. **Hardcoded Values**
   ```typescript
   // ❌ WRONG
   const apiKey = 'sk-1234567890';
   
   // ✅ CORRECT
   const apiKey = process.env.OPENAI_API_KEY;
   ```

---

## 📋 Development Workflow

### Before Starting Any Work

1. **Read relevant steering documents**:
   - This document (KIRO-AGENT-STEERING.md)
   - Feature-specific steering (e.g., ucie-system.md)
   - API integration guidelines

2. **Verify system status**:
   ```bash
   # Check database
   npx tsx scripts/test-database-access.ts
   
   # Check UCIE cache
   npx tsx scripts/verify-database-storage.ts
   ```

3. **Check current branch and pull latest**:
   ```bash
   git status
   git pull origin main
   ```

### During Development

1. **Follow the rules** (especially UCIE system rules)
2. **Use provided utilities** (don't reinvent)
3. **Add comprehensive error handling**
4. **Test thoroughly** before committing
5. **Update documentation** if needed

### Before Committing

1. **Test all changes**:
   ```bash
   npm run dev # Test locally
   npm run build # Verify build
   ```

2. **Run relevant tests**:
   ```bash
   # For UCIE changes
   npx tsx scripts/test-database-access.ts
   npx tsx scripts/verify-database-storage.ts
   ```

3. **Commit with descriptive message**:
   ```bash
   git add -A
   git commit -m "feat(ucie): Add context aggregation for AI analysis"
   git push origin main
   ```

---

## 📊 Current System Status (January 27, 2025)

### ✅ Operational Systems

- **Database**: Supabase PostgreSQL (17ms latency, 100% uptime)
- **Authentication**: JWT-based with access codes (session-only, 1-hour expiration)
- **Whale Watch**: Real-time tracking with Gemini AI (100% functional)
- **API Integration**: 13/14 sources working (92.9% uptime)
- **UCIE Database**: Cache system operational (10/10 tests passing)
- **UCIE Context**: Aggregation system complete

### 🔄 In Progress

- **UCIE System**: 85% complete
  - ✅ Database integration complete
  - ✅ Context aggregator complete
  - ✅ AI execution order specified
  - ⏳ API endpoint updates needed (8-10 hours)
  - ⏳ End-to-end testing needed

### 📋 Planned

- Mobile optimization enhancements
- Advanced analytics features
- Additional AI model integrations

---

## 🎯 Success Criteria

### For Any Development Work

Before considering work complete:

- [ ] All rules followed (especially UCIE rules)
- [ ] Proper authentication implemented
- [ ] Comprehensive error handling
- [ ] Environment variables used
- [ ] Database utilities used (no direct queries)
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Code committed with descriptive message

### For UCIE-Specific Work

Additionally:

- [ ] AI analysis happens LAST (after all data cached)
- [ ] Database cache used (no in-memory cache)
- [ ] Context aggregator used for AI calls
- [ ] Data quality checked (minimum 70%)
- [ ] Cache utilities used
- [ ] UCIE tests passing

---

## 📚 Key Documentation

### System Documentation
1. **KIRO-AGENT-STEERING.md** - This document (complete system guide)
2. **ucie-system.md** - UCIE system complete guide
3. **api-integration.md** - API integration guidelines
4. **tech.md** - Technical architecture
5. **product.md** - Product overview
6. **authentication.md** - Auth system guide
7. **api-status.md** - API status and configuration

### UCIE-Specific Documentation
1. **UCIE-EXECUTION-ORDER-SPECIFICATION.md** - AI execution order
2. **UCIE-AI-EXECUTION-FLOW.md** - Visual flow diagram
3. **UCIE-DATABASE-ACCESS-GUIDE.md** - Database access guide
4. **OPENAI-DATABASE-INTEGRATION-GUIDE.md** - OpenAI integration
5. **UCIE-STATUS-REPORT.md** - Current status

### Implementation Guides
1. **UCIE-ACTION-CHECKLIST.md** - Quick reference
2. **UCIE-FINAL-SUMMARY.md** - Executive summary
3. **caesar-api-reference.md** - Caesar API usage
4. **bitcoin-sovereign-design.md** - Design system
5. **mobile-development.md** - Mobile guidelines

---

## 🚀 Quick Reference

### UCIE Work Checklist

- [ ] Read `ucie-system.md` completely
- [ ] Verify database working: `npx tsx scripts/verify-database-storage.ts`
- [ ] Use cache utilities: `getCachedAnalysis()`, `setCachedAnalysis()`
- [ ] Use context aggregator: `getComprehensiveContext()`, `formatContextForAI()`
- [ ] AI analysis LAST (after all data cached)
- [ ] Check data quality (≥70%)
- [ ] Test thoroughly

### General Development Checklist

- [ ] Read this document
- [ ] Follow all system rules
- [ ] Use provided utilities
- [ ] Add error handling
- [ ] Test changes
- [ ] Update documentation
- [ ] Commit with good message

---

## 💡 Key Insights

### Why These Rules Exist

1. **UCIE AI Last**: Ensures maximum context and analysis quality (2-3x improvement)
2. **Database Cache**: Survives serverless restarts, reduces costs 84% (from $319 to $50-100/month)
3. **Utility Functions**: Consistent, tested, maintainable code
4. **Authentication**: Security and user management
5. **Error Handling**: Reliability and debugging

### System Philosophy

- **Data-Driven**: All decisions based on real data
- **AI-Enhanced**: AI provides insights, not just data
- **User-Centric**: Focus on user experience and value
- **Reliable**: System must work consistently
- **Scalable**: Built to handle growth

---

**Remember**: Follow the rules, use the utilities, test thoroughly, document changes!

**Status**: 🟢 **SYSTEM OPERATIONAL**  
**Priority**: Continue UCIE endpoint integration (8-10 hours remaining)  
**Next**: Update API endpoints to use database cache

**The system is working well. Follow the rules and we'll keep it that way!** ✅
