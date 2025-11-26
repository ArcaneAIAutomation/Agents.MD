-- Migration: System Alerts Table
-- Purpose: Store system alerts for monitoring and incident response
-- Requirements: 14.1-14.10

-- Create system_alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Alert Details
  severity VARCHAR(20) NOT NULL,
  -- Values: 'CRITICAL', 'WARNING', 'INFO'
  
  type VARCHAR(100) NOT NULL,
  -- Values: 'SYSTEM_SUSPENSION', 'FATAL_ANOMALY', 'DATABASE_CONNECTION_LOST', etc.
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Context (JSON for additional data)
  context JSONB,
  
  -- Resolution
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by VARCHAR(255),
  resolution_notes TEXT,
  
  -- Timestamps
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX idx_system_alerts_type ON system_alerts(type);
CREATE INDEX idx_system_alerts_triggered_at ON system_alerts(triggered_at DESC);
CREATE INDEX idx_system_alerts_active ON system_alerts(resolved_at) WHERE resolved_at IS NULL;

-- Add comment
COMMENT ON TABLE system_alerts IS 'Stores system alerts for critical, warning, and info level events';
