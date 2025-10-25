# Office 365 Email Setup Guide

## Overview

The Access Gate uses **Microsoft Graph API** with Azure AD authentication to send emails through Office 365. This provides enterprise-grade email delivery with better reliability than SMTP.

## Prerequisites

✅ Office 365 tenant  
✅ Azure Active Directory access  
✅ Valid Office 365 mailbox (e.g., no-reply@arcane.group)  
✅ Azure App Registration permissions  

## Current Configuration

Your environment is already configured with these credentials:

```bash
AZURE_TENANT_ID=c152592e-75fe-4f4f-8e8a-8acf38daf0b3
AZURE_CLIENT_ID=83bcb34c-3c73-41e9-8dc8-94d257e8755c
AZURE_CLIENT_SECRET=F6U8Q~J-GFXtxSBWf5paE3jyIsGoir6rKAgTWbTp
SENDER_EMAIL=no-reply@arcane.group
```

## How It Works

### Authentication Flow

```
1. Application requests access token from Azure AD
   ↓
2. Azure AD validates client credentials
   ↓
3. Azure AD returns access token
   ↓
4. Application uses token to call Microsoft Graph API
   ↓
5. Graph API sends email on behalf of sender mailbox
```

### API Endpoints Used

**Token Endpoint:**
```
POST https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
```

**Send Mail Endpoint:**
```
POST https://graph.microsoft.com/v1.0/users/{sender-email}/sendMail
```

## Azure App Registration Setup

### Required Permissions

Your Azure App Registration needs:

**Application Permissions:**
- `Mail.Send` - Send mail as any user

**Admin Consent:**
- Required: Yes
- Status: Must be granted by tenant admin

### Verify Permissions

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to: Azure Active Directory → App registrations
3. Find your app (Client ID: `83bcb34c-3c73-41e9-8dc8-94d257e8755c`)
4. Click "API permissions"
5. Verify `Mail.Send` is listed with "Granted for [tenant]"

### Grant Admin Consent (If Needed)

If admin consent is not granted:

1. In API permissions page
2. Click "Grant admin consent for [tenant name]"
3. Confirm the action
4. Wait for status to update to "Granted"

## Sender Mailbox Requirements

### Mailbox Setup

The sender email (`no-reply@arcane.group`) must:

✅ Exist as a valid Office 365 mailbox  
✅ Be licensed (Exchange Online license)  
✅ Be accessible by the Azure App  
✅ Have send permissions enabled  

### Verify Mailbox

1. Go to [Microsoft 365 Admin Center](https://admin.microsoft.com)
2. Navigate to: Users → Active users
3. Search for: `no-reply@arcane.group`
4. Verify:
   - User exists
   - Has Exchange Online license
   - Mailbox is active

### Create Mailbox (If Needed)

If the mailbox doesn't exist:

1. In Microsoft 365 Admin Center
2. Go to: Users → Active users
3. Click "Add a user"
4. Fill in details:
   - Username: `no-reply`
   - Domain: `arcane.group`
   - Display name: `Bitcoin Sovereign Technology`
5. Assign Exchange Online license
6. Complete setup

## Testing Email Delivery

### Test 1: Verify Azure Authentication

```bash
# Test getting access token
curl -X POST \
  https://login.microsoftonline.com/c152592e-75fe-4f4f-8e8a-8acf38daf0b3/oauth2/v2.0/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=83bcb34c-3c73-41e9-8dc8-94d257e8755c" \
  -d "client_secret=F6U8Q~J-GFXtxSBWf5paE3jyIsGoir6rKAgTWbTp" \
  -d "scope=https://graph.microsoft.com/.default" \
  -d "grant_type=client_credentials"
```

**Expected Response:**
```json
{
  "token_type": "Bearer",
  "expires_in": 3599,
  "access_token": "eyJ0eXAiOiJKV1QiLCJub25jZSI6..."
}
```

### Test 2: Send Test Email

1. Submit an application through the access gate
2. Check `no-reply@arcane.group` inbox for admin notification
3. Check applicant's inbox for confirmation email
4. Verify both emails arrived

### Test 3: Check Vercel Logs

1. Go to Vercel Dashboard
2. Navigate to your project
3. Click "Functions" tab
4. Find `/api/request-access` function
5. Check logs for any errors

## Troubleshooting

### Error: "Failed to get Azure access token"

**Possible Causes:**
- Invalid Tenant ID
- Invalid Client ID
- Invalid Client Secret
- Network connectivity issues

**Solution:**
1. Verify credentials in `.env.local`
2. Check Azure App Registration exists
3. Ensure client secret hasn't expired
4. Test authentication with curl command above

### Error: "Failed to send email via Graph API"

**Possible Causes:**
- Missing `Mail.Send` permission
- Admin consent not granted
- Sender mailbox doesn't exist
- Sender mailbox not licensed

**Solution:**
1. Verify `Mail.Send` permission in Azure
2. Grant admin consent if needed
3. Verify sender mailbox exists in Office 365
4. Check mailbox has Exchange Online license

### Error: "Mailbox not found"

**Possible Causes:**
- Sender email doesn't exist
- Typo in `SENDER_EMAIL` variable
- Mailbox not provisioned yet

**Solution:**
1. Verify `SENDER_EMAIL=no-reply@arcane.group`
2. Check mailbox exists in Microsoft 365 Admin Center
3. Wait 15 minutes if mailbox was just created
4. Try with a different mailbox to test

### Emails Going to Spam

**Possible Causes:**
- SPF/DKIM/DMARC not configured
- Sender reputation issues
- Content triggers spam filters

**Solution:**
1. Configure SPF record for arcane.group domain
2. Enable DKIM signing in Exchange Online
3. Set up DMARC policy
4. Review email content for spam triggers
5. Whitelist sender in recipient's email client

## Security Best Practices

### Credential Management

✅ **Never commit credentials to Git**  
✅ **Use environment variables**  
✅ **Rotate client secrets regularly** (every 6-12 months)  
✅ **Use separate credentials for dev/prod**  
✅ **Monitor Azure AD sign-in logs**  

### Client Secret Rotation

When rotating the client secret:

1. Generate new secret in Azure App Registration
2. Update `AZURE_CLIENT_SECRET` in Vercel
3. Test email delivery with new secret
4. Delete old secret from Azure
5. Update documentation

### Monitoring

Set up monitoring for:
- Failed authentication attempts
- Email delivery failures
- API rate limits
- Unusual activity patterns

## Rate Limits

### Microsoft Graph API Limits

**Mail.Send:**
- 10,000 requests per 10 minutes per app
- 30 messages per minute per mailbox

**Token Endpoint:**
- No published limit, but use caching

### Best Practices

- Cache access tokens (valid for 1 hour)
- Implement retry logic with exponential backoff
- Monitor usage in Azure AD logs
- Set up alerts for rate limit errors

## Cost Considerations

### Azure AD

- **Free tier:** Included with Office 365
- **App Registration:** Free
- **API calls:** Free (within limits)

### Office 365

- **Exchange Online:** Requires license
- **Mailbox:** ~$4-8/month per mailbox
- **Sending:** No additional cost

### Recommendations

- Use shared mailbox (free) instead of user mailbox
- Monitor usage to stay within free tier limits
- Consider dedicated sending mailbox for high volume

## Alternative: Shared Mailbox

For cost savings, use a shared mailbox:

### Benefits
- Free (no license required)
- Multiple users can access
- Same functionality as user mailbox

### Setup

1. In Microsoft 365 Admin Center
2. Go to: Teams & groups → Shared mailboxes
3. Click "Add a shared mailbox"
4. Name: `Bitcoin Sovereign Technology`
5. Email: `no-reply@arcane.group`
6. Complete setup
7. Update `SENDER_EMAIL` in environment variables

## Support Resources

### Microsoft Documentation
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/)
- [Send mail API](https://docs.microsoft.com/en-us/graph/api/user-sendmail)
- [Azure AD authentication](https://docs.microsoft.com/en-us/azure/active-directory/develop/)

### Azure Portal Links
- [Azure Portal](https://portal.azure.com)
- [Microsoft 365 Admin Center](https://admin.microsoft.com)
- [Azure AD App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps)

### Troubleshooting Tools
- [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
- [JWT Token Decoder](https://jwt.ms)
- [Azure AD Sign-in Logs](https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/SignIns)

---

**Configuration Status:** ✅ Ready  
**Email Provider:** Office 365 via Microsoft Graph API  
**Authentication:** Azure AD Client Credentials  
**Last Updated:** January 2025
