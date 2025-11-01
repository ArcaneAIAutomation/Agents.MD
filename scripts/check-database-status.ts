#!/usr/bin/env tsx
/**
 * Check Database Status
 * Verifies what tables and data exist in the production database
 */

import { query } from '../lib/db';

async function checkDatabaseStatus() {
  console.log('\n============================================================');
  console.log('🔍 Bitcoin Sovereign Technology');
  console.log('   Database Status Check');
  console.log('============================================================\n');

  try {
    // Check if tables exist
    console.log('📊 Checking tables...\n');
    
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'access_codes', 'sessions', 'auth_logs')
      ORDER BY table_name;
    `;
    
    const tables = await query(tablesQuery);
    
    if (tables.rows.length === 0) {
      console.log('❌ No authentication tables found');
      console.log('   Run: npx tsx scripts/run-migrations.ts\n');
      return;
    }
    
    console.log(`✅ Found ${tables.rows.length}/4 tables:`);
    tables.rows.forEach((row: any) => {
      console.log(`   - ${row.table_name}`);
    });
    console.log('');
    
    // Check users count
    if (tables.rows.some((r: any) => r.table_name === 'users')) {
      const usersCount = await query('SELECT COUNT(*) as count FROM users');
      console.log(`👥 Users: ${usersCount.rows[0].count}`);
    }
    
    // Check access codes
    if (tables.rows.some((r: any) => r.table_name === 'access_codes')) {
      const codesCount = await query('SELECT COUNT(*) as count FROM access_codes');
      const redeemedCount = await query('SELECT COUNT(*) as count FROM access_codes WHERE redeemed = TRUE');
      const availableCount = await query('SELECT COUNT(*) as count FROM access_codes WHERE redeemed = FALSE');
      
      console.log(`🎫 Access Codes:`);
      console.log(`   Total: ${codesCount.rows[0].count}`);
      console.log(`   Redeemed: ${redeemedCount.rows[0].count}`);
      console.log(`   Available: ${availableCount.rows[0].count}`);
    }
    
    // Check sessions
    if (tables.rows.some((r: any) => r.table_name === 'sessions')) {
      const sessionsCount = await query('SELECT COUNT(*) as count FROM sessions');
      const activeCount = await query('SELECT COUNT(*) as count FROM sessions WHERE expires_at > NOW()');
      
      console.log(`🔐 Sessions:`);
      console.log(`   Total: ${sessionsCount.rows[0].count}`);
      console.log(`   Active: ${activeCount.rows[0].count}`);
    }
    
    // Check auth logs
    if (tables.rows.some((r: any) => r.table_name === 'auth_logs')) {
      const logsCount = await query('SELECT COUNT(*) as count FROM auth_logs');
      console.log(`📝 Auth Logs: ${logsCount.rows[0].count}`);
    }
    
    console.log('\n============================================================');
    console.log('✅ Database Status Check Complete');
    console.log('============================================================\n');
    
  } catch (error) {
    console.error('\n❌ Database check failed:', error);
    process.exit(1);
  }
}

checkDatabaseStatus();
