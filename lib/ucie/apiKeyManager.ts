/**
 * API Key Management System for UCIE
 * 
 * Provides secure API key storage, retrieval, validation, and monitoring
 * for all 15+ external services used by the Universal Crypto Intelligence Engine.
 * 
 * Features:
 * - Centralized API key management
 * - Secure key storage and retrieval
 * - API key validation and health checks
 * - Rate limiting per API
 * - Cost tracking and monitoring
 * - Automatic fallback to alternative services
 * 
 * Requirements: 13.5, 14.2
 */

// =============================================================================
// Types and Interfaces
// =============================================================================

export interface APIKeyConfig {
  name: string;
  key: string | undefined;
  required: boolean;
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  cost: {
    perRequest: number;
    currency: string;
  };
  healthCheck?: {
    endpoint: string;
    method: string;
    expectedStatus: number;
  };
}

export interface APIServiceStatus {
  name: string;
  available: boolean;
  lastChecked: Date;
  responseTime: number;
  errorMessage?: string;
}

export interface APIUsageStats {
  serviceName: string;
  requestCount: number;
  successCount: number;
  failureCount: number;
  totalCost: number;
  lastUsed: Date;
}

export interface RateLimitStatus {
  serviceName: string;
  remaining: number;
  resetAt: Date;
  isLimited: boolean;
}

// =============================================================================
// API Service Configurations
// =============================================================================

/**
 * Complete configuration for all UCIE API services
 * Includes rate limits, costs, and health check endpoints
 */
export const API_SERVICES: Record<string, APIKeyConfig> = {
  // AI Services
  OPENAI: {
    name: 'OpenAI GPT-4o',
    key: process.env.OPENAI_API_KEY,
    required: true,
    rateLimit: {
      maxRequests: 500,
      windowMs: 60000, // 1 minute
    },
    cost: {
      perRequest: 0.01, // $0.01 per request (average)
      currency: 'USD',
    },
    healthCheck: {
      endpoint: 'https://api.openai.com/v1/models',
      method: 'GET',
      expectedStatus: 200,
    },
  },

  CAESAR: {
    name: 'Caesar AI Research',
    key: process.env.CAESAR_API_KEY,
    required: true,
    rateLimit: {
      maxRequests: 10,
      windowMs: 60000, // 1 minute
    },
    cost: {
      perRequest: 0.05, // $0.05 per research job
      currency: 'USD',
    },
  },

  GEMINI: {
    name: 'Google Gemini',
    key: process.env.GEMINI_API_KEY,
    required: false,
    rateLimit: {
      maxRequests: 60,
      windowMs: 60000, // 1 minute
    },
    cost: {
      perRequest: 0.0001, // $0.0001 per request (Flash)
      currency: 'USD',
    },
  },

  // Market Data Services
  COINGECKO: {
    name: 'CoinGecko',
    key: process.env.COINGECKO_API_KEY,
    required: false, // Free tier available
    rateLimit: {
      maxRequests: 50,
      windowMs: 60000, // 1 minute (free tier)
    },
    cost: {
      perRequest: 0,
      currency: 'USD',
    },
    healthCheck: {
      endpoint: 'https://api.coingecko.com/api/v3/ping',
      method: 'GET',
      expectedStatus: 200,
    },
  },

  COINMARKETCAP: {
    name: 'CoinMarketCap',
    key: process.env.COINMARKETCAP_API_KEY,
    required: true,
    rateLimit: {
      maxRequests: 333,
      windowMs: 86400000, // 24 hours (basic plan)
    },
    cost: {
      perRequest: 0.0003, // ~$10/month for 333 calls/day
      currency: 'USD',
    },
    healthCheck: {
      endpoint: 'https://pro-api.coinmarketcap.com/v1/key/info',
      method: 'GET',
      expectedStatus: 200,
    },
  },

  // Blockchain Explorer Services
  ETHERSCAN: {
    name: 'Etherscan',
    key: process.env.ETHERSCAN_API_KEY,
    required: true,
    rateLimit: {
      maxRequests: 5,
      windowMs: 1000, // 5 calls per second
    },
    cost: {
      perRequest: 0,
      currency: 'USD',
    },
    healthCheck: {
      endpoint: 'https://api.etherscan.io/v2/api?module=stats&action=ethprice&chainid=1',
      method: 'GET',
      expectedStatus: 200,
    },
  },

  BSCSCAN: {
    name: 'BSCScan',
    key: process.env.BSCSCAN_API_KEY,
    required: false,
    rateLimit: {
      maxRequests: 5,
      windowMs: 1000, // 5 calls per second
    },
    cost: {
      perRequest: 0,
      currency: 'USD',
    },
  },

  POLYGONSCAN: {
    name: 'Polygonscan',
    key: process.env.POLYGONSCAN_API_KEY,
    required: false,
    rateLimit: {
      maxRequests: 5,
      windowMs: 1000, // 5 calls per second
    },
    cost: {
      perRequest: 0,
      currency: 'USD',
    },
  },

  // Social Sentiment Services
  LUNARCRUSH: {
    name: 'LunarCrush',
    key: process.env.LUNARCRUSH_API_KEY,
    required: true,
    rateLimit: {
      maxRequests: 50,
      windowMs: 86400000, // 50 calls per day (free tier)
    },
    cost: {
      perRequest: 0,
      currency: 'USD',
    },
  },

  TWITTER: {
    name: 'Twitter API',
    key: process.env.TWITTER_BEARER_TOKEN,
    required: false,
    rateLimit: {
      maxRequests: 500000,
      windowMs: 2592000000, // 500k tweets per month
    },
    cost: {
      perRequest: 0,
      currency: 'USD',
    },
  },

  // News Services
  NEWSAPI: {
    name: 'NewsAPI',
    key: process.env.NEWSAPI_KEY,
    required: true,
    rateLimit: {
      maxRequests: 100,
      windowMs: 86400000, // 100 calls per day (free tier)
    },
    cost: {
      perRequest: 0,
      currency: 'USD',
    },
  },

  CRYPTOCOMPARE: {
    name: 'CryptoCompare',
    key: process.env.CRYPTOCOMPARE_API_KEY,
    required: false,
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000, // 100 calls per minute
    },
    cost: {
      perRequest: 0,
      currency: 'USD',
    },
  },

  // Derivatives Services
  COINGLASS: {
    name: 'CoinGlass',
    key: process.env.COINGLASS_API_KEY,
    required: false,
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000, // 100 calls per minute
    },
    cost: {
      perRequest: 0,
      currency: 'USD',
    },
  },

  // DeFi Services
  DEFILLAMA: {
    name: 'DeFiLlama',
    key: undefined, // No API key required
    required: false,
    rateLimit: {
      maxRequests: 300,
      windowMs: 60000, // No official limit, being conservative
    },
    cost: {
      perRequest: 0,
      currency: 'USD',
    },
  },

  MESSARI: {
    name: 'Messari',
    key: process.env.MESSARI_API_KEY,
    required: false,
    rateLimit: {
      maxRequests: 20,
      windowMs: 60000, // 20 calls per minute (free tier)
    },
    cost: {
      perRequest: 0,
      currency: 'USD',
    },
  },
};

// =============================================================================
// API Key Manager Class
// =============================================================================

class APIKeyManager {
  private usageStats: Map<string, APIUsageStats> = new Map();
  private rateLimiters: Map<string, { count: number; resetAt: Date }> = new Map();
  private healthStatus: Map<string, APIServiceStatus> = new Map();

  /**
   * Get API key for a specific service
   */
  getApiKey(serviceName: string): string | undefined {
    const config = API_SERVICES[serviceName];
    if (!config) {
      console.warn(`Unknown API service: ${serviceName}`);
      return undefined;
    }

    if (config.required && !config.key) {
      console.error(`Required API key missing: ${serviceName}`);
    }

    return config.key;
  }

  /**
   * Check if API key is configured
   */
  hasApiKey(serviceName: string): boolean {
    const key = this.getApiKey(serviceName);
    return key !== undefined && key.length > 0;
  }

  /**
   * Get all configured API services
   */
  getConfiguredServices(): string[] {
    return Object.keys(API_SERVICES).filter((name) => this.hasApiKey(name));
  }

  /**
   * Get all missing required API keys
   */
  getMissingRequiredKeys(): string[] {
    return Object.entries(API_SERVICES)
      .filter(([_, config]) => config.required && !config.key)
      .map(([name, _]) => name);
  }

  /**
   * Check rate limit for a service
   */
  checkRateLimit(serviceName: string): RateLimitStatus {
    const config = API_SERVICES[serviceName];
    if (!config) {
      return {
        serviceName,
        remaining: 0,
        resetAt: new Date(),
        isLimited: true,
      };
    }

    const limiter = this.rateLimiters.get(serviceName);
    const now = new Date();

    if (!limiter || now >= limiter.resetAt) {
      // Reset rate limiter
      const resetAt = new Date(now.getTime() + config.rateLimit.windowMs);
      this.rateLimiters.set(serviceName, {
        count: 0,
        resetAt,
      });

      return {
        serviceName,
        remaining: config.rateLimit.maxRequests,
        resetAt,
        isLimited: false,
      };
    }

    const remaining = config.rateLimit.maxRequests - limiter.count;
    return {
      serviceName,
      remaining: Math.max(0, remaining),
      resetAt: limiter.resetAt,
      isLimited: remaining <= 0,
    };
  }

  /**
   * Record API usage
   */
  recordUsage(serviceName: string, success: boolean): void {
    const config = API_SERVICES[serviceName];
    if (!config) return;

    // Update rate limiter
    const limiter = this.rateLimiters.get(serviceName);
    if (limiter) {
      limiter.count++;
    }

    // Update usage stats
    const stats = this.usageStats.get(serviceName) || {
      serviceName,
      requestCount: 0,
      successCount: 0,
      failureCount: 0,
      totalCost: 0,
      lastUsed: new Date(),
    };

    stats.requestCount++;
    if (success) {
      stats.successCount++;
    } else {
      stats.failureCount++;
    }
    stats.totalCost += config.cost.perRequest;
    stats.lastUsed = new Date();

    this.usageStats.set(serviceName, stats);
  }

  /**
   * Get usage statistics for a service
   */
  getUsageStats(serviceName: string): APIUsageStats | undefined {
    return this.usageStats.get(serviceName);
  }

  /**
   * Get all usage statistics
   */
  getAllUsageStats(): APIUsageStats[] {
    return Array.from(this.usageStats.values());
  }

  /**
   * Get total cost across all services
   */
  getTotalCost(): number {
    return Array.from(this.usageStats.values()).reduce(
      (total, stats) => total + stats.totalCost,
      0
    );
  }

  /**
   * Perform health check for a service
   */
  async checkHealth(serviceName: string): Promise<APIServiceStatus> {
    const config = API_SERVICES[serviceName];
    if (!config) {
      return {
        name: serviceName,
        available: false,
        lastChecked: new Date(),
        responseTime: 0,
        errorMessage: 'Unknown service',
      };
    }

    if (!config.healthCheck) {
      return {
        name: serviceName,
        available: this.hasApiKey(serviceName),
        lastChecked: new Date(),
        responseTime: 0,
        errorMessage: config.key ? undefined : 'API key not configured',
      };
    }

    const startTime = Date.now();
    try {
      const headers: Record<string, string> = {};
      
      // Add authentication header if key is available
      if (config.key) {
        if (serviceName === 'COINMARKETCAP') {
          headers['X-CMC_PRO_API_KEY'] = config.key;
        } else if (serviceName === 'TWITTER') {
          headers['Authorization'] = `Bearer ${config.key}`;
        } else if (serviceName === 'OPENAI' || serviceName === 'CAESAR') {
          headers['Authorization'] = `Bearer ${config.key}`;
        } else {
          // Most APIs use query parameter
          config.healthCheck.endpoint += config.healthCheck.endpoint.includes('?')
            ? `&apikey=${config.key}`
            : `?apikey=${config.key}`;
        }
      }

      const response = await fetch(config.healthCheck.endpoint, {
        method: config.healthCheck.method,
        headers,
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const responseTime = Date.now() - startTime;
      const available = response.status === config.healthCheck.expectedStatus;

      const status: APIServiceStatus = {
        name: serviceName,
        available,
        lastChecked: new Date(),
        responseTime,
        errorMessage: available ? undefined : `Unexpected status: ${response.status}`,
      };

      this.healthStatus.set(serviceName, status);
      return status;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const status: APIServiceStatus = {
        name: serviceName,
        available: false,
        lastChecked: new Date(),
        responseTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };

      this.healthStatus.set(serviceName, status);
      return status;
    }
  }

  /**
   * Check health of all services
   */
  async checkAllHealth(): Promise<APIServiceStatus[]> {
    const services = Object.keys(API_SERVICES);
    const results = await Promise.allSettled(
      services.map((service) => this.checkHealth(service))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: services[index],
          available: false,
          lastChecked: new Date(),
          responseTime: 0,
          errorMessage: 'Health check failed',
        };
      }
    });
  }

  /**
   * Get cached health status
   */
  getHealthStatus(serviceName: string): APIServiceStatus | undefined {
    return this.healthStatus.get(serviceName);
  }

  /**
   * Get all cached health statuses
   */
  getAllHealthStatuses(): APIServiceStatus[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Reset usage statistics
   */
  resetUsageStats(): void {
    this.usageStats.clear();
  }

  /**
   * Reset rate limiters
   */
  resetRateLimiters(): void {
    this.rateLimiters.clear();
  }

  /**
   * Get system health summary
   */
  getSystemHealthSummary(): {
    totalServices: number;
    configuredServices: number;
    availableServices: number;
    missingRequiredKeys: string[];
    totalRequests: number;
    totalCost: number;
  } {
    const totalServices = Object.keys(API_SERVICES).length;
    const configuredServices = this.getConfiguredServices().length;
    const availableServices = Array.from(this.healthStatus.values()).filter(
      (status) => status.available
    ).length;
    const missingRequiredKeys = this.getMissingRequiredKeys();
    const totalRequests = Array.from(this.usageStats.values()).reduce(
      (total, stats) => total + stats.requestCount,
      0
    );
    const totalCost = this.getTotalCost();

    return {
      totalServices,
      configuredServices,
      availableServices,
      missingRequiredKeys,
      totalRequests,
      totalCost,
    };
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const apiKeyManager = new APIKeyManager();

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Validate all required API keys are configured
 */
export function validateRequiredApiKeys(): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing = apiKeyManager.getMissingRequiredKeys();
  const warnings: string[] = [];

  // Check for optional but recommended keys
  const recommendedKeys = ['COINGECKO', 'TWITTER', 'CRYPTOCOMPARE'];
  recommendedKeys.forEach((key) => {
    if (!apiKeyManager.hasApiKey(key)) {
      warnings.push(`${key} not configured (optional but recommended)`);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Get API key with fallback
 */
export function getApiKeyWithFallback(
  primaryService: string,
  fallbackService: string
): { service: string; key: string | undefined } {
  const primaryKey = apiKeyManager.getApiKey(primaryService);
  if (primaryKey) {
    return { service: primaryService, key: primaryKey };
  }

  const fallbackKey = apiKeyManager.getApiKey(fallbackService);
  if (fallbackKey) {
    console.warn(`Using fallback service: ${fallbackService} instead of ${primaryService}`);
    return { service: fallbackService, key: fallbackKey };
  }

  return { service: primaryService, key: undefined };
}

/**
 * Check if service is rate limited
 */
export function isRateLimited(serviceName: string): boolean {
  const status = apiKeyManager.checkRateLimit(serviceName);
  return status.isLimited;
}

/**
 * Wait for rate limit reset
 */
export async function waitForRateLimitReset(serviceName: string): Promise<void> {
  const status = apiKeyManager.checkRateLimit(serviceName);
  if (!status.isLimited) return;

  const waitTime = status.resetAt.getTime() - Date.now();
  if (waitTime > 0) {
    console.log(`Rate limited for ${serviceName}, waiting ${waitTime}ms`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
}
