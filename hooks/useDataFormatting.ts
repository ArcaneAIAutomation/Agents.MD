/**
 * React Hook for Data Formatting
 * Task 12.11: Fix Data Formatting and Alignment
 * 
 * Provides formatting functions with mobile/tablet awareness
 */

import { useMemo } from 'react';
import {
  formatPrice,
  formatNumber,
  formatPercentage,
  truncateAddress,
  formatDateTime,
  truncateTxHash,
  formatVolume,
  formatMarketCap,
  truncateText,
  formatConfidence,
  formatRiskRewardRatio,
  formatBTC,
  formatETH,
  formatResponsive,
} from '../utils/dataFormatting';

/**
 * Hook to detect if device is mobile/tablet
 */
export function useIsMobile(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return useMemo(() => {
    return window.innerWidth < 1024;
  }, []);
}

/**
 * Hook for responsive data formatting
 * Automatically uses compact format on mobile devices
 */
export function useDataFormatting() {
  const isMobile = useIsMobile();

  return useMemo(() => ({
    // Price formatting
    formatPrice: (price: number | string | null | undefined, compact?: boolean) => 
      formatPrice(price, { compact: compact ?? isMobile }),
    
    // Number formatting
    formatNumber: (value: number | string | null | undefined, compact?: boolean) => 
      formatNumber(value, { compact: compact ?? isMobile }),
    
    // Percentage formatting
    formatPercentage: (percentage: number | string | null | undefined, showSign: boolean = true) => 
      formatPercentage(percentage, { showSign }),
    
    // Address truncation
    truncateAddress: (address: string | null | undefined, startChars?: number, endChars?: number) => 
      truncateAddress(address, { startChars, endChars }),
    
    // Date/time formatting
    formatDateTime: (date: Date | number | string | null | undefined, format?: 'full' | 'date' | 'time' | 'relative') => 
      formatDateTime(date, { format }),
    
    // Transaction hash truncation
    truncateTxHash: (txHash: string | null | undefined) => 
      truncateTxHash(txHash),
    
    // Volume formatting
    formatVolume: (volume: number | string | null | undefined) => 
      formatVolume(volume),
    
    // Market cap formatting
    formatMarketCap: (marketCap: number | string | null | undefined) => 
      formatMarketCap(marketCap),
    
    // Text truncation
    truncateText: (text: string | null | undefined, maxLength?: number) => 
      truncateText(text, maxLength),
    
    // Confidence score formatting
    formatConfidence: (confidence: number | string | null | undefined) => 
      formatConfidence(confidence),
    
    // Risk/reward ratio formatting
    formatRiskRewardRatio: (ratio: number | string | null | undefined) => 
      formatRiskRewardRatio(ratio),
    
    // BTC amount formatting
    formatBTC: (amount: number | string | null | undefined) => 
      formatBTC(amount),
    
    // ETH amount formatting
    formatETH: (amount: number | string | null | undefined) => 
      formatETH(amount),
    
    // Responsive formatting
    formatResponsive: (value: number | string | null | undefined, type: 'price' | 'number' | 'volume' | 'marketCap') => 
      formatResponsive(value, type, isMobile),
    
    // Mobile detection
    isMobile,
  }), [isMobile]);
}

/**
 * Hook for table cell formatting
 * Provides consistent formatting for table cells
 */
export function useTableFormatting() {
  const { formatPrice, formatNumber, formatPercentage, truncateAddress, formatDateTime } = useDataFormatting();

  return useMemo(() => ({
    // Format price cell
    formatPriceCell: (price: number | string | null | undefined) => ({
      value: formatPrice(price),
      className: 'table-cell-price',
    }),
    
    // Format number cell
    formatNumberCell: (value: number | string | null | undefined) => ({
      value: formatNumber(value),
      className: 'table-cell-number',
    }),
    
    // Format percentage cell
    formatPercentageCell: (percentage: number | string | null | undefined) => {
      const formatted = formatPercentage(percentage);
      const numPercentage = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
      const className = numPercentage && numPercentage > 0 
        ? 'table-cell-number percentage-positive' 
        : 'table-cell-number percentage-negative';
      
      return {
        value: formatted,
        className,
      };
    },
    
    // Format address cell
    formatAddressCell: (address: string | null | undefined) => ({
      value: truncateAddress(address),
      className: 'table-cell-text address-truncated',
      title: address || undefined, // Full address on hover
    }),
    
    // Format date cell
    formatDateCell: (date: Date | number | string | null | undefined) => ({
      value: formatDateTime(date, { format: 'date' }),
      className: 'table-cell-text datetime-display',
    }),
    
    // Format datetime cell
    formatDateTimeCell: (date: Date | number | string | null | undefined) => ({
      value: formatDateTime(date, { format: 'full' }),
      className: 'table-cell-text datetime-display-full',
    }),
  }), [formatPrice, formatNumber, formatPercentage, truncateAddress, formatDateTime]);
}

/**
 * Hook for chart formatting
 * Provides consistent formatting for chart labels and tooltips
 */
export function useChartFormatting() {
  const { formatPrice, formatNumber, formatDateTime } = useDataFormatting();

  return useMemo(() => ({
    // Format axis label
    formatAxisLabel: (value: number | string) => {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) return String(value);
      
      // Compact format for axis labels
      if (numValue >= 1_000_000) {
        return `$${(numValue / 1_000_000).toFixed(1)}M`;
      }
      if (numValue >= 1_000) {
        return `$${(numValue / 1_000).toFixed(1)}K`;
      }
      return `$${numValue.toFixed(0)}`;
    },
    
    // Format tooltip value
    formatTooltipValue: (value: number | string | null | undefined, type: 'price' | 'number' = 'price') => {
      if (type === 'price') {
        return formatPrice(value);
      }
      return formatNumber(value);
    },
    
    // Format tooltip label
    formatTooltipLabel: (date: Date | number | string | null | undefined) => {
      return formatDateTime(date, { format: 'full' });
    },
  }), [formatPrice, formatNumber, formatDateTime]);
}

/**
 * Hook for stat card formatting
 * Provides consistent formatting for stat cards
 */
export function useStatCardFormatting() {
  const { formatPrice, formatNumber, formatPercentage, formatVolume, formatMarketCap } = useDataFormatting();

  return useMemo(() => ({
    // Format price stat
    formatPriceStat: (price: number | string | null | undefined) => ({
      value: formatPrice(price),
      className: 'stat-card-value stat-card-value-orange',
    }),
    
    // Format number stat
    formatNumberStat: (value: number | string | null | undefined) => ({
      value: formatNumber(value),
      className: 'stat-card-value',
    }),
    
    // Format percentage stat
    formatPercentageStat: (percentage: number | string | null | undefined) => {
      const formatted = formatPercentage(percentage);
      const numPercentage = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
      const className = numPercentage && numPercentage > 0 
        ? 'stat-card-value percentage-positive' 
        : 'stat-card-value percentage-negative';
      
      return {
        value: formatted,
        className,
      };
    },
    
    // Format volume stat
    formatVolumeStat: (volume: number | string | null | undefined) => ({
      value: formatVolume(volume),
      className: 'stat-card-value stat-card-value-orange',
    }),
    
    // Format market cap stat
    formatMarketCapStat: (marketCap: number | string | null | undefined) => ({
      value: formatMarketCap(marketCap),
      className: 'stat-card-value stat-card-value-orange',
    }),
  }), [formatPrice, formatNumber, formatPercentage, formatVolume, formatMarketCap]);
}

export default useDataFormatting;
