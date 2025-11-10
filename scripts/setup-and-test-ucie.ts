/**
 * Complete UCIE Setup and Test Script
 * 
 * One command to:
 * 1. Create all database tables
 * 2. Run all migrations
 * 3. Test all functionality
 * 4. Verify everything works
 * 
 * Usage: npx tsx scripts/setup-and-test-ucie.ts
 */

import { execSync } from 'child_process';

async function setupAndTestUCIE() {
  console.log('🚀 UCIE Complete Setup and Test\n');
  console.log('='.repeat(60));
  console.log('This will:');
  console.log('1. Create all database tables');
  console.log('2. Run all migrations');
  console.log('3. Test all functionality');
  console.log('4. Verify everything works');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // Step 1: Setup database
    console.log('📦 Step 1: Setting up database...\n');
    execSync('npx tsx scripts/setup-ucie-database.ts', { stdio: 'inherit' });
    
    console.log('\n' + '='.repeat(60));
    
    // Step 2: Test database
    console.log('🧪 Step 2: Testing database...\n');
    execSync('npx tsx scripts/test-ucie-database.ts', { stdio: 'inherit' });
    
    console.log('\n' + '='.repeat(60));
    
    // Step 3: Test data replacement
    console.log('🔄 Step 3: Testing data replacement...\n');
    execSync('npx tsx scripts/test-data-replacement.ts', { stdio: 'inherit' });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 COMPLETE SETUP AND TEST SUCCESSFUL!');
    console.log('='.repeat(60));
    console.log('\n✅ UCIE database is ready to use');
    console.log('✅ All tables created');
    console.log('✅ All tests passed');
    console.log('✅ Data replacement working');
    console.log('\n📋 Next steps:');
    console.log('   1. Start your development server: npm run dev');
    console.log('   2. Test UCIE endpoints');
    console.log('   3. Deploy to production');
    
  } catch (error) {
    console.error('\n❌ Setup and test failed:', error);
    console.log('\n📋 Troubleshooting:');
    console.log('   1. Check DATABASE_URL environment variable');
    console.log('   2. Verify database is accessible');
    console.log('   3. Check migration files exist');
    console.log('   4. Review error messages above');
    process.exit(1);
  }
}

// Run setup and test
setupAndTestUCIE().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
