# 🚀 Agents.MD - Crypto Trading Intelligence Platform

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/ArcaneAIAutomation/Agents.MD/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

Advanced cryptocurrency trading intelligence platform powered by AI agents and real-time market data analysis. Built with Next.js, TypeScript, and the **Bitcoin Sovereign Technology** design system - a minimalist black and orange aesthetic that embodies digital scarcity and forward-looking innovation.

🌐 **Live Demo**: [news.arcane.group](https://news.arcane.group)  
📚 **Documentation**: [View Docs](docs/)  
🐛 **Issues**: [Report Bug](https://github.com/ArcaneAIAutomation/Agents.MD/issues)  
💡 **Feature Requests**: [Request Feature](https://github.com/ArcaneAIAutomation/Agents.MD/issues/new?template=feature_request.md)

## ✨ Key Features

### 📊 Enhanced Visual Trading Zones
- **Real-time order book analysis** from Binance with live bid/ask walls
- **Multi-timeframe trading zones** (1H Scalping, 4H Swing, 1D Position)
- **Whale movement detection** for transactions >5 BTC
- **Market sentiment integration** with Fear & Greed Index
- **Timeframe-specific volatility calculations** for optimal zone placement

### 🤖 Advanced Price Prediction Engine
- **Multi-timeframe technical analysis** (15m, 1h, 4h intervals)
- **Real-time indicator calculations**: RSI, MACD, EMA20/50, Bollinger Bands
- **Order book imbalance detection** for market bias analysis
- **Confidence scoring system** for prediction reliability
- **Live market data** from Binance, Coinbase, and CoinGecko APIs

### 📰 Regulatory Intelligence
- **Real-time monitoring** of regulatory changes affecting crypto
- **Relevance scoring** for news articles (0-100 scale)
- **Official sources** including FCA, EBA, and regulatory bodies
- **Automated updates** every 5 minutes

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0.0 or higher
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ArcaneAIAutomation/Agents.MD.git
   cd Agents.MD
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   COINMARKETCAP_API_KEY=your_cmc_api_key_here
   NEWS_API_KEY=your_news_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Trading Zone Analysis

1. **Select Timeframe**: Choose between 1H (Scalping), 4H (Swing), or 1D (Position)
2. **View Real-Time Zones**: See live supply/demand zones based on order book data
3. **Analyze Confidence**: Each zone shows confidence percentage and volume data
4. **Monitor Whale Activity**: Track large transactions affecting price levels

### Price Predictions

- **Hourly Predictions**: Short-term price targets with 85%+ confidence
- **Daily Predictions**: 24-hour price forecasts with technical analysis
- **Weekly Predictions**: Long-term trend analysis for position trading

### Market Intelligence

- **Live News Feed**: Real-time cryptocurrency news and regulatory updates
- **Sentiment Analysis**: Market sentiment scoring and Fear & Greed Index
- **Technical Indicators**: RSI, MACD, Bollinger Bands, and moving averages

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

## 🎨 Styling & UI - Bitcoin Sovereign Technology

- **Bitcoin Sovereign Design System** - Minimalist black and orange aesthetic
- **Pure Black Canvas** (#000000) - The digital space where Bitcoin exists
- **Bitcoin Orange Accents** (#F7931A) - Energy, action, and emphasis
- **Thin Orange Borders** (1-2px) - Signature visual element on black backgrounds
- **Typography**: Inter (UI/headlines) + Roboto Mono (data/technical displays)
- **Mobile-First** responsive design with progressive enhancement
- **WCAG 2.1 AA Compliant** - High contrast ratios for accessibility

### Bitcoin Sovereign Color Palette
```css
--bitcoin-black: #000000      /* Pure black backgrounds */
--bitcoin-orange: #F7931A     /* Bitcoin orange for CTAs and emphasis */
--bitcoin-white: #FFFFFF      /* Headlines and critical data */
--bitcoin-white-80: rgba(255, 255, 255, 0.8)  /* Body text */
--bitcoin-white-60: rgba(255, 255, 255, 0.6)  /* Labels */
--bitcoin-orange-20: rgba(247, 147, 26, 0.2)  /* Subtle borders */
```

### Design Philosophy
The visual language is rooted in Sovereign Technology - a secure, digital-native environment. The mood is minimalist, confident, and forward-looking, treating the black background not as a color, but as the digital space in which Bitcoin exists.

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

## 🏗️ Project Structure

```
Agents.MD/
├── 📁 components/           # React components
│   ├── BTCTradingChart.tsx  # Main trading chart component
│   ├── BTCMarketAnalysis.tsx # Market analysis dashboard
│   └── TradingChart.tsx     # Base chart component
├── 📁 pages/               # Next.js pages and API routes
│   ├── api/                # Backend API endpoints
│   │   ├── btc-analysis.ts # Bitcoin analysis API
│   │   ├── crypto-herald.ts # News aggregation API
│   │   └── historical-prices.ts # Price history API
│   └── index.tsx           # Main dashboard page
├── 📁 styles/              # CSS and styling
├── 📁 docs/                # Documentation
├── 📁 .github/             # GitHub templates and workflows
├── .env.example            # Environment variables template
├── README.md               # This file
└── package.json            # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables

Required API keys (add to `.env.local`):

| Variable | Description | Required | Get From |
|----------|-------------|----------|----------|
| `OPENAI_API_KEY` | OpenAI API for AI analysis | ✅ | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `COINMARKETCAP_API_KEY` | Market data | ✅ | [CoinMarketCap Pro](https://pro.coinmarketcap.com/account) |
| `NEWS_API_KEY` | News aggregation | ✅ | [NewsAPI](https://newsapi.org/account) |
| `COINGECKO_API_KEY` | Alternative market data | ⚪ | [CoinGecko](https://www.coingecko.com/en/api/pricing) |

### Feature Flags

Control features via environment variables:

```env
ENABLE_LIVE_DATA=true              # Enable real-time data fetching
ENABLE_AI_NEWS_ANALYSIS=true       # Enable AI-powered news analysis
ENABLE_ADVANCED_TA=true            # Enable advanced technical analysis
USE_REAL_AI_ANALYSIS=true          # Use real OpenAI instead of demo data
```

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow TypeScript best practices
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run build
   npm run lint
   npm run type-check
   ```

4. **Submit a pull request**
   - Use the provided PR template
   - Include screenshots for UI changes
   - Reference related issues

## 📊 Technical Architecture

### Frontend Stack
- **Next.js 14** - React framework with SSR/SSG
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework with Bitcoin Sovereign color palette
- **Inter Font** - Geometric sans-serif for UI and headlines
- **Roboto Mono** - Monospaced font for data and technical displays
- **Lucide React** - Modern icon library (styled in orange/white)

### Backend & APIs
- **Next.js API Routes** - Serverless API endpoints
- **Real-time Data Sources**:
  - Binance API (Order book, klines, funding)
  - Coinbase API (Price feeds)
  - CoinGecko API (Market data)
  - NewsAPI (Cryptocurrency news)
  - Alternative.me (Fear & Greed Index)

### AI & Analysis
- **OpenAI GPT-4** - Market analysis and predictions
- **Custom Algorithms** - Technical indicator calculations
- **Real-time Processing** - Live data analysis and zone generation

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set environment variables** in Vercel dashboard

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 📈 Performance

### Optimization Features
- **API Caching** - 5-minute cache for market data
- **Rate Limiting** - Prevents API quota exhaustion
- **Error Handling** - Graceful fallbacks for API failures
- **Responsive Design** - Optimized for all device sizes

### Monitoring
- Real-time API status monitoring
- Error logging and reporting
- Performance metrics tracking

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before getting started.

### Ways to Contribute
- 🐛 **Report bugs** using our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- 💡 **Suggest features** using our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
- 📝 **Improve documentation** by submitting PRs
- 🔧 **Fix issues** by browsing our [open issues](https://github.com/ArcaneAIAutomation/Agents.MD/issues)
- ⭐ **Star the repository** to show your support

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Agents.MD.git`
3. Follow the [installation steps](#installation) above
4. Create a feature branch: `git checkout -b feature/amazing-feature`
5. Make your changes and commit: `git commit -m 'Add amazing feature'`
6. Push to your branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

Security is a top priority. Please review our [Security Policy](SECURITY.md) for:
- Reporting vulnerabilities
- Security best practices
- Supported versions

**Never commit API keys or sensitive data to the repository.**

## 📞 Support & Community

### Getting Help
- 📖 **Documentation**: Check our [docs](docs/) directory
- 🐛 **Bug Reports**: Use our [issue tracker](https://github.com/ArcaneAIAutomation/Agents.MD/issues)
- 💬 **Discussions**: Join our [GitHub Discussions](https://github.com/ArcaneAIAutomation/Agents.MD/discussions)
- 📧 **Email**: Contact us at support@arcane.group

### Community Guidelines
Please read our [Code of Conduct](CODE_OF_CONDUCT.md) to understand our community standards.

## 🗺️ Roadmap

### Version 1.2.0 (Q4 2025)
- [ ] Additional cryptocurrency support (ETH, ADA, SOL)
- [ ] Advanced portfolio tracking
- [ ] Custom alert system
- [ ] Enhanced mobile experience
- [ ] API rate optimization

### Version 1.3.0 (Q1 2026)
- [ ] Machine learning price predictions
- [ ] Social sentiment analysis from Twitter/Reddit
- [ ] Advanced charting tools (TradingView integration)
- [ ] User authentication system
- [ ] Personalized dashboards

### Version 2.0.0 (Q2 2026)
- [ ] Multi-exchange support
- [ ] Real-time trading execution
- [ ] Advanced risk management tools
- [ ] Professional trader features
- [ ] API for third-party integrations

## 📊 Statistics

![GitHub stars](https://img.shields.io/github/stars/ArcaneAIAutomation/Agents.MD?style=social)
![GitHub forks](https://img.shields.io/github/forks/ArcaneAIAutomation/Agents.MD?style=social)
![GitHub issues](https://img.shields.io/github/issues/ArcaneAIAutomation/Agents.MD)
![GitHub pull requests](https://img.shields.io/github/issues-pr/ArcaneAIAutomation/Agents.MD)

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 API enabling intelligent market analysis
- **Binance** for comprehensive cryptocurrency market data
- **CoinGecko** for reliable price feeds and market information
- **Next.js Team** for the excellent React framework
- **Tailwind CSS** for the utility-first CSS framework
- **Vercel** for seamless deployment and hosting
- **Contributors** who help improve this project

## 📈 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes and releases.

---

<div align="center">

**Built with ❤️ by [Arcane AI Automation](https://github.com/ArcaneAIAutomation)**

[⭐ Star this repository](https://github.com/ArcaneAIAutomation/Agents.MD) if you find it helpful!

</div>