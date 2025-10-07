/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Mobile-first responsive breakpoints with precise iPhone sizes
    screens: {
      'xs': '320px',     // Extra small mobile devices (iPhone SE 1st gen, small Android)
      'se': '375px',     // iPhone SE 2nd/3rd gen, iPhone 6/7/8
      'ip': '390px',     // iPhone 12/13/14 standard models
      'ip-max': '428px', // iPhone 12/13/14 Pro Max, Plus models
      'sm': '480px',     // Small mobile devices
      'md': '768px',     // Tablets
      'lg': '1024px',    // Desktop
      'xl': '1280px',    // Large desktop
      '2xl': '1536px',   // Extra large desktop
    },
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        crypto: {
          green: '#00d4aa',
          red: '#ff6b6b',
          bitcoin: '#f7931a',
          nexo: '#1e4dd8',
        },
        // Mobile-specific high-contrast color variants
        mobile: {
          text: {
            primary: '#000000',      // Pure black for maximum contrast (7:1 ratio)
            secondary: '#374151',    // Gray-700 for secondary text (4.5:1 ratio)
            accent: '#1f2937',       // Gray-800 for accent text (6:1 ratio)
            inverse: '#ffffff',      // White text for dark backgrounds
            muted: '#6b7280',        // Gray-500 for muted text (3:1 ratio for large text)
            error: '#dc2626',        // Red-600 for error states
            success: '#059669',      // Emerald-600 for success states
            warning: '#d97706',      // Amber-600 for warning states
            info: '#2563eb',         // Blue-600 for info states
          },
          bg: {
            primary: '#ffffff',      // Pure white background
            secondary: '#f9fafb',    // Gray-50 for subtle backgrounds
            accent: '#f3f4f6',       // Gray-100 for accent backgrounds
            dark: '#111827',         // Gray-900 for dark sections
            card: '#ffffff',         // White card backgrounds
            overlay: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
            error: '#fef2f2',        // Red-50 for error backgrounds
            success: '#ecfdf5',      // Emerald-50 for success backgrounds
            warning: '#fffbeb',      // Amber-50 for warning backgrounds
            info: '#eff6ff',         // Blue-50 for info backgrounds
          },
          border: {
            primary: '#e5e7eb',      // Gray-200 for primary borders
            secondary: '#d1d5db',    // Gray-300 for secondary borders
            accent: '#9ca3af',       // Gray-400 for accent borders
            focus: '#3b82f6',        // Blue-500 for focus states
            error: '#f87171',        // Red-400 for error borders
            success: '#34d399',      // Emerald-400 for success borders
          },
          crypto: {
            // High-contrast versions of crypto colors for mobile
            green: {
              50: '#ecfdf5',         // Light background
              100: '#d1fae5',        // Lighter variant
              400: '#34d399',        // Medium contrast
              500: '#10b981',        // Standard contrast (4.5:1)
              600: '#059669',        // High contrast (6:1)
              700: '#047857',        // Higher contrast (7:1)
              900: '#064e3b',        // Maximum contrast
            },
            red: {
              50: '#fef2f2',         // Light background
              100: '#fee2e2',        // Lighter variant
              400: '#f87171',        // Medium contrast
              500: '#ef4444',        // Standard contrast (4.5:1)
              600: '#dc2626',        // High contrast (6:1)
              700: '#b91c1c',        // Higher contrast (7:1)
              900: '#7f1d1d',        // Maximum contrast
            },
            bitcoin: {
              50: '#fffbeb',         // Light background
              100: '#fef3c7',        // Lighter variant
              400: '#fbbf24',        // Medium contrast
              500: '#f59e0b',        // Standard contrast (4.5:1)
              600: '#d97706',        // High contrast (6:1)
              700: '#b45309',        // Higher contrast (7:1)
              900: '#78350f',        // Maximum contrast
            },
            nexo: {
              50: '#eff6ff',         // Light background
              100: '#dbeafe',        // Lighter variant
              400: '#60a5fa',        // Medium contrast
              500: '#3b82f6',        // Standard contrast (4.5:1)
              600: '#2563eb',        // High contrast (6:1)
              700: '#1d4ed8',        // Higher contrast (7:1)
              900: '#1e3a8a',        // Maximum contrast
            }
          },
          // Responsive color modifiers for different mobile contexts
          responsive: {
            light: {
              text: '#000000',       // Black text for light mode
              bg: '#ffffff',         // White background for light mode
            },
            dark: {
              text: '#ffffff',       // White text for dark mode
              bg: '#111827',         // Dark background for dark mode
            },
            highContrast: {
              text: '#000000',       // Maximum contrast text
              bg: '#ffffff',         // Maximum contrast background
              border: '#000000',     // Maximum contrast borders
            }
          }
        }
      },
      // Mobile-optimized spacing scale for touch interactions
      spacing: {
        // Touch target sizes (WCAG 2.1 AA compliance)
        'touch': '44px',           // Minimum touch target size (44x44px)
        'touch-sm': '40px',        // Small touch target (acceptable for secondary actions)
        'touch-lg': '48px',        // Large touch target (preferred for primary actions)
        'touch-xl': '56px',        // Extra large touch target (for accessibility)
        
        // Mobile-specific gaps and spacing
        'mobile-gap': '8px',       // Minimum gap between touch elements
        'mobile-gap-sm': '4px',    // Small gap for tight layouts
        'mobile-gap-lg': '12px',   // Large gap for better separation
        'mobile-gap-xl': '16px',   // Extra large gap for major sections
        
        // Mobile padding scale
        'mobile-padding': '16px',  // Standard mobile padding
        'mobile-padding-sm': '12px', // Small mobile padding
        'mobile-padding-lg': '20px', // Large mobile padding
        'mobile-padding-xl': '24px', // Extra large mobile padding
        
        // Mobile margin scale
        'mobile-margin': '12px',   // Standard mobile margin
        'mobile-margin-sm': '8px', // Small mobile margin
        'mobile-margin-lg': '16px', // Large mobile margin
        'mobile-margin-xl': '20px', // Extra large mobile margin
        
        // Component-specific spacing
        'mobile-header-padding': '16px', // Header internal padding
        'mobile-card-padding': '16px',   // Card internal padding
        'mobile-section-gap': '24px',    // Gap between major sections
        'mobile-content-gap': '16px',    // Gap between content blocks
        
        // Safe area spacing (for notched devices)
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // Mobile-optimized font sizes with improved readability
      fontSize: {
        // Mobile text sizes (minimum 16px for body text)
        'mobile-xs': ['12px', { lineHeight: '16px', letterSpacing: '0.025em' }],
        'mobile-sm': ['14px', { lineHeight: '20px', letterSpacing: '0.025em' }],
        'mobile-base': ['16px', { lineHeight: '24px', letterSpacing: '0.0125em' }], // Minimum readable size
        'mobile-lg': ['18px', { lineHeight: '28px', letterSpacing: '0.0125em' }],
        'mobile-xl': ['20px', { lineHeight: '32px', letterSpacing: '0em' }],
        'mobile-2xl': ['24px', { lineHeight: '36px', letterSpacing: '-0.0125em' }],
        'mobile-3xl': ['28px', { lineHeight: '40px', letterSpacing: '-0.025em' }],
        'mobile-4xl': ['32px', { lineHeight: '44px', letterSpacing: '-0.025em' }],
        'mobile-5xl': ['36px', { lineHeight: '48px', letterSpacing: '-0.05em' }],
        
        // Component-specific font sizes
        'mobile-button': ['16px', { lineHeight: '20px', fontWeight: '500' }],
        'mobile-caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'mobile-label': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'mobile-input': ['16px', { lineHeight: '24px', fontWeight: '400' }], // Prevents zoom on iOS
        
        // Responsive font sizes that scale with viewport
        'mobile-responsive-sm': ['clamp(14px, 4vw, 16px)', { lineHeight: '1.5' }],
        'mobile-responsive-base': ['clamp(16px, 4.5vw, 18px)', { lineHeight: '1.6' }],
        'mobile-responsive-lg': ['clamp(18px, 5vw, 22px)', { lineHeight: '1.5' }],
        'mobile-responsive-xl': ['clamp(20px, 6vw, 28px)', { lineHeight: '1.4' }],
      },
      // Mobile-specific component sizing
      minHeight: {
        'touch': '44px',           // Minimum touch target height (WCAG AA)
        'touch-lg': '48px',        // Large touch target height
        'mobile-header': '64px',   // Mobile header height
        'mobile-nav': '56px',      // Mobile navigation height
        'mobile-card': '120px',    // Minimum mobile card height
        'mobile-input': '44px',    // Mobile input field height
        'mobile-button': '44px',   // Mobile button height
        'mobile-tab': '48px',      // Mobile tab height
        'mobile-list-item': '56px', // Mobile list item height
        'mobile-section': '200px', // Minimum section height
      },
      minWidth: {
        'touch': '44px',           // Minimum touch target width (WCAG AA)
        'touch-lg': '48px',        // Large touch target width
        'mobile-button': '88px',   // Minimum mobile button width
        'mobile-input': '200px',   // Minimum mobile input width
        'mobile-card': '280px',    // Minimum mobile card width
        'mobile-modal': '320px',   // Minimum mobile modal width
      },
      maxWidth: {
        'mobile-container': '480px', // Maximum mobile container width
        'mobile-content': '400px',   // Maximum mobile content width
        'mobile-modal': '90vw',      // Maximum mobile modal width
        'mobile-image': '100%',      // Maximum mobile image width
      },
      // Mobile-optimized heights
      height: {
        'mobile-screen': '100vh',    // Full mobile screen height
        'mobile-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        'mobile-header': '64px',     // Standard mobile header
        'mobile-nav': '56px',        // Standard mobile navigation
        'mobile-footer': '80px',     // Standard mobile footer
        'mobile-fab': '56px',        // Floating action button
      },
      // Mobile-optimized widths
      width: {
        'mobile-full': '100vw',      // Full mobile width
        'mobile-safe': 'calc(100vw - env(safe-area-inset-left) - env(safe-area-inset-right))',
        'mobile-container': '100%',   // Mobile container width
        'mobile-fab': '56px',        // Floating action button
      },
      // Mobile-optimized line heights for readability
      lineHeight: {
        'mobile-tight': '1.4',     // For headings and large text
        'mobile-normal': '1.6',    // Optimal for mobile reading (body text)
        'mobile-relaxed': '1.8',   // For dense content that needs breathing room
        'mobile-loose': '2.0',     // For very dense or technical content
      },
      // Mobile-optimized letter spacing
      letterSpacing: {
        'mobile-tighter': '-0.05em',
        'mobile-tight': '-0.025em',
        'mobile-normal': '0em',
        'mobile-wide': '0.025em',
        'mobile-wider': '0.05em',
        'mobile-widest': '0.1em',
      },
      // Mobile-optimized border radius
      borderRadius: {
        'mobile-sm': '4px',        // Small mobile radius
        'mobile': '8px',           // Standard mobile radius
        'mobile-lg': '12px',       // Large mobile radius
        'mobile-xl': '16px',       // Extra large mobile radius
        'mobile-button': '8px',    // Mobile button radius
        'mobile-card': '12px',     // Mobile card radius
        'mobile-modal': '16px',    // Mobile modal radius
      },
      // Mobile-optimized shadows
      boxShadow: {
        'mobile-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'mobile': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'mobile-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'mobile-xl': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'mobile-card': '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        'mobile-button': '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
        'mobile-modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin-slow 2s linear infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'mobile-bounce': 'mobile-bounce 1s infinite',
        'mobile-fade-in': 'mobile-fade-in 0.3s ease-out',
        'skeleton': 'skeleton-loading 1.5s ease-in-out infinite',
        'progress': 'progress-indeterminate 2s linear infinite',
        // Mobile-specific error and loading animations
        'mobile-error-shake': 'mobile-error-shake 0.5s ease-in-out',
        'mobile-retry-pulse': 'mobile-retry-pulse 2s infinite',
        'mobile-loading-dots': 'mobile-loading-dots 1.4s infinite ease-in-out',
        'mobile-progress-indeterminate': 'mobile-progress-indeterminate 2s infinite linear',
        'mobile-error-bounce': 'mobile-error-bounce 1s',
        'mobile-success-checkmark': 'mobile-success-checkmark 0.6s ease-in-out',
      },
      keyframes: {
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' }
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        'mobile-bounce': {
          '0%, 100%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)'
          },
          '50%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)'
          }
        },
        'mobile-fade-in': {
          from: {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'skeleton-loading': {
          '0%': { backgroundColor: '#e5e7eb' },
          '50%': { backgroundColor: '#f3f4f6' },
          '100%': { backgroundColor: '#e5e7eb' }
        },
        'progress-indeterminate': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        // Mobile-specific error and loading keyframes
        'mobile-error-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' }
        },
        'mobile-retry-pulse': {
          '0%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.7)'
          },
          '70%': {
            transform: 'scale(1.05)',
            boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)'
          },
          '100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)'
          }
        },
        'mobile-loading-dots': {
          '0%, 80%, 100%': {
            transform: 'scale(0.8)',
            opacity: '0.5'
          },
          '40%': {
            transform: 'scale(1)',
            opacity: '1'
          }
        },
        'mobile-progress-indeterminate': {
          '0%': { transform: 'translateX(-100%) scaleX(0.5)' },
          '50%': { transform: 'translateX(0%) scaleX(1)' },
          '100%': { transform: 'translateX(100%) scaleX(0.5)' }
        },
        'mobile-error-bounce': {
          '0%, 20%, 53%, 80%, 100%': {
            animationTimingFunction: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
            transform: 'translate3d(0, 0, 0)'
          },
          '40%, 43%': {
            animationTimingFunction: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
            transform: 'translate3d(0, -8px, 0)'
          },
          '70%': {
            animationTimingFunction: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
            transform: 'translate3d(0, -4px, 0)'
          },
          '90%': { transform: 'translate3d(0, -2px, 0)' }
        },
        'mobile-success-checkmark': {
          '0%': { strokeDasharray: '0 100' },
          '100%': { strokeDasharray: '100 0' }
        }
      }
    },
  },
  plugins: [],
}
