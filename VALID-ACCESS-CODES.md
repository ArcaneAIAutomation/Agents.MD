# Valid Access Codes - Bitcoin Sovereign Technology

## Active Access Codes

All codes below are **case-insensitive** and grant full access to the platform.

### Default Code
```
BITCOIN2025
```

### Early Access Codes (Batch 1)
```
1. BTC-SOVEREIGN-K3QYMQ-01
2. BTC-SOVEREIGN-AKCJRG-02
3. BTC-SOVEREIGN-LMBLRN-03
4. BTC-SOVEREIGN-HZKEI2-04
5. BTC-SOVEREIGN-WVL0HN-05
6. BTC-SOVEREIGN-48YDHG-06
7. BTC-SOVEREIGN-6HSNX0-07
8. BTC-SOVEREIGN-N99A5R-08
9. BTC-SOVEREIGN-DCO2DG-09
10. BTC-SOVEREIGN-BYE9UX-10
```

---

## Code Properties

- **Case-Insensitive:** `BTC-SOVEREIGN-BYE9UX-10` = `btc-sovereign-bye9ux-10`
- **Reusable:** Can be used multiple times
- **Session-Based:** Access persists during browser session
- **No Expiration:** Codes remain valid until manually revoked

---

## How to Use

1. Visit: https://news.arcane.group
2. Click "Enter Access Code"
3. Enter any code from the list above
4. Click "Verify Code"
5. Access granted!

---

## Code Distribution

### Batch 1 Recipients
- morgan@arcane.group (10 codes)
- murray@arcane.group (10 codes)

**Date Issued:** January 25, 2025  
**Status:** ✅ Active

---

## Adding New Codes

To add new access codes:

1. Generate new codes using the pattern: `BTC-SOVEREIGN-XXXXXX-##`
2. Update `components/AccessGate.tsx` in the `VALID_CODES` array
3. Test the new codes locally
4. Commit and deploy
5. Send codes to recipients via email

### Example Code Addition

```typescript
const VALID_CODES = [
  'BITCOIN2025',
  // ... existing codes ...
  'BTC-SOVEREIGN-NEWCODE-11', // Add new code here
];
```

---

## Revoking Codes

To revoke a code:

1. Remove it from the `VALID_CODES` array in `components/AccessGate.tsx`
2. Commit and deploy
3. Notify affected users if necessary

---

## Security Notes

- Codes are stored in client-side code (visible in browser)
- For production, consider server-side validation
- Monitor usage patterns for suspicious activity
- Rotate codes periodically for better security
- Keep this document secure and private

---

## Testing

To test a code:

1. Open browser in incognito/private mode
2. Visit https://news.arcane.group
3. Enter code
4. Verify access is granted
5. Check that all features are accessible

---

## Support

If a user reports a code not working:

1. Verify the code is in the `VALID_CODES` array
2. Check for typos (case-insensitive, but hyphens matter)
3. Ensure latest code is deployed
4. Clear browser cache and try again
5. Test in incognito mode

---

**Last Updated:** January 25, 2025  
**Total Active Codes:** 11  
**Status:** ✅ All codes validated and working
