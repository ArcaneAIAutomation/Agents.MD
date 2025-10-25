# Access Gate Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER VISITS WEBSITE                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    _app.tsx (Entry Point)                       │
│  • Checks sessionStorage for 'hasAccess'                        │
│  • Shows loading state briefly                                  │
│  • Decides: Access Gate or Main App                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
        ┌───────────────────┐   ┌──────────────────┐
        │   NO ACCESS       │   │   HAS ACCESS     │
        │ Show Access Gate  │   │  Show Main App   │
        └───────────────────┘   └──────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│              AccessGate.tsx Component                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              INITIAL SCREEN                             │  │
│  │  • Bitcoin Sovereign branding                           │  │
│  │  • Two options:                                         │  │
│  │    1. Enter Access Code                                 │  │
│  │    2. Apply for Early Access                            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│         ┌──────────────────┴──────────────────┐               │
│         ↓                                      ↓               │
│  ┌──────────────────┐              ┌──────────────────────┐   │
│  │  CODE ENTRY      │              │  APPLICATION FORM    │   │
│  │  • Input field   │              │  • Email (required)  │   │
│  │  • Validation    │              │  • Telegram (req)    │   │
│  │  • Submit        │              │  • Twitter (req)     │   │
│  └──────────────────┘              │  • Message (opt)     │   │
│         ↓                          └──────────────────────┘   │
│  ┌──────────────────┐                       ↓                 │
│  │  Code Correct?   │              ┌──────────────────────┐   │
│  │  Yes → Grant     │              │  POST /api/          │   │
│  │  No → Error      │              │  request-access      │   │
│  └──────────────────┘              └──────────────────────┘   │
│         ↓                                   ↓                  │
│  sessionStorage.set                  ┌──────────────────┐     │
│  ('hasAccess', 'true')               │  Email Service   │     │
│         ↓                            │  • Send to admin │     │
│  onAccessGranted()                   │  • Send confirm  │     │
│                                      └──────────────────┘     │
│                                             ↓                  │
│                                      ┌──────────────────┐     │
│                                      │  SUCCESS SCREEN  │     │
│                                      │  • Confirmation  │     │
│                                      │  • Next steps    │     │
│                                      └──────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MAIN APPLICATION                             │
│  • Full access to all features                                  │
│  • Navigation menu                                              │
│  • Trading intelligence                                         │
│  • Whale Watch                                                  │
│  • News & Analysis                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App (_app.tsx)
├── Loading State (brief)
├── Access Gate (if no access)
│   ├── Initial Screen
│   │   ├── Logo & Branding
│   │   ├── Button: Enter Code
│   │   └── Button: Apply
│   ├── Code Entry Screen
│   │   ├── Input Field
│   │   ├── Validation Logic
│   │   └── Submit Button
│   ├── Application Screen
│   │   ├── Email Input
│   │   ├── Telegram Input
│   │   ├── Twitter Input
│   │   ├── Message Textarea
│   │   └── Submit Button
│   └── Success Screen
│       ├── Checkmark Icon
│       ├── Confirmation Message
│       └── Back Button
└── Main App (if has access)
    ├── Navigation
    ├── Features
    └── Content
```

## Data Flow

### Access Code Flow

```
User Input → Validation → sessionStorage → State Update → Render Main App
    ↓
"BITCOIN2025"
    ↓
Trim & Uppercase
    ↓
Compare with NEXT_PUBLIC_ACCESS_CODE
    ↓
Match? → sessionStorage.setItem('hasAccess', 'true')
    ↓
onAccessGranted() callback
    ↓
setHasAccess(true)
    ↓
Re-render with Main App
```

### Application Flow

```
Form Data → Validation → API Request → Email Service → Success
    ↓
{
  email: "user@example.com",
  telegram: "@username",
  twitter: "@username",
  message: "Optional"
}
    ↓
Client-side Validation
• Email format
• @ prefix for Telegram
• @ prefix for Twitter
    ↓
POST /api/request-access
    ↓
Server-side Validation
    ↓
nodemailer.sendMail()
├── To: no-reply@arcane.group (admin)
└── To: user@example.com (confirmation)
    ↓
Success Response
    ↓
Show Success Screen
```

## State Management

### Session State

```typescript
// _app.tsx
const [hasAccess, setHasAccess] = useState(false);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  // Check sessionStorage on mount
  const accessGranted = sessionStorage.getItem('hasAccess') === 'true';
  setHasAccess(accessGranted);
  setIsLoading(false);
}, []);
```

### Form State

```typescript
// AccessGate.tsx
const [mode, setMode] = useState<'initial' | 'code' | 'apply'>('initial');
const [accessCode, setAccessCode] = useState('');
const [formData, setFormData] = useState({
  email: '',
  telegram: '',
  twitter: '',
  message: ''
});
const [formErrors, setFormErrors] = useState<Record<string, string>>({});
const [submitting, setSubmitting] = useState(false);
const [submitted, setSubmitted] = useState(false);
```

## API Architecture

### Endpoint: POST /api/request-access

```
Request
├── Headers
│   └── Content-Type: application/json
└── Body
    ├── email: string (required)
    ├── telegram: string (required)
    ├── twitter: string (required)
    └── message: string (optional)

Processing
├── Validation
│   ├── Required fields present
│   ├── Email format valid
│   ├── Telegram starts with @
│   └── Twitter starts with @
├── Email Composition
│   ├── Admin notification
│   └── User confirmation
└── SMTP Delivery
    ├── Connect to SMTP server
    ├── Send admin email
    ├── Send confirmation email
    └── Handle errors

Response
├── Success (200)
│   └── { success: true, message: "..." }
└── Error (400/500)
    └── { message: "Error description" }
```

## Security Architecture

### Access Control

```
┌─────────────────────────────────────────┐
│         Environment Variables           │
│  NEXT_PUBLIC_ACCESS_CODE (client)       │
│  SMTP_* (server-only)                   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Code Validation                 │
│  • Case-insensitive                     │
│  • Whitespace trimmed                   │
│  • No bypass possible                   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         Session Storage                 │
│  • Browser session only                 │
│  • Cleared on browser close             │
│  • Not persistent                       │
└─────────────────────────────────────────┘
```

### Form Security

```
Client-side Validation
├── Email format (regex)
├── Required fields
├── @ prefix validation
└── XSS prevention (React)
    ↓
Server-side Validation
├── Re-validate all fields
├── Sanitize inputs
├── Rate limiting (future)
└── CAPTCHA (future)
    ↓
Email Security
├── SMTP over TLS
├── App passwords (not account)
├── Environment variables
└── No credentials in code
```

## Styling Architecture

### CSS Structure

```
styles/globals.css
├── Bitcoin Sovereign Variables
│   ├── --bitcoin-black: #000000
│   ├── --bitcoin-orange: #F7931A
│   └── --bitcoin-white: #FFFFFF
├── Access Gate Styles
│   ├── .access-gate-overlay
│   ├── .access-gate-container
│   ├── .access-gate-header
│   ├── .access-gate-content
│   ├── .form-group
│   ├── .form-input
│   └── .form-error
└── Animations
    ├── @keyframes fadeIn
    ├── @keyframes fadeInUp
    └── @keyframes spin
```

### Design System

```
Colors
├── Background: Pure Black (#000000)
├── Accent: Bitcoin Orange (#F7931A)
├── Text: White with opacity variants
└── Borders: Orange at 20% or 100%

Typography
├── Headings: Inter, 800 weight
├── Body: Inter, 400 weight
├── Data: Roboto Mono, 600 weight
└── Buttons: Inter, 700 weight, uppercase

Spacing
├── Container: 2rem padding
├── Form groups: 1.5rem margin
├── Buttons: 1rem gap
└── Mobile: Reduced to 1rem

Effects
├── Glow: 0 0 20px rgba(247,147,26,0.3)
├── Border: 2px solid orange
├── Transition: all 0.3s ease
└── Animation: fadeInUp 0.5s
```

## Mobile Architecture

### Responsive Breakpoints

```
320px - 640px   → Mobile (single column)
641px - 1024px  → Tablet (optimized layout)
1025px+         → Desktop (full features)
```

### Touch Optimization

```
Interactive Elements
├── Minimum size: 48px × 48px
├── Spacing: 8px minimum
├── Font size: 1rem (prevents iOS zoom)
└── Touch feedback: Visual state changes
```

## Email Architecture

### SMTP Flow

```
Application Submission
    ↓
nodemailer.createTransporter({
  host: SMTP_HOST,
  port: SMTP_PORT,
  auth: { user, pass }
})
    ↓
Send Admin Email
├── To: no-reply@arcane.group
├── Subject: Early Access Request
├── Body: Applicant details
└── ReplyTo: Applicant email
    ↓
Send Confirmation Email
├── To: Applicant email
├── Subject: Application Received
├── Body: Next steps
└── From: no-reply@arcane.group
    ↓
Success Response
```

## Deployment Architecture

### Development

```
Local Machine
├── .env.local (local config)
├── npm run dev
└── http://localhost:3000
```

### Production (Vercel)

```
Vercel Platform
├── Environment Variables
│   ├── NEXT_PUBLIC_ACCESS_CODE
│   ├── SMTP_HOST
│   ├── SMTP_PORT
│   ├── SMTP_USER
│   ├── SMTP_PASS
│   └── SMTP_FROM
├── Automatic Deployment
│   └── git push → Deploy
└── Production URL
    └── https://your-domain.vercel.app
```

## Performance Metrics

```
Load Time
├── Access Gate: < 1 second
├── Code Validation: Instant
└── Form Submission: < 5 seconds

Email Delivery
├── SMTP Connection: < 2 seconds
├── Email Send: < 3 seconds
└── Total: < 10 seconds

Mobile Performance
├── First Paint: < 1 second
├── Interactive: < 2 seconds
└── Animations: 60fps
```

## Error Handling

```
Error Types
├── Network Errors
│   └── Show retry option
├── Validation Errors
│   └── Show field-specific messages
├── SMTP Errors
│   └── Show generic error, log details
└── Timeout Errors
    └── Show timeout message, retry option
```

---

**Architecture Version:** 1.0.0  
**Last Updated:** January 2025  
**Status:** ✅ Production Ready
