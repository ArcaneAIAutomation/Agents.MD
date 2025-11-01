#!/usr/bin/env tsx
/**
 * Check Authentication Data
 * Shows current users, access codes, and their status
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Pool } from 'pg';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function checkAuthData() {
  console.log('\n============================================================');
  console.log('🔍 Bitcoin Sovereign Technology');
  console.log('   Authentication Data Check');
  console.log('============================================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  try {
    // Check users
    console.log('👥 USERS:\n');
    const users = await pool.query(`
      SELECT id, email, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);

    if (users.rows.length === 0) {
      console.log('   No users found\n');
    } else {
      users.rows.forEach((user: any, index: number) => {
        console.log(`   ${index + 1}. ${user.email}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Created: ${new Date(user.created_at).toLocaleString()}\n`);
      });
    }

    // Check access codes
    console.log('🎫 ACCESS CODES:\n');
    const codes = await pool.query(`
      SELECT code, redeemed, redeemed_by, redeemed_at, created_at
      FROM access_codes 
      ORDER BY created_at DESC
    `);

    const available = codes.rows.filter((c: any) => !c.redeemed);
    const redeemed = codes.rows.filter((c: any) => c.redeemed);

    console.log(`   Total: ${codes.rows.length}`);
    console.log(`   Available: ${available.length}`);
    console.log(`   Redeemed: ${redeemed.length}\n`);

    if (available.length > 0) {
      console.log('   ✅ AVAILABLE CODES:');
      available.forEach((code: any) => {
        console.log(`      - ${code.code}`);
      });
      console.log('');
    }

    if (redeemed.length > 0) {
      console.log('   🔴 REDEEMED CODES:');
      for (const code of redeemed) {
        const user = await pool.query('SELECT email FROM users WHERE id = $1', [code.redeemed_by]);
        const userEmail = user.rows[0]?.email || 'Unknown';
        console.log(`      - ${code.code}`);
        console.log(`        By: ${userEmail}`);
        console.log(`        On: ${new Date(code.redeemed_at).toLocaleString()}\n`);
      }
    }

    // Check sessions
    console.log('🔐 SESSIONS:\n');
    const sessions = await pool.query(`
      SELECT s.id, s.user_id, s.expires_at, s.created_at, u.email
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `);

    const activeSessions = sessions.rows.filter((s: any) => new Date(s.expires_at) > new Date());
    const expiredSessions = sessions.rows.filter((s: any) => new Date(s.expires_at) <= new Date());

    console.log(`   Total: ${sessions.rows.length}`);
    console.log(`   Active: ${activeSessions.length}`);
    console.log(`   Expired: ${expiredSessions.length}\n`);

    if (activeSessions.length > 0) {
      console.log('   ✅ ACTIVE SESSIONS:');
      activeSessions.forEach((session: any) => {
        console.log(`      - ${session.email}`);
        console.log(`        Expires: ${new Date(session.expires_at).toLocaleString()}\n`);
      });
    }

    // Check recent auth logs
    console.log('📝 RECENT AUTH EVENTS (Last 10):\n');
    const logs = await pool.query(`
      SELECT al.event_type, al.success, al.timestamp, u.email, al.error_message
      FROM auth_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.timestamp DESC
      LIMIT 10
    `);

    if (logs.rows.length === 0) {
      console.log('   No auth events found\n');
    } else {
      logs.rows.forEach((log: any) => {
        const status = log.success ? '✅' : '❌';
        const email = log.email || 'Unknown';
        console.log(`   ${status} ${log.event_type.toUpperCase()}`);
        console.log(`      User: ${email}`);
        console.log(`      Time: ${new Date(log.timestamp).toLocaleString()}`);
        if (log.error_message) {
          console.log(`      Error: ${log.error_message}`);
        }
        console.log('');
      });
    }

    console.log('============================================================');
    console.log('✅ Authentication Data Check Complete');
    console.log('============================================================\n');

  } catch (error: any) {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkAuthData();
