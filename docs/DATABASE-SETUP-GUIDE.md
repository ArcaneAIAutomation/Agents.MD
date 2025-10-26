# Database Setup Guide
## Bitcoin Sovereign Technology - Authentication System

This guide walks you through setting up Vercel Postgres for the authentication system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Vercel Postgres Database](#create-vercel-postgres-database)
3. [Configure Environment Variables](#configure-environment-variables)
4. [Run Database Migrations](#run-database-migrations)
5. [Import Access Codes](#import-access-codes)
6. [Verify Setup](#verify-setup)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- ✅ A Vercel account (free tier works)
- ✅ Node.js 18+ installed
- ✅ Project deployed to Vercel (or linked locally)
- ✅ Access to your project's Vercel dashboard

---

## Create Vercel Postgres Database

### Step 1: Navigate to Storage

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click on the **"Storage"** tab in the top navigation

### Step 2: Create Database

1. Click **"Create Database"**
2. Select **"Postgres"**
3. Configure your database:
   - **Name**: `bitcoin-sovereign-auth` (or your preferred name)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
   - **Plan**: Start with **Hobby** (free tier)
4. Click **"Create"**

### Step 3: Wait for Provisioning

- Database creation takes 30-60 seconds
- You'll see a success message when ready
- The database will appear in your Storage list

---

## Configure Environment Variables

### Step 1: Get Database Connection String

1. Click on your newly created database
2. Navigate to the **".env.local"** tab
3. You'll see several environment variables:
   ```bash
   POSTGRES_URL="postgres://default:xxxxx@xxxxx.postgres.vercel-storage.com:5432/verceldb"
   POSTGRES_PRISMA_URL="..."
   POSTGRES_URL_NON_POOLING="..."
   ```
4. Copy the **`POSTGRES_URL`** value

### Step 2: Update Local Environment

1. Open your `.env.local` file (create if it doesn't exist)
2. Add the database URL:
   ```bash
   DATABASE_URL="postgres://default:xxxxx@xxxxx.postgres.vercel-storage.com:5432/verceldb?sslmode=require"
   ```

### Step 3: Generate JWT Secret

Generate a secure random string for JWT signing:

```bash
# Using OpenSSL (Mac/Linux)
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using PowerShell (Windows)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Add to `.env.local`:
```bash
JWT_SECRET="your_generated_secret_here"
```

### Step 4: Set Up Vercel KV (Optional - for Rate Limiting)

1. In Vercel Dashboard, go to **Storage** tab
2. Click **"Create Database"**
3. Select **"KV"** (Redis)
4. Name it `bitcoin-sovereign-kv`
5. Click **"Create"**
6. Copy the KV environment variables to `.env.local`:
   ```bash
   KV_REST_API_URL="https://xxxxx.kv.vercel-storage.com"
   KV_REST_API_TOKEN="xxxxx"
   KV_REST_API_READ_ONLY_TOKEN="xxxxx"
   ```

### Step 5: Complete .env.local File

Your `.env.local` should now include:

```bash
# Database
DATABASE_URL="postgres://default:xxxxx@xxxxx.postgres.vercel-storage.com:5432/verceldb?sslmode=require"

# Authentication
JWT_SECRET="your_generated_secret_here"
JWT_EXPIRATION="7d"

# Rate Limiting (Optional)
KV_REST_API_URL="https://xxxxx.kv.vercel-storage.com"
KV_REST_API_TOKEN="xxxxx"
KV_REST_API_READ_ONLY_TOKEN="xxxxx"
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
AUTH_RATE_LIMIT_WINDOW_MS=900000

# Email (Office 365 - if configured)
OFFICE365_CLIENT_ID="your_client_id"
OFFICE365_CLIENT_SECRET="your_client_secret"
OFFICE365_TENANT_ID="your_tenant_id"
OFFICE365_FROM_EMAIL="no-reply@arcane.group"
```

---

## Run Database Migrations

### Option 1: Using the Migration Runner Script (Recommended)

```bash
# Install dependencies if not already installed
npm install pg @types/pg

# Run migrations
npx ts-node scripts/run-migrations.ts
```

Expected output:
```
✅ Database connection successful!
✅ Migrations tracking table ready
📝 Migration: 001 - Initial Schema
✅ Migration completed successfully
✅ All expected tables are present!
```

### Option 2: Using psql Command Line

If you have PostgreSQL client installed:

```bash
psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

### Option 3: Using Vercel Dashboard

1. Go to your database in Vercel Dashboard
2. Click on the **"Query"** tab
3. Copy the entire contents of `migrations/001_initial_schema.sql`
4. Paste into the query editor
5. Click **"Run Query"**
6. Verify success message

### What Gets Created

The migration creates:

**Tables:**
- `users` - User accounts with password hashes
- `access_codes` - One-time use registration codes
- `sessions` - Active user sessions
- `auth_logs` - Authentication event audit trail

**Indexes:**
- 13 indexes for optimal query performance
- Covering email lookups, code validation, session management

**Constraints:**
- Unique constraints on emails and access codes
- Foreign key relationships with cascading deletes
- Check constraints for data validation

---

## Import Access Codes

### Run the Import Script

```bash
npx ts-node scripts/import-access-codes.ts
```

Expected output:
```
✅ Database connection successful!
✅ Imported: BITCOIN2025
✅ Imported: BTC-SOVEREIGN-K3QYMQ-01
✅ Imported: BTC-SOVEREIGN-AKCJRG-02
... (9 more codes)

📊 Import Summary:
✅ Successfully imported: 11
📦 Total codes: 11

✅ All expected codes are present in the database!
```

### What Gets Imported

The script imports 11 access codes:
1. `BITCOIN2025` (default code)
2. `BTC-SOVEREIGN-K3QYMQ-01` through `BTC-SOVEREIGN-BYE9UX-10` (10 early access codes)

All codes are marked as **unredeemed** and ready for use.

---

## Verify Setup

### Test Database Connection

```bash
npx ts-node -e "import('./lib/db').then(db => db.testConnection())"
```

Expected output:
```
✅ Database connection test successful
```

### Check Tables

Run this query in Vercel Dashboard Query tab:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- `access_codes`
- `auth_logs`
- `schema_migrations`
- `sessions`
- `users`

### Check Access Codes

```sql
SELECT code, redeemed, created_at 
FROM access_codes 
ORDER BY created_at;
```

You should see all 11 codes with `redeemed = false`.

### Check Indexes

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

You should see 13+ indexes.

---

## Troubleshooting

### Connection Issues

**Problem:** "DATABASE_URL is not set"

**Solution:**
1. Verify `.env.local` exists in project root
2. Check that `DATABASE_URL` is set correctly
3. Restart your development server: `npm run dev`

---

**Problem:** "Connection timeout"

**Solution:**
1. Check your internet connection
2. Verify the database URL is correct (copy from Vercel Dashboard)
3. Ensure the database is not paused (Vercel may pause inactive databases)
4. Try accessing the database from Vercel Dashboard Query tab

---

**Problem:** "SSL connection error"

**Solution:**
Add `?sslmode=require` to the end of your DATABASE_URL:
```bash
DATABASE_URL="postgres://...?sslmode=require"
```

---

### Migration Issues

**Problem:** "relation already exists"

**Solution:**
The migration has already been run. This is normal if you're running it again.

To reset (⚠️ **WARNING: Deletes all data**):
```sql
DROP TABLE IF EXISTS auth_logs CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS access_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS schema_migrations CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

Then run migrations again.

---

**Problem:** "permission denied"

**Solution:**
1. Verify you're using the correct connection string from Vercel
2. Check that your database user has CREATE privileges
3. Try using the non-pooling connection string (`POSTGRES_URL_NON_POOLING`)

---

### Import Script Issues

**Problem:** "Cannot find module 'pg'"

**Solution:**
```bash
npm install pg @types/pg
```

---

**Problem:** "No codes imported"

**Solution:**
1. Verify migrations ran successfully first
2. Check that `access_codes` table exists
3. Test database connection
4. Check for error messages in script output

---

### Vercel Deployment Issues

**Problem:** Environment variables not working in production

**Solution:**
1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add all required variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `KV_REST_API_URL` (if using rate limiting)
   - `KV_REST_API_TOKEN` (if using rate limiting)
3. Redeploy your application

---

**Problem:** Database connection works locally but not in production

**Solution:**
1. Ensure you're using the production database URL in Vercel environment variables
2. Check that SSL mode is enabled: `?sslmode=require`
3. Verify the database is in the same region as your Vercel deployment (or close)
4. Check Vercel function logs for specific error messages

---

## Next Steps

After successful setup:

1. ✅ Database schema created
2. ✅ Access codes imported
3. ⏭️ **Next:** Implement authentication utilities (Task 2)
   - Password hashing with bcrypt
   - JWT token generation
   - Rate limiting middleware
4. ⏭️ **Then:** Build API endpoints (Task 3)
   - Registration endpoint
   - Login endpoint
   - Logout endpoint
5. ⏭️ **Finally:** Create frontend components (Task 4)
   - Registration form
   - Login form
   - Auth provider

---

## Additional Resources

- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section above
- Review the design document: `.kiro/specs/secure-user-authentication/design.md`
- Check migration logs in `scripts/run-migrations.ts` output
- Verify environment variables in `.env.local`

---

**Last Updated:** January 26, 2025  
**Version:** 1.0.0  
**Status:** ✅ Ready for use
