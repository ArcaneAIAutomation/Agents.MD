# Bitcoin Sovereign Technology

[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Advanced cryptocurrency intelligence platform powered by multi-source real-time data, AI analysis, and the **Bitcoin Sovereign Technology** design system — a minimalist black and orange aesthetic built for serious traders.

🌐 **Live**: [news.arcane.group](https://news.arcane.group)

---

## Features

### Universal Crypto Intelligence Engine (UCIE)
Comprehensive multi-source analysis pipeline that collects data from 13+ APIs, stores everything in Supabase, then runs modular GPT-5-mini analysis across 9 dimensions — market, technical, sentiment, news, on-chain, risk, predictions, DeFi, and an executive summary.

- Data-first architecture: all sources cached in database before AI runs
- Modular GPT-5-mini analysis with `medium` reasoning effort
- Caesar AI deep research (15–20 min, user opt-in)
- Real-time data quality scoring (minimum 70% required for AI)

### Whale Watch
Real-time Bitcoin whale transaction tracking with AI-powered analysis.

- Detects large BTC transactions (>50 BTC threshold)
- Gemini AI fast analysis with thinking mode
- GPT-5-mini deep dive analysis
- Exchange deposit/withdrawal classification
- Market impact assessment (Bullish / Bearish / Neutral)

### AI Trade Generation Engine (Einstein)
Multi-timeframe trading signal generation with confidence scoring.

- 15m, 1h, 4h, 1D technical analysis
- RSI, MACD, EMA, Bollinger Bands, ATR
- Supply/demand zone detection from order book data
- Risk/reward ratio calculations with stop-loss and take-profit levels

### Crypto News Wire
Real-time news aggregation with AI sentiment analysis.

- NewsAPI + CryptoCompare integration
- Automated sentiment scoring
- Regulatory intelligence monitoring

### Secure Authentication
Access code-based user system with session-only JWT authentication.

- One-time access code redemption
- bcrypt password hashing (12 salt rounds)
- httpOnly session cookies (1-hour expiry, no persistence)
- Rate limiting (5 attempts / 15 min)
- Comprehensive audit logging

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14, React 18, TypeScript 5.2 |
| Styling | Tailwind CSS, Inter + Roboto Mono fonts |
| Database | Supabase PostgreSQL (connection pooling) |
| AI | OpenAI GPT-5-mini (Responses API), Gemini AI, Caesar API |
| Auth | JWT, bcrypt, Zod validation |
| Deployment | Vercel Pro |

### Data Sources (13/14 operational)
CoinMarketCap · CoinGecko · Kraken · NewsAPI · Caesar API · LunarCrush · Twitter/X · Reddit · DeFiLlama · Etherscan V2 · Blockchain.com · OpenAI · Gemini

---

## Quick Start

```bash
git clone https://github.com/ArcaneAIAutomation/Agents.MD.git
cd Agents.MD
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Supabase PostgreSQL connection string | ✅ |
| `JWT_SECRET` | JWT signing secret (32+ bytes) | ✅ |
| `OPENAI_API_KEY` | OpenAI API key | ✅ |
| `OPENAI_MODEL` | Model name (default: `gpt-5-mini`) | ✅ |
| `REASONING_EFFORT` | Reasoning effort: `low`, `medium`, `high` | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key | ✅ |
| `CAESAR_API_KEY` | Caesar research API key | ✅ |
| `COINMARKETCAP_API_KEY` | CoinMarketCap API key | ✅ |
| `NEWS_API_KEY` | NewsAPI key | ✅ |
| `LUNARCRUSH_API_KEY` | LunarCrush social data key | ✅ |
| `ETHERSCAN_API_KEY` | Etherscan V2 API key | ✅ |
| `BLOCKCHAIN_API_KEY` | Blockchain.com API key | ✅ |
| `COINGECKO_API_KEY` | CoinGecko API key | ⚪ Optional |
| `CRON_SECRET` | Cron job authentication secret | ✅ |

See `.env.example` for the full list.

---

## Project Structure

```
├── components/
│   ├── UCIE/           # Universal Crypto Intelligence Engine UI
│   ├── WhaleWatch/     # Whale tracking dashboard
│   ├── QuantumBTC/     # Trade generation components
│   ├── LunarCrush/     # Social sentiment components
│   └── auth/           # Authentication forms and provider
├── pages/
│   ├── api/            # Serverless API routes
│   │   ├── ucie/       # UCIE data + AI analysis endpoints
│   │   ├── whale-watch/ # Whale detection and analysis
│   │   ├── einstein/   # Trade signal generation
│   │   ├── auth/       # Authentication endpoints
│   │   └── cron/       # Scheduled jobs
│   ├── ucie/           # UCIE pages
│   └── whale-watch.tsx # Whale Watch dashboard
├── lib/
│   ├── ucie/           # UCIE cache utilities and context aggregator
│   ├── einstein/       # Trade engine logic
│   ├── auth/           # JWT, password, audit logging
│   └── db.ts           # Database connection pool
├── hooks/              # Custom React hooks
├── middleware/         # Auth, rate limiting, CSRF
├── migrations/         # Database migration SQL files
├── utils/              # Shared utilities (OpenAI parsing, etc.)
└── styles/             # Global CSS + Tailwind config
```

---

## Design System

Bitcoin Sovereign Technology uses three colors only:

```css
--bitcoin-black:  #000000   /* Pure black canvas */
--bitcoin-orange: #F7931A   /* Bitcoin orange — energy and action */
--bitcoin-white:  #FFFFFF   /* Headlines and critical data */
```

- Thin orange borders (1–2px) on black backgrounds
- Inter for UI and headlines, Roboto Mono for data
- Mobile-first, 320px to 1920px+ responsive
- 48px minimum touch targets

---

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

---

## Deployment

Deployed on Vercel Pro with extended function timeouts:
- Caesar research endpoints: 1500s
- UCIE comprehensive endpoints: 900s
- Standard UCIE endpoints: 600s

```bash
vercel --prod
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push and open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## Security

Never commit API keys or secrets. See [SECURITY.md](SECURITY.md) for our vulnerability reporting policy.

---

## License

MIT — see [LICENSE](LICENSE) for details.
