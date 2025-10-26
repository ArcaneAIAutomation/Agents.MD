# Database Setup Checklist
## Bitcoin Sovereign Technology - Authentication System

Use this checklist to track your progress through the database setup process.

---

## Pre-Setup

- [ ] Vercel account created/logged in
- [ ] Node.js 18+ installed
- [ ] Project code downloaded
- [ ] Terminal/command prompt open

---

## Database Creation

- [ ] Navigated to Vercel Dashboard
- [ ] Selected project (or created new one)
- [ ] Clicked on "Storage" tab
- [ ] Clicked "Create Database"
- [ ] Selected "Postgres"
- [ ] Named database: `bitcoin-sovereign-auth`
- [ ] Selected region (closest to users)
- [ ] Clicked "Create"
- [ ] Database provisioning completed (30-60 seconds)

---

## Environment Configuration

- [ ] Clicked on database in Vercel Dashboard
- [ ] Navigated to ".env.local" tab
- [ ] Copied `POSTGRES_URL` value
- [ ] Created/opened `.env.local` file in project root
- [ ] Added `DATABASE_URL` with copied value
- [ ] Generated JWT secret using one of these methods:
  - [ ] OpenSSL: `openssl rand -base64 32`
  - [ ] Node.js: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
  - [ ] PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))`
- [ ] Added `JWT_SECRET` to `.env.local`
- [ ] Saved `.env.local` file

---

## Dependencies Installation

- [ ] Opened terminal in project root
- [ ] Ran: `npm install pg @types/pg`
- [ ] Installation completed successfully
- [ ] No error messages

---

## Database Migration

- [ ] Ran: `npx ts-node scripts/run-migrations.ts`
- [ ] Saw: "✅ Database connection successful!"
- [ ] Saw: "✅ Migration completed successfully"
- [ ] Saw: "✅ All expected tables are present!"
- [ ] No error messages

---

## Access Code Import

- [ ] Ran: `npx ts-node scripts/import-access-codes.ts`
- [ ] Saw: "✅ Successfully imported: 11"
- [ ] Saw: "✅ All expected codes are present in the database!"
- [ ] No error messages

---

## Verification

- [ ] Ran: `npx ts-node -e "import('./lib/db').then(db => db.testConnection())"`
- [ ] Saw: "✅ Database connection test successful"
- [ ] No error messages

### Verify in Vercel Dashboard (Optional)

- [ ] Opened database in Vercel Dashboard
- [ ] Clicked "Query" tab
- [ ] Ran: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`
- [ ] Saw 5 tables: `access_codes`, `auth_logs`, `schema_migrations`, `sessions`, `users`
- [ ] Ran: `SELECT code, redeemed FROM access_codes ORDER BY created_at;`
- [ ] Saw 11 access codes, all with `redeemed = false`

---

## Optional: Rate Limiting Setup (Vercel KV)

- [ ] In Vercel Dashboard, clicked "Storage" tab
- [ ] Clicked "Create Database"
- [ ] Selected "KV" (Redis)
- [ ] Named: `bitcoin-sovereign-kv`
- [ ] Clicked "Create"
- [ ] Copied KV environment variables
- [ ] Added to `.env.local`:
  - [ ] `KV_REST_API_URL`
  - [ ] `KV_REST_API_TOKEN`
  - [ ] `KV_REST_API_READ_ONLY_TOKEN`

---

## Final Verification

- [ ] `.env.local` contains `DATABASE_URL`
- [ ] `.env.local` contains `JWT_SECRET`
- [ ] Database has 4 main tables (users, access_codes, sessions, auth_logs)
- [ ] Database has 11 access codes imported
- [ ] Connection test passes
- [ ] No errors in any step

---

## Troubleshooting (If Needed)

### If connection fails:
- [ ] Verified `DATABASE_URL` is correct (copy from Vercel again)
- [ ] Checked internet connection
- [ ] Restarted development server
- [ ] Tried accessing database from Vercel Dashboard Query tab

### If migration fails:
- [ ] Checked for error messages
- [ ] Verified database user has CREATE privileges
- [ ] Tried running migration from Vercel Dashboard Query tab
- [ ] Consulted `docs/DATABASE-SETUP-GUIDE.md` troubleshooting section

### If import fails:
- [ ] Verified migration completed successfully first
- [ ] Checked that `access_codes` table exists
- [ ] Verified database connection works
- [ ] Checked for specific error messages

---

## Documentation Reference

If you need help at any step:

- **Quick Start:** `docs/QUICK-START-DATABASE.md` (10-minute guide)
- **Comprehensive Guide:** `docs/DATABASE-SETUP-GUIDE.md` (detailed walkthrough)
- **Migration Details:** `migrations/README.md` (migration-specific info)
- **Task Summary:** `docs/TASK-1-COMPLETION-SUMMARY.md` (what was built)

---

## Next Steps After Completion

Once all items above are checked:

1. ✅ **Task 1 Complete** - Database setup done
2. ⏭️ **Task 2 Next** - Implement authentication utilities
   - Install: `npm install bcrypt jsonwebtoken zod`
   - Install: `npm install --save-dev @types/bcrypt @types/jsonwebtoken`
   - Implement password hashing
   - Implement JWT token generation
   - Create authentication middleware

---

## Status

**Current Status:** [ ] Not Started / [ ] In Progress / [ ] Complete

**Date Started:** _______________

**Date Completed:** _______________

**Notes:**
```
(Add any notes, issues encountered, or deviations from the standard process)




```

---

**Last Updated:** January 26, 2025  
**Version:** 1.0.0
