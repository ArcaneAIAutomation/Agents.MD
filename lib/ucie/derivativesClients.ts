/**
 * Derivatives Data Fetching Utilities
 * 
 * Integrates with multiple derivatives exchanges to fetch:
 * - Funding rates
 * - Open interest
 * - Liquidation data
 * - Long/short ratios
 * - Options data
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface FundingRateData {
  exchange: string;
  symbol: string;
  fundingRate: number;
  fundingTime: string;
  nextFundingTime: string;
  markPrice: number;
  indexPrice: number;
}

export interface OpenInterestData {
  exchange: string;
  symbol: string;
  openInterest: number;
  openInterestValue: number; // in USD
  timestamp: string;
}

export interface LiquidationData {
  exchange: string;
  symbol: string;
  side: 'long' | 'short';
  price: number;
  quantity: number;
  value: number; // in USD
  timestamp: string;
}

export interface LongShortRatio {
  exchange: string;
  symbol: string;
  longRatio: number;
  shortRatio: number;
  longAccount: number;
  shortAccount: number;
  timestamp: string;
}

export interface OptionsData {
  exchange: string;
  symbol: string;
  putCallRatio: number;
  impliedVolatility: number;
  maxPain: number;
  timestamp: string;
}

// ============================================================================
// CoinGlass API Client
// ============================================================================

/**
 * CoinGlass API - Comprehensive derivatives data aggregator
 * Provides funding rates, OI, liquidations across multiple exchanges
 */
export class CoinGlassClient {
  private baseUrl = 'https://open-api.coinglass.com/public/v2';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.COINGLASS_API_KEY || '';
  }

  /**
   * Fetch funding rates from multiple exchanges
   */
  async getFundingRates(symbol: string): Promise<FundingRateData[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/funding?symbol=${symbol.toUpperCase()}`,
        {
          headers: this.apiKey ? { 'coinglassSecret': this.apiKey } : {},
          signal: AbortSignal.timeout(10000)
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGlass API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Invalid CoinGlass response');
      }

      // Transform CoinGlass format to our format
      return data.data.map((item: any) => ({
        exchange: item.exchangeName,
        symbol: symbol.toUpperCase(),
        fundingRate: parseFloat(item.rate) / 100, // Convert to decimal
        fundingTime: item.time,
        nextFundingTime: item.nextFundingTime,
        markPrice: parseFloat(item.markPrice || '0'),
        indexPrice: parseFloat(item.indexPrice || '0')
      }));
    } catch (error) {
      console.error('CoinGlass funding rates error:', error);
      return [];
    }
  }

  /**
   * Fetch aggregated open interest
   */
  async getOpenInterest(symbol: string): Promise<OpenInterestData[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/openInterest?symbol=${symbol.toUpperCase()}`,
        {
          headers: this.apiKey ? { 'coinglassSecret': this.apiKey } : {},
          signal: AbortSignal.timeout(10000)
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGlass API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Invalid CoinGlass response');
      }

      return data.data.map((item: any) => ({
        exchange: item.exchangeName,
        symbol: symbol.toUpperCase(),
        openInterest: parseFloat(item.openInterest || '0'),
        openInterestValue: parseFloat(item.openInterestValue || '0'),
        timestamp: item.time || new Date().toISOString()
      }));
    } catch (error) {
      console.error('CoinGlass open interest error:', error);
      return [];
    }
  }

  /**
   * Fetch recent liquidations
   */
  async getLiquidations(symbol: string, timeframe: '24h' | '12h' | '4h' = '24h'): Promise<LiquidationData[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/liquidation?symbol=${symbol.toUpperCase()}&timeframe=${timeframe}`,
        {
          headers: this.apiKey ? { 'coinglassSecret': this.apiKey } : {},
          signal: AbortSignal.timeout(10000)
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGlass API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Invalid CoinGlass response');
      }

      return data.data.map((item: any) => ({
        exchange: item.exchangeName,
        symbol: symbol.toUpperCase(),
        side: item.side.toLowerCase() as 'long' | 'short',
        price: parseFloat(item.price || '0'),
        quantity: parseFloat(item.quantity || '0'),
        value: parseFloat(item.value || '0'),
        timestamp: item.time || new Date().toISOString()
      }));
    } catch (error) {
      console.error('CoinGlass liquidations error:', error);
      return [];
    }
  }

  /**
   * Fetch long/short ratios
   */
  async getLongShortRatio(symbol: string): Promise<LongShortRatio[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/longShortRatio?symbol=${symbol.toUpperCase()}`,
        {
          headers: this.apiKey ? { 'coinglassSecret': this.apiKey } : {},
          signal: AbortSignal.timeout(10000)
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGlass API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Invalid CoinGlass response');
      }

      return data.data.map((item: any) => ({
        exchange: item.exchangeName,
        symbol: symbol.toUpperCase(),
        longRatio: parseFloat(item.longRatio || '0'),
        shortRatio: parseFloat(item.shortRatio || '0'),
        longAccount: parseFloat(item.longAccount || '0'),
        shortAccount: parseFloat(item.shortAccount || '0'),
        timestamp: item.time || new Date().toISOString()
      }));
    } catch (error) {
      console.error('CoinGlass long/short ratio error:', error);
      return [];
    }
  }
}

// ============================================================================
// Binance Futures API Client
// ============================================================================

/**
 * Binance Futures API - Direct exchange data
 */
export class BinanceFuturesClient {
  private baseUrl = 'https://fapi.binance.com';

  /**
   * Fetch funding rate for a symbol
   */
  async getFundingRate(symbol: string): Promise<FundingRateData | null> {
    try {
      // Binance uses BTCUSDT format
      const binanceSymbol = `${symbol.toUpperCase()}USDT`;
      
      const response = await fetch(
        `${this.baseUrl}/fapi/v1/premiumIndex?symbol=${binanceSymbol}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        exchange: 'Binance',
        symbol: symbol.toUpperCase(),
        fundingRate: parseFloat(data.lastFundingRate || '0'),
        fundingTime: new Date(data.time).toISOString(),
        nextFundingTime: new Date(data.nextFundingTime).toISOString(),
        markPrice: parseFloat(data.markPrice || '0'),
        indexPrice: parseFloat(data.indexPrice || '0')
      };
    } catch (error) {
      console.error('Binance funding rate error:', error);
      return null;
    }
  }

  /**
   * Fetch open interest
   */
  async getOpenInterest(symbol: string): Promise<OpenInterestData | null> {
    try {
      const binanceSymbol = `${symbol.toUpperCase()}USDT`;
      
      const response = await fetch(
        `${this.baseUrl}/fapi/v1/openInterest?symbol=${binanceSymbol}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        exchange: 'Binance',
        symbol: symbol.toUpperCase(),
        openInterest: parseFloat(data.openInterest || '0'),
        openInterestValue: parseFloat(data.openInterest || '0') * parseFloat(data.markPrice || '0'),
        timestamp: new Date(data.time).toISOString()
      };
    } catch (error) {
      console.error('Binance open interest error:', error);
      return null;
    }
  }

  /**
   * Fetch long/short ratio
   */
  async getLongShortRatio(symbol: string): Promise<LongShortRatio | null> {
    try {
      const binanceSymbol = `${symbol.toUpperCase()}USDT`;
      
      const response = await fetch(
        `${this.baseUrl}/futures/data/globalLongShortAccountRatio?symbol=${binanceSymbol}&period=5m`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid Binance response');
      }

      const latest = data[data.length - 1];
      const longRatio = parseFloat(latest.longShortRatio || '0');
      const shortRatio = 1 - longRatio;

      return {
        exchange: 'Binance',
        symbol: symbol.toUpperCase(),
        longRatio: longRatio,
        shortRatio: shortRatio,
        longAccount: parseFloat(latest.longAccount || '0'),
        shortAccount: parseFloat(latest.shortAccount || '0'),
        timestamp: new Date(latest.timestamp).toISOString()
      };
    } catch (error) {
      console.error('Binance long/short ratio error:', error);
      return null;
    }
  }
}

// ============================================================================
// Bybit API Client
// ============================================================================

/**
 * Bybit API - Derivatives and options data
 */
export class BybitClient {
  private baseUrl = 'https://api.bybit.com';

  /**
   * Fetch funding rate
   */
  async getFundingRate(symbol: string): Promise<FundingRateData | null> {
    try {
      const bybitSymbol = `${symbol.toUpperCase()}USDT`;
      
      const response = await fetch(
        `${this.baseUrl}/v5/market/tickers?category=linear&symbol=${bybitSymbol}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) {
        throw new Error(`Bybit API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.retCode !== 0 || !data.result?.list?.[0]) {
        throw new Error('Invalid Bybit response');
      }

      const ticker = data.result.list[0];

      return {
        exchange: 'Bybit',
        symbol: symbol.toUpperCase(),
        fundingRate: parseFloat(ticker.fundingRate || '0'),
        fundingTime: new Date().toISOString(),
        nextFundingTime: new Date(parseInt(ticker.nextFundingTime || '0')).toISOString(),
        markPrice: parseFloat(ticker.markPrice || '0'),
        indexPrice: parseFloat(ticker.indexPrice || '0')
      };
    } catch (error) {
      console.error('Bybit funding rate error:', error);
      return null;
    }
  }

  /**
   * Fetch open interest
   */
  async getOpenInterest(symbol: string): Promise<OpenInterestData | null> {
    try {
      const bybitSymbol = `${symbol.toUpperCase()}USDT`;
      
      const response = await fetch(
        `${this.baseUrl}/v5/market/open-interest?category=linear&symbol=${bybitSymbol}&intervalTime=5min`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) {
        throw new Error(`Bybit API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.retCode !== 0 || !data.result?.list?.[0]) {
        throw new Error('Invalid Bybit response');
      }

      const oi = data.result.list[0];

      return {
        exchange: 'Bybit',
        symbol: symbol.toUpperCase(),
        openInterest: parseFloat(oi.openInterest || '0'),
        openInterestValue: parseFloat(oi.openInterestValue || '0'),
        timestamp: new Date(parseInt(oi.timestamp || '0')).toISOString()
      };
    } catch (error) {
      console.error('Bybit open interest error:', error);
      return null;
    }
  }
}

// ============================================================================
// Deribit API Client
// ============================================================================

/**
 * Deribit API - Options and derivatives data
 */
export class DeribitClient {
  private baseUrl = 'https://www.deribit.com/api/v2';

  /**
   * Fetch options data (put/call ratio, IV, max pain)
   */
  async getOptionsData(symbol: string): Promise<OptionsData | null> {
    try {
      // Deribit uses BTC, ETH format
      const deribitSymbol = symbol.toUpperCase();
      
      const response = await fetch(
        `${this.baseUrl}/public/get_book_summary_by_currency?currency=${deribitSymbol}&kind=option`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) {
        throw new Error(`Deribit API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.result || !Array.isArray(data.result)) {
        throw new Error('Invalid Deribit response');
      }

      // Calculate put/call ratio and average IV
      let totalPutOI = 0;
      let totalCallOI = 0;
      let totalIV = 0;
      let count = 0;

      data.result.forEach((option: any) => {
        const oi = parseFloat(option.open_interest || '0');
        const iv = parseFloat(option.mark_iv || '0');
        
        if (option.instrument_name.includes('-P')) {
          totalPutOI += oi;
        } else if (option.instrument_name.includes('-C')) {
          totalCallOI += oi;
        }
        
        if (iv > 0) {
          totalIV += iv;
          count++;
        }
      });

      const putCallRatio = totalCallOI > 0 ? totalPutOI / totalCallOI : 0;
      const avgIV = count > 0 ? totalIV / count : 0;

      return {
        exchange: 'Deribit',
        symbol: symbol.toUpperCase(),
        putCallRatio: putCallRatio,
        impliedVolatility: avgIV / 100, // Convert to decimal
        maxPain: 0, // Would need additional calculation
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Deribit options data error:', error);
      return null;
    }
  }

  /**
   * Fetch funding rate for perpetual futures
   */
  async getFundingRate(symbol: string): Promise<FundingRateData | null> {
    try {
      const deribitSymbol = `${symbol.toUpperCase()}-PERPETUAL`;
      
      const response = await fetch(
        `${this.baseUrl}/public/get_funding_rate_value?instrument_name=${deribitSymbol}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (!response.ok) {
        throw new Error(`Deribit API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.result) {
        throw new Error('Invalid Deribit response');
      }

      return {
        exchange: 'Deribit',
        symbol: symbol.toUpperCase(),
        fundingRate: parseFloat(data.result || '0'),
        fundingTime: new Date().toISOString(),
        nextFundingTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
        markPrice: 0, // Would need separate call
        indexPrice: 0 // Would need separate call
      };
    } catch (error) {
      console.error('Deribit funding rate error:', error);
      return null;
    }
  }
}

// ============================================================================
// Aggregated Derivatives Client
// ============================================================================

/**
 * Aggregated client that fetches from all sources
 */
export class DerivativesAggregator {
  private coinGlass: CoinGlassClient;
  private binance: BinanceFuturesClient;
  private bybit: BybitClient;
  private deribit: DeribitClient;

  constructor() {
    this.coinGlass = new CoinGlassClient();
    this.binance = new BinanceFuturesClient();
    this.bybit = new BybitClient();
    this.deribit = new DeribitClient();
  }

  /**
   * Fetch funding rates from all exchanges
   */
  async getAllFundingRates(symbol: string): Promise<FundingRateData[]> {
    const results = await Promise.allSettled([
      this.coinGlass.getFundingRates(symbol),
      this.binance.getFundingRate(symbol),
      this.bybit.getFundingRate(symbol),
      this.deribit.getFundingRate(symbol)
    ]);

    const fundingRates: FundingRateData[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        if (Array.isArray(result.value)) {
          fundingRates.push(...result.value);
        } else {
          fundingRates.push(result.value);
        }
      }
    });

    return fundingRates;
  }

  /**
   * Fetch open interest from all exchanges
   */
  async getAllOpenInterest(symbol: string): Promise<OpenInterestData[]> {
    const results = await Promise.allSettled([
      this.coinGlass.getOpenInterest(symbol),
      this.binance.getOpenInterest(symbol),
      this.bybit.getOpenInterest(symbol)
    ]);

    const openInterest: OpenInterestData[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        if (Array.isArray(result.value)) {
          openInterest.push(...result.value);
        } else {
          openInterest.push(result.value);
        }
      }
    });

    return openInterest;
  }

  /**
   * Fetch liquidations
   */
  async getLiquidations(symbol: string): Promise<LiquidationData[]> {
    return this.coinGlass.getLiquidations(symbol);
  }

  /**
   * Fetch long/short ratios from all exchanges
   */
  async getAllLongShortRatios(symbol: string): Promise<LongShortRatio[]> {
    const results = await Promise.allSettled([
      this.coinGlass.getLongShortRatio(symbol),
      this.binance.getLongShortRatio(symbol)
    ]);

    const ratios: LongShortRatio[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        if (Array.isArray(result.value)) {
          ratios.push(...result.value);
        } else {
          ratios.push(result.value);
        }
      }
    });

    return ratios;
  }

  /**
   * Fetch options data
   */
  async getOptionsData(symbol: string): Promise<OptionsData | null> {
    return this.deribit.getOptionsData(symbol);
  }
}
