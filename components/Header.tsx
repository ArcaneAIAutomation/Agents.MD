import Link from 'next/link'
import { useState } from 'react'
import { useMobileOptimization } from '../hooks/useMobileViewport'

// Navigation menu items
const navigationItems = [
  { href: '/', label: 'Dashboard', description: 'Market Overview' },
  { href: '#btc-analysis', label: 'Bitcoin', description: 'BTC Analysis' },
  { href: '#eth-analysis', label: 'Ethereum', description: 'ETH Analysis' },
  { href: '#crypto-herald', label: 'News', description: 'Market News' },
  { href: '#trading-signals', label: 'Signals', description: 'AI Trading' }
]

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { shouldShowMobileMenu, minTouchTargetSize, viewport } = useMobileOptimization()

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

  return (
    <header className="bg-white border-b-4 md:border-b-8 border-black header-newspaper-pattern relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 py-4">
          {/* Mobile Menu Button - Left Side */}
          {shouldShowMobileMenu && (
            <button
              onClick={toggleMobileMenu}
              className="mobile-text-primary p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black transition-colors"
              style={{ 
                minWidth: `${minTouchTargetSize}px`,
                minHeight: `${minTouchTargetSize}px`,
                color: '#000000'
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
              className="text-xl md:text-4xl font-black leading-tight mobile-text-primary" 
              style={{ 
                fontFamily: 'Times, serif',
                color: '#000000' // Ensure high contrast black text
              }}
              onClick={() => handleNavClick('/')}
            >
              TRADING INTELLIGENCE HUB
            </Link>
            <p 
              className="text-xs md:text-sm font-bold mt-1 mobile-text-secondary"
              style={{ 
                color: '#374151' // Ensure high contrast gray text
              }}
            >
              CRYPTOCURRENCY • REGULATORY • MARKET ANALYSIS
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
                  className="mobile-text-primary hover:text-gray-600 transition-colors font-medium"
                  style={{ 
                    color: '#000000',
                    fontFamily: 'Times, serif'
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
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b-4 border-black shadow-lg z-50">
            <nav className="px-4 py-4 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="block mobile-text-primary hover:bg-gray-100 rounded-md transition-colors"
                  style={{ 
                    minHeight: `${minTouchTargetSize}px`,
                    color: '#000000',
                    fontFamily: 'Times, serif'
                  }}
                >
                  <div className="flex items-center px-3 py-3">
                    <div>
                      <div className="font-bold text-lg">{item.label}</div>
                      <div className="text-sm mobile-text-secondary" style={{ color: '#374151' }}>
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

      {/* Mobile Menu Overlay */}
      {shouldShowMobileMenu && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </header>
  )
}
