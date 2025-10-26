import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

/**
 * CSRF Token Management Middleware
 * 
 * Implements Cross-Site Request Forgery protection for state-changing API endpoints.
 * Tokens are generated on session creation and validated on POST/PUT/DELETE requests.
 */

// Store CSRF tokens in memory (in production, use Redis/database)
// Key: session ID or user ID, Value: CSRF token
const csrfTokenStore = new Map<string, { token: string; expiresAt: number }>();

// Token expiration time (24 hours)
const TOKEN_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Store CSRF token for a session/user
 */
export function storeCsrfToken(sessionId: string, token: string): void {
  csrfTokenStore.set(sessionId, {
    token,
    expiresAt: Date.now() + TOKEN_EXPIRATION_MS,
  });
}

/**
 * Get CSRF token for a session/user
 */
export function getCsrfToken(sessionId: string): string | null {
  const tokenData = csrfTokenStore.get(sessionId);
  
  if (!tokenData) {
    return null;
  }
  
  // Check if token has expired
  if (Date.now() > tokenData.expiresAt) {
    csrfTokenStore.delete(sessionId);
    return null;
  }
  
  return tokenData.token;
}

/**
 * Delete CSRF token for a session/user
 */
export function deleteCsrfToken(sessionId: string): void {
  csrfTokenStore.delete(sessionId);
}

/**
 * Validate CSRF token from request
 */
export function validateCsrfToken(sessionId: string, providedToken: string): boolean {
  const storedToken = getCsrfToken(sessionId);
  
  if (!storedToken) {
    return false;
  }
  
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(storedToken),
    Buffer.from(providedToken)
  );
}

/**
 * Extract CSRF token from request
 * Checks both headers and body
 */
function extractCsrfToken(req: NextApiRequest): string | null {
  // Check X-CSRF-Token header (preferred)
  const headerToken = req.headers['x-csrf-token'];
  if (headerToken && typeof headerToken === 'string') {
    return headerToken;
  }
  
  // Check request body as fallback
  if (req.body && typeof req.body.csrfToken === 'string') {
    return req.body.csrfToken;
  }
  
  return null;
}

/**
 * Get session ID from request
 * Uses JWT token from cookie or generates temporary ID
 */
function getSessionId(req: NextApiRequest): string {
  // Try to get session ID from auth token cookie
  const authToken = req.cookies.auth_token;
  if (authToken) {
    return authToken; // Use token as session ID
  }
  
  // For unauthenticated requests, use IP address as session ID
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' 
    ? forwarded.split(',')[0].trim() 
    : req.socket.remoteAddress || 'unknown';
  
  return `guest_${ip}`;
}

/**
 * CSRF Protection Middleware
 * 
 * Validates CSRF tokens on state-changing requests (POST, PUT, DELETE, PATCH)
 * Returns 403 Forbidden if token is invalid or missing
 */
export function csrfProtection(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
): void {
  // Only validate CSRF on state-changing methods
  const methodsToProtect = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  if (!methodsToProtect.includes(req.method || '')) {
    // GET, HEAD, OPTIONS don't need CSRF protection
    return next();
  }
  
  // Get session ID
  const sessionId = getSessionId(req);
  
  // Extract CSRF token from request
  const providedToken = extractCsrfToken(req);
  
  if (!providedToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing',
      code: 'CSRF_TOKEN_MISSING',
    });
  }
  
  // Validate token
  const isValid = validateCsrfToken(sessionId, providedToken);
  
  if (!isValid) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_INVALID',
    });
  }
  
  // Token is valid, proceed to next middleware/handler
  next();
}

/**
 * Generate and store CSRF token for a session
 * Call this when creating a new session (login/register)
 */
export function createCsrfToken(sessionId: string): string {
  const token = generateCsrfToken();
  storeCsrfToken(sessionId, token);
  return token;
}

/**
 * API endpoint to get CSRF token
 * Should be called before making state-changing requests
 */
export function getCsrfTokenHandler(req: NextApiRequest, res: NextApiResponse): void {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }
  
  const sessionId = getSessionId(req);
  
  // Get existing token or create new one
  let token = getCsrfToken(sessionId);
  
  if (!token) {
    token = createCsrfToken(sessionId);
  }
  
  res.status(200).json({
    success: true,
    csrfToken: token,
  });
}

/**
 * Cleanup expired tokens periodically
 * Should be called by a cron job or background task
 */
export function cleanupExpiredTokens(): void {
  const now = Date.now();
  
  for (const [sessionId, tokenData] of csrfTokenStore.entries()) {
    if (now > tokenData.expiresAt) {
      csrfTokenStore.delete(sessionId);
    }
  }
}

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredTokens, 60 * 60 * 1000);
}
