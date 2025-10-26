# CSRF Protection Quick Reference

## For Developers

### Getting a CSRF Token

```typescript
// Automatic (via AuthProvider)
const { csrfToken } = useAuth();

// Manual
const response = await fetch('/api/auth/csrf-token');
const { csrfToken } = await response.json();
```

### Including Token in Requests

**Option 1: Header (Recommended)**
```typescript
fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

**Option 2: Hidden Form Field**
```tsx
<form>
  <input type="hidden" name="csrfToken" value={csrfToken} />
  {/* other fields */}
</form>
```

### Protected Methods

- ✅ POST
- ✅ PUT
- ✅ DELETE
- ✅ PATCH
- ❌ GET (not protected)
- ❌ HEAD (not protected)
- ❌ OPTIONS (not protected)

### Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `CSRF_TOKEN_MISSING` | 403 | Token not provided |
| `CSRF_TOKEN_INVALID` | 403 | Token doesn't match |

### Common Issues

**Issue**: "CSRF token missing"
**Solution**: Ensure token is included in header or body

**Issue**: "Invalid CSRF token"
**Solution**: Fetch a fresh token from `/api/auth/csrf-token`

**Issue**: Token expired
**Solution**: Tokens expire after 24 hours, fetch a new one

### Testing

```typescript
// Get token
const tokenRes = await fetch('/api/auth/csrf-token');
const { csrfToken } = await tokenRes.json();

// Use token
const res = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'X-CSRF-Token': csrfToken },
  body: JSON.stringify({ email, password }),
});
```

### Production Checklist

- [ ] Migrate to Redis for token storage
- [ ] Implement token rotation
- [ ] Add rate limiting
- [ ] Set up monitoring
- [ ] Configure alerts
- [ ] Security audit

---

**See Also**: `docs/CSRF-PROTECTION-GUIDE.md` for complete documentation
