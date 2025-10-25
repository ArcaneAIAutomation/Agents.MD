# Access Gate Setup Guide

## Overview

The Bitcoin Sovereign Technology platform now includes a password protection system with two access methods:

1. **Early Access Code** - Users can enter a code to gain immediate access
2. **Apply for Early Access** - Users can submit an application form to request access

## Features

### Early Access Code
- Simple code entry interface
- Case-insensitive validation
- Stored in sessionStorage (persists during browser session)
- Configurable via environment variable

### Application Form
- Collects: Email, Telegram handle, Twitter/X account, optional message
- Client-side validation
- Sends email to `no-reply@arcane.group`
- Sends confirmation email to applicant
- Professional Bitcoin Sovereign styling

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install `nodemailer` and `@types/nodemailer` for email functionality.

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Access Control
NEXT_PUBLIC_ACCESS_CODE=BITCOIN2025

# Office 365 Email Configuration (via Azure AD)
AZURE_TENANT_ID=c152592e-75fe-4f4f-8e8a-8acf38daf0b3
AZURE_CLIENT_ID=83bcb34c-3c73-41e9-8dc8-94d257e8755c
AZURE_CLIENT_SECRET=F6U8Q~J-GFXtxSBWf5paE3jyIsGoir6rKAgTWbTp
SENDER_EMAIL=no-reply@arcane.group
```

### 3. Office 365 / Azure Setup

The access gate uses **Microsoft Graph API** with Azure AD authentication for email delivery.

#### Prerequisites
- Office 365 tenant with Azure AD
- Valid Office 365 mailbox (e.g., no-reply@arcane.group)
- Azure App Registration with Mail.Send permissions

#### Azure Configuration (Already Configured)

Your Azure credentials are already set up in `.env.local`:

```bash
AZURE_TENANT_ID=c152592e-75fe-4f4f-8e8a-8acf38daf0b3
AZURE_CLIENT_ID=83bcb34c-3c73-41e9-8dc8-94d257e8755c
AZURE_CLIENT_SECRET=F6U8Q~J-GFXtxSBWf5paE3jyIsGoir6rKAgTWbTp
SENDER_EMAIL=no-reply@arcane.group
```

#### How It Works

1. **Authentication**: Uses Azure AD client credentials flow
2. **API**: Microsoft Graph API (`/users/{email}/sendMail`)
3. **Permissions**: Application permission `Mail.Send`
4. **Sender**: Must be a valid Office 365 mailbox in your tenant

#### Verify Configuration

To verify your Azure setup is working:

1. Ensure the sender email (`no-reply@arcane.group`) exists in Office 365
2. Verify the Azure App Registration has `Mail.Send` permission
3. Confirm admin consent has been granted for the permission
4. Test by submitting an application form

### 4. Vercel Deployment

Add environment variables in Vercel dashboard:

1. Go to your project settings
2. Navigate to Environment Variables
3. Add:
   - `NEXT_PUBLIC_ACCESS_CODE` (visible to client)
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`

**Important:** `NEXT_PUBLIC_ACCESS_CODE` must have the `NEXT_PUBLIC_` prefix to be accessible in the browser.

## Usage

### For Users

#### Method 1: Enter Access Code
1. Visit the website
2. Click "Enter Access Code"
3. Enter the code (case-insensitive)
4. Click "Verify Code"
5. Access granted for the browser session

#### Method 2: Apply for Early Access
1. Visit the website
2. Click "Apply for Early Access"
3. Fill out the form:
   - Email address (required)
   - Telegram handle (required, must start with @)
   - Twitter/X account (required, must start with @)
   - Message to developers (optional)
4. Click "Submit Application"
5. Receive confirmation email
6. Wait for access code via email

### For Administrators

#### Changing the Access Code

1. Update `NEXT_PUBLIC_ACCESS_CODE` in `.env.local` (development)
2. Update in Vercel environment variables (production)
3. Redeploy the application

#### Reviewing Applications

Applications are sent to `no-reply@arcane.group`. Check this inbox for:
- Applicant email, Telegram, Twitter/X
- Optional message explaining why they want access
- Timestamp and IP address
- User agent information

#### Granting Access

1. Review the application
2. Reply to the applicant's email with an access code
3. Optionally create unique codes for tracking

## Security Considerations

### Access Code Security

- **Change the default code** (`BITCOIN2025`) immediately
- Use a strong, unique code (e.g., `BTC-SOVEREIGN-2025-ALPHA`)
- Rotate codes periodically
- Consider using unique codes per user for tracking

### Email Security

- **Never commit SMTP credentials** to version control
- Use environment variables for all sensitive data
- Use app passwords, not account passwords
- Enable 2FA on email accounts
- Monitor for suspicious activity

### Session Management

- Access is stored in `sessionStorage` (cleared when browser closes)
- Users must re-enter code in new browser sessions
- Consider implementing `localStorage` for persistent access
- Add expiration timestamps for time-limited access

## Customization

### Styling

All styles follow the Bitcoin Sovereign design system:
- Pure black background (`#000000`)
- Bitcoin orange accents (`#F7931A`)
- White text with opacity variants
- Thin orange borders
- Orange glow effects

Styles are in `styles/globals.css` under the "ACCESS GATE STYLING" section.

### Form Fields

To add/remove form fields, edit `components/AccessGate.tsx`:

1. Update `formData` state
2. Add validation in `validateForm()`
3. Add input field in the form JSX
4. Update email template in `pages/api/request-access.ts`

### Email Templates

Email templates are in `pages/api/request-access.ts`:
- Notification email (to admin)
- Confirmation email (to applicant)

Customize the text to match your brand voice.

## Troubleshooting

### "Invalid access code" error
- Check `NEXT_PUBLIC_ACCESS_CODE` is set correctly
- Verify the prefix `NEXT_PUBLIC_` is present
- Restart development server after changing env vars
- Check browser console for errors

### Email not sending
- Verify Azure credentials are correct (Tenant ID, Client ID, Client Secret)
- Ensure sender email exists in Office 365 tenant
- Check Azure App Registration has `Mail.Send` permission
- Verify admin consent has been granted
- Check spam folder for confirmation emails
- Review Vercel function logs for error messages

### Form validation errors
- Telegram handle must start with `@`
- Twitter/X handle must start with `@`
- Email must be valid format
- Check browser console for detailed errors

### Access not persisting
- Access is stored in `sessionStorage` (session-only)
- Closing browser clears access
- Use `localStorage` for persistent access (requires code change)

## API Endpoint

### POST /api/request-access

**Request Body:**
```json
{
  "email": "user@example.com",
  "telegram": "@username",
  "twitter": "@username",
  "message": "Optional message"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Application submitted successfully"
}
```

**Response (Error):**
```json
{
  "message": "Error description"
}
```

## Future Enhancements

- [ ] Database storage for applications
- [ ] Admin dashboard for reviewing applications
- [ ] Unique access codes per user
- [ ] Time-limited access codes
- [ ] Rate limiting on form submissions
- [ ] CAPTCHA integration
- [ ] OAuth integration (Google, Twitter)
- [ ] Waitlist management
- [ ] Automated approval system
- [ ] Analytics tracking

## Support

For issues or questions:
- Check this documentation first
- Review environment variables
- Check browser console for errors
- Contact development team

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
