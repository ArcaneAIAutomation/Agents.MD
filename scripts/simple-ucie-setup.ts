/**
 * Simple UCIE Database Setup
 * 
 * Creates tables one at a time with proper error handling
 * Skips tables that already exist
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { query } from '../lib/db';

async function simpleSetup() {
  console.log('🚀 Simple UCIE Database Setup\n');
  
  try {
    // Test connection
    console.log('📡 Testing connection...');
    await query('SELECT NOW()');
    console.log('✅ Connected\n');
    
    // Create tables one by one
    const tables = [
      {
        name: 'ucie_analysis_cache',
        sql: `
          CREATE TABLE IF NOT EXISTS ucie_analysis_cache (
            id SERIAL PRIMARY KEY,
            symbol VARCHAR(20) NOT NULL,
            analysis_type VARCHAR(50) NOT NULL,
            data JSONB NOT NULL,
            data_quality_score INTEGER,
            user_id VARCHAR(255) NOT NULL DEFAULT 'anonymous',
            user_email VARCHAR(255),
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(symbol, analysis_type, user_id)
          );
          CREATE INDEX IF NOT EXISTS idx_ucie_analysis_cache_symbol_type_user 
          ON ucie_analysis_cache(symbol, analysis_type, user_id);
          CREATE INDEX IF NOT EXISTS idx_ucie_analysis_cache_expires_at 
          ON ucie_analysis_cache(expires_at);
        `
      },
      {
        name: 'ucie_openai_analysis',
        sql: `
          CREATE TABLE IF NOT EXISTS ucie_openai_analysis (
            id SERIAL PRIMARY KEY,
            symbol VARCHAR(20) NOT NULL,
            user_id VARCHAR(255) NOT NULL DEFAULT 'anonymous',
            user_email VARCHAR(255),
            summary_text TEXT NOT NULL,
            data_quality_score INTEGER,
            api_status JSONB NOT NULL DEFAULT '{}',
            ai_provider VARCHAR(50) DEFAULT 'openai',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(symbol, user_id)
          );
          CREATE INDEX IF NOT EXISTS idx_ucie_openai_analysis_symbol_user 
          ON ucie_openai_analysis(symbol, user_id);
          CREATE INDEX IF NOT EXISTS idx_ucie_openai_analysis_ai_provider 
          ON ucie_openai_analysis(ai_provider);
        `
      },
      {
        name: 'ucie_caesar_research',
        sql: `
          CREATE TABLE IF NOT EXISTS ucie_caesar_research (
            id SERIAL PRIMARY KEY,
            symbol VARCHAR(20) NOT NULL,
            user_id VARCHAR(255) NOT NULL DEFAULT 'anonymous',
            user_email VARCHAR(255),
            job_id VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'queued',
            research_data JSONB NOT NULL DEFAULT '{}',
            executive_summary TEXT,
            key_findings JSONB DEFAULT '[]',
            opportunities JSONB DEFAULT '[]',
            risks JSONB DEFAULT '[]',
            recommendation VARCHAR(50),
            confidence_score INTEGER,
            sources JSONB DEFAULT '[]',
            source_count INTEGER DEFAULT 0,
            data_quality_score INTEGER,
            analysis_depth VARCHAR(50),
            started_at TIMESTAMP WITH TIME ZONE,
            completed_at TIMESTAMP WITH TIME ZONE,
            duration_seconds INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(symbol, user_id)
          );
          CREATE INDEX IF NOT EXISTS idx_ucie_caesar_research_symbol_user 
          ON ucie_caesar_research(symbol, user_id);
          CREATE INDEX IF NOT EXISTS idx_ucie_caesar_research_status 
          ON ucie_caesar_research(status);
        `
      },
      {
        name: 'ucie_phase_data',
        sql: `
          CREATE TABLE IF NOT EXISTS ucie_phase_data (
            id SERIAL PRIMARY KEY,
            session_id VARCHAR(255) NOT NULL,
            symbol VARCHAR(20) NOT NULL,
            phase INTEGER NOT NULL,
            data JSONB NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_ucie_phase_data_session_symbol 
          ON ucie_phase_data(session_id, symbol);
          CREATE INDEX IF NOT EXISTS idx_ucie_phase_data_expires_at 
          ON ucie_phase_data(expires_at);
        `
      },
      {
        name: 'ucie_watchlist',
        sql: `
          CREATE TABLE IF NOT EXISTS ucie_watchlist (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            symbol VARCHAR(20) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, symbol)
          );
          CREATE INDEX IF NOT EXISTS idx_ucie_watchlist_user_id 
          ON ucie_watchlist(user_id);
        `
      },
      {
        name: 'ucie_alerts',
        sql: `
          CREATE TABLE IF NOT EXISTS ucie_alerts (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            symbol VARCHAR(20) NOT NULL,
            alert_type VARCHAR(50) NOT NULL,
            threshold DECIMAL(20, 8),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            triggered_at TIMESTAMP WITH TIME ZONE
          );
        `
      },
      {
        name: 'ucie_alerts_indexes',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_ucie_alerts_user_id 
          ON ucie_alerts(user_id);
          CREATE INDEX IF NOT EXISTS idx_ucie_alerts_symbol 
          ON ucie_alerts(symbol);
          CREATE INDEX IF NOT EXISTS idx_ucie_alerts_is_active 
          ON ucie_alerts(is_active);
        `
      }
    ];
    
    // Create each table
    for (const table of tables) {
      console.log(`📦 Creating ${table.name}...`);
      try {
        await query(table.sql);
        console.log(`   ✅ ${table.name} created\n`);
      } catch (error) {
        console.log(`   ⚠️  ${table.name}: ${error.message}\n`);
      }
    }
    
    // Verify
    console.log('🔍 Verifying tables...');
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE 'ucie_%'
      ORDER BY table_name
    `);
    
    console.log(`\n✅ Found ${result.rows.length} tables:`);
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    if (result.rows.length === 6) {
      console.log('\n🎉 SUCCESS! All 6 UCIE tables created!');
      console.log('\n📋 Next steps:');
      console.log('   1. Run: npm run test:ucie');
      console.log('   2. Deploy to production');
    } else {
      console.log(`\n⚠️  Only ${result.rows.length}/6 tables created`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

simpleSetup().then(() => process.exit(0));
