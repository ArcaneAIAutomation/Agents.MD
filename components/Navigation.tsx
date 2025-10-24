import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, X, Home, Newspaper, Bot, Bitcoin, Coins, Whale, Scale } from 'lucide-react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const menuItems = [
    { name: 'Home', path: '/', icon: Home, emoji: '🏠', description: 'Dashboard Overview' },
    { name: 'Crypto News Wire', path: '/crypto-news', icon: Newspaper, emoji: '📰', description: 'Real-Time News & Sentiment' },
    { name: 'AI Trade Generation', path: '/trade-generation', icon: Bot, emoji: '🤖', description: 'GPT-4o Trading Signals' },
    { name: 'Bitcoin Report', path: '/bitcoin-report', icon: Bitcoin, emoji: '₿', description: 'BTC Market Analysis' },
    { name: 'Ethereum Report', path: '/ethereum-report', icon: Coins, emoji: '⟠', description: 'ETH & DeFi Insights' },
    { name: 'Whale Watch', path: '/whale-watch', icon: Whale, emoji: '🐋', description: 'Large Transaction Tracking' },
    { name: 'Regulatory Watch', path: '/regulatory-watch', icon: Scale, emoji: '⚖️', description: 'Compliance & Regulations' },
  ];

  const isActive = (path: string) => router.pathname === path;

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-bitcoin-black border-b border-bitcoin-orange-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <span className="text-2xl font-bold text-bitcoin-orange group-hover:text-bitcoin-white transition-colors">
                ₿
              </span>
              <span className="text-xl font-bold text-bitcoin-white group-hover:text-bitcoin-orange transition-colors">
                Bitcoin Sovereign
              </span>
            </Link>

            {/* Desktop Menu Items */}
            <div className="flex items-center space-x-1">
              {menuItems.slice(1).map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-all rounded flex items-center gap-2 ${
                      isActive(item.path)
                        ? 'text-bitcoin-orange border-b-2 border-bitcoin-orange'
                        : 'text-bitcoin-white-60 hover:text-bitcoin-orange hover:border-b-2 hover:border-bitcoin-orange'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="hidden xl:inline">{item.name}</span>
                    <span className="xl:hidden">{item.emoji}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile/Tablet Navigation */}
      <nav className="lg:hidden bg-bitcoin-black border-b border-bitcoin-orange-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-bitcoin-orange">₿</span>
              <span className="text-lg font-bold text-bitcoin-white">
                Bitcoin Sovereign
              </span>
            </Link>

            {/* Hamburger Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-bitcoin-orange hover:text-bitcoin-white transition-all hover:scale-110 active:scale-95 min-h-[48px] min-w-[48px] flex items-center justify-center"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="h-8 w-8" strokeWidth={2.5} />
              ) : (
                <Menu className="h-8 w-8" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile/Tablet Full-Screen Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-bitcoin-black overflow-y-auto">
          {/* Header with Close Button */}
          <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black sticky top-0 z-10">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-bitcoin-orange">₿</span>
                  <span className="text-lg font-bold text-bitcoin-white">Menu</span>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-bitcoin-orange hover:text-bitcoin-white transition-all hover:scale-110 active:scale-95 min-h-[48px] min-w-[48px] flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X className="h-8 w-8" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="container mx-auto px-4 py-6">
            <div className="space-y-3">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block transition-all ${
                      active
                        ? 'bitcoin-block-orange'
                        : 'bitcoin-block hover:border-bitcoin-orange'
                    }`}
                  >
                    <div className="p-4 flex items-center gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                        active 
                          ? 'bg-bitcoin-black text-bitcoin-orange' 
                          : 'bg-bitcoin-black border border-bitcoin-orange-20 text-bitcoin-orange'
                      }`}>
                        <IconComponent className="h-6 w-6" strokeWidth={2} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-lg ${
                          active ? 'text-bitcoin-black' : 'text-bitcoin-white'
                        }`}>
                          {item.name}
                        </div>
                        <div className={`text-sm mt-0.5 ${
                          active ? 'text-bitcoin-black opacity-80' : 'text-bitcoin-white-60'
                        }`}>
                          {item.description}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className={`flex-shrink-0 ${
                        active ? 'text-bitcoin-black' : 'text-bitcoin-orange'
                      }`}>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-bitcoin-orange mt-8 bg-bitcoin-black">
            <div className="container mx-auto px-4 py-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-2xl font-bold text-bitcoin-orange">₿</span>
                  <span className="text-lg font-bold text-bitcoin-white">Bitcoin Sovereign</span>
                </div>
                <p className="text-sm text-bitcoin-white-60">
                  Real-Time Market Intelligence Platform
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-bitcoin-white-60">
                  <span>⚡ Live Data</span>
                  <span>•</span>
                  <span>🧠 AI Powered</span>
                  <span>•</span>
                  <span>🔒 Privacy First</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
