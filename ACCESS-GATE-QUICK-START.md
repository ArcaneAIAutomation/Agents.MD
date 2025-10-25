# Access Gate - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Access Code
Edit `.env.local` and add:
```bash
NEXT_PUBLIC_ACCESS_CODE=BITCOIN2025
```

### Step 3: Verify Office 365 Configuration
Your `.env.local` already has Office 365 configured:
```bash
AZURE_TENANT_ID=c152592e-75fe-4f4f-8e8a-8acf38daf0b3
AZURE_CLIENT_ID=83bcb34c-3c73-41e9-8dc8-94d257e8755c
AZURE_CLIENT_SECRET=F6U8Q~J-GFXtxSBWf5paE3jyIsGoir6rKAgTWbTp
SENDER_EMAIL=no-reply@arcane.group
```

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Test
1. Visit `http://localhost:3000`
2. Enter code: `BITCOIN2025`
3. Access granted! 🎉

## 📧 Office 365 Email (Already Configured)

Your email system uses Microsoft Graph API with Azure AD:
- **Provider:** Office 365
- **Authentication:** Azure AD Client Credentials
- **Sender:** no-reply@arcane.group
- **Status:** ✅ Ready to use

See `OFFICE-365-EMAIL-SETUP.md` for detailed configuration.

## 🔐 Default Access Code

**Development:** `BITCOIN2025`  
**Production:** Change in Vercel environment variables

## 📱 Features

✅ Password protection  
✅ Application form  
✅ Email notifications  
✅ Mobile-optimized  
✅ Bitcoin Sovereign styling  
✅ Session management  

## 🎨 User Experience

### Method 1: Enter Code
1. Click "Enter Access Code"
2. Type: `BITCOIN2025`
3. Click "Verify Code"
4. ✅ Access granted

### Method 2: Apply
1. Click "Apply for Early Access"
2. Fill form (email, Telegram, Twitter)
3. Submit
4. Check email for confirmation
5. Wait for access code

## 🚢 Deploy to Vercel

1. Add environment variables:
   - `NEXT_PUBLIC_ACCESS_CODE`
   - `AZURE_TENANT_ID`
   - `AZURE_CLIENT_ID`
   - `AZURE_CLIENT_SECRET`
   - `SENDER_EMAIL`

2. Deploy:
```bash
git push origin main
```

3. Test on production URL

## 🔧 Troubleshooting

**Code not working?**
- Restart dev server after changing `.env.local`
- Check `NEXT_PUBLIC_` prefix is present

**Email not sending?**
- Verify Azure credentials in `.env.local`
- Check sender mailbox exists in Office 365
- Verify `Mail.Send` permission granted
- Check spam folder

**Access gate not showing?**
- Clear sessionStorage: `sessionStorage.clear()` in console
- Hard refresh: Ctrl+Shift+R

## 📚 Full Documentation

- **Setup Guide:** `ACCESS-GATE-SETUP.md`
- **Testing Guide:** `TEST-ACCESS-GATE.md`
- **Implementation Summary:** `ACCESS-GATE-IMPLEMENTATION-SUMMARY.md`

## 🎯 Quick Commands

```bash
# Automated setup
pwsh setup-access-gate.ps1

# Install dependencies
npm install

# Start dev server
npm run dev

# Deploy
git push origin main
```

## ✅ Checklist

- [ ] Dependencies installed
- [ ] Access code configured
- [ ] Office 365 configured (already done)
- [ ] Dev server running
- [ ] Access gate tested
- [ ] Email tested
- [ ] Ready for production

## 🆘 Need Help?

1. Check documentation files
2. Review browser console for errors
3. Verify environment variables
4. Test with default code first

---

**Status:** ✅ Ready to Use  
**Time to Setup:** 5 minutes  
**Difficulty:** Easy  
**Version:** 1.0.0
