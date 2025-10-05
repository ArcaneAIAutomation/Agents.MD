import { useState, useEffect, useCallback } from 'react';

// Mobile viewport detection interface
interface MobileViewport {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  touchSupport: boolean;
  orientation: 'portrait' | 'landscape';
}

// Responsive breakpoints configuration
export const breakpoints = {
  mobile: 320,
  mobileLarge: 480,
  tablet: 768,
  desktop: 1024,
  desktopLarge: 1280
} as const;

// Device capability detection utilities
interface DeviceCapabilities {
  hasTouch: boolean;
  hasHover: boolean;
  prefersReducedMotion: boolean;
  supportsWebP: boolean;
  connectionType: string | null;
  deviceMemory: number | null;
}

/**
 * Hook for detecting mobile viewport and device capabilities
 * Provides real-time viewport information and device detection
 */
export function useMobileViewport(): MobileViewport {
  const [viewport, setViewport] = useState<MobileViewport>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1024,
    screenHeight: 768,
    devicePixelRatio: 1,
    touchSupport: false,
    orientation: 'landscape'
  });

  const updateViewport = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Detect device type based on screen width
    const isMobile = width < breakpoints.tablet;
    const isTablet = width >= breakpoints.tablet && width < breakpoints.desktop;
    const isDesktop = width >= breakpoints.desktop;
    
    // Detect touch support
    const touchSupport = 'ontouchstart' in window || 
                        navigator.maxTouchPoints > 0 || 
                        (navigator as any).msMaxTouchPoints > 0;
    
    // Detect orientation
    const orientation = width > height ? 'landscape' : 'portrait';

    setViewport({
      isMobile,
      isTablet,
      isDesktop,
      screenWidth: width,
      screenHeight: height,
      devicePixelRatio: pixelRatio,
      touchSupport,
      orientation
    });
  }, []);

  useEffect(() => {
    // Initial viewport detection
    updateViewport();

    // Listen for viewport changes
    const handleResize = () => updateViewport();
    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated after orientation change
      setTimeout(updateViewport, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateViewport]);

  return viewport;
}

/**
 * Hook for detecting device capabilities
 * Provides information about device features and performance characteristics
 */
export function useDeviceCapabilities(): DeviceCapabilities {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    hasTouch: false,
    hasHover: false,
    prefersReducedMotion: false,
    supportsWebP: false,
    connectionType: null,
    deviceMemory: null
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectCapabilities = async () => {
      // Touch detection
      const hasTouch = 'ontouchstart' in window || 
                      navigator.maxTouchPoints > 0 || 
                      (navigator as any).msMaxTouchPoints > 0;

      // Hover capability detection
      const hasHover = window.matchMedia('(hover: hover)').matches;

      // Reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // WebP support detection
      const supportsWebP = await new Promise<boolean>((resolve) => {
        const webP = new Image();
        webP.onload = webP.onerror = () => resolve(webP.height === 2);
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
      });

      // Network information (if available)
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      const connectionType = connection?.effectiveType || null;

      // Device memory (if available)
      const deviceMemory = (navigator as any).deviceMemory || null;

      setCapabilities({
        hasTouch,
        hasHover,
        prefersReducedMotion,
        supportsWebP,
        connectionType,
        deviceMemory
      });
    };

    detectCapabilities();
  }, []);

  return capabilities;
}

/**
 * Responsive breakpoint helper functions
 */
export const useResponsiveBreakpoints = () => {
  const viewport = useMobileViewport();

  return {
    isMobile: viewport.screenWidth < breakpoints.tablet,
    isMobileLarge: viewport.screenWidth >= breakpoints.mobileLarge && viewport.screenWidth < breakpoints.tablet,
    isTablet: viewport.screenWidth >= breakpoints.tablet && viewport.screenWidth < breakpoints.desktop,
    isDesktop: viewport.screenWidth >= breakpoints.desktop,
    isDesktopLarge: viewport.screenWidth >= breakpoints.desktopLarge,
    
    // Utility functions
    isAtLeast: (breakpoint: keyof typeof breakpoints) => viewport.screenWidth >= breakpoints[breakpoint],
    isBelow: (breakpoint: keyof typeof breakpoints) => viewport.screenWidth < breakpoints[breakpoint],
    isBetween: (min: keyof typeof breakpoints, max: keyof typeof breakpoints) => 
      viewport.screenWidth >= breakpoints[min] && viewport.screenWidth < breakpoints[max]
  };
};

/**
 * Hook for mobile-specific behavior detection
 * Combines viewport and capability detection for mobile optimization decisions
 */
export function useMobileOptimization() {
  const viewport = useMobileViewport();
  const capabilities = useDeviceCapabilities();
  const breakpoints = useResponsiveBreakpoints();

  return {
    // Core mobile detection
    isMobileDevice: viewport.isMobile || (viewport.isTablet && viewport.touchSupport),
    shouldUseMobileLayout: viewport.isMobile,
    shouldUseTouchOptimizations: capabilities.hasTouch,
    
    // Performance optimizations
    shouldReduceAnimations: capabilities.prefersReducedMotion || 
                           (viewport.isMobile && capabilities.connectionType === 'slow-2g'),
    shouldOptimizeImages: viewport.isMobile || capabilities.connectionType === 'slow-2g',
    shouldLazyLoad: viewport.isMobile || capabilities.deviceMemory !== null && capabilities.deviceMemory < 4,
    
    // Layout decisions
    shouldStackVertically: viewport.isMobile,
    shouldUseHorizontalScroll: viewport.isMobile && viewport.orientation === 'portrait',
    shouldShowMobileMenu: viewport.isMobile,
    
    // Interaction optimizations
    minTouchTargetSize: viewport.touchSupport ? 44 : 32,
    shouldUseHoverEffects: capabilities.hasHover && !viewport.isMobile,
    
    // Viewport information
    viewport,
    capabilities,
    breakpoints
  };
}

/**
 * Utility function to get CSS media query strings
 */
export const getMediaQueries = () => ({
  mobile: `(max-width: ${breakpoints.tablet - 1}px)`,
  mobileLarge: `(min-width: ${breakpoints.mobileLarge}px) and (max-width: ${breakpoints.tablet - 1}px)`,
  tablet: `(min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`,
  desktop: `(min-width: ${breakpoints.desktop}px)`,
  desktopLarge: `(min-width: ${breakpoints.desktopLarge}px)`,
  
  // Touch and hover queries
  touch: '(hover: none) and (pointer: coarse)',
  hover: '(hover: hover) and (pointer: fine)',
  
  // Orientation queries
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  
  // Accessibility queries
  reducedMotion: '(prefers-reduced-motion: reduce)',
  highContrast: '(prefers-contrast: high)'
});