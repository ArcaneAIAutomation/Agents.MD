# 🚀 Crypto News Hub

A real-time cryptocurrency news and market analysis website powered by AI agents, built with Next.js, TypeScript, and Tailwind CSS.

## 🎯 Features

### 📰 Nexo.com UK Regulatory Updates
- **Real-time monitoring** of regulatory changes affecting Nexo
- **Relevance scoring** for news articles (0-100 scale)
- **Official sources** including FCA, EBA, and Nexo communications
- **Automated updates** every 5 minutes

### 📊 Bitcoin Market Analysis
- **Live market data** including price, volume, and market cap
- **Multi-timeframe technical analysis** (1H, 4H, 1D, 1W)
- **Popular indicators**: RSI, MACD, Bollinger Bands, Moving Averages
- **Trading recommendations** with entry/exit points
- **Risk/reward calculations** for each setup

## 🏗️ Project Structure

```
crypto-news-hub/
├── pages/
│   ├── api/
│   │   ├── nexo-news.ts      # Nexo regulatory news API
│   │   └── bitcoin-analysis.ts # Bitcoin market analysis API
│   ├── _app.tsx               # App configuration
│   └── index.tsx              # Main dashboard page
├── styles/
│   └── globals.css            # Global styles with Tailwind
├── components/                # Reusable React components
├── utils/                     # Utility functions
└── types/                     # TypeScript type definitions
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Additional commands
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Keys (when integrating real APIs)
NEWSAPI_KEY=your_newsapi_key_here
COINGECKO_API_KEY=your_coingecko_key
TRADINGVIEW_API_KEY=your_tradingview_key

# Update intervals (minutes)
NEWS_UPDATE_INTERVAL=5
MARKET_UPDATE_INTERVAL=1

# Data sources
NEXO_RSS_FEED=https://nexo.io/rss
FCA_NEWS_URL=https://www.fca.org.uk/news/rss
EBA_RSS_FEED=https://www.eba.europa.eu/rss
```

## 📡 API Integration

### Real-Time Data Sources

The application is designed to integrate with multiple data sources:

#### News Sources
- **NewsAPI** - General cryptocurrency news
- **RSS Feeds** - Official regulatory announcements
- **Google News API** - Nexo-specific news monitoring
- **Official APIs** - FCA, EBA regulatory updates

#### Market Data Sources
- **CoinGecko API** - Market data and price feeds
- **Binance API** - Real-time trading data
- **TradingView** - Technical analysis data
- **CoinMarketCap** - Additional market metrics

### API Endpoints

```typescript
// Get Nexo regulatory news
GET /api/nexo-news
Response: NewsArticle[]

// Get Bitcoin market analysis
GET /api/bitcoin-analysis
Response: BitcoinAnalysisResponse
```

## 🤖 AI Agent Architecture

### News Collection Agents

1. **Regulatory Monitor Agent**
   - Monitors FCA, EBA, and other regulatory body announcements
   - Filters content relevant to Nexo operations
   - Assigns relevance scores based on content analysis

2. **News Aggregation Agent**
   - Collects news from multiple sources
   - Removes duplicates and ranks by importance
   - Provides sentiment analysis

### Market Analysis Agents

1. **Technical Analysis Agent**
   - Processes market data across multiple timeframes
   - Calculates popular technical indicators
   - Generates trading recommendations

2. **Risk Assessment Agent**
   - Evaluates market conditions
   - Calculates risk/reward ratios
   - Provides position sizing recommendations

## 📊 Data Models

### News Article Schema
```typescript
interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  relevanceScore: number; // 0-100
  tags: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}
```

### Market Analysis Schema
```typescript
interface TechnicalAnalysis {
  timeframe: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 1-10
  support: number[];
  resistance: number[];
  indicators: TechnicalIndicator[];
  recommendation: string;
  tradeSetup?: TradeSetup;
}
```

## 🎨 Styling & UI

- **Tailwind CSS** for responsive design
- **Dark mode** support
- **Custom color scheme** for crypto branding
- **Responsive grid** layout for desktop and mobile
- **Real-time updates** with visual indicators

### Color Palette
```css
--crypto-green: #00d4aa   /* Positive price movements */
--crypto-red: #ff6b6b     /* Negative price movements */
--crypto-bitcoin: #f7931a /* Bitcoin brand color */
--crypto-nexo: #1e4dd8    /* Nexo brand color */
```

## 🔄 Real-Time Features

- **Auto-refresh** every 5 minutes for news
- **Live market data** updates every minute
- **WebSocket support** for real-time price feeds
- **Push notifications** for breaking news
- **Progressive loading** with skeleton screens

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## 📈 Performance Optimization

- **Next.js SSG/SSR** for optimal loading
- **API caching** with appropriate cache headers
- **Image optimization** with Next.js Image component
- **Code splitting** for reduced bundle size
- **Service Worker** for offline capability

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Docker
```bash
docker build -t crypto-news-hub .
docker run -p 3000:3000 crypto-news-hub
```

### Traditional Hosting
```bash
npm run build
npm start
```

## 🔒 Security

- **API rate limiting** to prevent abuse
- **CORS configuration** for secure API access
- **Environment variable protection**
- **Input validation** for all user inputs
- **HTTPS enforcement** in production

## 📱 Mobile Responsiveness

- **Progressive Web App** capabilities
- **Touch-friendly** interface design
- **Optimized** for all screen sizes
- **Fast loading** on mobile networks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: Create a GitHub issue
- **Discussions**: Join our Discord community

---

**Built with ❤️ for the crypto community**

*This project demonstrates how AI agents can be used to create powerful, real-time financial information systems without requiring extensive manual content curation.*
