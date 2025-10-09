# Requirements Document: Bitcoin Sovereign Technology Rebrand

## Introduction

This specification outlines the complete visual and structural transformation of Agents.MD from a traditional newspaper-style cryptocurrency platform to a Bitcoin-focused, sovereign technology platform. The rebrand emphasizes digital scarcity, minimalism, and a forward-looking aesthetic rooted in the Bitcoin ethos.

## CRITICAL CONSTRAINTS (DO NOT VIOLATE)

**This is a CSS/HTML-only visual rebrand. The following constraints are MANDATORY:**

1. **NO JavaScript Changes**: Do not modify, add, or remove any JavaScript code, React components logic, or TypeScript files
2. **NO Backend Changes**: Do not interact with or modify server-side code, database queries, API endpoints, or data fetching logic
3. **NO New Features**: Do not introduce any new interactive elements, data fetches, or functional components
4. **Existing Content Only**: Style only the content that is already present in the HTML/JSX structure
5. **Prioritize CSS & HTML**: Focus changes primarily on CSS stylesheets (globals.css, Tailwind config) and minor HTML/JSX structure adjustments for layout purposes only

**Deliverables:**
- Updated CSS files (styles/globals.css, tailwind.config.js) reflecting the new visual design
- Modified HTML/JSX structure (if necessary for layout) with semantic and accessible practices
- New image assets (logo, icons, background patterns) if provided or generated placeholders
- Documentation of CSS class changes and new utility classes

## Requirements

### Requirement 1: Core Visual Identity Transformation

**User Story:** As a Bitcoin-focused user, I want the platform to reflect sovereign technology principles with a dark, minimalist aesthetic, so that I feel I'm accessing cutting-edge digital financial intelligence.

#### Acceptance Criteria

1. WHEN I visit the platform THEN the primary background SHALL be Deep Space Black (#000000)
2. WHEN I view interactive elements THEN they SHALL use Bitcoin Orange (#F7931A) as the primary accent color
3. WHEN I read headlines and critical data THEN they SHALL be displayed in Glow White (#FFFFFF)
4. WHEN I read body text THEN it SHALL be displayed in Hash Grey (#CCCCCC)
5. WHEN I view the background THEN it SHALL include subtle, low-opacity patterns (hexagonal grids, network nodes, or circuit board traces)
6. IF the current newspaper-style aesthetic exists THEN it SHALL be completely replaced with the sovereign technology aesthetic

---

### Requirement 2: Typography System Implementation

**User Story:** As a user, I want typography that conveys both clarity and technical precision, so that the platform feels like a professional financial intelligence system.

#### Acceptance Criteria

1. WHEN I view headlines and UI elements THEN they SHALL use a clean, geometric sans-serif font (Inter or Poppins)
2. WHEN I view data and technical callouts THEN they SHALL use a monospaced font (Roboto Mono) for a "ledger" feel
3. WHEN I view the Bitcoin symbol (₿) THEN it SHALL be used as a design element throughout the interface
4. WHEN I view functional icons THEN they SHALL be minimalist orange or white outlines
5. IF Times/serif fonts are currently used THEN they SHALL be replaced with the new typography system

---

### Requirement 3: Mobile-First Minimalist Experience

**User Story:** As a mobile user, I want a clean, headline-first experience without information overload, so that I can quickly access critical Bitcoin data.

#### Acceptance Criteria

1. WHEN I view the mobile homepage THEN the top of the screen SHALL display only: Logo, Menu Icon, and Current Bitcoin Price
2. WHEN I view content sections THEN they SHALL be organized in collapsible accordions with orange headers
3. WHEN I scroll on mobile THEN all content SHALL be presented as a single-column stack of "Block" cards
4. WHEN I view data tables on mobile THEN they SHALL be hidden by default with only key data points visible
5. WHEN I want full details THEN I SHALL see a clear orange "View Details" or "See Full Report" button
6. IF the current design shows all content at once THEN it SHALL be reorganized into collapsible sections

---

### Requirement 4: Streamlined Navigation System

**User Story:** As a user, I want a clean, uncluttered navigation system that provides quick access to core features, so that I can efficiently navigate the platform.

#### Acceptance Criteria

1. WHEN I view the mobile/tablet interface THEN navigation SHALL be consolidated behind a hamburger menu icon (three white or orange horizontal lines)
2. WHEN I tap the hamburger menu THEN it SHALL reveal a full-screen overlay menu with black background and bold orange text
3. WHEN I view the menu overlay THEN it SHALL display these options:
   - CRYPTO NEWS WIRE
   - AI TRADE GENERATION ENGINE
   - BITCOIN MARKET REPORT
   - ETHEREUM MARKET REPORT
   - BITCOIN WHALE WATCH
   - NEXO.COM UK REGULATORY UPDATES
4. WHEN I view the desktop interface THEN navigation SHALL be a clean, minimalist horizontal list in the header
5. IF the current header has numerous visible links THEN they SHALL be consolidated into the new navigation system

---

### Requirement 5: Bitcoin-Themed Imagery & Visual Elements

**User Story:** As a user, I want all visual elements to reinforce the Bitcoin and sovereign technology theme, so that the platform has a cohesive, immersive aesthetic.

#### Acceptance Criteria

1. WHEN I view hero sections THEN they SHALL feature 3D renders of Bitcoin coins, abstract data block visualizations, or glowing orange holographic charts
2. WHEN I view background textures THEN they SHALL include subtle hexagonal grids, network node connections, or circuit board traces at low opacity
3. WHEN I view iconography THEN the Bitcoin '₿' symbol SHALL be used as a design element (e.g., bullet points)
4. WHEN I view charts and data visualizations THEN they SHALL use Bitcoin Orange (#F7931A) as the primary color
5. IF traditional newspaper-style imagery exists THEN it SHALL be replaced with Bitcoin-themed visuals

---

### Requirement 6: Component-Level Design System

**User Story:** As a developer, I want a comprehensive design system with reusable components, so that the new aesthetic is consistently applied across all features.

#### Acceptance Criteria

1. WHEN I create a new component THEN it SHALL follow the Bitcoin Sovereign design system
2. WHEN I use cards/blocks THEN they SHALL have subtle borders with Bitcoin Orange accents
3. WHEN I create buttons THEN they SHALL use Bitcoin Orange for primary actions and white outlines for secondary actions
4. WHEN I display data THEN it SHALL use the monospaced font with appropriate color coding
5. WHEN I add animations THEN they SHALL be subtle and reinforce the "digital ledger" aesthetic
6. IF existing components don't match the design system THEN they SHALL be updated or replaced

---

### Requirement 7: Responsive Breakpoint Strategy

**User Story:** As a user on any device, I want the platform to adapt seamlessly to my screen size while maintaining the minimalist aesthetic, so that I have an optimal experience regardless of device.

#### Acceptance Criteria

1. WHEN I view on mobile (320px-640px) THEN content SHALL be single-column with collapsible sections
2. WHEN I view on tablet (641px-1024px) THEN content SHALL use a 2-column grid where appropriate
3. WHEN I view on desktop (1025px+) THEN content SHALL use multi-column layouts with the horizontal navigation
4. WHEN I resize the browser THEN transitions between breakpoints SHALL be smooth and maintain visual hierarchy
5. IF the current responsive design doesn't follow this strategy THEN it SHALL be updated

---

### Requirement 8: Color Accessibility & Contrast

**User Story:** As a user with visual impairments, I want sufficient color contrast throughout the platform, so that I can read all content clearly.

#### Acceptance Criteria

1. WHEN I view white text on black background THEN it SHALL meet WCAG AAA contrast ratio (21:1)
2. WHEN I view Bitcoin Orange (#F7931A) on black background THEN it SHALL meet WCAG AA contrast ratio for large text
3. WHEN I view Hash Grey (#CCCCCC) on black background THEN it SHALL meet WCAG AA contrast ratio (4.5:1)
4. WHEN I use interactive elements THEN they SHALL have clear focus states with sufficient contrast
5. IF any color combinations don't meet accessibility standards THEN they SHALL be adjusted

---

### Requirement 9: Performance Optimization for Dark Theme

**User Story:** As a user, I want the dark theme to load quickly and perform smoothly, so that I have a fast, responsive experience.

#### Acceptance Criteria

1. WHEN the page loads THEN the black background SHALL render immediately to prevent white flash
2. WHEN images load THEN they SHALL be optimized for dark backgrounds
3. WHEN animations play THEN they SHALL be GPU-accelerated and not cause jank
4. WHEN I scroll THEN the experience SHALL be smooth with no layout shifts
5. IF the current implementation causes performance issues THEN it SHALL be optimized

---

### Requirement 10: Brand Consistency Across All Features

**User Story:** As a user, I want every feature and component to follow the same Bitcoin Sovereign aesthetic, so that the platform feels cohesive and professional.

#### Acceptance Criteria

1. WHEN I view the Crypto Herald THEN it SHALL use the new dark theme and Bitcoin Orange accents
2. WHEN I view the Trade Generation Engine THEN it SHALL use the new design system
3. WHEN I view the Whale Watch Dashboard THEN it SHALL use the new aesthetic
4. WHEN I view the BTC/ETH Trading Charts THEN they SHALL use Bitcoin Orange for primary data
5. WHEN I view any feature THEN it SHALL consistently apply the sovereign technology visual language
6. IF any feature still uses the old newspaper style THEN it SHALL be updated

---

## Success Metrics

- **Visual Consistency**: 100% of components follow the Bitcoin Sovereign design system
- **Mobile Performance**: First Contentful Paint < 1.5s on mobile devices
- **Accessibility**: All color combinations meet WCAG AA standards minimum
- **User Engagement**: Reduced bounce rate due to cleaner, more focused mobile experience
- **Brand Perception**: User feedback indicates platform feels "modern," "professional," and "Bitcoin-native"

## Implementation Approach

**CSS-First Strategy:**
- All visual changes will be implemented through CSS modifications in `styles/globals.css`
- Tailwind configuration will be extended with new color palette and custom utilities
- Existing Tailwind classes in JSX will be updated to use new design tokens
- CSS animations and transitions will be added for visual polish
- Background patterns will be implemented using CSS pseudo-elements or background images

**HTML/JSX Structure Changes (Minimal):**
- Only modify JSX structure if absolutely necessary for layout purposes
- Add semantic wrapper divs for styling hooks (e.g., `<div className="bitcoin-sovereign-theme">`)
- Update className attributes to use new design system classes
- Ensure all changes maintain accessibility (ARIA labels, semantic HTML)

**No Logic Changes:**
- All existing React hooks, state management, and data fetching remain unchanged
- All API calls and backend integrations remain unchanged
- All interactive functionality (buttons, forms, modals) remains unchanged
- Only the visual presentation layer is modified

## Out of Scope

- JavaScript/TypeScript logic modifications
- React component refactoring or new component creation
- Backend API changes or new endpoints
- New data fetching or state management
- New interactive features or functionality
- Content strategy changes (focus is on visual presentation only)
- Multi-cryptocurrency expansion beyond BTC/ETH (Bitcoin remains primary focus)

## Dependencies

- Design assets (3D Bitcoin renders, hexagonal grid patterns, circuit board textures)
- Font files or CDN links (Inter/Poppins and Roboto Mono)
- Updated brand guidelines documentation
- Mobile testing devices for validation
- CSS preprocessor tools (if needed for complex patterns)

## Assumptions

- Current HTML/JSX structure can accommodate new styling without major restructuring
- Tailwind CSS can be extended with the new color palette and custom utilities
- Existing CSS classes can be overridden or replaced without breaking functionality
- Users will respond positively to the dramatic visual shift
- All existing functionality will continue to work with only CSS/HTML changes
