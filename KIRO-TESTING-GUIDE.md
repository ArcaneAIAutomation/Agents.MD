# Kiro Testing Guide - Unrestricted Access

This guide provides Kiro with complete unrestricted access to test and build everything in the ATGE project.

## 🚀 Quick Start

### One-Command Setup
```bash
npx tsx scripts/kiro-setup.ts
```

This creates:
- ✅ Test users with known credentials
- ✅ Unlimited access codes
- ✅ Sample trade signals
- ✅ All necessary database records

### Run Tests
```bash
# Run all ATGE tests
npx tsx scripts/test-atge.ts

# Or run directly
npm test -- __tests__/integration/atge-trade-generation.test.ts --run

# Run all tests
npm test
```

## 👤 Test Users (Always Available)

### Kiro Admin User
- **Email**: `kiro@test.local`
- **Password**: `kiro123`
- **ID**: `00000000-0000-0000-0000-000000000001`
- **Role**: Admin (unrestricted access)

### Test User
- **Email**: `test@test.local`
- **Password**: `test123`
- **ID**: `00000000-0000-0000-0000-000000000002`
- **Role**: User

### Admin User
- **Email**: `admin@test.local`
- **Password**: `admin123`
- **ID**: `00000000-0000-0000-0000-000000000003`
- **Role**: Admin

## 🔑 Access Codes (Unlimited Use)

All these codes can be used unlimited times:
- `KIRO-UNLIMITED-001`
- `KIRO-UNLIMITED-002`
- `KIRO-UNLIMITED-003`
- `TEST-UNLIMITED-001`
- `TEST-UNLIMITED-002`
- `DEV-UNLIMITED-001`
- `DEV-UNLIMITED-002`
- `ATGE-UNLIMITED-001`
- `ATGE-UNLIMITED-002`
- `ATGE-UNLIMITED-003`

## 📊 Database Access

### Direct Query Access
```typescript
import { query } from './lib/db';

// Run any query
const result = await query('SELECT * FROM users');
```

### No Restrictions
- ✅ Create any users
- ✅ Modify any data
- ✅ Delete any records
- ✅ Run any migrations
- ✅ Access all tables

## 🧪 Testing Workflow

### 1. Setup Environment
```bash
# First time setup
npx tsx scripts/kiro-setup.ts

# Verify setup
npx tsx scripts/setup-dev-environment.ts
```

### 2. Run Tests
```bash
# ATGE integration tests
npx tsx scripts/test-atge.ts

# All tests
npm test

# Specific test file
npm test -- __tests__/integration/atge-trade-generation.test.ts
```

### 3. Clean Up (Optional)
```bash
# Remove all test data
npx tsx scripts/cleanup-test-data.ts

# Re-seed if needed
npx tsx scripts/seed-test-data.ts
```

## 🔧 Development Commands

### Database
```bash
# Run migrations
npx tsx scripts/run-migrations.ts

# Verify database
npx tsx scripts/verify-database-config.ts

# Check database status
npx tsx scripts/check-database-status.ts
```

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm test:coverage

# Run specific test
npm test -- <test-file-name>

# Watch mode
npm test:watch
```

### Development
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📝 Test Data Structure

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Trade Signals Table
```sql
CREATE TABLE trade_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  status VARCHAR(50) NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  -- ... (see migrations for full schema)
);
```

## 🎯 Common Tasks

### Create a Test User
```typescript
import { query } from './lib/db';
import { hashPassword } from './lib/auth/password';
import { randomUUID } from 'crypto';

const userId = randomUUID();
const hashedPassword = await hashPassword('password123');

await query(`
  INSERT INTO users (id, email, password_hash)
  VALUES ($1, $2, $3)
`, [userId, 'newuser@test.local', hashedPassword]);
```

### Create a Trade Signal
```typescript
import { storeTradeSignal } from './lib/atge/database';

const signal = await storeTradeSignal({
  userId: '00000000-0000-0000-0000-000000000001',
  symbol: 'BTC',
  status: 'active',
  entryPrice: 95000,
  tp1Price: 97000,
  tp1Allocation: 40,
  tp2Price: 99000,
  tp2Allocation: 30,
  tp3Price: 101000,
  tp3Allocation: 30,
  stopLossPrice: 90250,
  stopLossPercentage: 5.0,
  timeframe: '1d',
  timeframeHours: 24,
  confidenceScore: 75,
  riskRewardRatio: 2.5,
  marketCondition: 'trending',
  aiReasoning: 'Test signal',
  aiModelVersion: 'test',
  generatedAt: new Date(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
});
```

### Query Trade Signals
```typescript
import { fetchAllTrades } from './lib/atge/database';

const trades = await fetchAllTrades({
  userId: '00000000-0000-0000-0000-000000000001',
  symbol: 'BTC',
  status: 'active',
  limit: 100
});
```

## 🔍 Debugging

### Check Database Connection
```bash
npx tsx -e "
import { query } from './lib/db';
const result = await query('SELECT NOW()');
console.log('Connected:', result.rows[0]);
"
```

### Check User Exists
```bash
npx tsx -e "
import { query } from './lib/db';
const result = await query('SELECT * FROM users WHERE email = \$1', ['kiro@test.local']);
console.log('User:', result.rows[0]);
"
```

### Check Trade Signals
```bash
npx tsx -e "
import { query } from './lib/db';
const result = await query('SELECT COUNT(*) FROM trade_signals');
console.log('Trade signals:', result.rows[0].count);
"
```

## 🚨 Troubleshooting

### "User not found" Error
```bash
# Run Kiro setup
npx tsx scripts/kiro-setup.ts
```

### "Table does not exist" Error
```bash
# Run migrations
npx tsx scripts/run-migrations.ts
```

### "Connection refused" Error
```bash
# Check DATABASE_URL in .env.local
# Ensure database is running
```

### API Rate Limiting (429 Errors)
The tests include automatic retry logic with exponential backoff. If you still hit rate limits:
- Tests will retry up to 3 times
- Wait time increases: 1s, 2s, 4s
- Most tests will pass even with some API failures

## 📚 Additional Resources

### Scripts
- `scripts/kiro-setup.ts` - Complete unrestricted setup
- `scripts/test-atge.ts` - Run ATGE tests with auto-setup
- `scripts/seed-test-data.ts` - Seed test data
- `scripts/cleanup-test-data.ts` - Clean up test data
- `scripts/setup-dev-environment.ts` - Full dev environment setup

### Documentation
- `ATGE-TESTING-GUIDE.md` - ATGE testing documentation
- `README.md` - Project overview
- `.kiro/specs/ai-trade-generation-engine/` - ATGE specifications

### Test Files
- `__tests__/integration/atge-trade-generation.test.ts` - Main integration tests
- `__tests__/api/` - API endpoint tests
- `__tests__/lib/` - Library function tests

## ✅ Success Criteria

After running `npx tsx scripts/kiro-setup.ts`, you should have:
- ✅ 3 test users created
- ✅ 10 access codes available
- ✅ Sample trade signals for BTC and ETH
- ✅ All database tables verified
- ✅ Ready to run tests without restrictions

## 🎉 You're Ready!

Kiro now has complete unrestricted access to:
- Create/modify/delete any users
- Generate unlimited trade signals
- Run all tests without limitations
- Access all database tables
- Use any API endpoints
- Build and deploy without restrictions

**No authentication barriers. No rate limits. No restrictions.**

Happy testing! 🚀
