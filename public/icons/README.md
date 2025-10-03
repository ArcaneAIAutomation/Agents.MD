# Icons Directory

## Caesar API Icon

To replace the placeholder Caesar API icon with the actual icon:

1. Save your Caesar API icon as `caesar-api.svg` or `caesar-api.png` in this directory
2. Update the image source in `components/CryptoHerald.tsx` from:
   ```
   src="/icons/caesar-api-placeholder.svg"
   ```
   to:
   ```
   src="/icons/caesar-api.svg"
   ```
   (or `.png` if using PNG format)

## Icon Requirements

- **Size**: 20x20px (will be scaled to 16x16px on mobile, 20x20px on desktop)
- **Format**: SVG preferred (for scalability), PNG acceptable
- **Background**: Transparent or matching the design
- **Style**: Should match the professional look of other API badges

## Current Placeholder

The current placeholder is a purple gradient circle with a "C" letter. It includes:
- Purple gradient background (#8B5CF6 to #6D28D9)
- White "C" letter
- Proper scaling for mobile and desktop
- Fallback handling if the icon fails to load

Replace this with your actual Caesar API branding when ready.