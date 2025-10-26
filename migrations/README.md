# Database Migrations

This directory contains SQL migration files for the Bitcoin Sovereign Technology authentication system.

## Prerequisites

Before running migrations, you need:

1. **Vercel Postgres Database**: Create a new Postgres database in your Vercel dashboard
2. **Database URL**: Get the connection string from Vercel
3. **Environment Variable**: Set `DATABASE_URL` in your `.env.local` file

## Setup Instructions

### Step 1: Create Vercel Postgres Database

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (or create a new one)
3. Navigate to the "Storage" tab
4. Click "Create Database"
5. Select "Postgres"
6. Choose a database name (e.g., `bitcoin-sovereign-auth`)
7. Select a region (choose closest to your users)
8. Click "Create"

### Step 2: Get Connection String

1. After database creation, click on your database
2. Go to the ".env.local" tab
3. Copy the `POSTGRES_URL` value
4. This is your `DATABASE_URL`

### Step 3: Configure Environment Variables

Add to your `.env.local` file:

```bash
# Database
DATABASE_URL="postgres://default:xxxxx@xxxxx.postgres.vercel-storage.com:5432/verceldb?sslmode=require"
```

### Step 4: Install Dependencies

Make sure you have the required packages:

```bash
npm install pg @types/pg
```

### Step 5: Run Migrations

#### Option A: Using psql (Recommended)

If you have PostgreSQL client installed:

```bash
psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

#### Option B: Using Vercel CLI

```bash
vercel env pull .env.local
psql $(grep DATABASE_URL .env.local | cut -d '=' -f2) -f migrations/001_initial_schema.sql
```

#### Option C: Using Node.js Script

Create a migration runner script:

```bash
npx ts-node scripts/run-migrations.ts
```

#### Option D: Using Vercel Dashboard

1. Go to your database in Vercel dashboard
2. Click on "Query" tab
3. Copy the contents of `001_initial_schema.sql`
4. Paste into the query editor
5. Click "Run Query"

### Step 6: Verify Migration

Test the database connection:

```bash
npx ts-node -e "import('./lib/db').then(db => db.testConnection())"
```

You should see:
```
✅ Database connection test successful
```

### Step 7: Import Access Codes

Run the import script:

```bash
npx ts-node scripts/import-access-codes.ts
```

Expected output:
```
✅ Successfully imported: 11
📦 Total codes: 11
```

## Migration Files

### 001_initial_schema.sql

Creates the initial database schema:

- **users** table: User accounts with secure password hashing
- **access_codes** table: One-time use access codes for registration
- **sessions** table: Active user sessions with JWT tokens
- **auth_logs** table: Audit trail of authentication events

**Indexes created:**
- 13 total indexes for optimal query performance
- Covering email lookups, code validation, session management, and audit queries

**Constraints:**
- Unique constraints on email and access codes
- Foreign key relationships with cascading deletes
- Check constraints for data validation
- Automatic timestamp updates

## Verification

After running migrations, verify the schema:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Check constraints
SELECT conname, contype FROM pg_constraint 
WHERE connamespace = 'public'::regnamespace;
```

Expected tables:
- `users`
- `access_codes`
- `sessions`
- `auth_logs`

## Rollback

If you need to rollback the migration:

```sql
-- Drop all tables (WARNING: This deletes all data!)
DROP TABLE IF EXISTS auth_logs CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS access_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

## Troubleshooting

### Connection Issues

**Error: "DATABASE_URL is not set"**
- Make sure `.env.local` contains `DATABASE_URL`
- Restart your development server after adding the variable

**Error: "Connection timeout"**
- Check your internet connection
- Verify the database URL is correct
- Ensure the database is not paused (Vercel may pause inactive databases)

### Migration Errors

**Error: "relation already exists"**
- The migration has already been run
- Either skip it or run the rollback script first

**Error: "permission denied"**
- Check that your database user has CREATE privileges
- Verify you're using the correct connection string

**Error: "syntax error"**
- Ensure you're using PostgreSQL (not MySQL or other databases)
- Check that the SQL file wasn't corrupted during copy/paste

### Import Script Errors

**Error: "Cannot find module 'pg'"**
```bash
npm install pg @types/pg
```

**Error: "No codes imported"**
- Check that the migration ran successfully first
- Verify the `access_codes` table exists
- Check database connection

## Next Steps

After successful migration:

1. ✅ Database schema created
2. ✅ Access codes imported
3. ⏭️ Implement authentication utilities (Task 2)
4. ⏭️ Build API endpoints (Task 3)
5. ⏭️ Create frontend components (Task 4)

## Support

For issues or questions:
- Check the main README.md
- Review the design document: `.kiro/specs/secure-user-authentication/design.md`
- Check Vercel Postgres documentation: https://vercel.com/docs/storage/vercel-postgres

---

**Last Updated:** January 26, 2025  
**Version:** 1.0.0  
**Status:** ✅ Ready for use
