-- ============================================================
-- ProspectEngine - Neon Migration: User Data Tables
-- Run this once in the Neon SQL Editor or via psql
-- ============================================================

-- 1. user_icps — ICP Profiles per user
CREATE TABLE IF NOT EXISTS user_icps (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  niche TEXT DEFAULT '',
  job_titles TEXT[] DEFAULT '{}',
  company_size TEXT[] DEFAULT '{}',
  locations TEXT[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  pain_points TEXT DEFAULT '',
  revenue_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_icps_user ON user_icps(user_id);


-- 2. user_search_methods — Search Methods per user
CREATE TABLE IF NOT EXISTS user_search_methods (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'linkedin',
  mode TEXT NOT NULL DEFAULT 'fast',
  max_results INTEGER DEFAULT 10,
  query_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_search_methods_user ON user_search_methods(user_id);


-- 3. user_engines — Prospecting Engines per user
CREATE TABLE IF NOT EXISTS user_engines (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icp_id TEXT NOT NULL,
  search_method_id TEXT NOT NULL,
  total_leads INTEGER DEFAULT 0,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_engines_user ON user_engines(user_id);


-- 4. Add missing columns to search_history
ALTER TABLE search_history
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS mode TEXT,
  ADD COLUMN IF NOT EXISTS max_results INTEGER,
  ADD COLUMN IF NOT EXISTS icp_type TEXT,
  ADD COLUMN IF NOT EXISTS engine_id TEXT,
  ADD COLUMN IF NOT EXISTS engine_name TEXT,
  ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Backfill executed_at from created_at for existing rows
UPDATE search_history SET executed_at = created_at WHERE executed_at IS NULL;


-- 5. Add JSONB and missing columns to leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS decision_maker JSONB,
  ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
  ADD COLUMN IF NOT EXISTS message_a TEXT,
  ADD COLUMN IF NOT EXISTS is_npl_potential BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS icp_type TEXT,
  ADD COLUMN IF NOT EXISTS search_id UUID REFERENCES search_history(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_search_id ON leads(search_id);
