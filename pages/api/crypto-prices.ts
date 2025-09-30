import { NextApiRequest, NextApiResponse } from 'next';

interface CryptoPriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  lastUpdated: string;
}

interface PriceResponse {
  prices: CryptoPriceData[];
  success: boolean;
  source: string;
  lastUpdated: string;
  error?: string;
}

// CoinMarketCap API configuration
const CMC_API_KEY = process.env.COINMARKETCAP_API_KEY;
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com';

// Fetch real-time prices from CoinMarketCap API
async function fetchCoinMarketCapPrices(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!CMC_API_KEY) {
      throw new Error('CoinMarketCap API key not configured');
    }
    
    const symbols = 'BTC,ETH,SOL,ADA,XRP,DOT,AVAX,LINK';
    const url = `${CMC_BASE_URL}/v1/cryptocurrency/quotes/latest?symbol=${symbols}`;
    
    console.log('Fetching from CoinMarketCap:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('CoinMarketCap response status:', data.status);
    
    return { success: true, data };
  } catch (error: any) {
    console.error('CoinMarketCap fetch error:', error.message);
    return { success: false, error: error.message };
  }
}

// Convert CoinMarketCap data to our format
function convertCoinMarketCapData(data: any): CryptoPriceData[] {
  const prices: CryptoPriceData[] = [];
  
  if (data.data) {
    for (const [symbol, coinData] of Object.entries(data.data)) {
      const coin = coinData as any;
      if (coin.quote && coin.quote.USD) {
        prices.push({
          symbol: coin.symbol,
          name: coin.name,
          price: coin.quote.USD.price,
          change24h: coin.quote.USD.percent_change_24h || 0,
          lastUpdated: coin.quote.USD.last_updated || new Date().toISOString()
        });
      }
    }
  }
  
  return prices;
}

// Fetch real-time prices from CoinGecko API
async function fetchCoinGeckoPrices(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const coins = 'bitcoin,ethereum,solana,cardano,ripple,polkadot,avalanche-2,chainlink';
    const apiKey = process.env.COINGECKO_API_KEY;
    const keyParam = (apiKey && apiKey !== 'CG-YourActualAPIKeyHere') ? `&x_cg_demo_api_key=${apiKey}` : '';
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true${keyParam}`;
    
    console.log('Fetching from CoinGecko:', url.replace(apiKey || '', 'API_KEY_HIDDEN'));
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Trading-Intelligence-Hub/1.0'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('CoinGecko response:', Object.keys(data));
    
    return { success: true, data };
  } catch (error: any) {
    console.error('CoinGecko fetch error:', error.message);
    return { success: false, error: error.message };
  }
}

// Convert CoinGecko data to our format
function convertCoinGeckoData(data: any): CryptoPriceData[] {
  const coinMap = {
    'bitcoin': { symbol: 'BTC', name: 'Bitcoin' },
    'ethereum': { symbol: 'ETH', name: 'Ethereum' },
    'solana': { symbol: 'SOL', name: 'Solana' },
    'cardano': { symbol: 'ADA', name: 'Cardano' },
    'ripple': { symbol: 'XRP', name: 'XRP' },
    'polkadot': { symbol: 'DOT', name: 'Polkadot' },
    'avalanche-2': { symbol: 'AVAX', name: 'Avalanche' },
    'chainlink': { symbol: 'LINK', name: 'Chainlink' }
  };

  const prices: CryptoPriceData[] = [];
  
  for (const [coinId, coinInfo] of Object.entries(coinMap)) {
    if (data[coinId]) {
      prices.push({
        symbol: coinInfo.symbol,
        name: coinInfo.name,
        price: data[coinId].usd,
        change24h: data[coinId].usd_24h_change || 0,
        lastUpdated: new Date().toISOString()
      });
    }
  }
  
  return prices;
}

// Fallback prices (updated realistic market approximations as of August 2025)
function getFallbackPrices(): CryptoPriceData[] {
  return [
    { symbol: 'BTC', name: 'Bitcoin', price: 64800, change24h: 2.1, lastUpdated: new Date().toISOString() },
    { symbol: 'ETH', name: 'Ethereum', price: 2650, change24h: -0.8, lastUpdated: new Date().toISOString() },
    { symbol: 'SOL', name: 'Solana', price: 150, change24h: 1.5, lastUpdated: new Date().toISOString() },
    { symbol: 'ADA', name: 'Cardano', price: 0.45, change24h: 3.2, lastUpdated: new Date().toISOString() },
    { symbol: 'XRP', name: 'XRP', price: 0.58, change24h: 1.1, lastUpdated: new Date().toISOString() },
    { symbol: 'DOT', name: 'Polkadot', price: 4.20, change24h: -1.2, lastUpdated: new Date().toISOString() },
    { symbol: 'AVAX', name: 'Avalanche', price: 28.50, change24h: 4.5, lastUpdated: new Date().toISOString() },
    { symbol: 'LINK', name: 'Chainlink', price: 11.80, change24h: 2.7, lastUpdated: new Date().toISOString() }
  ];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<PriceResponse>) {
  try {
    console.log('🚀 Crypto Prices API called');
    
    // Try to fetch live data from CoinGecko first
    const coinGeckoResult = await fetchCoinGeckoPrices();
    
    if (coinGeckoResult.success && coinGeckoResult.data) {
      const prices = convertCoinGeckoData(coinGeckoResult.data);
      
      if (prices.length > 0) {
        console.log('✅ Live prices fetched from CoinGecko:', prices.length, 'coins');
        return res.status(200).json({
          prices,
          success: true,
          source: 'CoinGecko Live API',
          lastUpdated: new Date().toISOString()
        });
      }
    }
    
    // If CoinGecko fails, try CoinMarketCap
    console.log('🔄 CoinGecko failed, trying CoinMarketCap...');
    const cmcResult = await fetchCoinMarketCapPrices();
    
    if (cmcResult.success && cmcResult.data) {
      const prices = convertCoinMarketCapData(cmcResult.data);
      
      if (prices.length > 0) {
        console.log('✅ Live prices fetched from CoinMarketCap:', prices.length, 'coins');
        return res.status(200).json({
          prices,
          success: true,
          source: 'CoinMarketCap Live API',
          lastUpdated: new Date().toISOString()
        });
      }
    }
    
    // If both APIs fail, use fallback prices
    console.log('⚠️ Both APIs failed, using fallback prices');
    const fallbackPrices = getFallbackPrices();
    
    res.status(200).json({
      prices: fallbackPrices,
      success: true,
      source: 'Fallback Data',
      lastUpdated: new Date().toISOString(),
      error: `CoinGecko: ${coinGeckoResult.error}, CMC: ${cmcResult.error}`
    });
    
  } catch (error: any) {
    console.error('Crypto Prices API error:', error.message);
    
    // Always return fallback data on error
    const fallbackPrices = getFallbackPrices();
    
    res.status(200).json({
      prices: fallbackPrices,
      success: false,
      source: 'Fallback Data (Error)',
      lastUpdated: new Date().toISOString(),
      error: error.message
    });
  }
}
