/**
 * Kiro Unrestricted Setup Script
 * 
 * Complete setup for Kiro to test and build everything without restrictions
 * - Creates all necessary test users and access codes
 * - Bypasses all authentication requirements for testing
 * - Sets up mock data for API testing
 * - Configures environment for unrestricted access
 * 
 * Usage:
 *   npx tsx scripts/kiro-setup.ts
 */

import { query } from '../lib/db';
import { hashPassword } from '../lib/auth/password';
import { randomUUID } from 'crypto';

// Kiro test users with unrestricted access
const KIRO_USERS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'kiro@test.local',
    password: 'kiro123',
    role: 'admin'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'test@test.local',
    password: 'test123',
    role: 'user'
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'admin@test.local',
    password: 'admin123',
    role: 'admin'
  }
];

// Unlimited access codes
const KIRO_ACCESS_CODES = [
  'KIRO-UNLIMITED-001',
  'KIRO-UNLIMITED-002',
  'KIRO-UNLIMITED-003',
  'TEST-UNLIMITED-001',
  'TEST-UNLIMITED-002',
  'DEV-UNLIMITED-001',
  'DEV-UNLIMITED-002',
  'ATGE-UNLIMITED-001',
  'ATGE-UNLIMITED-002',
  'ATGE-UNLIMITED-003'
];

/**
 * Create Kiro test users
 */
async function createKiroUsers(): Promise<void> {
  console.log('\n👤 Creating Kiro test users...');
  
  for (const user of KIRO_USERS) {
    try {
      const hashedPassword = await hashPassword(user.password);
      
      await query(`
        INSERT INTO users (id, email, password_hash, email_verified, created_at, updated_at)
        VALUES ($1, $2, $3, TRUE, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            password_hash = EXCLUDED.password_hash,
            email_verified = TRUE,
            updated_at = NOW()
      `, [user.id, user.email, hashedPassword]);
      
      console.log(`✅ ${user.email} (${user.role})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Password: ${user.password}`);
    } catch (error) {
      console.error(`❌ Failed to create ${user.email}:`, error);
    }
  }
}

/**
 * Create unlimited access codes
 */
async function createAccessCodes(): Promise<void> {
  console.log('\n🔑 Creating unlimited access codes...');
  
  for (const code of KIRO_ACCESS_CODES) {
    try {
      await query(`
        INSERT INTO access_codes (code, redeemed, created_at)
        VALUES ($1, FALSE, NOW())
        ON CONFLICT (code) DO UPDATE
        SET redeemed = FALSE
      `, [code]);
      
      console.log(`✅ ${code}`);
    } catch (error) {
      console.error(`❌ Failed to create ${code}:`, error);
    }
  }
}

/**
 * Create sample trade signals for testing
 */
async function createSampleTrades(): Promise<void> {
  console.log('\n📊 Creating sample trade signals...');
  
  const userId = KIRO_USERS[0].id;
  const symbols = ['BTC', 'ETH'];
  
  for (const symbol of symbols) {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const result = await query(`
        INSERT INTO trade_signals (
          user_id, symbol, status,
          entry_price, tp1_price, tp1_allocation, tp2_price, tp2_allocation,
          tp3_price, tp3_allocation, stop_loss_price, stop_loss_percentage,
          timeframe, timeframe_hours, confidence_score, risk_reward_ratio,
          market_condition, ai_reasoning, ai_model_version,
          generated_at, expires_at
        ) VALUES (
          $1, $2, 'active',
          $3, $4, 40, $5, 30,
          $6, 30, $7, 5.0,
          '1d', 24, 75, 2.5,
          'trending', 'Sample trade signal for testing', 'test-model',
          $8, $9
        )
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
        userId,
        symbol,
        symbol === 'BTC' ? 95000 : 3500,
        symbol === 'BTC' ? 97000 : 3600,
        symbol === 'BTC' ? 99000 : 3700,
        symbol === 'BTC' ? 101000 : 3800,
        symbol === 'BTC' ? 90250 : 3325,
        now,
        expiresAt
      ]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Sample ${symbol} trade signal created`);
      }
    } catch (error) {
      console.error(`❌ Failed to create ${symbol} trade:`, error);
    }
  }
}

/**
 * Verify all tables exist
 */
async function verifyAllTables(): Promise<boolean> {
  console.log('\n🔍 Verifying all tables...');
  
  const tables = [
    'users',
    'access_codes',
    'sessions',
    'auth_logs',
    'trade_signals',
    'trade_results',
    'trade_technical_indicators',
    'trade_market_snapshot',
    'trade_historical_prices'
  ];
  
  let allExist = true;
  
  for (const table of tables) {
    try {
      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`✅ ${table}`);
      } else {
        console.log(`❌ ${table} - MISSING`);
        allExist = false;
      }
    } catch (error) {
      console.error(`❌ Error checking ${table}:`, error);
      allExist = false;
    }
  }
  
  return allExist;
}

/**
 * Test database connection
 */
async function testConnection(): Promise<boolean> {
  console.log('\n🔌 Testing database connection...');
  
  try {
    const result = await query('SELECT NOW() as time, version() as version');
    console.log(`✅ Connected to PostgreSQL`);
    console.log(`   Time: ${result.rows[0].time}`);
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return false;
  }
}

/**
 * Display setup summary
 */
function displaySummary(): void {
  console.log('\n' + '='.repeat(70));
  console.log('🤖 KIRO UNRESTRICTED SETUP COMPLETE');
  console.log('='.repeat(70));
  
  console.log('\n👤 Test Users (Unrestricted Access):');
  KIRO_USERS.forEach(user => {
    console.log(`   • ${user.email}`);
    console.log(`     Password: ${user.password}`);
    console.log(`     ID: ${user.id}`);
    console.log(`     Role: ${user.role}`);
  });
  
  console.log('\n🔑 Access Codes (Unlimited Use):');
  KIRO_ACCESS_CODES.forEach(code => {
    console.log(`   • ${code}`);
  });
  
  console.log('\n🎯 Quick Start:');
  console.log('   1. Run tests: npm test');
  console.log('   2. Start dev server: npm run dev');
  console.log('   3. Login with: kiro@test.local / kiro123');
  
  console.log('\n🧪 Test Commands:');
  console.log('   • Integration tests: npm test -- __tests__/integration/');
  console.log('   • ATGE tests: npm test -- atge-trade-generation');
  console.log('   • All tests: npm test');
  
  console.log('\n📝 Environment Variables:');
  console.log('   All API keys are optional for testing');
  console.log('   Tests will use mock data when APIs are unavailable');
  
  console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Main setup function
 */
async function main(): Promise<void> {
  console.log('🤖 Starting Kiro unrestricted setup...\n');
  
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.error('\n❌ Cannot connect to database');
      console.error('   Check DATABASE_URL in .env.local');
      process.exit(1);
    }
    
    // Verify tables
    const tablesExist = await verifyAllTables();
    if (!tablesExist) {
      console.error('\n❌ Some tables are missing');
      console.error('   Run migrations: npx tsx scripts/run-migrations.ts');
      console.error('   Or run: npx tsx migrations/000_complete_ucie_setup.sql');
      process.exit(1);
    }
    
    // Create users and data
    await createKiroUsers();
    await createAccessCodes();
    await createSampleTrades();
    
    // Display summary
    displaySummary();
    
    console.log('✅ Kiro setup completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { createKiroUsers, createAccessCodes, createSampleTrades, KIRO_USERS, KIRO_ACCESS_CODES };
