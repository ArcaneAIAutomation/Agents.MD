/**
 * Audit Logging Utility
 * 
 * Provides functions for logging authentication events to the database.
 * All logging is non-blocking (fire and forget) to avoid impacting performance.
 */

import { NextApiRequest } from 'next';
import { sql } from '@vercel/postgres';

/**
 * Authentication event types
 */
export type AuthEventType = 
  | 'login'
  | 'logout'
  | 'register'
  | 'failed_login'
  | 'failed_register'
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'token_refresh'
  | 'suspicious_activity';

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  userId?: string | null;
  eventType: AuthEventType;
  ipAddress?: string | null;
  userAgent?: string | null;
  success: boolean;
  errorMessage?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Extract client IP address from request
 * 
 * @param req - Next.js API request
 * @returns Client IP address
 */
function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Extract user agent from request
 * 
 * @param req - Next.js API request
 * @returns User agent string
 */
function getUserAgent(req: NextApiRequest): string {
  const userAgent = req.headers['user-agent'];
  return userAgent || 'unknown';
}

/**
 * Log an authentication event to the database
 * This function is non-blocking and will not throw errors to the caller
 * 
 * @param entry - Audit log entry data
 * @param req - Optional Next.js API request for automatic IP/UA extraction
 */
export async function logAuthEvent(
  entry: AuditLogEntry,
  req?: NextApiRequest
): Promise<void> {
  // Run asynchronously without blocking
  setImmediate(async () => {
    try {
      const ipAddress = entry.ipAddress || (req ? getClientIP(req) : null);
      const userAgent = entry.userAgent || (req ? getUserAgent(req) : null);

      await sql`
        INSERT INTO auth_logs (
          user_id,
          event_type,
          ip_address,
          user_agent,
          success,
          error_message,
          timestamp
        ) VALUES (
          ${entry.userId || null},
          ${entry.eventType},
          ${ipAddress},
          ${userAgent},
          ${entry.success},
          ${entry.errorMessage || null},
          NOW()
        )
      `;

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Audit Log]', {
          eventType: entry.eventType,
          userId: entry.userId,
          success: entry.success,
          ipAddress,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      // Log error but don't throw (fire and forget)
      console.error('Failed to write audit log:', error);
    }
  });
}

/**
 * Log successful login event
 * 
 * @param userId - User ID who logged in
 * @param req - Next.js API request
 */
export function logLogin(userId: string, req: NextApiRequest): void {
  logAuthEvent({
    userId,
    eventType: 'login',
    success: true
  }, req);
}

/**
 * Log failed login attempt
 * 
 * @param email - Email used in failed login attempt
 * @param reason - Reason for failure
 * @param req - Next.js API request
 */
export function logFailedLogin(
  email: string,
  reason: string,
  req: NextApiRequest
): void {
  logAuthEvent({
    userId: null,
    eventType: 'failed_login',
    success: false,
    errorMessage: `Failed login for ${email}: ${reason}`
  }, req);
}

/**
 * Log successful registration event
 * 
 * @param userId - Newly created user ID
 * @param email - Email used for registration
 * @param req - Next.js API request
 */
export function logRegistration(
  userId: string,
  email: string,
  req: NextApiRequest
): void {
  logAuthEvent({
    userId,
    eventType: 'register',
    success: true
  }, req);
}

/**
 * Log failed registration attempt
 * 
 * @param email - Email used in failed registration
 * @param reason - Reason for failure
 * @param req - Next.js API request
 */
export function logFailedRegistration(
  email: string,
  reason: string,
  req: NextApiRequest
): void {
  logAuthEvent({
    userId: null,
    eventType: 'failed_register',
    success: false,
    errorMessage: `Failed registration for ${email}: ${reason}`
  }, req);
}

/**
 * Log logout event
 * 
 * @param userId - User ID who logged out
 * @param req - Next.js API request
 */
export function logLogout(userId: string, req: NextApiRequest): void {
  logAuthEvent({
    userId,
    eventType: 'logout',
    success: true
  }, req);
}

/**
 * Log password reset request
 * 
 * @param email - Email requesting password reset
 * @param req - Next.js API request
 */
export function logPasswordResetRequest(
  email: string,
  req: NextApiRequest
): void {
  logAuthEvent({
    userId: null,
    eventType: 'password_reset_request',
    success: true,
    errorMessage: `Password reset requested for ${email}`
  }, req);
}

/**
 * Log password reset completion
 * 
 * @param userId - User ID who completed password reset
 * @param req - Next.js API request
 */
export function logPasswordResetComplete(
  userId: string,
  req: NextApiRequest
): void {
  logAuthEvent({
    userId,
    eventType: 'password_reset_complete',
    success: true
  }, req);
}

/**
 * Log suspicious activity
 * 
 * @param description - Description of suspicious activity
 * @param req - Next.js API request
 * @param userId - Optional user ID if known
 */
export function logSuspiciousActivity(
  description: string,
  req: NextApiRequest,
  userId?: string
): void {
  logAuthEvent({
    userId: userId || null,
    eventType: 'suspicious_activity',
    success: false,
    errorMessage: description
  }, req);
}

/**
 * Get recent authentication logs for a user
 * 
 * @param userId - User ID to get logs for
 * @param limit - Maximum number of logs to return (default: 10)
 * @returns Array of recent auth logs
 */
export async function getUserAuthLogs(
  userId: string,
  limit: number = 10
): Promise<any[]> {
  try {
    const result = await sql`
      SELECT 
        id,
        event_type,
        ip_address,
        user_agent,
        success,
        error_message,
        timestamp
      FROM auth_logs
      WHERE user_id = ${userId}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    return result.rows;
  } catch (error) {
    console.error('Failed to get user auth logs:', error);
    return [];
  }
}

/**
 * Get recent failed login attempts for an email/IP
 * 
 * @param identifier - Email or IP address
 * @param minutes - Time window in minutes (default: 15)
 * @returns Number of failed attempts
 */
export async function getRecentFailedAttempts(
  identifier: string,
  minutes: number = 15
): Promise<number> {
  try {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM auth_logs
      WHERE 
        event_type = 'failed_login'
        AND (
          error_message LIKE ${`%${identifier}%`}
          OR ip_address = ${identifier}
        )
        AND timestamp > NOW() - INTERVAL '${minutes} minutes'
    `;

    return parseInt(result.rows[0]?.count || '0', 10);
  } catch (error) {
    console.error('Failed to get recent failed attempts:', error);
    return 0;
  }
}

/**
 * Clean up old audit logs (for maintenance)
 * Removes logs older than specified days
 * 
 * @param daysToKeep - Number of days to keep logs (default: 90)
 * @returns Number of deleted logs
 */
export async function cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
  try {
    const result = await sql`
      DELETE FROM auth_logs
      WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
    `;

    const deletedCount = result.rowCount || 0;
    
    console.log(`Cleaned up ${deletedCount} old audit logs`);
    
    return deletedCount;
  } catch (error) {
    console.error('Failed to cleanup old logs:', error);
    return 0;
  }
}
