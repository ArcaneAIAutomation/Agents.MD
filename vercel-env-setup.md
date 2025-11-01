# 🚀 Vercel Environment Variables Setup Guide

## Quick Setup (Copy-Paste Method)

### Step 1: Open Vercel Dashboard
Go to: https://vercel.com/arcane-ai-automations-projects/agents-md-v2/settings/environment-variables

### Step 2: Add Each Variable

For each variable below, click "Add New" and:
1. Enter the **Name** (left column)
2. Enter the **Value** (right column)
3. Select: ✅ Production, ✅ Preview, ✅ Development
4. Click "Save"

---

## 🗄️ Database Configuration

### DATABASE_URL
```
postgres://postgres.nzcjkveexkhxsifllsox:QK9x178E4B7kzSvF@aws-1-eu-west-2.pooler.supabase.com:6543/postgres
```
**Description:** Supabase PostgreSQL connection string (connection pooling port 6543)

---

## 🔐 Authentication Secrets

### JWT_SECRET
```
MB4t1ZWyxayaddBoKRSR8TrkGgkq4XEtPSJKgTnD0HI=
```
**Description:** JWT token signing secret (32+ bytes, base64 encoded)

### CRON_SECRET
```
UU+Yg64wcv3mkbqO2neEdzKiqZ49q2/uu8j/xTmYFyo=
```
**Description:** Cron job authentication secret

### JWT_EXPIRATION
```
7d
```
**Description:** JWT token expiration time (7 days)

### JWT_REMEMBER_ME_EXPIRATION
```
30d
```
**Description:** JWT token expiration for 'Remember Me' (30 days)

---

## 🛡️ Rate Limiting Configuration

### KV_REST_API_URL
```
redis://default:P0yyIdZMnNwnIY2AR03fTmIgH31hktBs@redis-19137.c338.eu-west-2-1.ec2.redns.redis-cloud.com:19137
```
**Description:** Redis Cloud connection URL for rate limiting

### KV_REST_API_TOKEN
```
P0yyIdZMnNwnIY2AR03fTmIgH31hktBs
```
**Description:** Redis Cloud authentication token

### AUTH_RATE_LIMIT_MAX_ATTEMPTS
```
5
```
**Description:** Maximum login attempts before rate limiting

### AUTH_RATE_LIMIT_WINDOW_MS
```
900000
```
**Description:** Rate limit window in milliseconds (15 minutes)

---

## 📧 Email Configuration (Office 365)

### SENDER_EMAIL
```
no-reply@arcane.group
```
**Description:** Office 365 sender email address

### AZURE_TENANT_ID
```
c152592e-75fe-4f4f-8e8a-8acf38daf0b3
```
**Description:** Azure AD tenant ID for Office 365

### AZURE_CLIENT_ID
```
83bcb34c-3c73-41e9-8dc8-94d257e8755c
```
**Description:** Azure AD client ID for Office 365

### AZURE_CLIENT_SECRET
```
F6U8Q~J-GFXtxSBWf5paE3jyIsGoir6rKAgTWbTp
```
**Description:** Azure AD client secret for Office 365

---

## 🔧 Application Configuration

### NEXT_PUBLIC_APP_URL
```
https://news.arcane.group
```
**Description:** Production application URL

### ENABLE_WELCOME_EMAIL
```
true
```
**Description:** Enable welcome emails after registration

### ENABLE_SESSION_CLEANUP
```
true
```
**Description:** Enable automatic session cleanup

### SESSION_CLEANUP_INTERVAL_HOURS
```
24
```
**Description:** Session cleanup interval (24 hours)

### SESSION_RETENTION_DAYS
```
30
```
**Description:** Session retention period (30 days)

---

## ✅ Verification Checklist

After adding all variables:

- [ ] All 18 variables added to Vercel
- [ ] Each variable set for Production, Preview, Development
- [ ] No typos in variable names or values
- [ ] DATABASE_URL does NOT have `?sslmode=require` at the end
- [ ] All secrets are kept secure (not shared publicly)

---

## 🚀 Next Steps

Once all environment variables are set:

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Configure authentication system"
   ```

2. **Push to GitHub:**
   ```bash
   git push origin main
   ```

3. **Vercel will automatically deploy** (2-3 minutes)

4. **Test the deployment:**
   - Visit: https://news.arcane.group
   - Try registering with an access code
   - Test login functionality

---

## 🎫 Available Access Codes for Testing

After deployment, you can test registration with these codes:

- `BTC-SOVEREIGN-K3QYMQ-01`
- `BTC-SOVEREIGN-AKCJRG-02`
- `BTC-SOVEREIGN-LMBLRN-03`
- `BTC-SOVEREIGN-HZKEI2-04`
- `BTC-SOVEREIGN-WVL0HN-05`
- `BTC-SOVEREIGN-6HSNX0-07`
- `BTC-SOVEREIGN-N99A5R-08`
- `BTC-SOVEREIGN-DCO2DG-09`
- `BTC-SOVEREIGN-BYE9UX-10`

**Note:** 2 codes have already been redeemed:
- `BITCOIN2025` (redeemed)
- `BTC-SOVEREIGN-48YDHG-06` (redeemed)

---

## 🆘 Troubleshooting

### If deployment fails:

1. **Check Vercel function logs:**
   - Go to: https://vercel.com/arcane-ai-automations-projects/agents-md-v2
   - Click on latest deployment
   - View function logs

2. **Verify environment variables:**
   - Settings > Environment Variables
   - Ensure all 18 variables are present
   - Check for typos

3. **Test database connection:**
   - The DATABASE_URL should connect to Supabase
   - Port should be 6543 (connection pooling)
   - No `?sslmode=require` parameter

4. **Check Redis connection:**
   - KV_REST_API_URL should start with `redis://`
   - Token should match the password in the URL

---

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review this guide for missing variables
3. Verify database and Redis are accessible
4. Test locally first with `npm run dev`

---

**Last Updated:** November 1, 2025  
**Status:** ✅ Ready for Deployment
