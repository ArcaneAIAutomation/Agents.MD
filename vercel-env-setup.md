# 🚀 Vercel Environment Variables Setup Guide

## Required Environment Variables for Production

Copy these variables to your Vercel project settings:

### 🤖 AI Configuration (CRITICAL)
```
OPENAI_API_KEY=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
OPENAI_MODEL=gpt-4o-2024-08-06
USE_REAL_AI_ANALYSIS=true
```

### 📊 Market Data APIs (CRITICAL)
```
BINANCE_API_KEY=03SlYy1rpIX85ieY0cMaJC7z9Dn1B1u0pSPtLlIZIXcLfkfM5FLCurrOEiKkwwtz
BINANCE_SECRET_KEY=K8YrgZZ6bZbcwCpmMe8PQc7SEGQTsIHUbaYsYXer3qNbFhk0bCfCjsR4q8XeSDNz
COINMARKETCAP_API_KEY=25a84887-8485-4c41-8a65-2ba34b1afa37
COINGECKO_API_KEY=CG-YourActualAPIKeyHere
ALPHA_VANTAGE_API_KEY=9X8K0P2O7JKSJO6Q
```

### 📰 News APIs (IMPORTANT)
```
NEWS_API_KEY=4a574a8cc6f04b5b950243b0e55d512a
```

### ⚙️ Application Settings (REQUIRED)
```
ENABLE_LIVE_DATA=true
ENABLE_AI_NEWS_ANALYSIS=true
ENABLE_ADVANCED_TA=true
API_CACHE_DURATION=300000
MAX_API_REQUESTS_PER_MINUTE=60
```

## 🎯 Steps to Add Variables:

1. Go to: https://vercel.com/arcane-ai-automations-projects/agents-md/settings/environment-variables
2. Click "Add New" for each variable
3. Set Environment: "Production, Preview, Development" (all three)
4. Click "Save"
5. Redeploy your project

## 🚀 Quick Deploy After Setup:
```bash
vercel --prod
```

## ⚠️ Security Notes:
- These are your actual API keys - keep them secure
- Never commit .env.local to git (it's already in .gitignore)
- Vercel encrypts environment variables in production