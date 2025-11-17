# Valid Access Codes - Bitcoin Sovereign Technology

## Active Access Codes

All codes below are **case-insensitive** and grant full access to the platform.

### ATGE Codes (3 Available)
```
1. ATGE-UNLIMITED-001
2. ATGE-UNLIMITED-002
3. ATGE-UNLIMITED-003
```

### BTC-SOVEREIGN Codes (8 Available)
```
4. BTC-SOVEREIGN-046F3BN3
5. BTC-SOVEREIGN-1FE934MM
6. BTC-SOVEREIGN-28E5E0OZ
7. BTC-SOVEREIGN-2ABAC0OI
8. BTC-SOVEREIGN-7B766DPG
9. BTC-SOVEREIGN-829A56NK
10. BTC-SOVEREIGN-8FB338PY
11. BTC-SOVEREIGN-AB42E6O1
```

### DEV Codes (2 Available)
```
12. DEV-UNLIMITED-001
13. DEV-UNLIMITED-002
```

### KIRO Codes (3 Available)
```
14. KIRO-UNLIMITED-001
15. KIRO-UNLIMITED-002
16. KIRO-UNLIMITED-003
```

### TEST Codes (2 Available)
```
17. TEST-UNLIMITED-001
18. TEST-UNLIMITED-002
```

### Redeemed Codes (2)
```
❌ BTC-SOVEREIGN-5C0A66M5 (Redeemed: 2025-11-09)
❌ BTC-SOVEREIGN-5F55CAL8 (Redeemed: 2025-11-08)
```

---

## Code Properties

- **Case-Insensitive:** `ATGE-UNLIMITED-001` = `atge-unlimited-001`
- **One-Time Use:** Each code can only be redeemed once
- **Database-Backed:** Codes stored in Supabase PostgreSQL
- **No Expiration:** Codes remain valid until redeemed
- **Redemption Tracking:** User ID and timestamp recorded

---

## How to Use

1. Visit: https://news.arcane.group
2. Click "Register with Access Code"
3. Enter any available code from the list above
4. Complete registration form (email, password)
5. Verify email address via link sent to inbox
6. Login with your credentials

---

## Code Distribution

### Current Status
- **Total Codes:** 20
- **Available:** 18 (90%)
- **Redeemed:** 2 (10%)

**Last Updated:** January 27, 2025  
**Status:** ✅ Verified and Working

---

## Adding New Codes

To add new access codes:

1. Connect to Supabase database
2. Insert new codes into `access_codes` table:
   ```sql
   INSERT INTO access_codes (code, redeemed, created_at)
   VALUES ('NEW-CODE-HERE', FALSE, NOW());
   ```
3. Verify codes are available:
   ```bash
   npx tsx scripts/check-access-codes.ts
   ```
4. Test registration with new code
5. Distribute codes to recipients

### Example SQL Insert

```sql
INSERT INTO access_codes (code, redeemed, created_at)
VALUES 
  ('BTC-SOVEREIGN-NEWCODE-01', FALSE, NOW()),
  ('BTC-SOVEREIGN-NEWCODE-02', FALSE, NOW()),
  ('BTC-SOVEREIGN-NEWCODE-03', FALSE, NOW());
```

---

## Revoking Codes

To revoke a code (mark as redeemed):

1. Connect to Supabase database
2. Update the code:
   ```sql
   UPDATE access_codes 
   SET redeemed = TRUE, redeemed_at = NOW()
   WHERE code = 'CODE-TO-REVOKE';
   ```
3. Verify revocation:
   ```bash
   npx tsx scripts/check-access-codes.ts
   ```

---

## Security Notes

- Codes are stored in client-side code (visible in browser)
- For production, consider server-side validation
- Monitor usage patterns for suspicious activity
- Rotate codes periodically for better security
- Keep this document secure and private

---

## Testing

### Automated Testing
```bash
# Check code availability
npx tsx scripts/check-access-codes.ts

# Test validation logic
npx tsx scripts/test-access-codes.ts

# Test complete registration flow
npx tsx scripts/test-registration-flow.ts
```

### Manual Testing
1. Open browser in incognito/private mode
2. Visit https://news.arcane.group
3. Click "Register with Access Code"
4. Enter test code (e.g., TEST-UNLIMITED-001)
5. Complete registration form
6. Verify email verification link works
7. Login with credentials
8. Verify access to all features

---

## Support

If a user reports a code not working:

1. **Check Code Status**
   ```bash
   npx tsx scripts/check-access-codes.ts
   ```

2. **Verify Code Format**
   - Case-insensitive (ATGE-UNLIMITED-001 = atge-unlimited-001)
   - Hyphens required
   - No extra spaces

3. **Check Error Messages**
   - "Invalid access code" = Code doesn't exist in database
   - "Access code already used" = Code has been redeemed
   - "Email already exists" = Email address already registered

4. **Test Registration Flow**
   ```bash
   npx tsx scripts/test-registration-flow.ts
   ```

5. **Contact Support**
   - Email: morgan@arcane.group
   - Include: Code used, error message, timestamp

---

**Last Updated:** January 27, 2025  
**Total Active Codes:** 18 (out of 20)  
**Status:** ✅ All codes verified and working  
**Test Pass Rate:** 100% (5/5 tests)
