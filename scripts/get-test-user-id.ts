import { query } from '../lib/db';

async function getTestUserId() {
  const result = await query('SELECT id FROM users LIMIT 1');
  
  if (result.rows.length === 0) {
    console.log('No users found. Creating a test user...');
    
    // Create a test user
    const createResult = await query(`
      INSERT INTO users (email, password_hash, email_verified, created_at, updated_at)
      VALUES ('test-atge@example.com', '$2a$12$test', true, NOW(), NOW())
      RETURNING id
    `);
    
    console.log('Test user created:', createResult.rows[0].id);
    return createResult.rows[0].id;
  }
  
  console.log('Test user ID:', result.rows[0].id);
  return result.rows[0].id;
}

getTestUserId().catch(console.error);
