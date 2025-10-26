/**
 * Session Cleanup Cron Job
 * Bitcoin Sovereign Technology - Authentication System
 * 
 * This script deletes expired sessions from the database.
 * Should be run daily via Vercel Cron Jobs.
 * 
 * Usage:
 *   npx tsx scripts/cleanup-sessions.ts
 * 
 * Vercel Cron Configuration (vercel.json):
 *   {
 *     "crons": [{
 *       "path": "/api/cron/cleanup-sessions",
 *       "schedule": "0 2 * * *"
 *     }]
 *   }
 */

import { query, getPool, closePool } from '../lib/db';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CleanupStats {
  deletedCount: number;
  oldestExpired: Date | null;
  newestExpired: Date | null;
  duration: number;
  timestamp: Date;
}

// ============================================================================
// CLEANUP FUNCTION
// ============================================================================

/**
 * Delete expired sessions from the database
 * 
 * @returns Cleanup statistics
 */
async function cleanupExpiredSessions(): Promise<CleanupStats> {
  const startTime = Date.now();
  const timestamp = new Date();
  
  console.log('🧹 Starting session cleanup...');
  console.log(`⏰ Current time: ${timestamp.toISOString()}`);
  
  try {
    // First, get statistics about expired sessions before deletion
    const statsQuery = `
      SELECT 
        COUNT(*) as count,
        MIN(expires_at) as oldest_expired,
        MAX(expires_at) as newest_expired
      FROM sessions
      WHERE expires_at < NOW()
    `;
    
    const statsResult = await query(statsQuery);
    const stats = statsResult.rows[0];
    
    console.log(`📊 Found ${stats.count} expired sessions`);
    
    if (stats.count > 0) {
      console.log(`   Oldest expired: ${stats.oldest_expired}`);
      console.log(`   Newest expired: ${stats.newest_expired}`);
    }
    
    // Delete expired sessions
    const deleteQuery = `
      DELETE FROM sessions
      WHERE expires_at < NOW()
      RETURNING id, user_id, expires_at
    `;
    
    const deleteResult = await query(deleteQuery);
    const deletedCount = deleteResult.rowCount || 0;
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Cleanup completed successfully`);
    console.log(`   Deleted: ${deletedCount} sessions`);
    console.log(`   Duration: ${duration}ms`);
    
    return {
      deletedCount,
      oldestExpired: stats.oldest_expired ? new Date(stats.oldest_expired) : null,
      newestExpired: stats.newest_expired ? new Date(stats.newest_expired) : null,
      duration,
      timestamp,
    };
  } catch (error) {
    console.error('❌ Session cleanup failed:', error);
    throw error;
  }
}

/**
 * Log cleanup statistics to auth_logs table
 * 
 * @param stats - Cleanup statistics
 */
async function logCleanupStats(stats: CleanupStats): Promise<void> {
  try {
    const logQuery = `
      INSERT INTO auth_logs (
        user_id,
        event_type,
        ip_address,
        user_agent,
        success,
        error_message,
        timestamp
      ) VALUES (
        NULL,
        'security_alert',
        NULL,
        'session-cleanup-cron',
        TRUE,
        $1,
        NOW()
      )
    `;
    
    const message = JSON.stringify({
      action: 'session_cleanup',
      deleted_count: stats.deletedCount,
      oldest_expired: stats.oldestExpired?.toISOString(),
      newest_expired: stats.newestExpired?.toISOString(),
      duration_ms: stats.duration,
    });
    
    await query(logQuery, [message]);
    console.log('📝 Cleanup statistics logged to auth_logs');
  } catch (error) {
    console.error('⚠️ Failed to log cleanup statistics:', error);
    // Don't throw - logging failure shouldn't fail the cleanup
  }
}

/**
 * Get current session statistics
 * 
 * @returns Session statistics
 */
async function getSessionStats(): Promise<{
  total: number;
  active: number;
  expired: number;
}> {
  const statsQuery = `
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE expires_at > NOW()) as active,
      COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired
    FROM sessions
  `;
  
  const result = await query(statsQuery);
  const stats = result.rows[0];
  
  return {
    total: parseInt(stats.total) || 0,
    active: parseInt(stats.active) || 0,
    expired: parseInt(stats.expired) || 0,
  };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

/**
 * Main function - orchestrates the cleanup process
 */
async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Bitcoin Sovereign Technology - Session Cleanup');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  try {
    // Get initial statistics
    console.log('📊 Getting session statistics...');
    const beforeStats = await getSessionStats();
    console.log(`   Total sessions: ${beforeStats.total}`);
    console.log(`   Active sessions: ${beforeStats.active}`);
    console.log(`   Expired sessions: ${beforeStats.expired}`);
    console.log('');
    
    // Perform cleanup
    const cleanupStats = await cleanupExpiredSessions();
    console.log('');
    
    // Get final statistics
    console.log('📊 Getting updated session statistics...');
    const afterStats = await getSessionStats();
    console.log(`   Total sessions: ${afterStats.total}`);
    console.log(`   Active sessions: ${afterStats.active}`);
    console.log(`   Expired sessions: ${afterStats.expired}`);
    console.log('');
    
    // Log to database
    await logCleanupStats(cleanupStats);
    console.log('');
    
    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Cleanup Summary');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Sessions deleted: ${cleanupStats.deletedCount}`);
    console.log(`  Duration: ${cleanupStats.duration}ms`);
    console.log(`  Status: ✅ Success`);
    console.log('═══════════════════════════════════════════════════════════');
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('  Cleanup Failed');
    console.error('═══════════════════════════════════════════════════════════');
    console.error(error);
    console.error('═══════════════════════════════════════════════════════════');
    
    process.exit(1);
  } finally {
    // Always close the database connection
    await closePool();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// ============================================================================
// EXPORTS (for API endpoint usage)
// ============================================================================

export { cleanupExpiredSessions, logCleanupStats, getSessionStats };
export type { CleanupStats };
