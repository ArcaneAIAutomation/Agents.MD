/**
 * Caesar API Client
 * Dedicated client for Caesar cryptocurrency market intelligence API
 * Mobile-optimized with timeout handling and error recovery
 */

interface CaesarAPIConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retries: number;
}

interface CaesarAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  source: 'caesar';
}

class CaesarAPIClient {
  private config: CaesarAPIConfig;

  constructor() {
    this.config = {
      apiKey: process.env.CAESAR_API_KEY || '',
      baseUrl: process.env.CAESAR_API_BASE_URL || 'https://api.caesar.xyz',
      timeout: 15000, // 15 seconds for mobile
      retries: 3,
    };
  }

  /**
   * Generic request handler with mobile optimization
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<CaesarAPIResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'AgentMDC/1.0',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Caesar API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        source: 'caesar',
      };
    } catch (error) {
      clearTimeout(timeoutId);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        source: 'caesar',
      };
    }
  }

  /**
   * Get real-time market data for a cryptocurrency
   */
  async getMarketData(symbol: string) {
    return this.request(`/market-data/${symbol.toLowerCase()}`);
  }

  /**
   * Get technical analysis for a cryptocurrency
   */
  async getTechnicalAnalysis(symbol: string, timeframe: string = '1h') {
    return this.request(`/technical-analysis/${symbol.toLowerCase()}?timeframe=${timeframe}`);
  }

  /**
   * Get AI-powered trading signals
   */
  async getTradingSignals(symbol: string) {
    return this.request(`/trading-signals/${symbol.toLowerCase()}`);
  }

  /**
   * Get market intelligence and sentiment
   */
  async getMarketIntelligence(symbol: string) {
    return this.request(`/market-intelligence/${symbol.toLowerCase()}`);
  }

  /**
   * Get order flow analysis
   */
  async getOrderFlow(symbol: string) {
    return this.request(`/order-flow/${symbol.toLowerCase()}`);
  }

  /**
   * Get smart money tracking data
   */
  async getSmartMoney(symbol: string) {
    return this.request(`/smart-money/${symbol.toLowerCase()}`);
  }

  /**
   * Get market microstructure analysis
   */
  async getMarketMicrostructure(symbol: string) {
    return this.request(`/market-microstructure/${symbol.toLowerCase()}`);
  }

  /**
   * Health check for Caesar API
   */
  async healthCheck() {
    return this.request('/health');
  }
}

// Export singleton instance
export const caesarClient = new CaesarAPIClient();

// Export types
export type { CaesarAPIResponse, CaesarAPIConfig };
