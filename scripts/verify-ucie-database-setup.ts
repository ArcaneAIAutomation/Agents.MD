/**
 * UCIE Database Setup Verification Script
 * 
 * Checks if all required UCIE tables exist and have the correct structure
 * including user_id and user_email columns for user isolation.
 */

import { query } from '../lib/db';

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

interface TableConstraint {
  constraint_name: string;
  constraint_type: string;
}

interface TableIndex {
  indexname: string;
  indexdef: string;
}

async function verifyUCIEDatabaseSetup() {
  console.log('🔍 Verifying UCIE Database Setup...\n');

  try {
    // 1. Check if ucie_analysis_cache table exists
    console.log('1️⃣ Checking ucie_analysis_cache table...');
    const cacheTableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ucie_analysis_cache'
      );
    `);

    if (!cacheTableExists.rows[0].exists) {
      console.log('❌ ucie_analysis_cache table does NOT exist!');
      console.log('   Run migration: migrations/003_ucie_cache_table.sql\n');
      return;
    }

    console.log('✅ ucie_analysis_cache table exists');

    // 2. Check columns in ucie_analysis_cache
    console.log('\n2️⃣ Checking ucie_analysis_cache columns...');
    const cacheColumns = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'ucie_analysis_cache'
      ORDER BY ordinal_position;
    `);

    const requiredColumns = [
      'id',
      'symbol',
      'analysis_type',
      'data',
      'data_quality_score',
      'created_at',
      'expires_at',
      'user_id',
      'user_email'
    ];

    const existingColumns = cacheColumns.rows.map((row: TableColumn) => row.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log(`❌ Missing columns: ${missingColumns.join(', ')}`);
      if (missingColumns.includes('user_id')) {
        console.log('   Run migration: migrations/006_add_user_id_to_cache.sql');
      }
      if (missingColumns.includes('user_email')) {
        console.log('   Run migration: migrations/007_add_user_email_to_cache.sql');
      }
    } else {
      console.log('✅ All required columns exist');
      console.log('   Columns:', existingColumns.join(', '));
    }

    // 3. Check constraints
    console.log('\n3️⃣ Checking ucie_analysis_cache constraints...');
    const constraints = await query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND table_name = 'ucie_analysis_cache';
    `);

    const constraintNames = constraints.rows.map((row: TableConstraint) => row.constraint_name);
    console.log('   Constraints:', constraintNames.join(', '));

    // Check for user isolation constraint
    const hasUserIsolation = constraintNames.some(name => 
      name.includes('symbol_type_user') || name.includes('symbol_analysis_type_user_id')
    );

    if (hasUserIsolation) {
      console.log('✅ User isolation constraint exists (symbol, analysis_type, user_id)');
    } else {
      console.log('⚠️  User isolation constraint missing');
      console.log('   Run migration: migrations/006_add_user_id_to_cache.sql');
    }

    // 4. Check indexes
    console.log('\n4️⃣ Checking ucie_analysis_cache indexes...');
    const indexes = await query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = 'ucie_analysis_cache';
    `);

    const indexNames = indexes.rows.map((row: TableIndex) => row.indexname);
    console.log('   Indexes:', indexNames.join(', '));

    const requiredIndexes = [
      'idx_ucie_cache_symbol',
      'idx_ucie_cache_type',
      'idx_ucie_cache_expires',
      'idx_ucie_cache_user_id',
      'idx_ucie_cache_user_email'
    ];

    const missingIndexes = requiredIndexes.filter(idx => 
      !indexNames.some(name => name.includes(idx.replace('idx_ucie_cache_', '')))
    );

    if (missingIndexes.length > 0) {
      console.log(`⚠️  Missing indexes: ${missingIndexes.join(', ')}`);
    } else {
      console.log('✅ All required indexes exist');
    }

    // 5. Check ucie_phase_data table
    console.log('\n5️⃣ Checking ucie_phase_data table...');
    const phaseTableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ucie_phase_data'
      );
    `);

    if (!phaseTableExists.rows[0].exists) {
      console.log('⚠️  ucie_phase_data table does NOT exist');
      console.log('   This is optional but recommended for session tracking');
    } else {
      console.log('✅ ucie_phase_data table exists');

      // Check for user_id and user_email columns
      const phaseColumns = await query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'ucie_phase_data';
      `);

      const phaseColumnNames = phaseColumns.rows.map((row: TableColumn) => row.column_name);
      const hasUserId = phaseColumnNames.includes('user_id');
      const hasUserEmail = phaseColumnNames.includes('user_email');

      if (hasUserId && hasUserEmail) {
        console.log('✅ ucie_phase_data has user_id and user_email columns');
      } else {
        console.log('⚠️  ucie_phase_data missing user columns');
        if (!hasUserId) console.log('   Run migration: migrations/006_add_user_id_to_cache.sql');
        if (!hasUserEmail) console.log('   Run migration: migrations/007_add_user_email_to_cache.sql');
      }
    }

    // 6. Check sample data
    console.log('\n6️⃣ Checking sample data in ucie_analysis_cache...');
    const sampleData = await query(`
      SELECT 
        symbol,
        analysis_type,
        user_id,
        user_email,
        data_quality_score,
        created_at,
        expires_at
      FROM ucie_analysis_cache
      ORDER BY created_at DESC
      LIMIT 5;
    `);

    if (sampleData.rows.length === 0) {
      console.log('ℹ️  No data in cache yet (this is normal for a new setup)');
    } else {
      console.log(`✅ Found ${sampleData.rows.length} cache entries`);
      console.log('\n   Sample entries:');
      sampleData.rows.forEach((row: any, index: number) => {
        console.log(`   ${index + 1}. ${row.symbol} - ${row.analysis_type}`);
        console.log(`      User: ${row.user_id || 'anonymous'} (${row.user_email || 'no email'})`);
        console.log(`      Quality: ${row.data_quality_score}%`);
        console.log(`      Created: ${row.created_at}`);
        console.log(`      Expires: ${row.expires_at}`);
      });
    }

    // 7. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));

    const allGood = 
      cacheTableExists.rows[0].exists &&
      missingColumns.length === 0 &&
      hasUserIsolation;

    if (allGood) {
      console.log('✅ Database setup is COMPLETE and CORRECT!');
      console.log('   All required tables, columns, and constraints exist.');
      console.log('   User isolation is properly configured.');
    } else {
      console.log('⚠️  Database setup needs attention:');
      if (missingColumns.length > 0) {
        console.log(`   - Missing columns: ${missingColumns.join(', ')}`);
      }
      if (!hasUserIsolation) {
        console.log('   - User isolation constraint missing');
      }
      console.log('\n   Run the suggested migrations above to fix.');
    }

  } catch (error) {
    console.error('❌ Error verifying database setup:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
  }
}

// Run verification
verifyUCIEDatabaseSetup()
  .then(() => {
    console.log('\n✅ Verification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
