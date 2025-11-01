/**
 * CSS Validation and Error Prevention Utility
 * Bitcoin Sovereign Technology Design System
 * 
 * This utility provides runtime validation for Bitcoin Sovereign color compliance
 * and automatic fallbacks for invalid color combinations.
 */

// ============================================
// BITCOIN SOVEREIGN COLOR PALETTE
// ============================================

export const BITCOIN_COLORS = {
  BLACK: '#000000',
  ORANGE: '#F7931A',
  WHITE: '#FFFFFF',
  
  // Orange opacity variants
  ORANGE_5: 'rgba(247, 147, 26, 0.05)',
  ORANGE_10: 'rgba(247, 147, 26, 0.1)',
  ORANGE_20: 'rgba(247, 147, 26, 0.2)',
  ORANGE_30: 'rgba(247, 147, 26, 0.3)',
  ORANGE_50: 'rgba(247, 147, 26, 0.5)',
  ORANGE_80: 'rgba(247, 147, 26, 0.8)',
  
  // White opacity variants
  WHITE_60: 'rgba(255, 255, 255, 0.6)',
  WHITE_80: 'rgba(255, 255, 255, 0.8)',
  WHITE_90: 'rgba(255, 255, 255, 0.9)',
} as const;

// ============================================
// FORBIDDEN COLORS
// ============================================

export const FORBIDDEN_COLORS = [
  // Greens
  'green', '#00d4aa', '#059669', '#10b981', '#34d399', '#6ee7b7',
  // Reds
  'red', '#ff6b6b', '#dc2626', '#ef4444', '#f87171', '#fca5a5',
  // Blues
  'blue', '#1e4dd8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
  // Purples
  'purple', '#8b5cf6', '#a78bfa', '#c4b5fd',
  // Yellows (except orange)
  'yellow', '#fbbf24', '#fcd34d',
  // Grays (except as opacity of white/black)
  'gray', 'grey', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb',
];

// ============================================
// COLOR VALIDATION
// ============================================

/**
 * Check if a color is a valid Bitcoin Sovereign color
 */
export function isValidBitcoinColor(color: string): boolean {
  if (!color) return false;
  
  const normalizedColor = color.toLowerCase().trim();
  
  // Check if it's one of the allowed colors
  const allowedColors = Object.values(BITCOIN_COLORS).map(c => c.toLowerCase());
  if (allowedColors.includes(normalizedColor)) {
    return true;
  }
  
  // Check if it's a CSS variable
  if (normalizedColor.includes('--bitcoin-')) {
    return true;
  }
  
  // Check if it's transparent (allowed)
  if (normalizedColor === 'transparent' || normalizedColor === 'rgba(0, 0, 0, 0)') {
    return true;
  }
  
  return false;
}

/**
 * Check if a color is forbidden
 */
export function isForbiddenColor(color: string): boolean {
  if (!color) return false;
  
  const normalizedColor = color.toLowerCase().trim();
  
  return FORBIDDEN_COLORS.some(forbidden => 
    normalizedColor.includes(forbidden.toLowerCase())
  );
}

/**
 * Validate color combination for contrast
 */
export function validateColorContrast(
  textColor: string,
  backgroundColor: string
): { valid: boolean; ratio: number; level: 'AAA' | 'AA' | 'FAIL' } {
  // Known contrast ratios for Bitcoin Sovereign colors
  const contrastRatios: Record<string, number> = {
    'white-black': 21,
    'white80-black': 16.8,
    'white60-black': 12.6,
    'orange-black': 5.8,
    'black-orange': 5.8,
  };
  
  const key = `${textColor}-${backgroundColor}`.toLowerCase();
  const ratio = contrastRatios[key] || 0;
  
  let level: 'AAA' | 'AA' | 'FAIL' = 'FAIL';
  if (ratio >= 7) level = 'AAA';
  else if (ratio >= 4.5) level = 'AA';
  
  return {
    valid: ratio >= 4.5,
    ratio,
    level,
  };
}

// ============================================
// RUNTIME VALIDATION (DEVELOPMENT ONLY)
// ============================================

/**
 * Validate all elements on the page for Bitcoin Sovereign compliance
 * Only runs in development mode
 */
export function validatePageColors(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const violations: Array<{
    element: Element;
    property: string;
    value: string;
    reason: string;
  }> = [];
  
  // Get all elements
  const elements = document.querySelectorAll('*');
  
  elements.forEach(element => {
    const computed = window.getComputedStyle(element);
    
    // Check background color
    const bgColor = computed.backgroundColor;
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && !isValidBitcoinColor(bgColor)) {
      if (isForbiddenColor(bgColor)) {
        violations.push({
          element,
          property: 'background-color',
          value: bgColor,
          reason: 'Forbidden color detected',
        });
      }
    }
    
    // Check text color
    const textColor = computed.color;
    if (textColor && !isValidBitcoinColor(textColor)) {
      if (isForbiddenColor(textColor)) {
        violations.push({
          element,
          property: 'color',
          value: textColor,
          reason: 'Forbidden color detected',
        });
      }
    }
    
    // Check border color
    const borderColor = computed.borderColor;
    if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)' && !isValidBitcoinColor(borderColor)) {
      if (isForbiddenColor(borderColor)) {
        violations.push({
          element,
          property: 'border-color',
          value: borderColor,
          reason: 'Forbidden color detected',
        });
      }
    }
  });
  
  // Log violations
  if (violations.length > 0) {
    console.group('🚨 Bitcoin Sovereign Color Violations Detected');
    console.warn(`Found ${violations.length} color violations:`);
    violations.forEach(({ element, property, value, reason }) => {
      console.warn(`Element:`, element);
      console.warn(`Property: ${property}`);
      console.warn(`Value: ${value}`);
      console.warn(`Reason: ${reason}`);
      console.warn('---');
    });
    console.groupEnd();
  } else {
    console.log('✅ All colors are Bitcoin Sovereign compliant');
  }
}

/**
 * Watch for DOM mutations and validate new elements
 */
export function watchForColorViolations(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const computed = window.getComputedStyle(element);
          
          // Check for violations
          const bgColor = computed.backgroundColor;
          const textColor = computed.color;
          const borderColor = computed.borderColor;
          
          if (isForbiddenColor(bgColor) || isForbiddenColor(textColor) || isForbiddenColor(borderColor)) {
            console.warn('🚨 Color violation in newly added element:', element);
            console.warn('Background:', bgColor);
            console.warn('Text:', textColor);
            console.warn('Border:', borderColor);
          }
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// ============================================
// AUTOMATIC FALLBACKS
// ============================================

/**
 * Apply automatic fallbacks for invalid color combinations
 */
export function applyColorFallbacks(): void {
  if (typeof window === 'undefined') return;
  
  const elements = document.querySelectorAll('*');
  
  elements.forEach(element => {
    const computed = window.getComputedStyle(element);
    const bgColor = computed.backgroundColor;
    const textColor = computed.color;
    
    // Check for white-on-white
    if (isWhiteColor(bgColor) && isWhiteColor(textColor)) {
      console.warn('⚠️ White-on-white detected, applying fallback:', element);
      (element as HTMLElement).style.color = BITCOIN_COLORS.BLACK;
    }
    
    // Check for black-on-black
    if (isBlackColor(bgColor) && isBlackColor(textColor)) {
      console.warn('⚠️ Black-on-black detected, applying fallback:', element);
      (element as HTMLElement).style.color = BITCOIN_COLORS.WHITE;
    }
    
    // Check for orange-on-orange
    if (isOrangeColor(bgColor) && isOrangeColor(textColor)) {
      console.warn('⚠️ Orange-on-orange detected, applying fallback:', element);
      (element as HTMLElement).style.color = BITCOIN_COLORS.BLACK;
    }
  });
}

// ============================================
// COLOR DETECTION HELPERS
// ============================================

function isWhiteColor(color: string): boolean {
  const normalized = color.toLowerCase().trim();
  return (
    normalized === '#ffffff' ||
    normalized === 'rgb(255, 255, 255)' ||
    normalized === 'white' ||
    normalized.startsWith('rgba(255, 255, 255')
  );
}

function isBlackColor(color: string): boolean {
  const normalized = color.toLowerCase().trim();
  return (
    normalized === '#000000' ||
    normalized === 'rgb(0, 0, 0)' ||
    normalized === 'black' ||
    normalized.startsWith('rgba(0, 0, 0')
  );
}

function isOrangeColor(color: string): boolean {
  const normalized = color.toLowerCase().trim();
  return (
    normalized === '#f7931a' ||
    normalized === 'rgb(247, 147, 26)' ||
    normalized.startsWith('rgba(247, 147, 26')
  );
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize CSS validation system
 * Call this once when the app loads
 */
export function initCSSValidation(): void {
  if (typeof window === 'undefined') return;
  
  // Only run in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🎨 Bitcoin Sovereign CSS Validation System Initialized');
    
    // Validate on load
    if (document.readyState === 'complete') {
      validatePageColors();
      watchForColorViolations();
    } else {
      window.addEventListener('load', () => {
        validatePageColors();
        watchForColorViolations();
      });
    }
  }
  
  // Apply fallbacks in all environments
  if (document.readyState === 'complete') {
    applyColorFallbacks();
  } else {
    window.addEventListener('load', applyColorFallbacks);
  }
}

// ============================================
// EXPORT VALIDATION FUNCTIONS
// ============================================

export default {
  BITCOIN_COLORS,
  FORBIDDEN_COLORS,
  isValidBitcoinColor,
  isForbiddenColor,
  validateColorContrast,
  validatePageColors,
  watchForColorViolations,
  applyColorFallbacks,
  initCSSValidation,
};
