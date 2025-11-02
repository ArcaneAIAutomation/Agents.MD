/**
 * Accessibility utilities for UCIE
 * Ensures WCAG 2.1 AA compliance
 */

/**
 * Calculate contrast ratio between two colors
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG AA standards
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? 3 : 4.5;
  return ratio >= requiredRatio;
}

/**
 * Check if color combination meets WCAG AAA standards
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? 4.5 : 7;
  return ratio >= requiredRatio;
}

/**
 * Generate ARIA label for data values
 */
export function generateAriaLabel(label: string, value: string | number, unit?: string): string {
  const valueStr = typeof value === 'number' ? value.toLocaleString() : value;
  return unit ? `${label}: ${valueStr} ${unit}` : `${label}: ${valueStr}`;
}

/**
 * Generate ARIA description for charts
 */
export function generateChartAriaDescription(
  chartType: string,
  dataPoints: number,
  trend: 'up' | 'down' | 'stable',
  range?: { min: number; max: number }
): string {
  let description = `${chartType} chart with ${dataPoints} data points showing a ${trend} trend.`;
  
  if (range) {
    description += ` Values range from ${range.min.toLocaleString()} to ${range.max.toLocaleString()}.`;
  }
  
  return description;
}

/**
 * Keyboard navigation helper
 */
export class KeyboardNavigationManager {
  private focusableElements: HTMLElement[] = [];
  private currentIndex: number = -1;

  constructor(containerSelector: string) {
    this.updateFocusableElements(containerSelector);
  }

  updateFocusableElements(containerSelector: string) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.focusableElements = Array.from(container.querySelectorAll(selector)) as HTMLElement[];
    this.currentIndex = -1;
  }

  focusNext(): boolean {
    if (this.focusableElements.length === 0) return false;
    
    this.currentIndex = (this.currentIndex + 1) % this.focusableElements.length;
    this.focusableElements[this.currentIndex]?.focus();
    return true;
  }

  focusPrevious(): boolean {
    if (this.focusableElements.length === 0) return false;
    
    this.currentIndex = this.currentIndex <= 0 
      ? this.focusableElements.length - 1 
      : this.currentIndex - 1;
    this.focusableElements[this.currentIndex]?.focus();
    return true;
  }

  focusFirst(): boolean {
    if (this.focusableElements.length === 0) return false;
    
    this.currentIndex = 0;
    this.focusableElements[0]?.focus();
    return true;
  }

  focusLast(): boolean {
    if (this.focusableElements.length === 0) return false;
    
    this.currentIndex = this.focusableElements.length - 1;
    this.focusableElements[this.currentIndex]?.focus();
    return true;
  }
}

/**
 * Screen reader announcement helper
 */
export class ScreenReaderAnnouncer {
  private liveRegion: HTMLElement | null = null;

  constructor() {
    this.createLiveRegion();
  }

  private createLiveRegion() {
    if (typeof document === 'undefined') return;

    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    this.liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(this.liveRegion);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
      }
    }, 1000);
  }

  destroy() {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
      this.liveRegion = null;
    }
  }
}

/**
 * Focus trap for modals and overlays
 */
export class FocusTrap {
  private container: HTMLElement;
  private previousFocus: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];

  constructor(containerSelector: string) {
    const container = document.querySelector(containerSelector);
    if (!container) throw new Error(`Container not found: ${containerSelector}`);
    
    this.container = container as HTMLElement;
    this.updateFocusableElements();
  }

  private updateFocusableElements() {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.focusableElements = Array.from(
      this.container.querySelectorAll(selector)
    ) as HTMLElement[];
  }

  activate() {
    this.previousFocus = document.activeElement as HTMLElement;
    this.updateFocusableElements();

    // Focus first element
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }

    // Add event listener for tab key
    this.container.addEventListener('keydown', this.handleKeyDown);
  }

  deactivate() {
    this.container.removeEventListener('keydown', this.handleKeyDown);
    
    // Restore previous focus
    if (this.previousFocus) {
      this.previousFocus.focus();
    }
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };
}

/**
 * Skip link helper for keyboard navigation
 */
export function createSkipLink(targetId: string, label: string = 'Skip to main content'): HTMLElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = label;
  skipLink.className = 'skip-link';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--bitcoin-orange);
    color: var(--bitcoin-black);
    padding: 8px 16px;
    text-decoration: none;
    font-weight: bold;
    z-index: 100;
  `;

  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });

  return skipLink;
}

/**
 * Validate accessibility of a component
 */
export interface AccessibilityIssue {
  type: 'error' | 'warning';
  message: string;
  element?: HTMLElement;
}

export function validateAccessibility(container: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for images without alt text
  const images = container.querySelectorAll('img');
  images.forEach(img => {
    if (!img.hasAttribute('alt')) {
      issues.push({
        type: 'error',
        message: 'Image missing alt attribute',
        element: img as HTMLElement
      });
    }
  });

  // Check for buttons without accessible names
  const buttons = container.querySelectorAll('button');
  buttons.forEach(button => {
    const hasText = button.textContent?.trim();
    const hasAriaLabel = button.hasAttribute('aria-label');
    const hasAriaLabelledBy = button.hasAttribute('aria-labelledby');
    
    if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push({
        type: 'error',
        message: 'Button missing accessible name',
        element: button as HTMLElement
      });
    }
  });

  // Check for form inputs without labels
  const inputs = container.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    const hasLabel = input.hasAttribute('aria-label') || 
                     input.hasAttribute('aria-labelledby') ||
                     container.querySelector(`label[for="${input.id}"]`);
    
    if (!hasLabel) {
      issues.push({
        type: 'error',
        message: 'Form input missing label',
        element: input as HTMLElement
      });
    }
  });

  // Check for proper heading hierarchy
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let previousLevel = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.substring(1));
    if (level - previousLevel > 1) {
      issues.push({
        type: 'warning',
        message: `Heading level skipped from h${previousLevel} to h${level}`,
        element: heading as HTMLElement
      });
    }
    previousLevel = level;
  });

  return issues;
}
