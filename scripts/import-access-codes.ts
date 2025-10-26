/**
 * Import Existing Access Codes Script
 * Bitcoin Sovereign Technology - Authentication System
 * 
 * This script imports all 11 existing access codes into the database.
 * All codes are marked as unredeemed initially.
 * 
 * Usage:
 *   npx ts-node scripts/import-access-codes.ts
 */

import { query, queryOne, testConnection, normalizeAccessCode, closePool } from '../lib/db';

// ============================================================================
// ACCESS CODES TO IMPORT
// ============================================================================

/**
 * All 11 existing access codes from VALID-ACCESS-CODES.md
 * These codes are currently used in the client-side validation
 */
const ACCESS_CODES = [
  'BITCOIN2025',
  'BTC-SOVEREIGN-K3QYMQ-01',
  'BTC-SOVEREIGN-AKCJRG-02',
  'BTC-SOVEREIGN-LMBLRN-03',
  'BTC-SOVEREIGN-HZKEI2-04',
  'BTC-SOVEREIGN-WVL0HN-05',
  'BTC-SOVEREIGN-48YDHG-06',
  'BTC-SOVEREIGN-6HSNX0-07',
  'BTC-SOVEREIGN-N99A5R-08',
  'BTC-SOVEREIGN-DCO2DG-09',
  'BTC-SOVEREIGN-BYE9UX-10',
];

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

/**
 * Check if an access code already exists in the database
 */
async function codeExists(code: string): Promise<boolean> {
  const normalizedCode = normalizeAccessCode(code);
  const result = await queryOne(
    'SELECT id FROM access_codes WHERE code = $1',
    [normalizedCode]
  );
  return result !== null;
}

/**
 * Insert a single access code into the database
 */
async function insertAccessCode(code: string): Promise<void> {
  const normalizedCode = normalizeAccessCode(code);
  
  try {
    await query(
      `INSERT INTO access_codes (code, redeemed, redeemed_by, redeemed_at)
       VALUES ($1, FALSE, NULL, NULL)`,
      [normalizedCode]
    );
    console.log(`✅ Imported: ${normalizedCode}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('unique constraint')) {
      console.log(`⚠️  Already exists: ${normalizedCode}`);
    } else {
      console.error(`❌ Failed to import ${normalizedCode}:`, error);
      throw error;
    }
  }
}

/**
 * Import all access codes
 */
async function importAllCodes(): Promise<void> {
  console.log('🚀 Starting access code import...\n');
  console.log(`Total codes to import: ${ACCESS_CODES.length}\n`);
  
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const code of ACCESS_CODES) {
    try {
      const exists = await codeExists(code);
      
      if (exists) {
        console.log(`⏭️  Skipping (already exists): ${code}`);
        skipped++;
      } else {
        await insertAccessCode(code);
        imported++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${code}:`, error);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Successfully imported: ${imported}`);
  console.log(`⏭️  Skipped (already exist): ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📦 Total codes: ${ACCESS_CODES.length}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Verify all codes were imported correctly
 */
async function verifyImport(): Promise<void> {
  console.log('🔍 Verifying import...\n');
  
  const result = await query(
    'SELECT code, redeemed, created_at FROM access_codes ORDER BY created_at DESC'
  );
  
  console.log(`Total codes in database: ${result.rows.length}\n`);
  
  if (result.rows.length === 0) {
    console.log('⚠️  No codes found in database!');
    return;
  }
  
  console.log('Codes in database:');
  console.log('-'.repeat(60));
  
  for (const row of result.rows) {
    const status = row.redeemed ? '🔴 REDEEMED' : '🟢 AVAILABLE';
    console.log(`${status} | ${row.code} | Created: ${new Date(row.created_at).toISOString()}`);
  }
  
  console.log('-'.repeat(60) + '\n');
  
  // Check if all expected codes are present
  const dbCodes = result.rows.map((row: any) => row.code);
  const normalizedExpectedCodes = ACCESS_CODES.map(normalizeAccessCode);
  const missing = normalizedExpectedCodes.filter(code => !dbCodes.includes(code));
  
  if (missing.length > 0) {
    console.log('⚠️  Missing codes:');
    missing.forEach(code => console.log(`   - ${code}`));
  } else {
    console.log('✅ All expected codes are present in the database!');
  }
  
  console.log('');
}

/**
 * Display usage statistics
 */
async function displayStats(): Promise<void> {
  console.log('📈 Access Code Statistics:\n');
  
  const stats = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE redeemed = TRUE) as redeemed,
      COUNT(*) FILTER (WHERE redeemed = FALSE) as available
    FROM access_codes
  `);
  
  const { total, redeemed, available } = stats.rows[0];
  
  console.log(`Total codes:     ${total}`);
  console.log(`Available:       ${available} (${((available / total) * 100).toFixed(1)}%)`);
  console.log(`Redeemed:        ${redeemed} (${((redeemed / total) * 100).toFixed(1)}%)`);
  console.log('');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔐 Bitcoin Sovereign Technology');
  console.log('   Access Code Import Script');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Database connection failed!');
      console.error('   Please check your DATABASE_URL environment variable.');
      process.exit(1);
    }
    
    console.log('✅ Database connection successful!\n');
    
    // Import codes
    await importAllCodes();
    
    // Verify import
    await verifyImport();
    
    // Display statistics
    await displayStats();
    
    console.log('✅ Import process completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Import process failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await closePool();
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for testing
export { importAllCodes, verifyImport, displayStats };
