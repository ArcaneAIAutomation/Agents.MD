# Staging Deployment - Quick Reference Card

## 🚀 Quick Start (15 Minutes)

### 1. Deploy Code (2 min)
```powershell
.\scripts\deploy-staging.ps1
```

### 2. Create Databases (3 min)
- **Postgres**: Vercel > Storage > Create > Postgres
  - Name: `agents-md-auth-staging`
  - Copy `DATABASE_URL`
- **KV**: Vercel > Storage > Create > KV
  - Name: `agents-md-rate-limit-staging`
  - Copy `KV_REST_API_URL`, `KV_REST_API_TOKEN`

### 3. Set Environment Variables (2 min)
Vercel > Settings > Environment Variables (Preview):
```bash
DATABASE_URL=postgres://...
JWT_SECRET=$(openssl rand -base64 32)
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
CRON_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://your-preview-url.vercel.app
```
Then: Redeploy

### 4. Run Migrations (3 min)
```powershell
$env:DATABASE_URL="postgres://..."
npm run migrate:prod
npm run import:codes
```

### 5. Validate (5 min)
```powershell
.\scripts\validate-staging.ps1 -StagingUrl "https://your-staging-url.vercel.app"
```

---

## 📋 Essential Commands

### Deployment
```powershell
# Deploy to staging
.\scripts\deploy-staging.ps1

# Deploy without tests
.\scripts\deploy-staging.ps1 -SkipTests

# Deploy in force mode (no prompts)
.\scripts\deploy-staging.ps1 -Force
```

### Database
```powershell
# Run migrations
npm run migrate:prod

# Import access codes
npm run import:codes

# Verify database
npm run db:verify
```

### Validation
```powershell
# Run all tests
.\scripts\validate-staging.ps1 -StagingUrl "https://..."

# Verbose output
.\scripts\validate-staging.ps1 -StagingUrl "..." -Verbose

# Skip email tests
.\scripts\validate-staging.ps1 -StagingUrl "..." -SkipEmailTest
```

---

## ✅ Success Checklist

### Deployment
- [ ] Vercel shows "Ready" status
- [ ] Preview URL accessible
- [ ] No build errors

### Database
- [ ] Postgres created
- [ ] KV created
- [ ] Migrations successful
- [ ] 11 codes imported

### Testing
- [ ] Automated tests: 15/15 pass
- [ ] Manual tests: All pass
- [ ] No errors in logs

---

## 🔍 Quick Verification

### Database Check
```sql
-- Check tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check codes
SELECT COUNT(*) FROM access_codes;  -- Should be 11

-- Check users
SELECT email FROM users;
```

### API Test
```powershell
# Test registration
curl -X POST https://your-staging-url.vercel.app/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"accessCode":"CODE0001","email":"test@staging.com","password":"TestPass123!"}'
```

---

## 🆘 Quick Fixes

### Build Failed
→ Check Vercel logs, verify package.json

### Database Error
→ Verify `DATABASE_URL`, check SSL mode

### Rate Limiting Not Working
→ Verify KV credentials

### Tests Failing
→ Check environment variables, verify migrations

---

## 📚 Documentation

| Guide | Purpose | Time |
|-------|---------|------|
| `STAGING-QUICK-START.md` | Express guide | 15 min |
| `STAGING-DEPLOYMENT-GUIDE.md` | Comprehensive | 1 hour |
| `STAGING-DEPLOYMENT-CHECKLIST.md` | Step-by-step | Variable |

---

## 🔄 Rollback

```powershell
# Emergency rollback
git branch -D auth-system-staging
git push origin --delete auth-system-staging
```

---

## 📊 Test Coverage

**Automated**: 15 tests  
**Manual**: 10 tests  
**Database**: 4 checks  
**Total**: 29 validations

---

## ⏱️ Timeline

| Phase | Time |
|-------|------|
| Deploy | 5 min |
| Setup | 5 min |
| Migrate | 5 min |
| Test | 15 min |
| **Total** | **30 min** |

---

## 🎯 Next Steps

1. Review docs
2. Run deploy script
3. Setup databases
4. Run migrations
5. Validate
6. Get approvals
7. Deploy to production

---

**Status**: ✅ Ready  
**Version**: 1.0.0  
**Updated**: Jan 26, 2025
