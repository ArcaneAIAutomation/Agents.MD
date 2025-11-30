/**
 * UCIE GPT-5.1 Analysis Endpoint
 * 
 * Generates comprehensive analysis using GPT-5.1
 * Returns consensus, executive summary, and insights
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { extractResponseText, validateResponseText } from '../../../../utils/openai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'OpenAI-Beta': 'responses=v1'
  }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { symbol, collectedData, forceRefresh } = req.body;

    if (!symbol || !collectedData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, collectedData'
      });
    }

    console.log(`🚀 Starting GPT-5.1 analysis for ${symbol}${forceRefresh ? ' (FORCE REFRESH)' : ''}...`);

    // ✅ FIXED: Calculate which APIs are actually working by checking for real data
    const availableAPIs = [];
    
    // Check each data source for actual content (not just existence)
    if (collectedData.marketData && Object.keys(collectedData.marketData).length > 0) {
      availableAPIs.push('Market Data');
    }
    if (collectedData.technical && Object.keys(collectedData.technical).length > 0) {
      availableAPIs.push('Technical Analysis');
    }
    if (collectedData.sentiment && Object.keys(collectedData.sentiment).length > 0) {
      availableAPIs.push('Sentiment Analysis');
    }
    if (collectedData.news && Object.keys(collectedData.news).length > 0) {
      availableAPIs.push('News');
    }
    if (collectedData.risk && Object.keys(collectedData.risk).length > 0) {
      availableAPIs.push('Risk Assessment');
    }
    
    // On-Chain is optional (only for BTC/ETH)
    if (collectedData.onChain && Object.keys(collectedData.onChain).length > 0) {
      availableAPIs.push('On-Chain Data');
    }
    
    const totalAPIs = 5; // Core APIs: Market, Technical, Sentiment, News, Risk
    const workingAPIs = availableAPIs.filter(api => api !== 'On-Chain Data').length;
    const dataQuality = Math.round((workingAPIs / totalAPIs) * 100);
    
    console.log(`📊 Data Quality Check: ${workingAPIs}/${totalAPIs} core APIs working (${dataQuality}%)`);
    console.log(`   Available APIs: ${availableAPIs.join(', ')}`);
    console.log(`   Market Data keys:`, collectedData.marketData ? Object.keys(collectedData.marketData).length : 0);
    console.log(`   Technical keys:`, collectedData.technical ? Object.keys(collectedData.technical).length : 0);
    console.log(`   Sentiment keys:`, collectedData.sentiment ? Object.keys(collectedData.sentiment).length : 0);
    console.log(`   News keys:`, collectedData.news ? Object.keys(collectedData.news).length : 0);
    console.log(`   Risk keys:`, collectedData.risk ? Object.keys(collectedData.risk).length : 0);
    
    // Build comprehensive prompt with accurate data quality
    const prompt = `You are an expert cryptocurrency market analyst. Analyze ${symbol} using the following comprehensive data.

✅ ACCURATE DATA QUALITY: ${workingAPIs} out of ${totalAPIs} core APIs are working (${dataQuality}% data quality).
📊 Available data sources: ${availableAPIs.join(', ')}

CRITICAL INSTRUCTIONS:
1. Report EXACTLY: "${dataQuality}% data quality with ${workingAPIs} out of ${totalAPIs} APIs working"
2. Use ONLY the data provided below - do NOT invent or assume missing data
3. All ${workingAPIs} APIs listed above are working and contain real data

📊 MARKET DATA:
${collectedData.marketData ? JSON.stringify(collectedData.marketData, null, 2) : 'Not available'}

📈 TECHNICAL ANALYSIS:
${collectedData.technical ? JSON.stringify(collectedData.technical, null, 2) : 'Not available'}

💬 SENTIMENT ANALYSIS:
${collectedData.sentiment ? JSON.stringify(collectedData.sentiment, null, 2) : 'Not available'}

📰 NEWS:
${collectedData.news ? JSON.stringify(collectedData.news, null, 2) : 'Not available'}

🎯 RISK ASSESSMENT:
${collectedData.risk ? JSON.stringify(collectedData.risk, null, 2) : 'Not available'}

⛓️ ON-CHAIN DATA:
${collectedData.onChain ? JSON.stringify(collectedData.onChain, null, 2) : 'Not available'}

💰 DEFI METRICS:
${collectedData.defi ? JSON.stringify(collectedData.defi, null, 2) : 'Not available'}

✅ VERIFIED DATA SOURCES (ALL WORKING):
${availableAPIs.map(api => `✓ ${api}`).join('\n')}

CRITICAL INSTRUCTIONS FOR YOUR ANALYSIS:
1. ✅ REPORT EXACTLY: "${dataQuality}% data quality with ${workingAPIs} out of ${totalAPIs} APIs working"
2. ✅ ALL ${workingAPIs} APIs listed above are WORKING and contain REAL data
3. ✅ Use ONLY the data provided above - do NOT invent or assume missing data
4. ✅ If a section shows "Not available", it means that specific data source is not included
5. ✅ Focus your analysis on the ${workingAPIs} working data sources
6. ✅ Be specific and cite actual numbers from the data provided
7. ❌ DO NOT say "only 3 out of 5 APIs working" if ${workingAPIs} APIs are actually working
8. ❌ DO NOT underestimate the data quality - report the accurate ${dataQuality}%

Provide comprehensive JSON analysis with these exact fields:
{
  "consensus": {
    "overallScore": 75,
    "recommendation": "Buy|Hold|Sell",
    "confidence": 85
  },
  "executiveSummary": {
    "oneLineSummary": "Brief one-line summary",
    "topFindings": ["finding 1", "finding 2", "finding 3"],
    "opportunities": ["opportunity 1", "opportunity 2"],
    "risks": ["risk 1", "risk 2"]
  },
  "marketOutlook": "24-48 hour outlook paragraph",
  "technicalSummary": "Technical indicator summary",
  "sentimentSummary": "Social sentiment summary"
}

Be specific, actionable, and data-driven. Return ONLY valid JSON.`;

    console.log(`📡 Calling GPT-5.1 with medium reasoning...`);
    const startTime = Date.now();

    const completion = await openai.chat.completions.create({
      model: 'gpt-5.1',
      messages: [
        { role: 'system', content: 'You are an expert cryptocurrency analyst. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      reasoning: {
        effort: 'medium'
      },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const duration = Date.now() - startTime;
    console.log(`✅ GPT-5.1 responded in ${duration}ms`);

    const responseText = extractResponseText(completion, true);
    validateResponseText(responseText, 'gpt-5.1', completion);

    console.log(`✅ Got GPT-5.1 response text (${responseText.length} chars)`);

    let analysis: any;
    try {
      analysis = JSON.parse(responseText);
      console.log(`✅ Direct JSON parse succeeded`);
    } catch (parseError) {
      console.warn(`⚠️ Initial JSON parse failed, engaging cleanup...`);
      
      let cleanedText = responseText.trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .replace(/^[^{]*({)/s, '$1')
        .replace(/(})[^}]*$/s, '$1');
      
      for (let i = 0; i < 5; i++) {
        cleanedText = cleanedText
          .replace(/,(\s*])/g, '$1')
          .replace(/,(\s*})/g, '$1')
          .replace(/(\d+)\.(\s*[,\]}])/g, '$1$2')
          .replace(/,\s*,/g, ',');
      }
      
      analysis = JSON.parse(cleanedText);
      console.log(`✅ JSON parse succeeded after cleanup`);
    }
    
    if (!analysis || typeof analysis !== 'object') {
      throw new Error('Parsed analysis is not a valid object');
    }
    
    console.log(`✅ Analysis validated, keys:`, Object.keys(analysis).join(', '));

    return res.status(200).json({
      success: true,
      analysis,
      dataQuality: {
        percentage: dataQuality,
        workingAPIs: workingAPIs,
        totalAPIs: totalAPIs,
        available: availableAPIs
      },
      timestamp: new Date().toISOString(),
      version: '2.0-fixed' // ✅ Version marker to identify new analysis logic
    });

  } catch (error) {
    console.error('❌ GPT-5.1 analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    });
  }
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
  maxDuration: 300,
};
