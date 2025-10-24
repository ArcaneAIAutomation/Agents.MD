# Mobile/Tablet CSS Classes Documentation

## Overview

This document provides comprehensive documentation for all mobile-specific CSS utility classes in the Bitcoin Sovereign Technology platform. These classes ensure foolproof styling on mobile and tablet devices (320px-1023px) with guaranteed contrast and visibility.

## Task 7 Implementation Summary

✅ **Task 7.1**: Mobile-specific CSS utility classes created
✅ **Task 7.2**: CSS validation and error prevention implemented
✅ **Task 7.3**: Mobile/tablet media query overrides added

## Core Utility Classes

### Button State Classes

#### `.mobile-btn-active`
**Purpose**: Active button state with guaranteed contrast
**Usage**: Apply to buttons that are currently active/selected
**Styling**:
- Background: Orange (#F7931A)
- Text: Black (#000000)
- Border: 2px solid orange
- Min height: 48px (touch target)
- Box shadow: Orange glow

**Example**:
```html
<button className="mobile-btn-active">
  Active Feature
</button>
```

#### `.mobile-btn-inactive`
**Purpose**: Inactive button state with guaranteed contrast
**Usage**: Apply to buttons that are not currently active
**Styling**:
- Background: Black (#000000)
- Text: Orange (#F7931A)
- Border: 2px solid orange
- Min height: 48px (touch target)

**Example**:
```html
<button className="mobile-btn-inactive">
  Inactive Feature
</button>
```

### Text Visibility Classes

#### `.mobile-text-visible`
**Purpose**: Force white text on transparent background
**Usage**: Emergency override for invisible text
**Styling**:
- Color: White (#FFFFFF)
- Background: Transparent
- Font weight: 500

**Example**:
```html
<p className="mobile-text-visible">
  This text is guaranteed to be visible
</p>
```

#### `.mobile-text-visible-strong`
**Purpose**: Extra strong text visibility
**Usage**: Critical text that must be highly visible
**Styling**:
- Color: White (#FFFFFF)
- Font weight: 700
- Text shadow: Subtle white glow

**Example**:
```html
<span className="mobile-text-visible-strong">
  Critical Information
</span>
```

### Background Safety Classes

#### `.mobile-bg-safe`
**Purpose**: Force black background with visible text
**Usage**: Ensure safe background color
**Styling**:
- Background: Black (#000000)
- Text: White 80% opacity

**Example**:
```html
<div className="mobile-bg-safe">
  Content with safe background
</div>
```

#### `.mobile-bg-safe-with-border`
**Purpose**: Black background with orange border
**Usage**: Cards or containers needing borders
**Styling**:
- Background: Black (#000000)
- Text: White 80% opacity
- Border: 1px solid orange 20% opacity

**Example**:
```html
<div className="mobile-bg-safe-with-border">
  Card content
</div>
```

### Border Visibility Classes

#### `.mobile-border-visible`
**Purpose**: Force visible orange border
**Usage**: Ensure borders are always visible
**Styling**:
- Border: 2px solid orange (#F7931A)
- Border radius: 8px

**Example**:
```html
<div className="mobile-border-visible">
  Content with visible border
</div>
```

#### `.mobile-border-visible-subtle`
**Purpose**: Subtle orange border
**Usage**: Less prominent borders
**Styling**:
- Border: 1px solid orange 20% opacity
- Border radius: 8px
- Hover: Full orange border

**Example**:
```html
<div className="mobile-border-visible-subtle">
  Content with subtle border
</div>
```

#### `.mobile-border-visible-strong`
**Purpose**: Strong orange border with glow
**Usage**: Highly emphasized borders
**Styling**:
- Border: 3px solid orange (#F7931A)
- Border radius: 8px
- Box shadow: Orange glow

**Example**:
```html
<div className="mobile-border-visible-strong">
  Emphasized content
</div>
```

### Icon Visibility Classes

#### `.mobile-icon-visible`
**Purpose**: Force orange color for SVG icons
**Usage**: Ensure icons are visible
**Styling**:
- Color: Orange (#F7931A)
- Stroke: Orange
- Fill: None
- Stroke width: 2.5

**Example**:
```html
<div className="mobile-icon-visible">
  <svg>...</svg>
</div>
```

#### `.mobile-icon-visible-white`
**Purpose**: Force white color for SVG icons
**Usage**: Icons on orange backgrounds
**Styling**:
- Color: White (#FFFFFF)
- Stroke: White
- Fill: None
- Stroke width: 2.5

**Example**:
```html
<div className="mobile-icon-visible-white">
  <svg>...</svg>
</div>
```

#### `.mobile-icon-visible-filled`
**Purpose**: Filled orange icons
**Usage**: Icons that need solid fill
**Styling**:
- Color: Orange (#F7931A)
- Fill: Orange
- Stroke: None

**Example**:
```html
<div className="mobile-icon-visible-filled">
  <svg>...</svg>
</div>
```

### Card Safety Classes

#### `.mobile-card-safe`
**Purpose**: Safe card styling with proper contrast
**Usage**: Cards and containers
**Styling**:
- Background: Black (#000000)
- Border: 1px solid orange (#F7931A)
- Border radius: 12px
- Padding: 1rem
- Text: White 80% opacity

**Example**:
```html
<div className="mobile-card-safe">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>
```

#### `.mobile-card-safe-subtle`
**Purpose**: Subtle card styling
**Usage**: Less prominent cards
**Styling**:
- Background: Black (#000000)
- Border: 1px solid orange 20% opacity
- Border radius: 12px
- Padding: 1rem
- Hover: Full orange border

**Example**:
```html
<div className="mobile-card-safe-subtle">
  <h3>Subtle Card</h3>
  <p>Card content</p>
</div>
```

### Link Safety Classes

#### `.mobile-link-safe`
**Purpose**: Safe link styling with proper contrast
**Usage**: All links on mobile/tablet
**Styling**:
- Color: Orange (#F7931A)
- Text decoration: Underline (2px)
- Font weight: 600
- Hover: White color, thicker underline

**Example**:
```html
<a href="#" className="mobile-link-safe">
  Click here
</a>
```

### Input Safety Classes

#### `.mobile-input-safe`
**Purpose**: Safe input styling with proper contrast
**Usage**: Form inputs on mobile/tablet
**Styling**:
- Background: Black (#000000)
- Text: White (#FFFFFF)
- Border: 2px solid orange 20% opacity
- Border radius: 8px
- Padding: 0.75rem
- Font size: 1rem (prevents iOS zoom)
- Focus: Orange border with glow

**Example**:
```html
<input 
  type="text" 
  className="mobile-input-safe" 
  placeholder="Enter text"
/>
```

### Emergency Override Classes

#### `.emergency-contrast`
**Purpose**: Maximum contrast override
**Usage**: Last resort for visibility issues
**Styling**:
- Background: Orange (#F7931A)
- Text: Black (#000000)
- Border: 3px solid orange
- Font weight: 800
- Box shadow: Strong orange glow

**Example**:
```html
<div className="emergency-contrast">
  Critical content that must be visible
</div>
```

#### `.emergency-contrast-inverted`
**Purpose**: Inverted maximum contrast
**Usage**: Alternative emergency override
**Styling**:
- Background: Black (#000000)
- Text: White (#FFFFFF)
- Border: 3px solid orange
- Font weight: 800
- Box shadow: Strong orange glow

**Example**:
```html
<div className="emergency-contrast-inverted">
  Critical content (inverted)
</div>
```

### High Visibility Classes

#### `.mobile-high-visibility`
**Purpose**: Maximum visibility with glow
**Usage**: Critical elements that must be seen
**Styling**:
- Border: 3px solid orange
- Box shadow: Strong orange glow (25px)
- Background: Black
- Text: White

**Example**:
```html
<div className="mobile-high-visibility">
  Highly visible content
</div>
```

#### `.mobile-high-visibility-orange`
**Purpose**: Orange background with maximum visibility
**Usage**: Emphasized critical elements
**Styling**:
- Border: 3px solid orange
- Box shadow: Extra strong orange glow (30px)
- Background: Orange
- Text: Black
- Font weight: 800

**Example**:
```html
<div className="mobile-high-visibility-orange">
  Maximum emphasis content
</div>
```

## Automatic Color Conversion

### Forbidden Colors

The system automatically converts forbidden colors to Bitcoin Sovereign colors:

| Forbidden Color | Converted To | Reason |
|----------------|--------------|--------|
| Red | White 80% | Neutral representation |
| Green | Orange | Positive/gain indicator |
| Blue | White | Neutral information |
| Yellow | Orange | Warning/emphasis |
| Purple | White 60% | Muted information |

### Automatic Fallbacks

The system prevents invalid color combinations:

1. **White-on-White**: Automatically converts text to black
2. **Black-on-Black**: Automatically converts text to white 80%
3. **Orange-on-Orange**: Automatically converts text to black

## Breakpoint-Specific Styling

### Extra Small Mobile (320px-479px)
- Button min-height: 48px
- Button padding: 0.875rem 1rem
- Font size: 0.875rem
- Single column layouts

### Small Mobile (480px-639px)
- Button min-height: 48px
- Button padding: 0.875rem 1.25rem
- Font size: 0.9375rem
- Single column layouts

### Large Mobile (640px-767px)
- Button min-height: 48px
- Button padding: 0.875rem 1.5rem
- Font size: 1rem
- Single column layouts

### Tablet (768px-1023px)
- Button min-height: 52px
- Button padding: 1rem 1.75rem
- Font size: 1rem
- Two-column layouts available
- Slightly thicker borders (1.5px)

## Best Practices

### Do's ✅

1. **Always use utility classes** for mobile/tablet styling
2. **Test on physical devices** (iPhone SE, iPhone 14, iPad)
3. **Verify button states** (inactive, active, hover, focus, disabled)
4. **Check text visibility** (minimum 4.5:1 contrast ratio)
5. **Ensure borders are visible** (orange at appropriate opacity)
6. **Use Bitcoin Sovereign colors only** (black, orange, white)

### Don'ts ❌

1. **Never use inline styles** that override utility classes
2. **Never use forbidden colors** (red, green, blue, yellow, purple)
3. **Never create white-on-white** or black-on-black combinations
4. **Never use buttons without explicit state classes**
5. **Never skip physical device testing**
6. **Never override with !important** unless absolutely necessary

## Testing Checklist

Before deploying any mobile/tablet changes:

- [ ] Test on iPhone SE (375px width)
- [ ] Test on iPhone 14 (390px width)
- [ ] Test on iPhone 14 Pro Max (428px width)
- [ ] Test on iPad Mini (768px width)
- [ ] Test on iPad Pro (1024px width)
- [ ] Verify all button states work correctly
- [ ] Check all text is visible (no invisible elements)
- [ ] Ensure all borders are visible
- [ ] Validate all icons are visible
- [ ] Test hover states on all interactive elements
- [ ] Test focus states for keyboard navigation
- [ ] Verify disabled states are clearly disabled
- [ ] Check orientation changes (portrait/landscape)
- [ ] Validate no horizontal scroll on any screen size
- [ ] Ensure minimum 48px touch targets

## Troubleshooting

### Problem: Button text is invisible
**Solution**: Apply `.mobile-btn-active` or `.mobile-btn-inactive` class

### Problem: Text is too light to read
**Solution**: Apply `.mobile-text-visible` or `.mobile-text-visible-strong` class

### Problem: Border is not visible
**Solution**: Apply `.mobile-border-visible` or `.mobile-border-visible-strong` class

### Problem: Icon is not visible
**Solution**: Apply `.mobile-icon-visible` class to parent container

### Problem: Card has poor contrast
**Solution**: Apply `.mobile-card-safe` or `.mobile-card-safe-subtle` class

### Problem: Link is hard to see
**Solution**: Apply `.mobile-link-safe` class

### Problem: Input is hard to use
**Solution**: Apply `.mobile-input-safe` class

### Problem: Element is completely invisible
**Solution**: Apply `.emergency-contrast` or `.mobile-high-visibility` class

## Maintenance

### Adding New Utility Classes

When adding new utility classes:

1. Follow the naming convention: `.mobile-[purpose]-[variant]`
2. Ensure WCAG AA compliance (4.5:1 contrast minimum)
3. Test on all breakpoints (320px-1023px)
4. Document in this file
5. Add to the appropriate section in `mobile-tablet-utility-classes.css`
6. Test on physical devices

### Updating Existing Classes

When updating existing classes:

1. Test on all breakpoints
2. Verify no regressions on physical devices
3. Update documentation
4. Maintain Bitcoin Sovereign color system
5. Ensure backward compatibility

## Support

For questions or issues with mobile/tablet styling:

1. Check this documentation first
2. Review `mobile-tablet-utility-classes.css` for implementation details
3. Test on physical devices to reproduce issues
4. Document the issue with screenshots
5. Verify the issue exists on multiple devices

## Version History

- **v1.0.0** (Current): Initial implementation of foolproof mobile/tablet styling system
  - Task 7.1: Mobile-specific CSS utility classes
  - Task 7.2: CSS validation and error prevention
  - Task 7.3: Mobile/tablet media query overrides

---

**Last Updated**: January 2025
**Status**: ✅ Complete
**Requirements**: 11.1, 11.2, 11.3, 11.4, 11.5
