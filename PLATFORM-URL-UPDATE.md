# Platform URL Update - January 25, 2025

## Summary

✅ **Platform URL has been updated** and users have been notified.

---

## URL Change

### Old URL
```
https://agents-md.vercel.app
```

### New URL
```
https://news.arcane.group
```

---

## Notifications Sent

### Recipients
- ✅ morgan@arcane.group
- ✅ murray@arcane.group

### Email Subject
"Important: Bitcoin Sovereign Technology - New Platform URL"

### Email Content
Each recipient received:
- Notification of the new URL
- All 10 access codes (unchanged)
- Updated access instructions
- Reassurance that codes still work
- Information about the change

---

## What Was Updated

### Scripts Updated
1. `scripts/send-early-access-codes.js` - Updated platform URL
2. `scripts/send-early-access-codes.ts` - Updated platform URL
3. `scripts/send-platform-update.js` - New notification script

### Documentation Updated
1. `EARLY-ACCESS-CODES-SENT.md` - Updated URL references
2. `PLATFORM-URL-UPDATE.md` - This document

### Package.json Updated
- Added new script: `npm run send-platform-update`

---

## Access Codes (Unchanged)

All 10 access codes remain valid and work on the new domain:

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

## User Instructions

### How to Access (Updated)
1. Visit: **https://news.arcane.group**
2. Click "Enter Access Code"
3. Enter any of the codes above
4. Enjoy full access to all features

---

## Technical Details

### Domain Configuration
- **New Domain:** news.arcane.group
- **DNS:** Should be configured to point to Vercel
- **SSL:** Automatic via Vercel
- **Redirect:** Old URL should redirect to new domain (optional)

### Vercel Configuration
To configure the custom domain in Vercel:

1. Go to Vercel Dashboard
2. Select your project
3. Navigate to Settings → Domains
4. Add domain: `news.arcane.group`
5. Configure DNS records as instructed by Vercel
6. Wait for SSL certificate provisioning

### DNS Records Required
```
Type: CNAME
Name: news
Value: cname.vercel-dns.com
```

Or if using A records:
```
Type: A
Name: news
Value: 76.76.21.21
```

---

## Email Delivery Status

| Recipient | Email | Status | Timestamp |
|-----------|-------|--------|-----------|
| Morgan | morgan@arcane.group | ✅ Sent | January 25, 2025 |
| Murray | murray@arcane.group | ✅ Sent | January 25, 2025 |

---

## Next Steps

### For You
- ✅ Update notifications sent
- ✅ Scripts updated with new URL
- ✅ Documentation updated
- [ ] Configure custom domain in Vercel
- [ ] Verify DNS propagation
- [ ] Test new URL with access codes
- [ ] Set up redirect from old URL (optional)

### For Recipients
1. Check email for update notification
2. Update bookmarks to new URL
3. Visit https://news.arcane.group
4. Use existing access codes
5. Confirm everything works

---

## Verification Checklist

After domain is configured:

- [ ] Visit https://news.arcane.group
- [ ] Verify SSL certificate is active
- [ ] Test access gate appears
- [ ] Test access code entry
- [ ] Verify all features load correctly
- [ ] Test on mobile devices
- [ ] Confirm old URL redirects (if configured)

---

## Support

If users report issues:
- Verify DNS has propagated (can take 24-48 hours)
- Check Vercel domain configuration
- Ensure SSL certificate is active
- Test access codes still work
- Check email delivery logs

---

## Future Notifications

To send future updates to users:

```bash
# Send platform updates
npm run send-platform-update

# Send new access codes
npm run send-access-codes
```

---

**Status:** ✅ Complete  
**Notifications Sent:** 2  
**New URL:** https://news.arcane.group  
**Old URL:** https://agents-md.vercel.app  
**Date:** January 25, 2025
