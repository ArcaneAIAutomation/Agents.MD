# Technology Stack

## Framework & Runtime
- **Next.js 14** - React framework with SSR/SSG capabilities
- **Node.js 18+** - Runtime environment
- **TypeScript 5.2** - Type-safe JavaScript with strict mode enabled

## Frontend Stack
- **React 18** - Component library with hooks
- **Tailwind CSS 3.3** - Utility-first CSS framework with custom crypto color palette
- **Lucide React** - Modern icon library
- **PostCSS & Autoprefixer** - CSS processing

## Backend & APIs
- **Next.js API Routes** - Serverless functions for backend logic
- **Axios** - HTTP client for external API calls
- **OpenAI API** - AI-powered market analysis
- **Multiple Data Sources**: Binance, CoinGecko, CoinMarketCap, NewsAPI

## Development Tools
- **ESLint** - Code linting with Next.js config
- **Prettier** - Code formatting
- **TypeScript compiler** - Type checking

## Common Commands

```bash
# Development
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix linting issues

# Type checking & formatting
npm run type-check   # TypeScript validation
npm run format       # Format code with Prettier
npm run format:check # Check formatting

# Utilities
npm run clean        # Remove build artifacts
npm run analyze      # Bundle analysis
```

## Environment Setup
- Copy `.env.example` to `.env.local`
- Required API keys: OPENAI_API_KEY, COINMARKETCAP_API_KEY, NEWS_API_KEY
- Optional: COINGECKO_API_KEY for fallback data

## Build Configuration
- TypeScript errors ignored during build (`ignoreBuildErrors: true`)
- ESLint disabled during build for faster deployment
- WebSocket polling enabled for HMR in development
- Image optimization configured for external domains