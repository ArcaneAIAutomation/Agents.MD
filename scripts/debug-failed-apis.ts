/**
 * Debug Failed APIs
 * Detailed testing of CoinGlass and Etherscan
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugCoinGlass() {
  console.log('🔍 Debugging CoinGlass API\n');
  console.log('API Key:', process.env.COINGLASS_API_KEY ? '✅ Configured' : '❌ Missing');
  
  try {
    const response = await fetch(
      'https://open-api.coinglass.com/public/v2/funding?symbol=BTC',
      {
        headers: process.env.COINGLASS_API_KEY ? {
          'coinglassSecret': process.env.COINGLASS_API_KEY,
        } : {},
        signal: AbortSignal.timeout(10000),
      }
    );
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));
    
    try {
      const data = JSON.parse(text);
      console.log('\nParsed Data:');
      console.log('  success:', data.success);
      console.log('  code:', data.code);
      console.log('  msg:', data.msg);
      console.log('  data:', data.data ? 'Present' : 'Missing');
    } catch (e) {
      console.log('Failed to parse JSON');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

async function debugEtherscan() {
  console.log('🔍 Debugging Etherscan API\n');
  console.log('API Key:', process.env.ETHERSCAN_API_KEY ? '✅ Configured' : '❌ Missing');
  
  try {
    const url = `https://api.etherscan.io/v2/api?module=stats&action=ethprice&chainid=1&apikey=${process.env.ETHERSCAN_API_KEY}`;
    console.log('URL:', url.replace(process.env.ETHERSCAN_API_KEY || '', '***'));
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));
    
    try {
      const data = JSON.parse(text);
      console.log('\nParsed Data:');
      console.log('  status:', data.status);
      console.log('  message:', data.message);
      console.log('  result:', data.result);
    } catch (e) {
      console.log('Failed to parse JSON');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

async function main() {
  await debugCoinGlass();
  await debugEtherscan();
}

main();
