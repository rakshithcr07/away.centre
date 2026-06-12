-- Away Intelligence - Initial Database Schema
-- PostgreSQL + pgvector

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- USERS & RBAC
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'sales_manager', 'sales_rep', 'viewer');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'sales_rep',
  password_hash VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMPANIES
-- ============================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(500) NOT NULL,
  normalized_name VARCHAR(500),
  website VARCHAR(500),
  linkedin_url VARCHAR(500),
  industry VARCHAR(255),
  employee_count INTEGER,
  city VARCHAR(255),
  country VARCHAR(255) DEFAULT 'India',
  funding_stage VARCHAR(100),
  latest_funding_date DATE,
  estimated_budget DECIMAL(12, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_remote_only BOOLEAN NOT NULL DEFAULT false,
  is_staffing_agency BOOLEAN NOT NULL DEFAULT false,
  hiring_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_normalized_name ON companies(normalized_name);
CREATE INDEX idx_companies_city ON companies(city);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_is_active ON companies(is_active);
CREATE UNIQUE INDEX idx_companies_website_unique ON companies(website) WHERE website IS NOT NULL;

-- Company name aliases for intelligent merging (e.g. "Google LLC" / "Google India")
CREATE TABLE company_aliases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  alias_name VARCHAR(500) NOT NULL,
  normalized_alias VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(normalized_alias)
);

CREATE INDEX idx_company_aliases_company_id ON company_aliases(company_id);

-- ============================================================
-- SIGNALS
-- ============================================================

CREATE TYPE signal_type AS ENUM (
  'HIRING_SIGNAL',
  'FUNDING_SIGNAL',
  'SOCIAL_SIGNAL',
  'EXPANSION_SIGNAL'
);

CREATE TYPE signal_source AS ENUM (
  'google_jobs',
  'wellfound',
  'career_page',
  'crunchbase',
  'news_api',
  'linkedin',
  'twitter',
  'manual'
);

-- Raw signals before processing
CREATE TABLE raw_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source signal_source NOT NULL,
  raw_payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_raw_signals_processed ON raw_signals(processed) WHERE processed = false;

CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  signal_type signal_type NOT NULL,
  signal_source signal_source NOT NULL,
  signal_text TEXT NOT NULL,
  signal_date DATE NOT NULL,
  confidence_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  raw_payload JSONB,
  content_hash VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signals_company_id ON signals(company_id);
CREATE INDEX idx_signals_type ON signals(signal_type);
CREATE INDEX idx_signals_date ON signals(signal_date DESC);
CREATE INDEX idx_signals_active ON signals(is_active) WHERE is_active = true;
CREATE UNIQUE INDEX idx_signals_dedup ON signals(company_id, content_hash) WHERE content_hash IS NOT NULL;

-- ============================================================
-- CONTACTS
-- ============================================================

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  linkedin_url VARCHAR(500),
  email VARCHAR(255),
  seniority VARCHAR(100),
  decision_maker BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contacts_company_id ON contacts(company_id);

-- ============================================================
-- SCORES
-- ============================================================

CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  fit_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  intent_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  timing_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  overall_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  score_reasoning TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scores_overall ON scores(overall_score DESC);

-- ============================================================
-- CRM RECORDS
-- ============================================================

CREATE TYPE crm_status AS ENUM (
  'pending',
  'synced',
  'failed',
  'closed_won',
  'closed_lost',
  'dead_letter'
);

CREATE TABLE crm_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  zoho_lead_id VARCHAR(100),
  status crm_status NOT NULL DEFAULT 'pending',
  assigned_salesperson VARCHAR(255),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);

CREATE INDEX idx_crm_records_status ON crm_records(status);
CREATE INDEX idx_crm_records_zoho ON crm_records(zoho_lead_id);

-- ============================================================
-- OUTREACH RECOMMENDATIONS
-- ============================================================

CREATE TABLE outreach_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  recommended_product VARCHAR(100) NOT NULL,
  outreach_angle TEXT NOT NULL,
  generated_message TEXT NOT NULL,
  subject VARCHAR(500),
  personalization TEXT,
  pain_point TEXT,
  cta TEXT,
  ai_confidence DECIMAL(5, 2) NOT NULL DEFAULT 0,
  requires_human_review BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outreach_company_id ON outreach_recommendations(company_id);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- CONVERSION TRACKING
-- ============================================================

CREATE TABLE conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  crm_record_id UUID REFERENCES crm_records(id),
  conversion_type VARCHAR(100) NOT NULL,
  conversion_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revenue DECIMAL(12, 2),
  notes TEXT
);

CREATE INDEX idx_conversions_company ON conversions(company_id);

-- ============================================================
-- VECTOR EMBEDDINGS (for semantic signal search)
-- ============================================================

CREATE TABLE signal_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signal_id UUID NOT NULL UNIQUE REFERENCES signals(id) ON DELETE CASCADE,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signal_embeddings_vector ON signal_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
