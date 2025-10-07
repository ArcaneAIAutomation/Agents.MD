# Mobile Breakpoints Quick Reference Card

## 📱 Breakpoint Values

| Name | Width | Device | Tailwind Class |
|------|-------|--------|----------------|
| **xs** | 320px | Small mobile | `xs:` |
| **se** | 375px | iPhone SE | `se:` |
| **ip** | 390px | iPhone 12/13/14 | `ip:` |
| **ip-max** | 428px | iPhone Pro Max | `ip-max:` |
| **sm** | 480px | Large mobile | `sm:` |
| **md** | 768px | Tablet | `md:` |
| **lg** | 1024px | Desktop | `lg:` |

## 🎯 Common Patterns

### Responsive Container
```jsx
<div className="px-4 se:px-4 ip:px-[18px] ip-max:px-5 md:px-6">
```

### Responsive Text
```jsx
<p className="text-base ip:text-lg ip-max:text-xl md:text-2xl">
```

### Responsive Grid
```jsx
<div className="grid-cols-1 ip-max:grid-cols-2 md:grid-cols-3">
```

## 📏 Device Specs

| Device | Width | Padding | Touch | Heading |
|--------|-------|---------|-------|---------|
| iPhone SE | 375px | 16px | 44px | 28px |
| iPhone 12/13/14 | 390px | 18px | 44px | 30px |
| iPhone Pro Max | 428px | 20px | 48px | 32px |

## 🔧 CSS Utilities

### Responsive Font Sizing
```css
font-size: clamp(0.875rem, 3.5vw, 1.125rem);
```

### Touch Targets
```css
min-height: 44px; /* Base mobile */
min-height: 48px; /* Pro Max */
```

### Overflow Prevention
```css
overflow: hidden;
word-wrap: break-word;
text-overflow: ellipsis;
```

## ✅ Testing Widths

- 320px - Smallest mobile
- 375px - iPhone SE
- 390px - iPhone 12/13/14
- 428px - iPhone Pro Max
- 768px - iPad Mini

## 🚀 Quick Test

```bash
# Validate configuration
node validate-breakpoints.js

# Visual test
open test-mobile-breakpoints.html
```

---
**Version:** 1.0 | **Last Updated:** Task 10.4
