# Technology Stack

## Framework & Runtime
- **Next.js 14** - React framework with SSR/SSG capabilities and mobile optimization
- **Node.js 18+** - Runtime environment with performance monitoring
- **TypeScript 5.2** - Type-safe JavaScript with strict mode enabled

## Frontend Stack
- **React 18** - Component library with hooks and mobile-first components
- **Tailwind CSS 3.3** - Utility-first CSS framework with **Bitcoin Sovereign color palette** (Black, Orange, White)
- **Lucide React** - Modern icon library with scalable SVG icons (styled in orange/white)
- **PostCSS & Autoprefixer** - CSS processing with mobile browser support
- **Custom Animations** - CSS animations optimized for mobile performance (orange glow effects, smooth transitions)
- **Inter Font** - Geometric sans-serif for UI and headlines
- **Roboto Mono** - Monospaced font for data and technical displays

## Mobile & Accessibility
- **Mobile-First Design** - Progressive enhancement from 320px to 1920px+
- **Touch Optimization** - 48px minimum touch targets, hover states, gesture support
- **WCAG 2.1 AA Compliance** - High contrast ratios, screen reader support
- **Performance Optimization** - Lazy loading, optimized animations, efficient rendering
- **Responsive Images** - Adaptive image loading for different screen densities

## Backend & APIs
- **Next.js API Routes** - Serverless functions with error handling and fallbacks
- **Fetch API** - Native HTTP client with timeout and retry logic
- **OpenAI GPT-4o** - Advanced AI-powered market analysis and trade generation
- **Multiple Data Sources**: 
  - **CoinGecko API** - Primary market data source
  - **CoinMarketCap API** - Secondary market data with fallback
  - **NewsAPI** - Real-time cryptocurrency news aggregation
  - **CryptoCompare** - Additional news source and market data
  - **Kraken API** - Live trading data and order book analysis
  - **Caesar API** - Advanced market analysis and whale transaction intelligence (✅ Live)

## Development Tools
- **ESLint** - Code linting with Next.js config and accessibility rules
- **Prettier** - Code formatting with consistent styling
- **TypeScript compiler** - Type checking with strict mode
- **Kiro IDE** - AI-powered development environment with autofix capabilities
- **Git** - Version control with structured commit messages
- **Vercel CLI** - Deployment and preview management

## Testing & Validation
- **Mobile Accessibility Testing** - Automated WCAG compliance validation
- **Performance Monitoring** - Mobile performance metrics and optimization
- **Cross-Device Testing** - Responsive design validation across screen sizes
- **API Health Monitoring** - Diagnostic endpoints for service monitoring

## Common Commands

```bash
# Development
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build with mobile optimization
npm run start        # Start production server
npm run lint         # Run ESLint with accessibility checks
npm run lint:fix     # Auto-fix linting issues

# Type checking & formatting
npm run type-check   # TypeScript validation
npm run format       # Format code with Prettier
npm run format:check # Check formatting

# Testing & Validation
npm run test         # Run accessibility and mobile tests
npm run validate     # Mobile performance validation

# Deployment
vercel --prod        # Deploy to production
vercel --preview     # Deploy preview build

# Utilities
npm run clean        # Remove build artifacts
npm run analyze      # Bundle analysis with mobile metrics
```

## Environment Setup
- Copy `.env.example` to `.env.local`
- **Required API keys**: 
  - `OPENAI_API_KEY` - GPT-4o for AI analysis
  - `NEWS_API_KEY` - Real-time news aggregation
  - `COINMARKETCAP_API_KEY` - Primary market data
- **Optional API keys**:
  - `COINGECKO_API_KEY` - Fallback market data
  - `CRYPTOCOMPARE_API_KEY` - Additional news source

## Build Configuration
- **TypeScript**: Errors ignored during build for faster deployment (`ignoreBuildErrors: true`)
- **ESLint**: Disabled during build, enabled in development
- **Mobile Optimization**: Image optimization, lazy loading, performance budgets
- **Progressive Enhancement**: Mobile-first CSS with desktop enhancements
- **API Integration**: Multiple fallback sources with error handling
- **Performance**: Bundle splitting, tree shaking, compression enabled

## Deployment Architecture
- **Vercel Platform**: Serverless deployment with global CDN
- **Environment Variables**: Secure API key management
- **Preview Deployments**: Automatic preview builds for pull requests
- **Production Monitoring**: Real-time performance and error tracking
- **Mobile Performance**: Lighthouse CI integration for mobile metrics