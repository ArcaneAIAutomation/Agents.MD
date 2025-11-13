/**
 * Admin API: Run ATGE Monitoring Tables Migration
 * 
 * Creates the missing atge_performance_metrics table and related monitoring tables
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

    console.log('[Admin] Running ATGE monitoring tables migration...');

    // Read the migration file
    const migrationPath = join(process.cwd(), 'migrations', '002_create_atge_monitoring_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    await query(migrationSQL);

    console.log('[Admin] Migration completed successfully');

    // Verify tables exist
    const tables = ['atge_error_logs', 'atge_performance_metrics', 'atge_user_feedback'];
    const verification: Record<string, boolean> = {};
    
    for (const table of tables) {
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

    return res.status(200).json({
      success: true,
      message: 'ATGE monitoring tables migration completed successfully',
      tables: {
        created: ['atge_error_logs', 'atge_performance_metrics', 'atge_user_feedback'],
        views: ['atge_recent_critical_errors', 'atge_performance_summary_24h', 'atge_feedback_summary']
      },
      verification,
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
