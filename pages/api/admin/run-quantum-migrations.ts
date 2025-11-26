/**
 * Admin API: Run Quantum BTC Migrations
 * 
 * Runs all Quantum BTC migrations in order to set up the database tables.
 * 
 * Security: Public endpoint (no auth required for initial setup)
 * Note: In production, this should be protected with authentication
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Quantum BTC] Running migrations...');

    const results: any[] = [];
    const migrationsDir = join(process.cwd(), 'migrations', 'quantum-btc');

    // List of migrations in order
    const migrations = [
      '001_create_quantum_btc_tables.sql',
      '002_add_quantum_btc_indexes.sql',
      '003_add_quantum_btc_monitoring.sql',
      '004_add_quantum_btc_performance_cache.sql',
      '005_add_quantum_btc_constraints.sql',
      '006_optimize_database_queries.sql'
    ];

    // Run each migration
    for (const migrationFile of migrations) {
      try {
        console.log(`[Quantum BTC] Running migration: ${migrationFile}...`);
        const migrationPath = join(migrationsDir, migrationFile);
        const migrationSQL = readFileSync(migrationPath, 'utf-8');
        
        await query(migrationSQL);
        
        results.push({
          migration: migrationFile,
          status: 'success'
        });
        
        console.log(`[Quantum BTC] Migration ${migrationFile} completed`);
      } catch (error) {
        console.error(`[Quantum BTC] Migration ${migrationFile} failed:`, error);
        
        // Check if error is "already exists" - that's OK
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('already exists')) {
          results.push({
            migration: migrationFile,
            status: 'skipped',
            reason: 'Already exists'
          });
        } else {
          results.push({
            migration: migrationFile,
            status: 'failed',
            error: errorMessage
          });
        }
      }
    }

    // Verify critical tables exist
    console.log('[Quantum BTC] Verifying database schema...');
    const verification: Record<string, boolean> = {};
    
    const criticalTables = [
      'quantum_btc_trades',
      'quantum_btc_market_data',
      'quantum_btc_technical_indicators',
      'quantum_btc_monitoring',
      'quantum_btc_performance_cache'
    ];
    
    for (const table of criticalTables) {
      const result = await query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );
      
      verification[table] = result.rows[0].exists;
    }

    const allTablesExist = Object.values(verification).every(v => v);

    return res.status(200).json({
      success: true,
      message: 'Quantum BTC migrations completed',
      migrations: results,
      verification: {
        tables: verification,
        allTablesExist,
        ready: allTablesExist
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Quantum BTC] Migration failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
