/**
 * Admin API: Run ALL ATGE Migrations
 * 
 * Runs all missing migrations in order:
 * 1. Monitoring tables (002_create_atge_monitoring_tables.sql)
 * 2. Missing columns (003_add_missing_columns.sql)
 * 
 * Security: Requires ADMIN_SECRET environment variable
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
    // Security check
    const adminSecret = req.headers['x-admin-secret'] || req.body.adminSecret;
    
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or missing admin secret'
      });
    }

    console.log('[Admin] Running ALL ATGE migrations...');

    const results: any[] = [];

    // Migration 1: Monitoring Tables
    try {
      console.log('[Admin] Running migration 002: Monitoring tables...');
      const migration002Path = join(process.cwd(), 'migrations', '002_create_atge_monitoring_tables.sql');
      const migration002SQL = readFileSync(migration002Path, 'utf-8');
      await query(migration002SQL);
      results.push({
        migration: '002_create_atge_monitoring_tables',
        status: 'success',
        tables: ['atge_error_logs', 'atge_performance_metrics', 'atge_user_feedback']
      });
      console.log('[Admin] Migration 002 completed');
    } catch (error) {
      console.error('[Admin] Migration 002 failed:', error);
      results.push({
        migration: '002_create_atge_monitoring_tables',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Migration 2: Missing Columns
    try {
      console.log('[Admin] Running migration 003: Missing columns...');
      const migration003Path = join(process.cwd(), 'migrations', '003_add_missing_columns.sql');
      const migration003SQL = readFileSync(migration003Path, 'utf-8');
      await query(migration003SQL);
      results.push({
        migration: '003_add_missing_columns',
        status: 'success',
        columns: ['galaxy_score', 'alt_rank', 'social_dominance', 'sentiment_*', 'social_*', 'correlation_score']
      });
      console.log('[Admin] Migration 003 completed');
    } catch (error) {
      console.error('[Admin] Migration 003 failed:', error);
      results.push({
        migration: '003_add_missing_columns',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Verify critical tables exist
    console.log('[Admin] Verifying database schema...');
    const verification: Record<string, boolean> = {};
    
    const criticalTables = [
      'trade_signals',
      'trade_technical_indicators',
      'trade_market_snapshot',
      'trade_historical_prices',
      'trade_results',
      'atge_performance_cache',
      'atge_error_logs',
      'atge_performance_metrics',
      'atge_user_feedback'
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

    // Verify critical columns exist
    const criticalColumns: Record<string, boolean> = {};
    
    const columnsToCheck = [
      { table: 'trade_market_snapshot', column: 'galaxy_score' },
      { table: 'trade_market_snapshot', column: 'alt_rank' },
      { table: 'trade_market_snapshot', column: 'social_dominance' }
    ];
    
    for (const { table, column } of columnsToCheck) {
      const result = await query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = $1 
          AND column_name = $2
        )`,
        [table, column]
      );
      
      criticalColumns[`${table}.${column}`] = result.rows[0].exists;
    }

    const allTablesExist = Object.values(verification).every(v => v);
    const allColumnsExist = Object.values(criticalColumns).every(v => v);

    return res.status(200).json({
      success: true,
      message: 'All ATGE migrations completed',
      migrations: results,
      verification: {
        tables: verification,
        columns: criticalColumns,
        allTablesExist,
        allColumnsExist,
        ready: allTablesExist && allColumnsExist
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Admin] Migration failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
