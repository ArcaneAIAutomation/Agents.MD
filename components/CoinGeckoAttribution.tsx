/**
 * CoinGecko Attribution Component
 * 
 * Required by CoinGecko API Terms of Service
 * Must be displayed wherever CoinGecko data is shown
 * 
 * Reference: https://brand.coingecko.com/resources/attribution-guide
 */

import React from 'react';

interface CoinGeckoAttributionProps {
  variant?: 'full' | 'compact' | 'text-only';
  className?: string;
  dataType?: 'price' | 'market' | 'onchain';
}

export default function CoinGeckoAttribution({ 
  variant = 'full',
  className = '',
  dataType = 'price'
}: CoinGeckoAttributionProps) {
  
  const getAttributionText = () => {
    switch (dataType) {
      case 'onchain':
        return 'On-chain data provided by';
      case 'market':
        return 'Market data provided by';
      case 'price':
      default:
        return 'Price data provided by';
    }
  };

  // Text-only attribution (minimal)
  if (variant === 'text-only') {
    return (
      <div className={`text-xs text-bitcoin-white-60 ${className}`}>
        <a 
          href="https://www.coingecko.com?utm_source=bitcoin-sovereign-tech&utm_medium=referral"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-bitcoin-orange transition-colors"
        >
          Data provided by CoinGecko
        </a>
      </div>
    );
  }

  // Compact attribution (logo only)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs text-bitcoin-white-60 font-inter">
          {getAttributionText()}
        </span>
        <a 
          href="https://www.coingecko.com?utm_source=bitcoin-sovereign-tech&utm_medium=referral"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center hover:opacity-80 transition-opacity"
          aria-label="CoinGecko - Cryptocurrency Data"
        >
          <svg 
            width="80" 
            height="20" 
            viewBox="0 0 276 60" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-auto"
          >
            <path d="M30 0C13.4315 0 0 13.4315 0 30C0 46.5685 13.4315 60 30 60C46.5685 60 60 46.5685 60 30C60 13.4315 46.5685 0 30 0Z" fill="#8DC63F"/>
            <path d="M30 15C21.7157 15 15 21.7157 15 30C15 38.2843 21.7157 45 30 45C38.2843 45 45 38.2843 45 30C45 21.7157 38.2843 15 30 15Z" fill="white"/>
            <circle cx="25" cy="27" r="3" fill="#8DC63F"/>
            <circle cx="35" cy="27" r="3" fill="#8DC63F"/>
            <path d="M25 35C25 35 27.5 37 30 37C32.5 37 35 35 35 35" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </a>
      </div>
    );
  }

  // Full attribution (logo + text)
  return (
    <div className={`flex items-center gap-2 bg-bitcoin-black border border-bitcoin-orange-20 rounded-lg px-3 py-2 ${className}`}>
      <span className="text-xs text-bitcoin-white-60 font-inter">
        {getAttributionText()}
      </span>
      <a 
        href="https://www.coingecko.com?utm_source=bitcoin-sovereign-tech&utm_medium=referral"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center hover:opacity-80 transition-opacity"
        aria-label="CoinGecko - Cryptocurrency Data"
      >
        <svg 
          width="100" 
          height="24" 
          viewBox="0 0 276 60" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-auto"
        >
          {/* CoinGecko Logo */}
          <path d="M30 0C13.4315 0 0 13.4315 0 30C0 46.5685 13.4315 60 30 60C46.5685 60 60 46.5685 60 30C60 13.4315 46.5685 0 30 0Z" fill="#8DC63F"/>
          <path d="M30 15C21.7157 15 15 21.7157 15 30C15 38.2843 21.7157 45 30 45C38.2843 45 45 38.2843 45 30C45 21.7157 38.2843 15 30 15Z" fill="white"/>
          <circle cx="25" cy="27" r="3" fill="#8DC63F"/>
          <circle cx="35" cy="27" r="3" fill="#8DC63F"/>
          <path d="M25 35C25 35 27.5 37 30 37C32.5 37 35 35 35 35" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round"/>
          
          {/* CoinGecko Text */}
          <text x="70" y="40" fill="#8DC63F" fontSize="24" fontFamily="Inter, sans-serif" fontWeight="700">
            CoinGecko
          </text>
        </svg>
      </a>
    </div>
  );
}

/**
 * Footer Attribution Component
 * For use in page footers or data source sections
 */
export function CoinGeckoFooterAttribution({ className = '' }: { className?: string }) {
  return (
    <div className={`text-center py-4 ${className}`}>
      <p className="text-xs text-bitcoin-white-60 mb-2">
        Cryptocurrency market data powered by
      </p>
      <a 
        href="https://www.coingecko.com?utm_source=bitcoin-sovereign-tech&utm_medium=referral"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
        aria-label="CoinGecko - Cryptocurrency Data"
      >
        <svg 
          width="120" 
          height="30" 
          viewBox="0 0 276 60" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-auto"
        >
          <path d="M30 0C13.4315 0 0 13.4315 0 30C0 46.5685 13.4315 60 30 60C46.5685 60 60 46.5685 60 30C60 13.4315 46.5685 0 30 0Z" fill="#8DC63F"/>
          <path d="M30 15C21.7157 15 15 21.7157 15 30C15 38.2843 21.7157 45 30 45C38.2843 45 45 38.2843 45 30C45 21.7157 38.2843 15 30 15Z" fill="white"/>
          <circle cx="25" cy="27" r="3" fill="#8DC63F"/>
          <circle cx="35" cy="27" r="3" fill="#8DC63F"/>
          <path d="M25 35C25 35 27.5 37 30 37C32.5 37 35 35 35 35" stroke="#8DC63F" strokeWidth="2" strokeLinecap="round"/>
          <text x="70" y="40" fill="#8DC63F" fontSize="24" fontFamily="Inter, sans-serif" fontWeight="700">
            CoinGecko
          </text>
        </svg>
      </a>
    </div>
  );
}

/**
 * Inline Attribution Component
 * For use inline with data displays
 */
export function CoinGeckoInlineAttribution({ className = '' }: { className?: string }) {
  return (
    <span className={`text-xs text-bitcoin-white-60 ${className}`}>
      via{' '}
      <a 
        href="https://www.coingecko.com?utm_source=bitcoin-sovereign-tech&utm_medium=referral"
        target="_blank"
        rel="noopener noreferrer"
        className="text-bitcoin-orange hover:underline"
      >
        CoinGecko
      </a>
    </span>
  );
}
