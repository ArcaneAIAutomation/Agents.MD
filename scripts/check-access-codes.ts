import { query } from '../lib/db';

async function checkAccessCodes() {
  try {
    console.log('🔍 Checking Access Codes Status...\n');
    
    const result = await query(
      'SELECT code, redeemed, redeemed_by, redeemed_at FROM access_codes ORDER BY id'
    );
    
    console.log('Code                          | Redeemed | Redeemed By | Redeemed At');
    console.log('------------------------------|----------|-------------|------------');
    
    result.rows.forEach((row: any) => {
      const code = row.code.padEnd(30);
      const redeemed = row.redeemed ? 'Yes     ' : 'No      ';
      const redeemedBy = (row.redeemed_by || 'N/A').toString().padEnd(11);
      const redeemedAt = row.redeemed_at 
        ? new Date(row.redeemed_at).toISOString().split('T')[0] 
        : 'N/A';
      
      console.log(`${code} | ${redeemed} | ${redeemedBy} | ${redeemedAt}`);
    });
    
    const available = result.rows.filter((r: any) => !r.redeemed).length;
    const redeemed = result.rows.filter((r: any) => r.redeemed).length;
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Codes: ${result.rows.length}`);
    console.log(`   Available: ${available}`);
    console.log(`   Redeemed: ${redeemed}`);
    
    if (available === 0) {
      console.log('\n⚠️  WARNING: All access codes have been redeemed!');
    } else {
      console.log(`\n✅ ${available} access codes are still available for use.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking access codes:', error);
    process.exit(1);
  }
}

checkAccessCodes();
