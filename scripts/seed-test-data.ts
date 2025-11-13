/**
 * ATGE Test Data Seeding Script
 * 
 * Creates test users, access codes, and sample data for development and testing
 * 
 * Usage:
 *   npx tsx scripts/seed-test-data.ts
 */

import { query } from '../lib/db';
import { hashPassword } from '../lib/auth/password';
import { randomUUID } from 'crypto';

interface TestUser {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

interface AccessCode {
  code: string;
  description: string;
}

// Test users for development
const TEST_USERS: TestUser[] = [
  {
    id: randomUUID(),
    email: 'admin@atge-test.com',
    password: 'Admin123!',
    role: 'admin'
  },
  {
    id: randomUUID(),
    email: 'trader@atge-test.com',
    password: 'Trader123!',
    role: 'user'
  },
  {
    id: randomUUID(),
    email: 'test@atge-test.com',
    password: 'Test123!',
    role: 'user'
  }
];

// Access codes for registration testing
const ACCESS_CODES: AccessCode[] = [
  { code: 'ATGE-TEST-001', description: 'Test access code 1' },
  { code: 'ATGE-TEST-002', description: 'Test access code 2' },
  { code: 'ATGE-TEST-003', description: 'Test access code 3' },
  { code: 'ATGE-DEV-001', description: 'Development access code 1' },
  { code: 'ATGE-DEV-002', description: 'Development access code 2' }
];

/**
 * Seed test users
 */
async function seedTestUsers(): Promise<void> {
  console.log('\n📊 Seeding test users...');
  
  for (const user of TEST_USERS) {
    try {
      const hashedPassword = await hashPassword(user.password);
      
      await query(`
        INSERT INTO users (id, email, password_hash, email_verified, created_at, updated_at)
        VALUES ($1, $2, $3, TRUE, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            email_verified = TRUE,
            updated_at = NOW()
      `, [user.id, user.email, hashedPassword]);
      
      console.log(`✅ Created/Updated user: ${user.email} (${user.role})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Password: ${user.password}`);
    } catch (error) {
      console.error(`❌ Failed to create user ${user.email}:`, error);
    }
  }
}

/**
 * Seed access codes
 */
async function seedAccessCodes(): Promise<void> {
  console.log('\n🔑 Seeding access codes...');
  
  for (const accessCode of ACCESS_CODES) {
    try {
      await query(`
        INSERT INTO access_codes (code, redeemed, created_at)
        VALUES ($1, FALSE, NOW())
        ON CONFLICT (code) DO UPDATE
        SET redeemed = FALSE
      `, [accessCode.code]);
      
      console.log(`✅ Created/Updated access code: ${accessCode.code}`);
      console.log(`   Description: ${accessCode.description}`);
    } catch (error) {
      console.error(`❌ Failed to create access code ${accessCode.code}:`, error);
    }
  }
}

/**
 * Verify database tables exist
 */
async function verifyTables(): Promise<boolean> {
  console.log('\n🔍 Verifying database tables...');
  
  const requiredTables = [
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
  
  for (const table of requiredTables) {
    try {
      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      const exists = result.rows[0].exists;
      
      if (exists) {
        console.log(`✅ Table exists: ${table}`);
      } else {
        console.error(`❌ Table missing: ${table}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error checking table ${table}:`, error);
      return false;
    }
  }
  
  return true;
}

/**
 * Display seeded data summary
 */
function displaySummary(): void {
  console.log('\n' + '='.repeat(60));
  console.log('📋 ATGE Test Data Seeding Complete');
  console.log('='.repeat(60));
  
  console.log('\n👥 Test Users:');
  TEST_USERS.forEach(user => {
    console.log(`   • ${user.email}`);
    console.log(`     Password: ${user.password}`);
    console.log(`     Role: ${user.role}`);
    console.log(`     ID: ${user.id}`);
  });
  
  console.log('\n🔑 Access Codes:');
  ACCESS_CODES.forEach(code => {
    console.log(`   • ${code.code} - ${code.description}`);
  });
  
  console.log('\n💡 Usage:');
  console.log('   1. Login with any test user credentials');
  console.log('   2. Use access codes for registration testing');
  console.log('   3. Run integration tests with seeded data');
  
  console.log('\n🧪 Run Tests:');
  console.log('   npm test -- __tests__/integration/atge-trade-generation.test.ts');
  
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Main seeding function
 */
async function main(): Promise<void> {
  try {
    console.log('🌱 Starting ATGE test data seeding...');
    
    // Verify tables exist
    const tablesExist = await verifyTables();
    if (!tablesExist) {
      console.error('\n❌ Required tables are missing. Please run migrations first:');
      console.error('   npx tsx scripts/run-migrations.ts');
      process.exit(1);
    }
    
    // Seed data
    await seedTestUsers();
    await seedAccessCodes();
    
    // Display summary
    displaySummary();
    
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { seedTestUsers, seedAccessCodes, verifyTables, TEST_USERS, ACCESS_CODES };
