import { query } from '../lib/db';

async function checkJobs() {
  try {
    console.log('Checking UCIE OpenAI Jobs...\n');
    
    const result = await query(
      `SELECT 
        id, 
        symbol, 
        status, 
        progress, 
        context_data IS NOT NULL as has_context,
        result IS NOT NULL as has_result,
        error,
        created_at,
        updated_at,
        completed_at
      FROM ucie_openai_jobs 
      ORDER BY created_at DESC 
      LIMIT 5`
    );
    
    if (result.rows.length === 0) {
      console.log('No jobs found in database.');
      return;
    }
    
    console.log(`Found ${result.rows.length} recent jobs:\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`Job #${index + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Symbol: ${row.symbol}`);
      console.log(`  Status: ${row.status}`);
      console.log(`  Progress: ${row.progress || 'N/A'}`);
      console.log(`  Has Context Data: ${row.has_context ? 'YES' : 'NO'}`);
      console.log(`  Has Result: ${row.has_result ? 'YES' : 'NO'}`);
      console.log(`  Error: ${row.error || 'None'}`);
      console.log(`  Created: ${row.created_at}`);
      console.log(`  Updated: ${row.updated_at}`);
      console.log(`  Completed: ${row.completed_at || 'N/A'}`);
      console.log('');
    });
    
    // Check if any jobs have context but no result
    const stuckJobs = result.rows.filter(r => r.has_context && !r.has_result && r.status !== 'error');
    
    if (stuckJobs.length > 0) {
      console.log(`⚠️  WARNING: ${stuckJobs.length} job(s) have context_data but no result:`);
      stuckJobs.forEach(job => {
        console.log(`  - Job ${job.id} (${job.symbol}): Status = ${job.status}`);
      });
      console.log('');
    }
    
    // Get a sample job with context to inspect
    const jobWithContext = result.rows.find(r => r.has_context);
    if (jobWithContext) {
      console.log(`Fetching full details for Job ${jobWithContext.id}...\n`);
      
      const detailResult = await query(
        'SELECT context_data, result FROM ucie_openai_jobs WHERE id = $1',
        [jobWithContext.id]
      );
      
      if (detailResult.rows[0]) {
        const job = detailResult.rows[0];
        
        console.log('Context Data Structure:');
        if (job.context_data) {
          const contextKeys = Object.keys(job.context_data);
          console.log(`  Keys: ${contextKeys.join(', ')}`);
          
          if (job.context_data.collectedData) {
            const dataKeys = Object.keys(job.context_data.collectedData);
            console.log(`  collectedData keys: ${dataKeys.join(', ')}`);
          }
        }
        console.log('');
        
        console.log('Result Data:');
        if (job.result) {
          const resultKeys = Object.keys(job.result);
          console.log(`  Keys: ${resultKeys.join(', ')}`);
        } else {
          console.log('  NO RESULT DATA');
        }
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking jobs:', error);
    process.exit(1);
  }
}

checkJobs();
