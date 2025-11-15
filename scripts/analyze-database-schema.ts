/**
 * Analyze Database Schema for UCIE
 * 
 * This script analyzes the complete database schema to document:
 * 1. All UCIE-related tables
 * 2. Column definitions and data types
 * 3. Sample data from each table
 * 4. Relationships between tables
 */

import { query } from '../lib/db';

async function analyzeDatabaseSchema() {
  console.log('🔍 Analyzing UCIE Database Schema');
  console.log('='.repeat(80));
  console.log('');
  
  try {
    // ========================================================================
    // STEP 1: Find all UCIE-related tables
    // ========================================================================
    console.log('📋 STEP 1: Finding all UCIE-related tables');
    console.log('-'.repeat(80));
    
    const tablesResult = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%ucie%'
      ORDER BY table_name
    `);
    
    console.log(`Found ${tablesResult.rows.length} UCIE tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    console.log('');
    
    // ========================================================================
    // STEP 2: Analyze each table in detail
    // ========================================================================
    console.log('📊 STEP 2: Analyzing each table in detail');
    console.log('-'.repeat(80));
    console.log('');
    
    for (const tableRow of tablesResult.rows) {
      const tableName = tableRow.table_name;
      
      console.log(`\n${'='.repeat(80)}`);
      console.log(`TABLE: ${tableName}`);
      console.log('='.repeat(80));
      
      // Get column information
      const columnsResult = await query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      console.log('\nColumns:');
      console.log('-'.repeat(80));
      columnsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  ${col.column_name.padEnd(30)} ${col.data_type}${length} ${nullable}${defaultVal}`);
      });
      
      // Get indexes
      const indexesResult = await query(`
        SELECT
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename = $1
      `, [tableName]);
      
      if (indexesResult.rows.length > 0) {
        console.log('\nIndexes:');
        console.log('-'.repeat(80));
        indexesResult.rows.forEach(idx => {
          console.log(`  ${idx.indexname}`);
          console.log(`    ${idx.indexdef}`);
        });
      }
      
      // Get constraints
      const constraintsResult = await query(`
        SELECT
          conname,
          contype,
          pg_get_constraintdef(oid) as definition
        FROM pg_constraint
        WHERE conrelid = $1::regclass
      `, [tableName]);
      
      if (constraintsResult.rows.length > 0) {
        console.log('\nConstraints:');
        console.log('-'.repeat(80));
        constraintsResult.rows.forEach(con => {
          const type = {
            'p': 'PRIMARY KEY',
            'u': 'UNIQUE',
            'f': 'FOREIGN KEY',
            'c': 'CHECK'
          }[con.contype] || con.contype;
          console.log(`  ${con.conname} (${type})`);
          console.log(`    ${con.definition}`);
        });
      }
      
      // Get row count
      const countResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const rowCount = countResult.rows[0].count;
      console.log(`\nRow Count: ${rowCount}`);
      
      // Get sample data (if any)
      if (parseInt(rowCount) > 0) {
        const sampleResult = await query(`
          SELECT *
          FROM ${tableName}
          ORDER BY created_at DESC
          LIMIT 3
        `);
        
        console.log('\nSample Data (3 most recent rows):');
        console.log('-'.repeat(80));
        sampleResult.rows.forEach((row, i) => {
          console.log(`\nRow ${i + 1}:`);
          Object.entries(row).forEach(([key, value]) => {
            let displayValue = value;
            if (typeof value === 'object' && value !== null) {
              displayValue = JSON.stringify(value).substring(0, 100) + '...';
            } else if (typeof value === 'string' && value.length > 100) {
              displayValue = value.substring(0, 100) + '...';
            }
            console.log(`  ${key}: ${displayValue}`);
          });
        });
      }
      
      console.log('');
    }
    
    // ========================================================================
    // STEP 3: Document the correct data flow
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('📖 STEP 3: UCIE Data Flow Documentation');
    console.log('='.repeat(80));
    console.log('');
    
    console.log('✅ CORRECT DATA FLOW FOR GEMINI:');
    console.log('-'.repeat(80));
    console.log('');
    console.log('1. Phase 1: Data Collection');
    console.log('   - APIs fetch data (market, sentiment, technical, news, on-chain)');
    console.log('   - Data is stored in: ucie_analysis_cache');
    console.log('   - Table structure:');
    console.log('     * symbol (VARCHAR) - e.g., "BTC"');
    console.log('     * analysis_type (VARCHAR) - e.g., "market-data", "sentiment"');
    console.log('     * data (JSONB) - The actual data payload');
    console.log('     * data_quality_score (INTEGER) - Quality score 0-100');
    console.log('     * expires_at (TIMESTAMP) - When cache expires');
    console.log('     * user_email (VARCHAR) - Who created this cache entry');
    console.log('');
    console.log('2. Phase 2: Gemini Analysis');
    console.log('   - Gemini reads from: ucie_analysis_cache');
    console.log('   - Query pattern:');
    console.log('     SELECT data FROM ucie_analysis_cache');
    console.log('     WHERE symbol = $1 AND analysis_type = $2 AND expires_at > NOW()');
    console.log('   - Gemini generates summary using this data');
    console.log('   - Summary is stored in: ucie_gemini_analysis');
    console.log('');
    console.log('3. Data Retrieval:');
    console.log('   - Use getCachedAnalysis(symbol, type) to read from ucie_analysis_cache');
    console.log('   - Use setCachedAnalysis(symbol, type, data, ttl) to write');
    console.log('   - NEVER query other tables for analysis data');
    console.log('');
    
    // ========================================================================
    // STEP 4: Verify current data availability
    // ========================================================================
    console.log('='.repeat(80));
    console.log('📊 STEP 4: Current Data Availability');
    console.log('='.repeat(80));
    console.log('');
    
    const availabilityResult = await query(`
      SELECT 
        symbol,
        analysis_type,
        data_quality_score,
        created_at,
        expires_at,
        user_email,
        CASE 
          WHEN expires_at > NOW() THEN 'VALID'
          ELSE 'EXPIRED'
        END as status
      FROM ucie_analysis_cache
      ORDER BY symbol, analysis_type
    `);
    
    if (availabilityResult.rows.length === 0) {
      console.log('❌ No data currently in ucie_analysis_cache');
      console.log('');
      console.log('To populate:');
      console.log('  1. Go to: https://news.arcane.group/ucie');
      console.log('  2. Click: "Analyze BTC"');
      console.log('  3. Wait: ~30 seconds for Phase 1');
      console.log('');
    } else {
      console.log(`Found ${availabilityResult.rows.length} cache entries:\n`);
      
      // Group by symbol
      const bySymbol: any = {};
      availabilityResult.rows.forEach(row => {
        if (!bySymbol[row.symbol]) {
          bySymbol[row.symbol] = [];
        }
        bySymbol[row.symbol].push(row);
      });
      
      Object.entries(bySymbol).forEach(([symbol, entries]: [string, any]) => {
        console.log(`${symbol}:`);
        entries.forEach((entry: any) => {
          const age = Math.floor((Date.now() - new Date(entry.created_at).getTime()) / 1000);
          const ttl = Math.floor((new Date(entry.expires_at).getTime() - Date.now()) / 1000);
          const status = entry.status === 'VALID' ? '✅' : '❌';
          
          console.log(`  ${status} ${entry.analysis_type.padEnd(15)} (quality: ${entry.data_quality_score}, age: ${age}s, ttl: ${ttl}s)`);
        });
        console.log('');
      });
    }
    
    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('='.repeat(80));
    console.log('🎯 SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    console.log('✅ Gemini should ONLY read from: ucie_analysis_cache');
    console.log('✅ Use getCachedAnalysis() function to read data');
    console.log('✅ Data is stored by symbol + analysis_type');
    console.log('✅ Check expires_at > NOW() for valid data');
    console.log('');
    console.log('❌ DO NOT read from:');
    console.log('   - ucie_openai_analysis (old table)');
    console.log('   - ucie_gemini_analysis (output table, not input)');
    console.log('   - Any other tables');
    console.log('');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analyzeDatabaseSchema();
