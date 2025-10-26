# Upstash Redis Setup Guide

## ✅ Status: Configured

You've successfully set up Upstash Redis for distributed rate limiting!

## 🔧 Environment Variables

Add these to your Vercel project:

### Required Variables

1. **UPSTASH_REDIS_REST_URL**
   ```
   https://musical-cattle-22790.upstash.io
   ```

2. **UPSTASH_REDIS_REST_TOKEN**
   ```
   AVkGAAIncDIyOTYyY2RhZGViNTg0ODI5OWQ1ZWVmN2ZjNjBhMTlkM3AyMjI3OTA
   ```

## 📝 Steps to Add to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **Agents.MD**
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - Click **Add New**
   - Name: `UPSTASH_REDIS_REST_URL`
   - Value: `https://musical-cattle-22790.upstash.io`
   - Environment: Select **Production**, **Preview**, and **Development**
   - Click **Save**
5. Repeat for `UPSTASH_REDIS_REST_TOKEN`
6. **Redeploy** your application for changes to take effect

## 🗑️ Remove Old Variables (Optional)

If you have these old variables, you can remove them:
- `KV_REST_API_URL` (if it has a `redis://` URL)
- `KV_REST_API_TOKEN` (old token)

The new code supports both old and new variable names for backward compatibility.

## ✨ Benefits

- **Distributed Rate Limiting**: Works across multiple Vercel instances
- **Persistent Storage**: Rate limits survive server restarts
- **Better Security**: Prevents brute force attacks more effectively
- **Free Tier**: 10,000 commands per day (plenty for most apps)

## 🧪 Testing

After deployment, test registration:

```bash
curl -X POST https://news.arcane.group/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "accessCode": "BITCOIN2025",
    "email": "test@example.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!"
  }'
```

Expected: No Redis errors, successful registration or proper error messages.

## 📊 Monitoring

Check Upstash Console for:
- Command usage
- Connection status
- Performance metrics

Dashboard: https://console.upstash.com/

## 🔐 Security Notes

- ✅ Credentials are in `.env.local` (gitignored)
- ✅ Must be added to Vercel dashboard manually
- ✅ Never commit credentials to git
- ✅ Rotate tokens if compromised

## 🎯 Next Steps

1. Add environment variables to Vercel dashboard
2. Redeploy the application
3. Test registration endpoint
4. Monitor Upstash console for usage

---

**Last Updated**: January 26, 2025
**Status**: Ready for deployment ✅
