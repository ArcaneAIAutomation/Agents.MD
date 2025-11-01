/**
 * Diagnostic Endpoint for Authentication System
 * GET /api/diagnostic-auth
 * 
 * Tests database connectivity and environment variables
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { testConnection, query } from '../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
  };

  try {
    // Check 1: Environment Variables
    diagnostics.checks.env_vars = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      CRON_SECRET: !!process.env.CRON_SECRET,
      KV_REST_API_URL: !!process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    };

    // Check 2: Database Connection
    try {
      const dbConnected = await testConnection();
      diagnostics.checks.database = {
        connected: dbConnected,
        status: dbConnected ? 'OK' : 'FAILED',
      };
    } catch (error: any) {
      diagnostics.checks.database = {
        connected: false,
        status: 'ERROR',
        error: error.message,
      };
    }

    // Check 3: Database Tables
    if (diagnostics.checks.database.connected) {
      try {
        const tablesResult = await query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('users', 'access_codes', 'sessions', 'auth_logs')
          ORDER BY table_name
        `);

        diagnostics.checks.tables = {
          found: tablesResult.rows.length,
          expected: 4,
          tables: tablesResult.rows.map((r: any) => r.table_name),
          status: tablesResult.rows.length === 4 ? 'OK' : 'INCOMPLETE',
        };

        // Check 4: Access Codes
        const codesResult = await query(`
          SELECT COUNT(*) as total,
                 COUNT(*) FILTER (WHERE redeemed = FALSE) as available
          FROM access_codes
        `);

        diagnostics.checks.access_codes = {
          total: parseInt(codesResult.rows[0].total),
          available: parseInt(codesResult.rows[0].available),
          status: parseInt(codesResult.rows[0].available) > 0 ? 'OK' : 'NONE_AVAILABLE',
        };

        // Check 5: Users
        const usersResult = await query('SELECT COUNT(*) as count FROM users');
        diagnostics.checks.users = {
          count: parseInt(usersResult.rows[0].count),
          status: 'OK',
        };

      } catch (error: any) {
        diagnostics.checks.tables = {
          status: 'ERROR',
          error: error.message,
        };
      }
    }

    // Overall Status
    const allChecksOk = 
      diagnostics.checks.env_vars.DATABASE_URL &&
      diagnostics.checks.env_vars.JWT_SECRET &&
      diagnostics.checks.database?.connected &&
      diagnostics.checks.tables?.status === 'OK' &&
      diagnostics.checks.access_codes?.available > 0;

    diagnostics.overall_status = allChecksOk ? 'HEALTHY' : 'ISSUES_DETECTED';

    return res.status(200).json(diagnostics);

  } catch (error: any) {
    return res.status(500).json({
      error: 'Diagnostic failed',
      message: error.message,
      diagnostics,
    });
  }
}
