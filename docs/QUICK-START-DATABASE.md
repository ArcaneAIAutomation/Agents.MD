# Quick Start: Database Setup
## Bitcoin Sovereign Technology - Authentication System

**⏱️ Estimated Time:** 10-15 minutes

---

## Prerequisites

- ✅ Vercel account
- ✅ Node.js 18+ installed
- ✅ Project code downloaded

---

## Step-by-Step Setup

### 1️⃣ Create Vercel Postgres Database (3 minutes)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **Storage** → **Create Database** → **Postgres**
4. Name: `bitcoin-sovereign-auth`
5. Region: Choose closest to you
6. Click **Create**

### 2️⃣ Get Connection String (1 minute)

1. Click on your new database
2. Go to **.env.local** tab
3. Copy the `POSTGRES_URL` value

### 3️⃣ Configure Environment (2 minutes)

Create/edit `.env.local` in your project root:

```bash
# Database
DATABASE_URL="paste_your_postgres_url_here"

# JWT Secret (generate below)
JWT_SECRET="paste_generated_secret_here"
```

Generate JWT secret:
```bash
# Mac/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Node.js (any platform)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4️⃣ Install Dependencies (1 minute)

```bash
npm install pg @types/pg
```

### 5️⃣ Run Migrations (2 minutes)

```bash
npx ts-node scripts/run-migrations.ts
```

Expected output:
```
✅ Database connection successful!
✅ Migration completed successfully
✅ All expected tables are present!
```

### 6️⃣ Import Access Codes (1 minute)

```bash
npx ts-node scripts/import-access-codes.ts
```

Expected output:
```
✅ Successfully imported: 11
✅ All expected codes are present in the database!
```

### 7️⃣ Verify Setup (1 minute)

```bash
npx ts-node -e "import('./lib/db').then(db => db.testConnection())"
```

Expected output:
```
✅ Database connection test successful
```

---

## ✅ You're Done!

Your database is now set up and ready for authentication development.

### What You Have Now:

- ✅ Vercel Postgres database
- ✅ 4 tables (users, access_codes, sessions, auth_logs)
- ✅ 13 performance indexes
- ✅ 11 access codes imported
- ✅ Database utilities ready to use

### Next Steps:

1. **Task 2:** Implement authentication utilities
   - Password hashing (bcrypt)
   - JWT token generation
   - Rate limiting middleware

2. **Task 3:** Build API endpoints
   - Registration endpoint
   - Login endpoint
   - Logout endpoint

3. **Task 4:** Create frontend components
   - Registration form
   - Login form
   - Auth provider

---

## Troubleshooting

### "DATABASE_URL is not set"
- Check `.env.local` exists in project root
- Restart dev server: `npm run dev`

### "Connection timeout"
- Verify database URL is correct
- Check internet connection
- Ensure database is not paused in Vercel

### "Cannot find module 'pg'"
```bash
npm install pg @types/pg
```

### Need More Help?
- See: `docs/DATABASE-SETUP-GUIDE.md` (comprehensive guide)
- See: `migrations/README.md` (migration details)

---

**Last Updated:** January 26, 2025  
**Status:** ✅ Ready to use
