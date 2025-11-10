/**
 * Fix UCIE cache schema to use shared cache instead of user-specific
 * 
 * Changes:
 * 1. Drop old UNIQUE constraint (symbol, analysis_type, user_id)
 * 2. Add new UNIQUE constraint (symbol, analysis_type) only
 * 3. Keep user_id and user_email for tracking WHO requested it
 */

import { query } from '../lib/db';

async function fixCacheSchema() {
  try {
    console.log('\n🔧 Fixing UCIE cache schema for shared cache...\n');
    
    // 1. Check current constraint
    const constraintCheck = await query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'ucie_analysis_cache' 
      AND constraint_type = 'UNIQUE'
    `);
    
    console.log('📊 Current UNIQUE constraints:');
    for (const row of constraintCheck.rows) {
      console.log(`   - ${row.constraint_name}`);
    }
    
    // 2. Drop old constraint if it exists
    console.log('\n🗑️  Dropping old UNIQUE constraint...');
    try {
      await query(`
        ALTER TABLE ucie_analysis_cache 
        DROP CONSTRAINT IF EXISTS ucie_analysis_cache_symbol_analysis_type_user_id_key
      `);
      console.log('✅ Old constraint dropped');
    } catch (error) {
      console.log('⚠️  Old constraint may not exist, continuing...');
    }
    
    // 3. Add new constraint (symbol, analysis_type) only
    console.log('\n➕ Adding new UNIQUE constraint (symbol, analysis_type)...');
    try {
      await query(`
        ALTER TABLE ucie_analysis_cache 
        ADD CONSTRAINT ucie_analysis_cache_symbol_analysis_type_key 
        UNIQUE (symbol, analysis_type)
      `);
      console.log('✅ New constraint added');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('✅ Constraint already exists');
      } else {
        throw error;
      }
    }
    
    // 4. Verify new schema
    const newConstraintCheck = await query(`
      SELECT constraint_name, column_name
      FROM information_schema.constraint_column_usage 
      WHERE table_name = 'ucie_analysis_cache' 
      AND constraint_name LIKE '%unique%' OR constraint_name LIKE '%key%'
    `);
    
    console.log('\n📊 New UNIQUE constraints:');
    for (const row of newConstraintCheck.rows) {
      console.log(`   - ${row.constraint_name}: ${row.column_name}`);
    }
    
    // 5. Clean up duplicate entries (keep most recent)
    console.log('\n🧹 Cleaning up duplicate entries...');
    const duplicates = await query(`
      SELECT symbol, analysis_type, COUNT(*) as count
      FROM ucie_analysis_cache
      GROUP BY symbol, analysis_type
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.rows.length > 0) {
      console.log(`Found ${duplicates.rows.length} duplicate groups`);
      
      for (const dup of duplicates.rows) {
        // Keep the most recent entry, delete others
        await query(`
          DELETE FROM ucie_analysis_cache
          WHERE symbol = $1 AND analysis_type = $2
          AND id NOT IN (
            SELECT id FROM ucie_analysis_cache
            WHERE symbol = $1 AND analysis_type = $2
            ORDER BY created_at DESC
            LIMIT 1
          )
        `, [dup.symbol, dup.analysis_type]);
        
        console.log(`   Cleaned up duplicates for ${dup.symbol}/${dup.analysis_type}`);
      }
    } else {
      console.log('✅ No duplicates found');
    }
    
    // 6. Show final state
    const finalCount = await query(`
      SELECT COUNT(*) as count FROM ucie_analysis_cache
    `);
    
    console.log(`\n📊 Final cache entries: ${finalCount.rows[0].count}`);
    
    console.log('\n🎉 Schema fix complete!');
    console.log('\n✅ Cache is now SHARED across users');
    console.log('✅ user_id and user_email still tracked for analytics');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
    process.exit(1);
  }
}

fixCacheSchema();
