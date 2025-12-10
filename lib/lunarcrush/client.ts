/**
 * LunarCrush API Client
 * Provides social sentiment data for cryptocurrencies
 */

const BASE_URL = "https://lunarcrush.com";
const API_KEY = process.env.LUNARCRUSH_API_KEY;

if (!API_KEY) {
  console.warn("⚠️ LUNARCRUSH_API_KEY not configured");
}

export interface LunarCrushError {
  error: string;
  status: number;
  message: string;
}

/**
 * Generic GET request to LunarCrush API
 */
export async function lcGet<T>(
  path: string,
  params: Record<string, any> = {}
): Promise<T> {
  if (!API_KEY) {
    throw new Error("LUNARCRUSH_API_KEY not configured");
  }

  const url = new URL(path, BASE_URL);

  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
      },
    });

    // Handle rate limiting
    if (response.status === 429) {
      throw new Error("LunarCrush rate limit exceeded. Please try again later.");
    }

    // Handle errors
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`LunarCrush API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error("LunarCrush API error:", error);
    throw error;
  }
}

/**
 * Rate limiter for LunarCrush API
 * Free tier: ~100 requests per 10 seconds
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 100;
  private readonly windowMs = 10000; // 10 seconds

  async checkLimit(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // Check if we're at the limit
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        console.warn(`⏳ Rate limit reached. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // Add current request
    this.requests.push(now);
  }
}

export const rateLimiter = new RateLimiter();
