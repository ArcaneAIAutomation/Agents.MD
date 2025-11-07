import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, X, Home, Newspaper, Bot, Bitcoin, Coins, Fish, Scale, LogOut, Brain } from 'lucide-react';
import { useAuth } from './auth/AuthProvider';

export interface NavigationRef {
  openMenu: () => void;
}

const Navigation = forwardRef<NavigationRef>((props, ref) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Expose openMenu function to parent components
  useImperativeHandle(ref, () => ({
    openMenu: () => {
      // Only open menu on mobile/tablet (< 1024px)
      if (window.innerWidth < 1024) {
        setIsMenuOpen(true);
      }
    }
  }));

  // Close menu on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setIsMenuOpen(false);
    };
    
    router.events?.on('routeChangeStart', handleRouteChange);
    
    return () => {
      router.events?.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  // Close menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      // Close menu if resized to desktop (>= 1024px)
      if (window.innerWidth >= 1024 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMenuOpen]);

  // Prevent body scroll when menu is open (mobile/tablet only)
  useEffect(() => {
    // Only apply overflow lock on mobile/tablet (< 1024px)
    const isMobileOrTablet = window.innerWidth < 1024;
    
    if (isMenuOpen && isMobileOrTablet) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const menuItems = [
    { name: 'Home', path: '/', icon: Home, emoji: '🏠', description: 'Dashboard Overview' },
    { name: 'Universal Intelligence', path: '/ucie', icon: Brain, emoji: '🧠', description: 'Multi-Asset Crypto Analysis' },
    { name: 'Crypto News Wire', path: '/crypto-news', icon: Newspaper, emoji: '📰', description: 'Real-Time News & Sentiment' },
    { name: 'AI Trade Generation', path: '/trade-generation', icon: Bot, emoji: '🤖', description: 'GPT-4o Trading Signals' },
    { name: 'Bitcoin Report', path: '/bitcoin-report', icon: Bitcoin, emoji: '₿', description: 'BTC Market Analysis' },
    { name: 'Ethereum Report', path: '/ethereum-report', icon: Coins, emoji: '⟠', description: 'ETH & DeFi Insights' },
    { name: 'Whale Watch', path: '/whale-watch', icon: Fish, emoji: '🐋', description: 'Large Transaction Tracking' },
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
              
              {/* Logout Button */}
              {user && (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-all rounded flex items-center gap-2 text-bitcoin-white-60 hover:text-bitcoin-orange hover:border-b-2 hover:border-bitcoin-orange ml-4"
                  title={`Logout (${user.email})`}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden xl:inline">Logout</span>
                </button>
              )}
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

            {/* Menu Button - Mobile Optimized */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-bitcoin-orange text-bitcoin-black px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-bitcoin-white transition-all hover:shadow-[0_0_20px_rgba(247,147,26,0.5)] active:scale-95 min-h-[48px] flex items-center gap-2"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <>
                  <X className="h-5 w-5" strokeWidth={2.5} />
                  <span>Close</span>
                </>
              ) : (
                <>
                  <Menu className="h-5 w-5" strokeWidth={2.5} />
                  <span>Menu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile/Tablet Full-Screen Menu Overlay - Enhanced with Smooth Transitions */}
      {isMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-[9999] bg-bitcoin-black overflow-y-auto animate-fade-in"
          style={{
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          {/* Header with Close Button */}
          <div className="border-b-2 border-bitcoin-orange bg-bitcoin-black sticky top-0 z-10 shadow-[0_0_20px_rgba(247,147,26,0.3)]">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-bitcoin-orange">₿</span>
                  <span className="text-lg font-bold text-bitcoin-white">Menu</span>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-bitcoin-orange hover:text-bitcoin-white transition-all duration-300 hover:scale-110 active:scale-95 min-h-[48px] min-w-[48px] flex items-center justify-center hover:rotate-90"
                  aria-label="Close menu"
                >
                  <X className="h-8 w-8" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          {/* Menu Items - Enhanced with Proper Spacing and Hover States */}
          <div className="container mx-auto px-4 py-6">
            <div className="space-y-4">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block transition-all duration-300 rounded-xl ${
                      active
                        ? 'bg-bitcoin-orange text-bitcoin-black border-2 border-bitcoin-orange shadow-[0_0_30px_rgba(247,147,26,0.5)]'
                        : 'bg-bitcoin-black text-bitcoin-white border border-bitcoin-orange-20 hover:border-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.3)]'
                    }`}
                    style={{
                      animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`,
                    }}
                  >
                    <div className="p-4 flex items-center gap-4 min-h-[80px]">
                      {/* Icon - Enhanced with Animation */}
                      <div className={`flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        active 
                          ? 'bg-bitcoin-black text-bitcoin-orange scale-110' 
                          : 'bg-bitcoin-black border-2 border-bitcoin-orange-20 text-bitcoin-orange hover:border-bitcoin-orange hover:scale-105'
                      }`}>
                        <IconComponent className="h-7 w-7" strokeWidth={2.5} />
                      </div>
                      
                      {/* Content - Enhanced Typography */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-lg tracking-tight ${
                          active ? 'text-bitcoin-black' : 'text-bitcoin-white'
                        }`}>
                          {item.name}
                        </div>
                        <div className={`text-sm mt-1 ${
                          active ? 'text-bitcoin-black opacity-80' : 'text-bitcoin-white-60'
                        }`}>
                          {item.description}
                        </div>
                      </div>

                      {/* Arrow - Enhanced with Animation */}
                      <div className={`flex-shrink-0 transition-transform duration-300 ${
                        active ? 'text-bitcoin-black translate-x-1' : 'text-bitcoin-orange group-hover:translate-x-1'
                      }`}>
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
              
              {/* Logout Button - Mobile Menu */}
              {user && (
                <button
                  onClick={handleLogout}
                  className="block w-full transition-all duration-300 rounded-xl bg-bitcoin-black text-bitcoin-white border border-bitcoin-orange-20 hover:border-bitcoin-orange hover:shadow-[0_0_20px_rgba(247,147,26,0.3)]"
                >
                  <div className="p-4 flex items-center gap-4 min-h-[80px]">
                    <div className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center bg-bitcoin-black border-2 border-bitcoin-orange-20 text-bitcoin-orange hover:border-bitcoin-orange hover:scale-105 transition-all duration-300">
                      <LogOut className="h-7 w-7" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-bold text-lg tracking-tight text-bitcoin-white">
                        Logout
                      </div>
                      <div className="text-sm mt-1 text-bitcoin-white-60 truncate">
                        {user.email}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-bitcoin-orange">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Footer - Enhanced with Better Spacing */}
          <div className="border-t-2 border-bitcoin-orange mt-8 bg-bitcoin-black">
            <div className="container mx-auto px-4 py-8">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <span className="text-3xl font-bold text-bitcoin-orange">₿</span>
                  <span className="text-xl font-bold text-bitcoin-white">Bitcoin Sovereign</span>
                </div>
                <p className="text-sm text-bitcoin-white-60 mb-4">
                  Real-Time Market Intelligence Platform
                </p>
                <div className="flex items-center justify-center gap-3 text-xs text-bitcoin-white-60">
                  <span className="flex items-center gap-1">
                    <span className="text-bitcoin-orange">⚡</span> Live Data
                  </span>
                  <span className="text-bitcoin-orange-20">•</span>
                  <span className="flex items-center gap-1">
                    <span className="text-bitcoin-orange">🧠</span> AI Powered
                  </span>
                  <span className="text-bitcoin-orange-20">•</span>
                  <span className="flex items-center gap-1">
                    <span className="text-bitcoin-orange">🔒</span> Privacy First
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

Navigation.displayName = 'Navigation';

export default Navigation;
