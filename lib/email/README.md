# Email System Documentation

## Overview

Professional email system using Microsoft Graph API with Office 365 for Bitcoin Sovereign Technology platform.

## Quick Start

### 1. Configure Environment Variables

```bash
# Azure AD Configuration
AZURE_TENANT_ID=your_azure_tenant_id
AZURE_CLIENT_ID=your_azure_client_id
AZURE_CLIENT_SECRET=your_azure_client_secret

# Email Configuration
SENDER_EMAIL=no-reply@arcane.group
NEXT_PUBLIC_APP_URL=https://news.arcane.group
```

### 2. Send Welcome Email

```typescript
import { sendEmailAsync } from './email/office365';
import { generateWelcomeEmail } from './email/templates/welcome';

// Generate email content
const emailHtml = generateWelcomeEmail({
  email: user.email,
  platformUrl: 'https://news.arcane.group'
});

// Send email (non-blocking)
sendEmailAsync({
  to: user.email,
  subject: 'Welcome to Bitcoin Sovereign Technology',
  body: emailHtml,
  contentType: 'HTML'
});
```

### 3. Send Password Reset Email

```typescript
import { sendEmail } from './email/office365';
import { generatePasswordResetEmail } from './email/templates/passwordReset';

// Generate email content
const emailHtml = generatePasswordResetEmail({
  email: user.email,
  resetToken: 'secure-token',
  expirationMinutes: 60
});

// Send email (blocking)
const result = await sendEmail({
  to: user.email,
  subject: 'Password Reset - Bitcoin Sovereign Technology',
  body: emailHtml,
  contentType: 'HTML'
});

if (result.success) {
  console.log('Email sent successfully');
}
```

## API Reference

### `sendEmail(options)`

Send email with retry logic and return result.

**Parameters:**
- `to` (string, required) - Recipient email address
- `subject` (string, required) - Email subject
- `body` (string, required) - Email body (HTML or plain text)
- `contentType` ('HTML' | 'Text', optional) - Content type (default: 'HTML')
- `replyTo` (string, optional) - Reply-to email address
- `cc` (string[], optional) - CC recipients
- `bcc` (string[], optional) - BCC recipients

**Returns:** `Promise<SendEmailResult>`
```typescript
{
  success: boolean;
  error?: string;
  timestamp: Date;
}
```

**Example:**
```typescript
const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Test Email',
  body: '<h1>Hello</h1>',
  contentType: 'HTML',
  replyTo: 'support@arcane.group'
});
```

### `sendEmailAsync(options)`

Send email without waiting for result (fire and forget).

**Parameters:** Same as `sendEmail()`

**Returns:** `void`

**Example:**
```typescript
sendEmailAsync({
  to: 'user@example.com',
  subject: 'Test Email',
  body: '<h1>Hello</h1>'
});

// Code continues immediately
```

## Email Templates

### Welcome Email

**Function:** `generateWelcomeEmail(data)`

**Parameters:**
```typescript
{
  email: string;           // User's email address
  platformUrl?: string;    // Platform URL (optional)
}
```

**Returns:** HTML email content

**Features:**
- Bitcoin Sovereign branding
- Account details
- Platform features overview
- Getting started guide
- Mobile-responsive

### Password Reset Email

**Function:** `generatePasswordResetEmail(data)`

**Parameters:**
```typescript
{
  email: string;              // User's email address
  resetToken: string;         // Secure reset token
  resetUrl?: string;          // Base URL (optional)
  expirationMinutes?: number; // Token expiration (default: 60)
}
```

**Returns:** HTML email content

**Features:**
- Security-focused design
- Reset link with token
- Expiration time display
- Security warnings
- Password best practices
- Mobile-responsive

## Error Handling

### Automatic Retry

The email system automatically retries failed sends:
- **Retry Count:** 3 attempts
- **Backoff:** Exponential (1s, 2s, 4s)
- **Retry Conditions:** Server errors (5xx), rate limiting (429), network errors

### Error Logging

All errors are logged with details:
```typescript
console.error('Email send error:', error);
console.error('Azure AD authentication error:', error);
console.error('Failed to queue welcome email:', error);
```

### Non-Blocking Behavior

Using `sendEmailAsync()` ensures critical flows are not blocked:
```typescript
// Registration completes immediately
await createUser(userData);

// Email is sent in background
sendEmailAsync({ to: user.email, ... });

// Return success to user
return res.status(201).json({ success: true });
```

## Security

### Azure AD Authentication
- Client credentials flow (server-to-server)
- Credentials stored in environment variables
- Token caching with 5-minute buffer
- Never exposed to client-side code

### Email Content
- No sensitive data in email bodies
- Reset tokens are one-time use
- Expiration times clearly communicated
- Security warnings for unsolicited emails

### Rate Limiting
- Respects Microsoft Graph API rate limits
- Exponential backoff on rate limit errors
- Token caching reduces API calls

## Performance

### Token Caching
- Access tokens cached for lifetime (minus 5-minute buffer)
- Reduces authentication requests to Azure AD
- Improves email sending performance

### Non-Blocking Email
- `sendEmailAsync()` returns immediately
- Email sending happens in background
- Critical flows are not delayed

### Retry Logic
- Automatic retry on transient failures
- Exponential backoff prevents API spam
- Maximum 3 retry attempts

## Monitoring

### Success Logs
```
Email sent successfully to user@example.com at 2025-01-26T12:00:00.000Z
Welcome email queued for user@example.com
```

### Error Logs
```
Email failed to user@example.com: Failed to send email via Graph API: 500
Failed to queue welcome email: Azure credentials not configured
Azure AD authentication error: Failed to get Azure access token: 401
```

### Metrics to Track
- Email send success rate
- Azure AD authentication failures
- Email delivery times
- Retry rates

## Troubleshooting

### Email Not Sending

1. **Check Azure credentials:**
   ```bash
   echo $AZURE_TENANT_ID
   echo $AZURE_CLIENT_ID
   echo $AZURE_CLIENT_SECRET
   ```

2. **Verify sender mailbox:**
   - Must be valid Office 365 mailbox
   - Must have Exchange Online license
   - Must be accessible by Azure App

3. **Check API permissions:**
   - Microsoft Graph API
   - Mail.Send (Application permission)
   - Admin consent granted

### Authentication Failures

1. **Verify tenant ID:**
   - Check Azure Portal → Azure Active Directory → Overview
   - Copy Directory (tenant) ID

2. **Verify client ID:**
   - Check Azure Portal → App registrations → Your app
   - Copy Application (client) ID

3. **Verify client secret:**
   - Check Azure Portal → App registrations → Your app → Certificates & secrets
   - Create new secret if expired

### Rate Limiting

If you see 429 errors:
1. Reduce email sending frequency
2. Implement request queuing
3. Upgrade to higher tier if needed

## Azure Setup Guide

### 1. Create App Registration

1. Go to Azure Portal → Azure Active Directory
2. Click "App registrations" → "New registration"
3. Enter name: "Bitcoin Sovereign Email Service"
4. Select "Accounts in this organizational directory only"
5. Click "Register"

### 2. Add API Permissions

1. Go to your app → API permissions
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Select "Application permissions"
5. Search for "Mail.Send"
6. Check "Mail.Send"
7. Click "Add permissions"
8. Click "Grant admin consent"

### 3. Create Client Secret

1. Go to your app → Certificates & secrets
2. Click "New client secret"
3. Enter description: "Email Service Secret"
4. Select expiration: 24 months
5. Click "Add"
6. **Copy the secret value immediately** (you won't see it again)

### 4. Configure Sender Mailbox

1. Ensure mailbox exists in Office 365
2. Verify Exchange Online license is assigned
3. Test mailbox can send/receive emails
4. Add mailbox address to SENDER_EMAIL environment variable

## Testing

### Test Email Sending

```typescript
import { sendEmail } from './email/office365';

// Test basic email
const result = await sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  body: '<h1>Test</h1>',
  contentType: 'HTML'
});

console.log('Result:', result);
```

### Test Welcome Email

```typescript
import { sendEmail } from './email/office365';
import { generateWelcomeEmail } from './email/templates/welcome';

const emailHtml = generateWelcomeEmail({
  email: 'test@example.com',
  platformUrl: 'https://news.arcane.group'
});

const result = await sendEmail({
  to: 'test@example.com',
  subject: 'Welcome Test',
  body: emailHtml,
  contentType: 'HTML'
});

console.log('Result:', result);
```

### Test Password Reset Email

```typescript
import { sendEmail } from './email/office365';
import { generatePasswordResetEmail } from './email/templates/passwordReset';

const emailHtml = generatePasswordResetEmail({
  email: 'test@example.com',
  resetToken: 'test-token-123',
  expirationMinutes: 60
});

const result = await sendEmail({
  to: 'test@example.com',
  subject: 'Password Reset Test',
  body: emailHtml,
  contentType: 'HTML'
});

console.log('Result:', result);
```

## Support

For issues or questions:
1. Check Azure Portal for service health
2. Review error logs in Vercel dashboard
3. Verify environment variables are set correctly
4. Test with Microsoft Graph Explorer: https://developer.microsoft.com/en-us/graph/graph-explorer

## Resources

- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [Send Mail API Reference](https://docs.microsoft.com/en-us/graph/api/user-sendmail)
- [Azure AD Authentication](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [Office 365 Email Setup Guide](../../OFFICE-365-EMAIL-SETUP.md)
