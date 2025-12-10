/**
 * LunarCrush Dashboard Page
 * Complete social sentiment analysis dashboard for Bitcoin
 */

import React, { useState } from "react";
import Head from "next/head";
import {
  SocialSentimentGauge,
  ViralContentAlert,
  SocialFeedWidget,
  TradingSignalsCard,
} from "../components/LunarCrush";

export default function LunarCrushDashboard() {
  const [symbol] = useState("BTC");

  return (
    <>
      <Head>
        <title>Bitcoin Social Sentiment Dashboard | LunarCrush Integration</title>
        <meta
          name="description"
          content="Real-time Bitcoin social sentiment analysis powered by LunarCrush. Track Galaxy Score, viral content, and sentiment-based trading signals."
        />
      </Head>

      <div className="min-h-screen bg-bitcoin-black">
        {/* Header */}
        <header className="border-b border-bitcoin-orange-20 bg-bitcoin-black sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-bitcoin-white font-bold text-2xl mb-1">
                  Bitcoin Social Sentiment
                </h1>
                <p className="text-bitcoin-white-60 text-sm">
                  Powered by{" "}
                  <a
                    href="https://lunarcrush.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bitcoin-orange hover:text-bitcoin-white transition-colors underline"
                  >
                    LunarCrush
                  </a>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-bitcoin-white-60 text-xs uppercase tracking-wider">
                    Tracking
                  </div>
                  <div className="text-bitcoin-orange font-mono text-xl font-bold">
                    {symbol}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Viral Content Alert (appears when viral content detected) */}
          <div className="mb-6">
            <ViralContentAlert symbol={symbol} threshold={10000000} />
          </div>

          {/* Top Row: Sentiment & Signals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SocialSentimentGauge symbol={symbol} />
            <TradingSignalsCard symbol={symbol} />
          </div>

          {/* Social Feed */}
          <div className="mb-6">
            <SocialFeedWidget symbol={symbol} limit={50} />
          </div>

          {/* Info Section */}
          <div className="bitcoin-block">
            <h3 className="text-bitcoin-white font-bold text-lg mb-4">
              About This Dashboard
            </h3>
            
            <div className="space-y-4 text-bitcoin-white-80 text-sm leading-relaxed">
              <p>
                This dashboard provides real-time social sentiment analysis for Bitcoin using data from{" "}
                <a
                  href="https://lunarcrush.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bitcoin-orange hover:text-bitcoin-white transition-colors underline"
                >
                  LunarCrush
                </a>
                , a leading social intelligence platform for cryptocurrency markets.
              </p>

              <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                <h4 className="text-bitcoin-white font-semibold mb-2">Key Features:</h4>
                <ul className="space-y-2 text-bitcoin-white-60">
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange">•</span>
                    <span><strong className="text-bitcoin-white">Galaxy Score™:</strong> Proprietary metric combining social and market data (0-100 scale)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange">•</span>
                    <span><strong className="text-bitcoin-white">Social Sentiment:</strong> Aggregated sentiment from Twitter, Reddit, YouTube, and TikTok</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange">•</span>
                    <span><strong className="text-bitcoin-white">Viral Content Tracking:</strong> Automatic detection of posts with &gt;10M interactions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange">•</span>
                    <span><strong className="text-bitcoin-white">Trading Signals:</strong> Sentiment-based signals with confidence scoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-bitcoin-orange">•</span>
                    <span><strong className="text-bitcoin-white">Real-time Feed:</strong> Live social media posts with clickable source links</span>
                  </li>
                </ul>
              </div>

              <div className="bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg p-4">
                <h4 className="text-bitcoin-white font-semibold mb-2">Data Sources:</h4>
                <p className="text-bitcoin-white-60">
                  All social media posts include direct links to their original sources, allowing you to verify the data and explore the full context. Click "View Source" on any post to see the original content on Twitter, Reddit, YouTube, or TikTok.
                </p>
              </div>

              <div className="bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg p-4">
                <h4 className="text-bitcoin-white font-semibold mb-2">Update Frequency:</h4>
                <p className="text-bitcoin-white-60">
                  Data is cached for 5 minutes to optimize performance and respect API rate limits. Click the refresh button (🔄) on any component to fetch the latest data.
                </p>
              </div>

              <div className="bg-bitcoin-orange-10 border border-bitcoin-orange-20 rounded-lg p-4">
                <p className="text-bitcoin-white-60">
                  ⚠️ <strong className="text-bitcoin-white">Important:</strong> This dashboard provides social sentiment analysis for informational purposes only. It should not be considered financial advice. Always conduct your own research and consult with financial professionals before making investment decisions.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-bitcoin-orange-20 bg-bitcoin-black mt-12">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-bitcoin-white-60 text-sm">
                © 2025 Bitcoin Sovereign Technology. Social data powered by{" "}
                <a
                  href="https://lunarcrush.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bitcoin-orange hover:text-bitcoin-white transition-colors underline"
                >
                  LunarCrush
                </a>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <a
                  href="https://lunarcrush.com/developers/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors"
                >
                  API Documentation
                </a>
                <span className="text-bitcoin-white-60">•</span>
                <a
                  href="/"
                  className="text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors"
                >
                  Back to Home
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
