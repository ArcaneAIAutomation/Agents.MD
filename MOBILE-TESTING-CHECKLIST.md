# Mobile Device Testing Checklist

Quick reference checklist for mobile testing. Print this and check off items during testing sessions.

## Device Information

**Tester**: ________________  
**Date**: ________________  
**Device**: ________________  
**OS Version**: ________________  
**Browser**: ________________  
**Screen Size**: ________________  

---

## Visual Design Compliance

### Bitcoin Sovereign Aesthetic
- [ ] All backgrounds are pure black (#000000)
- [ ] All text is white (#FFFFFF) or orange (#F7931A) only
- [ ] All borders are thin orange (1-2px solid)
- [ ] No forbidden colors (green, red, blue, gray)
- [ ] Text hierarchy uses white opacity (100%, 80%, 60%)
- [ ] All data uses Roboto Mono font
- [ ] All UI text uses Inter font
- [ ] Orange glow effects on emphasis elements
- [ ] Buttons have orange glow on hover/focus

### Layout & Containment
- [ ] No horizontal scroll on any page
- [ ] All text fits within containers (no overflow)
- [ ] All price displays scale properly
- [ ] All stat cards fit in containers
- [ ] Zone cards display without clipping
- [ ] Whale transaction cards render correctly
- [ ] News article cards stack properly
- [ ] Charts fit within viewport

---

## Responsive Design

### Viewport Testing
- [ ] 320px width (extra small mobile)
- [ ] 375px width (iPhone SE)
- [ ] 390px width (iPhone 12/13/14)
- [ ] 428px width (iPhone Pro Max)
- [ ] 640px width (large mobile)
- [ ] 768px width (tablet)

### Orientation
- [ ] Portrait mode works correctly
- [ ] Landscape mode works correctly
- [ ] Smooth transition between orientations
- [ ] No layout breaks on rotation

### Layout Patterns
- [ ] Single-column on mobile (< 640px)
- [ ] Two-column on tablet (640px - 1024px)
- [ ] Multi-column on desktop (> 1024px)
- [ ] Collapsible sections work properly
- [ ] Accordions expand/collapse smoothly

---

## Touch Interactions

### Touch Targets
- [ ] All buttons minimum 48px × 48px
- [ ] All links minimum 48px × 48px
- [ ] All form inputs minimum 48px height
- [ ] Spacing between targets minimum 8px
- [ ] Touch targets don't overlap

### Interactive Feedback
- [ ] Buttons show visual feedback on tap
- [ ] Links show visual feedback on tap
- [ ] Active states are visible
- [ ] Disabled states are clear
- [ ] Loading states are visible

### Gestures
- [ ] Tap works on all interactive elements
- [ ] Scroll works smoothly (60fps)
- [ ] Swipe gestures work (if applicable)
- [ ] Pinch-to-zoom disabled on UI elements
- [ ] Long-press works (if applicable)

---

## Navigation

### Header & Menu
- [ ] Logo displays correctly
- [ ] Hamburger icon is visible (orange)
- [ ] Hamburger icon is tappable (48px min)
- [ ] Menu opens on tap
- [ ] Full-screen overlay appears (black bg)
- [ ] Menu items are orange and readable
- [ ] Menu items are tappable
- [ ] Close button (X) works
- [ ] Menu closes on item selection
- [ ] Menu closes on outside tap

### Page Navigation
- [ ] All menu links work
- [ ] Page transitions are smooth
- [ ] Back button works correctly
- [ ] Forward button works correctly
- [ ] Deep links work
- [ ] URL updates correctly

---

## Content Display

### Text Readability
- [ ] All text is readable (minimum 16px)
- [ ] Headlines are clear and bold
- [ ] Body text has proper line height (1.6)
- [ ] Labels are uppercase and visible
- [ ] No text is cut off or clipped
- [ ] Text wraps properly
- [ ] Long words break correctly

### Data Displays
- [ ] Prices display in Roboto Mono
- [ ] Prices have orange glow effect
- [ ] Stat values fit in containers
- [ ] Stat labels are visible
- [ ] Percentage changes display correctly
- [ ] Volume data is readable
- [ ] Market cap displays properly

### Charts & Graphs
- [ ] Trading charts render correctly
- [ ] Chart legends are readable
- [ ] Technical indicators display
- [ ] Chart interactions work (zoom, pan)
- [ ] Chart tooltips appear on hover/tap
- [ ] Charts scale to viewport
- [ ] No chart overflow

### News & Articles
- [ ] News articles load
- [ ] Article cards display properly
- [ ] Headlines are readable
- [ ] Summaries are visible
- [ ] Timestamps display correctly
- [ ] "Read More" buttons work
- [ ] News ticker scrolls smoothly

---

## Performance

### Load Times
- [ ] Initial page load < 3 seconds (4G)
- [ ] First Contentful Paint < 1.8s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.8s
- [ ] Subsequent page loads < 1 second

### Scrolling Performance
- [ ] Smooth scrolling at 60fps
- [ ] No jank or stuttering
- [ ] Scroll position maintained on back
- [ ] Infinite scroll works (if applicable)
- [ ] Scroll-to-top button works

### Animations
- [ ] Fade-in animations are smooth
- [ ] Slide-up animations are smooth
- [ ] Glow effects don't cause lag
- [ ] Transitions are smooth (0.3s)
- [ ] No animation jank

### Resource Loading
- [ ] Images load progressively
- [ ] Lazy loading works
- [ ] No unnecessary requests
- [ ] API calls are optimized
- [ ] Caching works correctly

---

## Functionality

### Market Data
- [ ] Real-time prices load
- [ ] 24h changes display correctly
- [ ] Volume data appears
- [ ] Market cap displays
- [ ] Data refreshes automatically
- [ ] Manual refresh works

### Trading Features
- [ ] Trading zones display
- [ ] Support/resistance levels show
- [ ] Technical indicators work
- [ ] Fear & greed index displays
- [ ] Trade signals appear
- [ ] Risk metrics calculate

### Whale Watch (if applicable)
- [ ] Whale transactions load
- [ ] Transaction cards display
- [ ] Analyze button works (48px min)
- [ ] Analysis status updates
- [ ] Analysis lock prevents spam
- [ ] Results display properly
- [ ] Sources are accessible

### Forms & Inputs
- [ ] All form inputs work
- [ ] Keyboard appears correctly
- [ ] Input validation works
- [ ] Error messages display
- [ ] Success messages display
- [ ] Form submission works

---

## Accessibility

### Color Contrast
- [ ] White on black: 21:1 ratio ✓
- [ ] White 80% on black: 16.8:1 ratio ✓
- [ ] White 60% on black: 12.6:1 ratio ✓
- [ ] Orange on black: 5.8:1 ratio ✓
- [ ] Black on orange: 5.8:1 ratio ✓
- [ ] All text meets WCAG AA minimum

### Focus Management
- [ ] Focus indicators are visible (orange)
- [ ] Focus order is logical
- [ ] Focus doesn't get trapped
- [ ] Skip links work
- [ ] Focus returns after modal close

### Screen Reader
- [ ] All content is announced
- [ ] Heading hierarchy is correct (h1-h6)
- [ ] ARIA labels are present
- [ ] Alt text on all images
- [ ] Form labels are associated
- [ ] Error messages are announced
- [ ] Status updates are announced

### Keyboard Navigation
- [ ] Tab key navigates correctly
- [ ] Shift+Tab goes backward
- [ ] Enter activates buttons/links
- [ ] Escape closes modals/menus
- [ ] Arrow keys work (if applicable)
- [ ] All features keyboard accessible

---

## Error Handling

### Network Errors
- [ ] Network error messages display
- [ ] Retry button works
- [ ] Fallback content shows
- [ ] Cached data displays (if available)
- [ ] Error doesn't crash app

### Loading States
- [ ] Loading spinners display
- [ ] Skeleton screens show
- [ ] Progress indicators work
- [ ] Loading doesn't block UI
- [ ] Timeout handling works

### Empty States
- [ ] Empty state messages display
- [ ] Helpful guidance provided
- [ ] Call-to-action buttons present
- [ ] No broken layouts

### API Failures
- [ ] API errors handled gracefully
- [ ] Fallback data used
- [ ] Error messages are clear
- [ ] Retry logic works
- [ ] No console errors

---

## Browser Compatibility

### iOS Safari
- [ ] Latest version works
- [ ] Previous version works
- [ ] No iOS-specific bugs
- [ ] Touch events work
- [ ] Viewport meta tag correct

### Chrome Mobile
- [ ] Latest version works
- [ ] Previous version works
- [ ] No Chrome-specific bugs
- [ ] Touch events work
- [ ] Performance is good

### Firefox Mobile
- [ ] Latest version works
- [ ] No Firefox-specific bugs
- [ ] Touch events work
- [ ] Performance is acceptable

### Samsung Internet
- [ ] Latest version works
- [ ] No Samsung-specific bugs
- [ ] Touch events work
- [ ] Performance is acceptable

---

## Network Conditions

### Fast 4G/WiFi
- [ ] Page loads quickly
- [ ] All features work
- [ ] Real-time updates work
- [ ] No performance issues

### Slow 3G
- [ ] Page loads (may be slow)
- [ ] Loading states visible
- [ ] Core features work
- [ ] Graceful degradation

### Offline
- [ ] Offline message displays
- [ ] Cached content available
- [ ] No crashes
- [ ] Reconnection works

---

## Security & Privacy

### HTTPS
- [ ] All pages use HTTPS
- [ ] No mixed content warnings
- [ ] SSL certificate valid

### Data Privacy
- [ ] No sensitive data in URLs
- [ ] No data leaks in console
- [ ] API keys not exposed
- [ ] User data protected

---

## Notes & Issues

**Issues Found**:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________
4. _______________________________________________
5. _______________________________________________

**Screenshots Attached**: [ ] Yes [ ] No

**Console Errors**: [ ] Yes [ ] No

**Performance Issues**: [ ] Yes [ ] No

**Accessibility Issues**: [ ] Yes [ ] No

---

## Sign-Off

**Tested By**: ________________  
**Date**: ________________  
**Status**: [ ] Pass [ ] Fail [ ] Pass with Issues  

**Notes**:
_____________________________________________________
_____________________________________________________
_____________________________________________________
_____________________________________________________

---

**Checklist Version**: 1.0.0  
**Last Updated**: January 2025
