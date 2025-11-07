import Link from 'next/link'
import { useState } from 'react'
import { useMobileOptimization } from '../hooks/useMobileViewport'
import { useBTCData, useETHData } from '../hooks/useMarketData'

// Navigation menu items
const navigationItems = [
  { href: '/', label: 'Back to Dashboard', description: 'Market Overview' }
]

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { shouldShowMobileMenu, minTouchTargetSize, viewport } = useMobileOptimization()
  const { btcData } = useBTCData()
  const { ethData } = useETHData()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleNavClick = (href: string) => {
    // Close mobile menu when navigation item is clicked
    closeMobileMenu()
    
    // Handle anchor links for smooth scrolling
    if (href.startsWith('#')) {
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  // Format price with commas
  const formatPrice = (price: number | undefined) => {
    if (!price) return '---';
    return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Calculate 24h change (mock for now - would come from API)
  const btcChange = 2.4; // Mock 24h change percentage
  const ethChange = 1.8; // Mock 24h change percentage

  return (
    <header className="bg-bitcoin-black border-b-2 border-bitcoin-orange relative">
      {/* Live Market Data Banner - Mobile/Tablet Only */}
      <div className="lg:hidden bg-bitcoin-black border-b border-bitcoin-orange-20 py-2 px-4">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          {/* BTC Price */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
              BTC
            </span>
            <span className="font-mono text-sm md:text-base font-bold text-bitcoin-orange truncate" style={{ textShadow: '0 0 15px rgba(247, 147, 26, 0.3)' }}>
              ${formatPrice(btcData?.currentPrice)}
            </span>
            <span className={`text-xs font-semibold ${btcChange >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
              {btcChange >= 0 ? '+' : ''}{btcChange}%
            </span>
          </div>

          {/* ETH Price */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
              ETH
            </span>
            <span className="font-mono text-sm md:text-base font-bold text-bitcoin-orange truncate" style={{ textShadow: '0 0 15px rgba(247, 147, 26, 0.3)' }}>
              ${formatPrice(ethData?.currentPrice)}
            </span>
            <span className={`text-xs font-semibold ${ethChange >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
              {ethChange >= 0 ? '+' : ''}{ethChange}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 py-4">
          {/* Mobile Menu Button - Left Side */}
          {shouldShowMobileMenu && (
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md hover:bg-bitcoin-orange-10 focus:outline-none focus:ring-2 focus:ring-bitcoin-orange transition-colors"
              style={{ 
                minWidth: `${minTouchTargetSize}px`,
                minHeight: `${minTouchTargetSize}px`,
                color: '#F7931A'
              }}
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isMobileMenuOpen ? (
                  // X icon when menu is open
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  // Hamburger icon when menu is closed
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          )}

          {/* Centered Logo */}
          <div className={`text-center ${shouldShowMobileMenu ? 'flex-1' : ''}`}>
            <Link 
              href="/" 
              className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-black leading-tight text-bitcoin-white hover:text-bitcoin-orange transition-colors" 
              style={{ 
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.02em'
              }}
              onClick={() => handleNavClick('/')}
            >
              BITCOIN SOVEREIGN TECHNOLOGY
            </Link>
            <p 
              className="text-xs md:text-sm font-semibold mt-1 text-bitcoin-white-60 uppercase tracking-wider"
              style={{ 
                fontFamily: 'Inter, sans-serif'
              }}
            >
              CRYPTOCURRENCY • AI ANALYSIS • MARKET INTELLIGENCE
            </p>
          </div>

          {/* Desktop Navigation - Right Side */}
          {!shouldShowMobileMenu && (
            <nav className="hidden md:flex space-x-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="text-bitcoin-white-60 hover:text-bitcoin-orange transition-colors font-semibold text-sm uppercase tracking-wider"
                  style={{ 
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Spacer for mobile to balance hamburger menu */}
          {shouldShowMobileMenu && (
            <div style={{ width: `${minTouchTargetSize}px` }} />
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {shouldShowMobileMenu && isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-bitcoin-black border-b-2 border-bitcoin-orange shadow-[0_0_20px_rgba(247,147,26,0.3)] z-50">
            <nav className="px-4 py-4 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="block bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg hover:border-bitcoin-orange hover:shadow-[0_0_15px_rgba(247,147,26,0.3)] transition-all"
                  style={{ 
                    minHeight: `${minTouchTargetSize}px`
                  }}
                >
                  <div className="flex items-center px-3 py-3">
                    <div>
                      <div className="font-bold text-base text-bitcoin-white">{item.label}</div>
                      <div className="text-sm text-bitcoin-white-60">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Platform Feature Indicators - Desktop Only */}
      <div className="hidden lg:block bg-bitcoin-black border-t border-bitcoin-orange-20 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-8">
          {/* 24/7 Live Monitoring */}
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-bitcoin-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-semibold text-bitcoin-white-80 uppercase tracking-wider">
              24/7 Live Monitoring
            </span>
          </div>

          {/* 6 AI Features */}
          <div className="flex items-center gap-2 px-3 py-1 border border-bitcoin-orange-20 rounded-md">
            <svg className="w-5 h-5 text-bitcoin-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm font-bold text-bitcoin-orange font-mono">6 AI Features</span>
          </div>

          {/* Real-Time Data */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-bitcoin-orange rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-bitcoin-white-80 uppercase tracking-wider">
              Real-Time Data
            </span>
          </div>

          {/* Live Market Data - Desktop */}
          <div className="flex items-center gap-6 ml-8 pl-8 border-l border-bitcoin-orange-20">
            {/* BTC Price */}
            <div className="flex items-center gap-2">
              <span className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider">
                BTC
              </span>
              <span className="font-mono text-base font-bold text-bitcoin-orange" style={{ textShadow: '0 0 15px rgba(247, 147, 26, 0.3)' }}>
                ${formatPrice(btcData?.currentPrice)}
              </span>
              <span className={`text-xs font-semibold ${btcChange >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                {btcChange >= 0 ? '+' : ''}{btcChange}%
              </span>
            </div>

            {/* ETH Price */}
            <div className="flex items-center gap-2">
              <span className="text-bitcoin-white-60 text-xs font-semibold uppercase tracking-wider">
                ETH
              </span>
              <span className="font-mono text-base font-bold text-bitcoin-orange" style={{ textShadow: '0 0 15px rgba(247, 147, 26, 0.3)' }}>
                ${formatPrice(ethData?.currentPrice)}
              </span>
              <span className={`text-xs font-semibold ${ethChange >= 0 ? 'text-bitcoin-orange' : 'text-bitcoin-white-60'}`}>
                {ethChange >= 0 ? '+' : ''}{ethChange}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {shouldShowMobileMenu && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-40 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </header>
  )
}
