# Email Delivery Troubleshooting

## Issue
Verification emails are not being received by users.

## Diagnostic Steps

### 1. Test Email Endpoint
Visit: `https://news.arcane.group/api/test-email?to=morgan@arcane.group`

This will show:
- ✅ Environment variables status
- ✅ Email send attempt result
- ❌ Any errors in the process

### 2. Check Vercel Environment Variables

Required variables for email:
```
SENDER_EMAIL=no-reply@arcane.group
AZURE_TENANT_ID=c152592e-75fe-4f4f-8e8a-8acf38daf0b3
AZURE_CLIENT_ID=83bcb34c-3c73-41e9-8dc8-94d257e8755c
AZURE_CLIENT_SECRET=F6U8Q~J-GFXtxSBWf5paE3jyIsGoir6rKAgTWbTp
```

### 3. Check Azure AD Configuration

**Required Microsoft Graph API Permissions:**
- `Mail.Send` - Application permission
- `User.Read` - Delegated permission (optional)

**Steps to verify:**
1. Go to: https://portal.azure.com
2. Navigate to: Azure Active Directory > App Registrations
3. Select your app (Client ID: 83bcb34c-3c73-41e9-8dc8-94d257e8755c)
4. Go to: API Permissions
5. Verify `Mail.Send` permission is granted
6. Click "Grant admin consent" if not already done

### 4. Check Office 365 Mailbox

**Verify SENDER_EMAIL exists:**
- Email: `no-reply@arcane.group`
- Must be a valid mailbox in Office 365
- Must have send permissions
- Check if mailbox is active

### 5. Common Issues

#### Issue: "Failed to get Azure access token"
**Solution:** 
- Verify AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET are correct
- Check Azure AD app registration exists
- Verify client secret hasn't expired

#### Issue: "Failed to send email via Graph API"
**Solution:**
- Verify Mail.Send permission is granted
- Check admin consent is given
- Verify SENDER_EMAIL mailbox exists

#### Issue: "SENDER_EMAIL environment variable not configured"
**Solution:**
- Add SENDER_EMAIL to Vercel environment variables
- Must be a valid Office 365 mailbox

### 6. Alternative: Use SendGrid (Backup Plan)

If Office 365 continues to fail, we can switch to SendGrid:

1. Sign up at: https://sendgrid.com
2. Get API key
3. Add to Vercel: `SENDGRID_API_KEY=xxx`
4. Update email utility to use SendGrid

## Quick Fix Options

### Option A: Fix Office 365 (Recommended)
1. Verify all Azure credentials in Vercel
2. Grant Mail.Send permission in Azure AD
3. Verify sender mailbox exists
4. Test with diagnostic endpoint

### Option B: Switch to SendGrid (Faster)
1. Create SendGrid account (free tier: 100 emails/day)
2. Get API key
3. Update email utility
4. Deploy and test

## Testing After Fix

1. Reset database: `npx tsx scripts/simple-reset.ts`
2. Register at: https://news.arcane.group
3. Check email arrives within 1-2 minutes
4. Click verification link
5. Verify login works

## Current Status

- ✅ Email verification flow UI complete
- ✅ Database schema ready
- ✅ API endpoints working
- ❌ Email delivery failing
- ✅ Login blocking unverified users working

**Next:** Test diagnostic endpoint and fix email configuration.
