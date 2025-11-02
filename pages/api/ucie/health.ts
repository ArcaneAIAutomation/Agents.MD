/**
 * UCIE Health Check Endpoint
 * Monitors system health and API availability
 * 
 * Returns:
 * - Overall health status
 * - Database connectivity
 * - Cache availability
 * - API key configuration status
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: 'healthy' | 'unhealthy';
    cache: 'healthy' | 'not_configured';
    apis: Record<string, 'configured' | 'missing'>;
  };
  uptime: number;
}

const startTime = Date.now();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const checks: HealthCheckResponse['checks'] = {
    database: 'unhealthy',
    cache: 'not_configured',
    apis: {},
  };

  let status: HealthCheckResponse['status'] = 'healthy';

  // Check database
  try {
    await query('SELECT 1');
    checks.database = 'healthy';
  } catch (error) {
    console.error('[Health Check] Database error:', error);
    checks.database = 'unhealthy';
    status = 'degraded';
  }

  // Check cache (Redis)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    checks.cache = 'healthy';
  } else {
    checks.cache = 'not_configured';
  }

  // Check API keys
  const apiKeys = {
    caesar: process.env.CAESAR_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    coingecko: process.env.COINGECKO_API_KEY,
    etherscan: process.env.ETHERSCAN_API_KEY,
    lunarcrush: process.env.LUNARCRUSH_API_KEY,
    twitter: process.env.TWITTER_BEARER_TOKEN,
    coinglass: process.env.COINGLASS_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  };

  Object.entries(apiKeys).forEach(([name, key]) => {
    checks.apis[name] = key ? 'configured' : 'missing';
    if (!key && name !== 'coingecko') { // CoinGecko is optional
      status = 'degraded';
    }
  });

  // Calculate uptime
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const response: HealthCheckResponse = {
    status,
    timestamp: new Date().toISOString(),
    checks,
    uptime,
  };

  const statusCode = status === 'healthy' ? 200 : 503;
  return res.status(statusCode).json(response);
}
