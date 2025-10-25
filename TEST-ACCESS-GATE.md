# Access Gate Testing Guide

## Quick Test Checklist

### ✅ Visual Testing

1. **Initial Screen**
   - [ ] Pure black background
   - [ ] Orange lock icon with glow
   - [ ] "Bitcoin Sovereign Technology" title in white
   - [ ] "Early Access Required" subtitle in orange
   - [ ] Two buttons: "Enter Access Code" and "Apply for Early Access"
   - [ ] Orange borders on container
   - [ ] Smooth fade-in animation

2. **Code Entry Screen**
   - [ ] Input field with orange border
   - [ ] Placeholder text visible
   - [ ] "Verify Code" button (orange)
   - [ ] "Back" button (orange outline)
   - [ ] Focus state shows orange glow
   - [ ] Error message displays in orange if code is wrong

3. **Application Form Screen**
   - [ ] All form fields visible
   - [ ] Labels in white with orange asterisks for required fields
   - [ ] Input fields with orange borders
   - [ ] Textarea for message
   - [ ] "Submit Application" button (orange)
   - [ ] "Back" button (orange outline)
   - [ ] Validation errors show in orange

4. **Success Screen**
   - [ ] Large orange checkmark with glow
   - [ ] Success message in white
   - [ ] User's email displayed in orange monospace
   - [ ] "Back to Options" button

### ✅ Functionality Testing

#### Test 1: Access Code Entry

1. Start the dev server: `npm run dev`
2. Visit `http://localhost:3000`
3. Click "Enter Access Code"
4. Enter wrong code: `WRONG123`
   - **Expected:** Error message appears
5. Enter correct code: `BITCOIN2025` (or your configured code)
   - **Expected:** Access granted, redirected to main page
6. Refresh the page
   - **Expected:** Still have access (sessionStorage)
7. Close browser and reopen
   - **Expected:** Access gate appears again

#### Test 2: Application Form

1. Visit `http://localhost:3000`
2. Click "Apply for Early Access"
3. Try submitting empty form
   - **Expected:** Validation errors appear
4. Fill in invalid data:
   - Email: `notanemail`
   - Telegram: `username` (without @)
   - Twitter: `handle` (without @)
   - **Expected:** Validation errors for each field
5. Fill in valid data:
   - Email: `test@example.com`
   - Telegram: `@testuser`
   - Twitter: `@testuser`
   - Message: `Testing the access gate`
6. Click "Submit Application"
   - **Expected:** Loading spinner appears
   - **Expected:** Success screen shows
   - **Expected:** Email sent to `no-reply@arcane.group`
   - **Expected:** Confirmation email sent to applicant

#### Test 3: Mobile Responsiveness

1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on different devices:
   - iPhone SE (375px)
   - iPhone 14 (390px)
   - iPad Mini (768px)
   - iPad Pro (1024px)
4. Check:
   - [ ] Container fits screen
   - [ ] Text is readable
   - [ ] Buttons are at least 48px tall
   - [ ] Form inputs don't cause zoom on iOS
   - [ ] Scrolling works if content overflows

### ✅ Email Testing

#### Prerequisites
- SMTP credentials configured in `.env.local`
- Email service accessible (not blocked by firewall)

#### Test Email Delivery

1. Submit an application with your real email
2. Check `no-reply@arcane.group` inbox:
   - **Expected:** Email with applicant details
   - **Expected:** Formatted with ASCII borders
   - **Expected:** Includes timestamp and IP
3. Check applicant's inbox:
   - **Expected:** Confirmation email received
   - **Expected:** Professional formatting
   - **Expected:** Next steps explained
4. Check spam folders if emails not received

#### Test Email Content

**Admin Email Should Include:**
- Applicant email, Telegram, Twitter
- Optional message (if provided)
- Timestamp
- IP address
- User agent

**Confirmation Email Should Include:**
- Thank you message
- Application details summary
- Next steps explanation
- Professional signature

### ✅ Security Testing

#### Test 1: Code Validation
- [ ] Case-insensitive (BITCOIN2025 = bitcoin2025)
- [ ] Whitespace trimmed
- [ ] Wrong codes rejected
- [ ] No code bypass possible

#### Test 2: Form Validation
- [ ] Email format validated
- [ ] Telegram @ prefix required
- [ ] Twitter @ prefix required
- [ ] XSS attempts sanitized
- [ ] SQL injection attempts blocked

#### Test 3: Session Management
- [ ] Access persists in same session
- [ ] Access cleared on browser close
- [ ] No access without code
- [ ] SessionStorage used (not localStorage)

### ✅ Performance Testing

1. **Load Time**
   - [ ] Access gate appears within 1 second
   - [ ] No layout shift during load
   - [ ] Smooth animations

2. **Form Submission**
   - [ ] Loading state shows immediately
   - [ ] Response within 5 seconds
   - [ ] No double submissions possible

3. **Error Handling**
   - [ ] Network errors handled gracefully
   - [ ] Timeout errors show user-friendly message
   - [ ] Retry option available

### ✅ Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### ✅ Accessibility Testing

1. **Keyboard Navigation**
   - [ ] Tab through all interactive elements
   - [ ] Enter key submits forms
   - [ ] Escape key closes (if applicable)
   - [ ] Focus states visible (orange outline)

2. **Screen Reader**
   - [ ] All form labels read correctly
   - [ ] Error messages announced
   - [ ] Button purposes clear
   - [ ] Success messages announced

3. **Color Contrast**
   - [ ] White on black: 21:1 (AAA)
   - [ ] Orange on black: 5.8:1 (AA)
   - [ ] All text meets WCAG AA standards

## Common Issues & Solutions

### Issue: "Invalid access code" always shows
**Solution:** Check `NEXT_PUBLIC_ACCESS_CODE` in `.env.local` and restart dev server

### Issue: Email not sending
**Solution:** 
1. Verify SMTP credentials
2. Check firewall settings
3. Test with Gmail app password
4. Check spam folder

### Issue: Form validation not working
**Solution:** Check browser console for JavaScript errors

### Issue: Access gate not showing
**Solution:** Clear sessionStorage: `sessionStorage.clear()` in browser console

### Issue: Styling looks wrong
**Solution:** 
1. Check `styles/globals.css` loaded
2. Clear browser cache
3. Verify Tailwind CSS compiled

## Manual Testing Script

```javascript
// Run in browser console

// Test 1: Check sessionStorage
console.log('Has access:', sessionStorage.getItem('hasAccess'));

// Test 2: Grant access manually
sessionStorage.setItem('hasAccess', 'true');
location.reload();

// Test 3: Revoke access
sessionStorage.removeItem('hasAccess');
location.reload();

// Test 4: Check environment variable
console.log('Access code configured:', !!process.env.NEXT_PUBLIC_ACCESS_CODE);
```

## Automated Testing (Future)

Consider adding:
- Jest unit tests for validation logic
- Cypress E2E tests for user flows
- Email delivery tests with mock SMTP
- Accessibility tests with axe-core

## Production Checklist

Before deploying to production:

- [ ] Change default access code
- [ ] Configure production SMTP
- [ ] Test email delivery in production
- [ ] Verify Vercel environment variables
- [ ] Test on real mobile devices
- [ ] Monitor error logs
- [ ] Set up email monitoring
- [ ] Document access code distribution process

---

**Testing Status:** Ready for QA  
**Last Updated:** January 2025  
**Version:** 1.0.0
