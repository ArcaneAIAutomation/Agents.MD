import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { query } from '../lib/db';

const createTableSQL = `
-- UCIE Phase Data Storage
-- Stores intermediate phase data for passing between analysis phases
CREATE TABLE IF NOT EXISTS ucie_phase_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  phase_number INTEGER NOT NULL CHECK (phase_number >= 1 AND phase_number <= 4),
  phase_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour',
  CONSTRAINT ucie_phase_unique UNIQUE(session_id, symbol, phase_number)
);

CREATE INDEX IF NOT EXISTS idx_ucie_phase_session ON ucie_phase_data(session_id);
CREATE INDEX IF NOT EXISTS idx_ucie_phase_expires ON ucie_phase_data(expires_at);
CREATE INDEX IF NOT EXISTS idx_ucie_phase_session_symbol ON ucie_phase_data(session_id, symbol);

COMMENT ON TABLE ucie_phase_data IS 'Stores intermediate phase data for progressive loading analysis';
COMMENT ON COLUMN ucie_phase_data.session_id IS 'Unique session identifier for tracking analysis progress';
COMMENT ON COLUMN ucie_phase_data.phase_number IS 'Phase number (1-4): 1=Critical, 2=Important, 3=Enhanced, 4=Deep';
`;

async function createPhaseDataTable() {
  console.log('Creating ucie_phase_data table...\n');
  
  try {
    await query(createTableSQL);
    console.log('✅ ucie_phase_data table created successfully!\n');
    
    // Verify
    const check = await query("SELECT table_name FROM information_schema.tables WHERE table_name = 'ucie_phase_data'");
    if (check.rows.length > 0) {
      console.log('✅ Table verified in database');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create table:', error);
    process.exit(1);
  }
}

createPhaseDataTable();
