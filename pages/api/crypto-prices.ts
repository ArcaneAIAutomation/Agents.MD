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

// ✅ REMOVED: getFallbackPrices() function
// 99% ACCURACY RULE: No fallback data allowed
// If APIs fail, return error instead of fake data

export default async function handler(req: NextApiRequest, res: NextApiResponse<PriceResponse>) {
  try {
    console.log('🚀 Crypto Prices API called');
    
    // Try to fetch live data from CoinMarketCap first (primary)
    const cmcResult = await fetchCoinMarketCapPrices();
    
    if (cmcResult.success && cmcResult.data) {
      const prices = convertCoinMarketCapData(cmcResult.data);
      
      if (prices.length > 0) {
        console.log('✅ Live prices fetched from CoinMarketCap Pro:', prices.length, 'coins');
        return res.status(200).json({
          prices,
          success: true,
          source: 'CoinMarketCap Pro API',
          lastUpdated: new Date().toISOString()
        });
      }
    }
    
    // If CoinMarketCap fails, try CoinGecko as fallback
    console.log('🔄 CoinMarketCap failed, trying CoinGecko fallback...');
    const coinGeckoResult = await fetchCoinGeckoPrices();
    
    if (coinGeckoResult.success && coinGeckoResult.data) {
      const prices = convertCoinGeckoData(coinGeckoResult.data);
      
      if (prices.length > 0) {
        console.log('✅ Live prices fetched from CoinGecko (fallback):', prices.length, 'coins');
        return res.status(200).json({
          prices,
          success: true,
          source: 'CoinGecko Fallback API',
          lastUpdated: new Date().toISOString()
        });
      }
    }
    
    // ✅ 99% ACCURACY RULE: Return error instead of fallback data
    console.error('❌ Both APIs failed - no accurate data available');
    console.error(`   CoinMarketCap error: ${cmcResult.error}`);
    console.error(`   CoinGecko error: ${coinGeckoResult.error}`);
    
    return res.status(500).json({
      prices: [],
      success: false,
      source: 'Error',
      lastUpdated: new Date().toISOString(),
      error: 'Unable to fetch accurate cryptocurrency prices. Both CoinMarketCap and CoinGecko APIs failed. Please try again in a few moments.'
    });
    
  } catch (error: any) {
    console.error('❌ Crypto Prices API error:', error.message);
    
    // ✅ 99% ACCURACY RULE: Return error instead of fallback data
    return res.status(500).json({
      prices: [],
      success: false,
      source: 'Error',
      lastUpdated: new Date().toISOString(),
      error: `Unable to fetch accurate cryptocurrency prices: ${error.message}. Please try again.`
    });
  }
}
