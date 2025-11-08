/**
 * Database Diagnostic Endpoint
 * 
 * Tests database connection and cache functionality
 * GET /api/ucie/diagnostic/database
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../../lib/db';
import { setCachedAnalysis, getCachedAnalysis } from '../../../../lib/ucie/cacheUtils';

interface DiagnosticResponse {
  success: boolean;
  timestamp: string;
  checks: {
    name: string;
    status: 'pass' | 'fail';
    message: string;
    details?: any;
  }[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DiagnosticResponse>
) {
  const checks: DiagnosticResponse['checks'] = [];
  
  // Check 1: Environment variable
  checks.push({
    name: 'DATABASE_URL Environment Variable',
    status: process.env.DATABASE_URL ? 'pass' : 'fail',
    message: process.env.DATABASE_URL 
      ? 'DATABASE_URL is set' 
      : 'DATABASE_URL is not set',
    details: process.env.DATABASE_URL 
      ? { host: process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown' }
      : undefined
  });
  
  // Check 2: Database connection
  try {
    const result = await query('SELECT NOW() as current_time');
    checks.push({
      name: 'Database Connection',
      status: 'pass',
      message: 'Successfully connected to database',
      details: { currentTime: result.rows[0].current_time }
    });
  } catch (error) {
    checks.push({
      name: 'Database Connection',
      status: 'fail',
      message: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : String(error) }
    });
  }
  
  // Check 3: Table exists
  try {
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ucie_analysis_cache'
      );
    `);
    
    const exists = result.rows[0].exists;
    checks.push({
      name: 'Cache Table Exists',
      status: exists ? 'pass' : 'fail',
      message: exists 
        ? 'ucie_analysis_cache table exists' 
        : 'ucie_analysis_cache table does not exist'
    });
  } catch (error) {
    checks.push({
      name: 'Cache Table Exists',
      status: 'fail',
      message: `Failed to check table: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
  
  // Check 4: Write test
  try {
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      value: Math.random()
    };
    
    await setCachedAnalysis('TEST', 'market-data', testData, 60, 100);
    
    checks.push({
      name: 'Cache Write',
      status: 'pass',
      message: 'Successfully wrote test data to cache',
      details: { testData }
    });
  } catch (error) {
    checks.push({
      name: 'Cache Write',
      status: 'fail',
      message: `Failed to write: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : String(error) }
    });
  }
  
  // Check 5: Read test
  try {
    const cachedData = await getCachedAnalysis('TEST', 'market-data');
    
    checks.push({
      name: 'Cache Read',
      status: cachedData ? 'pass' : 'fail',
      message: cachedData 
        ? 'Successfully read test data from cache' 
        : 'Failed to read test data (not found or expired)',
      details: { cachedData }
    });
  } catch (error) {
    checks.push({
      name: 'Cache Read',
      status: 'fail',
      message: `Failed to read: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : String(error) }
    });
  }
  
  // Check 6: Record count
  try {
    const result = await query(`
      SELECT COUNT(*) as total FROM ucie_analysis_cache;
    `);
    
    const total = parseInt(result.rows[0].total);
    checks.push({
      name: 'Cache Record Count',
      status: 'pass',
      message: `Found ${total} records in cache`,
      details: { total }
    });
  } catch (error) {
    checks.push({
      name: 'Cache Record Count',
      status: 'fail',
      message: `Failed to count records: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
  
  // Check 7: Recent records
  try {
    const result = await query(`
      SELECT 
        symbol,
        analysis_type,
        data_quality_score,
        created_at
      FROM ucie_analysis_cache
      ORDER BY created_at DESC
      LIMIT 5;
    `);
    
    checks.push({
      name: 'Recent Cache Records',
      status: 'pass',
      message: `Found ${result.rows.length} recent records`,
      details: { records: result.rows }
    });
  } catch (error) {
    checks.push({
      name: 'Recent Cache Records',
      status: 'fail',
      message: `Failed to fetch recent records: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
  
  // Calculate summary
  const passed = checks.filter(c => c.status === 'pass').length;
  const failed = checks.filter(c => c.status === 'fail').length;
  
  const response: DiagnosticResponse = {
    success: failed === 0,
    timestamp: new Date().toISOString(),
    checks,
    summary: {
      total: checks.length,
      passed,
      failed
    }
  };
  
  // Return appropriate status code
  const statusCode = failed === 0 ? 200 : 500;
  
  return res.status(statusCode).json(response);
}
