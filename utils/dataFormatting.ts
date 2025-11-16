/**
 * Data Formatting Utilities for Mobile/Tablet Display
 * Ensures all visual data is properly formatted, scaled, and aligned
 * 
 * Task 12.11: Fix Data Formatting and Alignment
 */

/**
 * Format price with proper currency formatting
 * Handles large numbers with commas and proper decimal places
 * 
 * @param price - The price value to format
 * @param options - Optional formatting options
 * @returns Formatted price string (e.g., "$1,234,567.89")
 */
export function formatPrice(
  price: number | string | null | undefined,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    compact?: boolean; // For mobile: $1.23M instead of $1,234,567.89
  }
): string {
  if (price === null || price === undefined || price === '') {
    return 'N/A';
  }

  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return 'N/A';
  }

  // Compact format for mobile (e.g., $1.23M)
  if (options?.compact) {
    if (numPrice >= 1_000_000_000) {
      return `$${(numPrice / 1_000_000_000).toFixed(2)}B`;
    }
    if (numPrice >= 1_000_000) {
      return `$${(numPrice / 1_000_000).toFixed(2)}M`;
    }
    if (numPrice >= 1_000) {
      return `$${(numPrice / 1_000).toFixed(2)}K`;
    }
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(numPrice);
}

/**
 * Format large numbers with proper thousand separators
 * 
 * @param value - The number to format
 * @param options - Optional formatting options
 * @returns Formatted number string (e.g., "1,234,567")
 */
export function formatNumber(
  value: number | string | null | undefined,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    compact?: boolean;
  }
): string {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 'N/A';
  }

  // Compact format for mobile
  if (options?.compact) {
    if (numValue >= 1_000_000_000) {
      return `${(numValue / 1_000_000_000).toFixed(2)}B`;
    }
    if (numValue >= 1_000_000) {
      return `${(numValue / 1_000_000).toFixed(2)}M`;
    }
    if (numValue >= 1_000) {
      return `${(numValue / 1_000).toFixed(2)}K`;
    }
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(numValue);
}

/**
 * Format percentage with proper sign and decimal places
 * 
 * @param percentage - The percentage value to format
 * @param options - Optional formatting options
 * @returns Formatted percentage string (e.g., "+12.34%")
 */
export function formatPercentage(
  percentage: number | string | null | undefined,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSign?: boolean; // Always show + for positive values
  }
): string {
  if (percentage === null || percentage === undefined || percentage === '') {
    return 'N/A';
  }

  const numPercentage = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
  
  if (isNaN(numPercentage)) {
    return 'N/A';
  }

  const sign = options?.showSign !== false && numPercentage > 0 ? '+' : '';
  const formatted = numPercentage.toFixed(options?.maximumFractionDigits ?? 2);
  
  return `${sign}${formatted}%`;
}

/**
 * Truncate wallet address for display
 * Shows first and last characters with ellipsis in between
 * 
 * @param address - The wallet address to truncate
 * @param options - Optional truncation options
 * @returns Truncated address (e.g., "0x1234...5678")
 */
export function truncateAddress(
  address: string | null | undefined,
  options?: {
    startChars?: number; // Number of characters to show at start (default: 6)
    endChars?: number;   // Number of characters to show at end (default: 4)
    ellipsis?: string;   // Ellipsis character (default: "...")
  }
): string {
  if (!address || typeof address !== 'string') {
    return 'N/A';
  }

  const startChars = options?.startChars ?? 6;
  const endChars = options?.endChars ?? 4;
  const ellipsis = options?.ellipsis ?? '...';

  // If address is short enough, return as-is
  if (address.length <= startChars + endChars + ellipsis.length) {
    return address;
  }

  return `${address.slice(0, startChars)}${ellipsis}${address.slice(-endChars)}`;
}

/**
 * Format date/time consistently across the application
 * 
 * @param date - The date to format (Date object, timestamp, or ISO string)
 * @param options - Optional formatting options
 * @returns Formatted date string
 */
export function formatDateTime(
  date: Date | number | string | null | undefined,
  options?: {
    format?: 'full' | 'date' | 'time' | 'relative'; // Format type
    locale?: string; // Locale for formatting (default: 'en-US')
  }
): string {
  if (!date) {
    return 'N/A';
  }

  let dateObj: Date;
  
  try {
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      return 'N/A';
    }

    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
  } catch (error) {
    return 'N/A';
  }

  const locale = options?.locale ?? 'en-US';
  const format = options?.format ?? 'full';

  switch (format) {
    case 'date':
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    
    case 'time':
      return dateObj.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });
    
    case 'relative':
      return formatRelativeTime(dateObj);
    
    case 'full':
    default:
      return dateObj.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "just now")
 * 
 * @param date - The date to format
 * @returns Relative time string
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

/**
 * Format transaction hash for display
 * Similar to address truncation but optimized for transaction hashes
 * 
 * @param txHash - The transaction hash to truncate
 * @param options - Optional truncation options
 * @returns Truncated transaction hash
 */
export function truncateTxHash(
  txHash: string | null | undefined,
  options?: {
    startChars?: number;
    endChars?: number;
  }
): string {
  return truncateAddress(txHash, {
    startChars: options?.startChars ?? 8,
    endChars: options?.endChars ?? 6,
  });
}

/**
 * Format volume with appropriate units (K, M, B)
 * 
 * @param volume - The volume value to format
 * @returns Formatted volume string
 */
export function formatVolume(
  volume: number | string | null | undefined
): string {
  if (volume === null || volume === undefined || volume === '') {
    return 'N/A';
  }

  const numVolume = typeof volume === 'string' ? parseFloat(volume) : volume;
  
  if (isNaN(numVolume)) {
    return 'N/A';
  }

  if (numVolume >= 1_000_000_000) {
    return `$${(numVolume / 1_000_000_000).toFixed(2)}B`;
  }
  if (numVolume >= 1_000_000) {
    return `$${(numVolume / 1_000_000).toFixed(2)}M`;
  }
  if (numVolume >= 1_000) {
    return `$${(numVolume / 1_000).toFixed(2)}K`;
  }

  return `$${numVolume.toFixed(2)}`;
}

/**
 * Format market cap with appropriate units
 * 
 * @param marketCap - The market cap value to format
 * @returns Formatted market cap string
 */
export function formatMarketCap(
  marketCap: number | string | null | undefined
): string {
  return formatVolume(marketCap);
}

/**
 * Ensure text fits within container by truncating with ellipsis
 * 
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number = 50
): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

/**
 * Format confidence score as percentage
 * 
 * @param confidence - Confidence value (0-1 or 0-100)
 * @returns Formatted confidence string
 */
export function formatConfidence(
  confidence: number | string | null | undefined
): string {
  if (confidence === null || confidence === undefined || confidence === '') {
    return 'N/A';
  }

  const numConfidence = typeof confidence === 'string' ? parseFloat(confidence) : confidence;
  
  if (isNaN(numConfidence)) {
    return 'N/A';
  }

  // If value is between 0 and 1, convert to percentage
  const percentage = numConfidence <= 1 ? numConfidence * 100 : numConfidence;
  
  return `${percentage.toFixed(0)}%`;
}

/**
 * Format risk/reward ratio
 * 
 * @param ratio - The risk/reward ratio value
 * @returns Formatted ratio string (e.g., "1:3")
 */
export function formatRiskRewardRatio(
  ratio: number | string | null | undefined
): string {
  if (ratio === null || ratio === undefined || ratio === '') {
    return 'N/A';
  }

  const numRatio = typeof ratio === 'string' ? parseFloat(ratio) : ratio;
  
  if (isNaN(numRatio)) {
    return 'N/A';
  }

  return `1:${numRatio.toFixed(2)}`;
}

/**
 * Format BTC amount with proper decimal places
 * 
 * @param amount - BTC amount
 * @returns Formatted BTC string
 */
export function formatBTC(
  amount: number | string | null | undefined
): string {
  if (amount === null || amount === undefined || amount === '') {
    return 'N/A';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return 'N/A';
  }

  return `${numAmount.toFixed(8)} BTC`;
}

/**
 * Format ETH amount with proper decimal places
 * 
 * @param amount - ETH amount
 * @returns Formatted ETH string
 */
export function formatETH(
  amount: number | string | null | undefined
): string {
  if (amount === null || amount === undefined || amount === '') {
    return 'N/A';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return 'N/A';
  }

  return `${numAmount.toFixed(6)} ETH`;
}

/**
 * Responsive formatting based on screen width
 * Returns compact format on mobile, full format on desktop
 * 
 * @param value - Value to format
 * @param type - Type of value ('price', 'number', 'volume')
 * @param isMobile - Whether to use mobile formatting
 * @returns Formatted string
 */
export function formatResponsive(
  value: number | string | null | undefined,
  type: 'price' | 'number' | 'volume' | 'marketCap',
  isMobile: boolean = false
): string {
  switch (type) {
    case 'price':
      return formatPrice(value, { compact: isMobile });
    case 'number':
      return formatNumber(value, { compact: isMobile });
    case 'volume':
      return formatVolume(value);
    case 'marketCap':
      return formatMarketCap(value);
    default:
      return String(value ?? 'N/A');
  }
}
