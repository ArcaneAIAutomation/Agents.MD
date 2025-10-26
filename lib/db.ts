/**
 * Database Connection and Query Utilities
 * Bitcoin Sovereign Technology - Authentication System
 * 
 * This module provides a connection pool and query helper functions
 * for interacting with Vercel Postgres database.
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User database model
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Access code database model
 */
export interface AccessCode {
  id: string;
  code: string;
  redeemed: boolean;
  redeemed_by: string | null;
  redeemed_at: Date | null;
  created_at: Date;
}

/**
 * Session database model
 */
export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

/**
 * Auth log database model
 */
export interface AuthLog {
  id: string;
  user_id: string | null;
  event_type: 'login' | 'logout' | 'register' | 'failed_login' | 'password_reset' | 'security_alert';
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  error_message: string | null;
  timestamp: Date;
}

/**
 * Database query options
 */
export interface QueryOptions {
  timeout?: number;
  retries?: number;
}

// ============================================================================
// CONNECTION POOL
// ============================================================================

let pool: Pool | null = null;

/**
 * Get or create database connection pool
 * Uses connection pooling for better performance
 */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Timeout after 10 seconds
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });

    console.log('✅ Database connection pool initialized');
  }

  return pool;
}

/**
 * Close the database connection pool
 * Should be called when shutting down the application
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Database connection pool closed');
  }
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Execute a parameterized query with automatic retry logic
 * 
 * @param text - SQL query string with $1, $2, etc. placeholders
 * @param params - Array of parameter values
 * @param options - Query options (timeout, retries)
 * @returns Query result
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params: any[] = [],
  options: QueryOptions = {}
): Promise<QueryResult<T>> {
  const { timeout = 10000, retries = 3 } = options;
  const pool = getPool();
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const start = Date.now();
      const result = await pool.query<T>({
        text,
        values: params,
        // rowMode removed - return objects instead of arrays for proper field access
      });
      const duration = Date.now() - start;
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`⚠️ Slow query (${duration}ms):`, text.substring(0, 100));
      }
      
      return result as QueryResult<T>;
    } catch (error) {
      lastError = error as Error;
      console.error(`Database query error (attempt ${attempt}/${retries}):`, error);
      
      // Don't retry on certain errors
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (
          message.includes('unique constraint') ||
          message.includes('foreign key') ||
          message.includes('check constraint') ||
          message.includes('syntax error')
        ) {
          throw error; // Don't retry validation errors
        }
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Query failed after retries');
}

/**
 * Execute a query and return a single row
 * 
 * @param text - SQL query string
 * @param params - Query parameters
 * @returns Single row or null if not found
 */
export async function queryOne<T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

/**
 * Execute a query and return all rows
 * 
 * @param text - SQL query string
 * @param params - Query parameters
 * @returns Array of rows
 */
export async function queryMany<T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

/**
 * Execute a transaction with automatic rollback on error
 * 
 * @param callback - Function that executes queries within the transaction
 * @returns Result of the callback function
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Test database connectivity
 * 
 * @returns True if connection is successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Database connection test successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

/**
 * Get database health status
 * 
 * @returns Health status object
 */
export async function getHealthStatus(): Promise<{
  connected: boolean;
  latency: number | null;
  error: string | null;
}> {
  const start = Date.now();
  
  try {
    await query('SELECT 1');
    const latency = Date.now() - start;
    
    return {
      connected: true,
      latency,
      error: null,
    };
  } catch (error) {
    return {
      connected: false,
      latency: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sanitize and normalize email address
 * 
 * @param email - Raw email input
 * @returns Normalized email (lowercase, trimmed)
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Sanitize and normalize access code
 * 
 * @param code - Raw access code input
 * @returns Normalized code (uppercase, trimmed)
 */
export function normalizeAccessCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Check if a database error is a unique constraint violation
 * 
 * @param error - Database error
 * @returns True if unique constraint violation
 */
export function isUniqueConstraintError(error: any): boolean {
  return error?.code === '23505' || error?.message?.includes('unique constraint');
}

/**
 * Check if a database error is a foreign key violation
 * 
 * @param error - Database error
 * @returns True if foreign key violation
 */
export function isForeignKeyError(error: any): boolean {
  return error?.code === '23503' || error?.message?.includes('foreign key');
}

/**
 * Check if a database error is a check constraint violation
 * 
 * @param error - Database error
 * @returns True if check constraint violation
 */
export function isCheckConstraintError(error: any): boolean {
  return error?.code === '23514' || error?.message?.includes('check constraint');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getPool,
  closePool,
  query,
  queryOne,
  queryMany,
  transaction,
  testConnection,
  getHealthStatus,
  normalizeEmail,
  normalizeAccessCode,
  isUniqueConstraintError,
  isForeignKeyError,
  isCheckConstraintError,
};
