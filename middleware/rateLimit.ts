/**
 * Rate Limiting Middleware
 * 
 * Implements sliding window rate limiting using Vercel KV (Redis).
 * Prevents brute force attacks by limiting requests per time window.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

/**
 * Rate limit configuration options
 */
export interface RateLimitConfig {
  /**
   * Time window in milliseconds (default: 15 minutes)
   */
  windowMs?: number;

  /**
   * Maximum number of attempts per window (default: 5)
   */
  maxAttempts?: number;

  /**
   * Function to generate unique key for rate limiting
   * Default: uses IP address
   */
  keyGenerator?: (req: NextApiRequest) => string;

  /**
   * Custom error message when rate limit is exceeded
   */
  message?: string;
}

/**
 * Default rate limit configuration
 */
const DEFAULT_CONFIG: Required<RateLimitConfig> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  keyGenerator: (req: NextApiRequest) => {
    // Use IP address as default key
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' 
      ? forwarded.split(',')[0].trim()
      : req.socket.remoteAddress || 'unknown';
    return ip;
  },
  message: 'Too many attempts. Please try again later.'
};

/**
 * Get client IP address from request
 */
function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Rate limiting middleware using sliding window algorithm
 * 
 * @param config - Rate limit configuration options
 * @returns Middleware function
 */
export function rateLimit(config: RateLimitConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => void | Promise<void>
  ) => {
    try {
      // Generate unique key for this client/endpoint
      const identifier = finalConfig.keyGenerator(req);
      const endpoint = req.url || 'unknown';
      const key = `ratelimit:${endpoint}:${identifier}`;

      // Get current timestamp
      const now = Date.now();
      const windowStart = now - finalConfig.windowMs;

      // Get attempts from KV store
      let attempts: number[] = [];
      try {
        const stored = await kv.get<number[]>(key);
        attempts = stored || [];
      } catch (error) {
        console.error('Rate limit: Failed to get attempts from KV:', error);
        // If KV is unavailable, allow the request (fail open)
        return next();
      }

      // Filter out attempts outside the current window (sliding window)
      const recentAttempts = attempts.filter(timestamp => timestamp > windowStart);

      // Check if rate limit is exceeded
      if (recentAttempts.length >= finalConfig.maxAttempts) {
        const oldestAttempt = Math.min(...recentAttempts);
        const retryAfter = Math.ceil((oldestAttempt + finalConfig.windowMs - now) / 1000);

        res.setHeader('Retry-After', retryAfter.toString());
        res.setHeader('X-RateLimit-Limit', finalConfig.maxAttempts.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', new Date(oldestAttempt + finalConfig.windowMs).toISOString());

        return res.status(429).json({
          success: false,
          message: finalConfig.message,
          retryAfter
        });
      }

      // Add current attempt
      recentAttempts.push(now);

      // Store updated attempts in KV with expiration
      try {
        const expirationSeconds = Math.ceil(finalConfig.windowMs / 1000);
        await kv.set(key, recentAttempts, { ex: expirationSeconds });
      } catch (error) {
        console.error('Rate limit: Failed to store attempts in KV:', error);
        // Continue even if storage fails (fail open)
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', finalConfig.maxAttempts.toString());
      res.setHeader('X-RateLimit-Remaining', (finalConfig.maxAttempts - recentAttempts.length).toString());
      res.setHeader('X-RateLimit-Reset', new Date(now + finalConfig.windowMs).toISOString());

      // Continue to next middleware/handler
      return next();
    } catch (error) {
      console.error('Rate limiting middleware error:', error);
      // On error, allow the request (fail open for availability)
      return next();
    }
  };
}

/**
 * Create rate limiter for specific endpoint with custom config
 * 
 * @param endpointName - Name of the endpoint for key generation
 * @param config - Rate limit configuration
 * @returns Middleware function
 */
export function createRateLimiter(
  endpointName: string,
  config: RateLimitConfig = {}
) {
  return rateLimit({
    ...config,
    keyGenerator: (req: NextApiRequest) => {
      const identifier = config.keyGenerator 
        ? config.keyGenerator(req)
        : getClientIP(req);
      return `${endpointName}:${identifier}`;
    }
  });
}

/**
 * Rate limiter for login endpoint (5 attempts per email per 15 minutes)
 */
export const loginRateLimiter = createRateLimiter('login', {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  keyGenerator: (req: NextApiRequest) => {
    // Use email from request body if available, otherwise IP
    const email = req.body?.email;
    return email || getClientIP(req);
  },
  message: 'Too many login attempts. Please try again in 15 minutes.'
});

/**
 * Rate limiter for registration endpoint (5 attempts per IP per 15 minutes)
 */
export const registrationRateLimiter = createRateLimiter('register', {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many registration attempts. Please try again in 15 minutes.'
});

/**
 * Wrapper to use rate limiter with Next.js API routes
 * 
 * @param limiter - Rate limiter middleware
 * @param handler - API route handler
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit(
  limiter: ReturnType<typeof rateLimit>,
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    return new Promise<void>((resolve, reject) => {
      limiter(req, res, async () => {
        try {
          await handler(req, res);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  };
}
