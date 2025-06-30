/*
  # Schema update for legal AI platform

  1. New Tables
    - `legal_documents` - Stores legal documents for analysis and training
    - `prompt_response_pairs` - Training data for fine-tuning models
    - `fine_tuning_jobs` - Manages model fine-tuning processes
    - `contract_analyses` - Stores results of contract analysis
    - `user_sessions` - Tracks user interaction sessions
    - `api_usage` - Logs API usage for monitoring and billing
    - `model_deployments` - Tracks deployed models
    - `compliance_logs` - Records compliance-related activities

  2. Security
    - Enable RLS on all tables
    - Create policies for proper access control
    - Set up appropriate foreign key relationships

  3. Performance
    - Add indexes for common query patterns
    - Full-text search capabilities for document content
*/

-- Create extensions for enhanced functionality
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Legal Documents Table
CREATE TABLE IF NOT EXISTS legal_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    document_type text NOT NULL CHECK (document_type IN ('contract', 'constitutional', 'statute', 'case_law', 'regulation')),
    jurisdiction text NOT NULL DEFAULT 'US',
    source text NOT NULL,
    word_count integer DEFAULT 0,
    complexity text DEFAULT 'medium' CHECK (complexity IN ('low', 'medium', 'high')),
    language text DEFAULT 'en',
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Prompt Response Pairs Table
CREATE TABLE IF NOT EXISTS prompt_response_pairs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt text NOT NULL,
    response text NOT NULL,
    pair_type text NOT NULL CHECK (pair_type IN ('summarization', 'clause_explanation', 'qa', 'risk_analysis', 'translation', 'simplification')),
    source_document_id uuid REFERENCES legal_documents(id) ON DELETE CASCADE,
    quality_score integer DEFAULT 3 CHECK (quality_score >= 1 AND quality_score <= 5),
    verified boolean DEFAULT false,
    tags text[] DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    reviewed_at timestamptz,
    reviewed_by text
);

-- Fine Tuning Jobs Table
CREATE TABLE IF NOT EXISTS fine_tuning_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    status text NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'training', 'evaluating', 'completed', 'failed', 'cancelled')),
    model_name text NOT NULL,
    base_model text NOT NULL DEFAULT 'gemini-1.5-flash',
    config jsonb NOT NULL DEFAULT '{}',
    progress real DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    metrics jsonb DEFAULT '{}',
    logs text[] DEFAULT '{}',
    model_id text,
    focus_areas text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    started_at timestamptz,
    completed_at timestamptz,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Contract Analyses Table
CREATE TABLE IF NOT EXISTS contract_analyses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_name text NOT NULL,
    document_content text NOT NULL,
    overall_score integer DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
    risk_level text DEFAULT 'fair' CHECK (risk_level IN ('excellent', 'good', 'fair', 'poor')),
    clauses jsonb DEFAULT '[]',
    summary jsonb DEFAULT '{}',
    analysis_time real DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    analyzed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type text NOT NULL CHECK (session_type IN ('chatbot', 'contract_validation', 'document_analysis')),
    messages jsonb DEFAULT '[]',
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    ended_at timestamptz
);

-- API Usage Table
CREATE TABLE IF NOT EXISTS api_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint text NOT NULL,
    method text NOT NULL,
    tokens_used integer DEFAULT 0,
    cost_cents integer DEFAULT 0,
    response_time_ms integer DEFAULT 0,
    status_code integer DEFAULT 200,
    error_message text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Model Deployments Table
CREATE TABLE IF NOT EXISTS model_deployments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid REFERENCES fine_tuning_jobs(id) ON DELETE CASCADE,
    model_name text NOT NULL,
    endpoint_url text,
    status text NOT NULL DEFAULT 'deploying' CHECK (status IN ('deploying', 'active', 'inactive', 'failed')),
    performance_metrics jsonb DEFAULT '{}',
    deployment_config jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    deployed_at timestamptz,
    last_health_check timestamptz,
    deployed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Compliance Logs Table
CREATE TABLE IF NOT EXISTS compliance_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id text NOT NULL,
    processing_type text NOT NULL CHECK (processing_type IN ('anonymization', 'analysis', 'storage', 'deletion')),
    anonymization_applied boolean DEFAULT false,
    sensitive_data_removed text[] DEFAULT '{}',
    compliance_standards text[] DEFAULT '{}',
    compliance_checks jsonb DEFAULT '{}',
    retention_expiry timestamptz,
    created_at timestamptz DEFAULT now(),
    processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security on all tables
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_response_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fine_tuning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    -- Drop policies for legal_documents
    DROP POLICY IF EXISTS "Service role can manage legal documents" ON legal_documents;
    DROP POLICY IF EXISTS "Authenticated users can read legal documents" ON legal_documents;
    
    -- Drop policies for prompt_response_pairs
    DROP POLICY IF EXISTS "Service role can manage prompt response pairs" ON prompt_response_pairs;
    DROP POLICY IF EXISTS "Authenticated users can read verified pairs" ON prompt_response_pairs;
    
    -- Drop policies for fine_tuning_jobs
    DROP POLICY IF EXISTS "Users can manage their own fine tuning jobs" ON fine_tuning_jobs;
    DROP POLICY IF EXISTS "Service role can manage all fine tuning jobs" ON fine_tuning_jobs;
    
    -- Drop policies for contract_analyses
    DROP POLICY IF EXISTS "Users can manage their own contract analyses" ON contract_analyses;
    DROP POLICY IF EXISTS "Service role can manage all contract analyses" ON contract_analyses;
    
    -- Drop policies for user_sessions
    DROP POLICY IF EXISTS "Users can manage their own sessions" ON user_sessions;
    DROP POLICY IF EXISTS "Service role can manage all sessions" ON user_sessions;
    
    -- Drop policies for api_usage
    DROP POLICY IF EXISTS "Users can read their own API usage" ON api_usage;
    DROP POLICY IF EXISTS "Service role can manage all API usage" ON api_usage;
    
    -- Drop policies for model_deployments
    DROP POLICY IF EXISTS "Users can read their own model deployments" ON model_deployments;
    DROP POLICY IF EXISTS "Service role can manage all model deployments" ON model_deployments;
    
    -- Drop policies for compliance_logs
    DROP POLICY IF EXISTS "Service role can manage compliance logs" ON compliance_logs;
    DROP POLICY IF EXISTS "Users can read compliance logs for their data" ON compliance_logs;
END $$;

-- RLS Policies for legal_documents
CREATE POLICY "Service role can manage legal documents"
    ON legal_documents
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Authenticated users can read legal documents"
    ON legal_documents
    FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for prompt_response_pairs
CREATE POLICY "Service role can manage prompt response pairs"
    ON prompt_response_pairs
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Authenticated users can read verified pairs"
    ON prompt_response_pairs
    FOR SELECT
    TO authenticated
    USING (verified = true);

-- RLS Policies for fine_tuning_jobs
CREATE POLICY "Users can manage their own fine tuning jobs"
    ON fine_tuning_jobs
    FOR ALL
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Service role can manage all fine tuning jobs"
    ON fine_tuning_jobs
    FOR ALL
    TO service_role
    USING (true);

-- RLS Policies for contract_analyses
CREATE POLICY "Users can manage their own contract analyses"
    ON contract_analyses
    FOR ALL
    TO authenticated
    USING (auth.uid() = analyzed_by);

CREATE POLICY "Service role can manage all contract analyses"
    ON contract_analyses
    FOR ALL
    TO service_role
    USING (true);

-- RLS Policies for user_sessions
CREATE POLICY "Users can manage their own sessions"
    ON user_sessions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all sessions"
    ON user_sessions
    FOR ALL
    TO service_role
    USING (true);

-- RLS Policies for api_usage
CREATE POLICY "Users can read their own API usage"
    ON api_usage
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all API usage"
    ON api_usage
    FOR ALL
    TO service_role
    USING (true);

-- RLS Policies for model_deployments
CREATE POLICY "Users can read their own model deployments"
    ON model_deployments
    FOR SELECT
    TO authenticated
    USING (auth.uid() = deployed_by);

CREATE POLICY "Service role can manage all model deployments"
    ON model_deployments
    FOR ALL
    TO service_role
    USING (true);

-- RLS Policies for compliance_logs
CREATE POLICY "Service role can manage compliance logs"
    ON compliance_logs
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Users can read compliance logs for their data"
    ON compliance_logs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = processed_by);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_legal_documents_content_fts 
    ON legal_documents USING gin(to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS idx_legal_documents_type 
    ON legal_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_legal_documents_created_at 
    ON legal_documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_response_pairs_search 
    ON prompt_response_pairs USING gin(to_tsvector('english', prompt || ' ' || response));

CREATE INDEX IF NOT EXISTS idx_prompt_response_pairs_type 
    ON prompt_response_pairs(pair_type);

CREATE INDEX IF NOT EXISTS idx_prompt_response_pairs_quality 
    ON prompt_response_pairs(quality_score DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_response_pairs_verified 
    ON prompt_response_pairs(verified);

CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_status 
    ON fine_tuning_jobs(status);

CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_created_at 
    ON fine_tuning_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_user 
    ON fine_tuning_jobs(created_by);

CREATE INDEX IF NOT EXISTS idx_contract_analyses_created_at 
    ON contract_analyses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contract_analyses_user 
    ON contract_analyses(analyzed_by);

CREATE INDEX IF NOT EXISTS idx_contract_analyses_risk_level 
    ON contract_analyses(risk_level);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user 
    ON user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_type 
    ON user_sessions(session_type);

CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at 
    ON user_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_usage_user 
    ON api_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_api_usage_created_at 
    ON api_usage(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint 
    ON api_usage(endpoint);

CREATE INDEX IF NOT EXISTS idx_model_deployments_status 
    ON model_deployments(status);

CREATE INDEX IF NOT EXISTS idx_model_deployments_created_at 
    ON model_deployments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_logs_created_at 
    ON compliance_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_logs_document_id 
    ON compliance_logs(document_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_legal_documents_updated_at ON legal_documents;
DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON user_sessions;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_legal_documents_updated_at 
    BEFORE UPDATE ON legal_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON user_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
INSERT INTO legal_documents (title, content, document_type, jurisdiction, source, word_count, complexity) VALUES
('Sample Employment Contract', 'This is a sample employment contract for testing purposes. It contains standard clauses for employment agreements including compensation, benefits, termination procedures, and confidentiality requirements.', 'contract', 'US', 'sample', 150, 'medium'),
('Privacy Policy Template', 'This privacy policy template outlines how personal information is collected, used, and protected. It includes sections on data collection, usage, sharing, and user rights under various privacy regulations.', 'regulation', 'US', 'template', 120, 'low'),
('Non-Disclosure Agreement', 'A comprehensive non-disclosure agreement template that protects confidential information shared between parties. Includes definitions, obligations, exceptions, and enforcement provisions.', 'contract', 'US', 'template', 200, 'medium')
ON CONFLICT DO NOTHING;

-- Insert sample prompt-response pairs for testing
INSERT INTO prompt_response_pairs (prompt, response, pair_type, quality_score, verified, tags) VALUES
('What is a force majeure clause?', 'A force majeure clause is a contract provision that frees parties from liability or obligation when extraordinary circumstances beyond their control prevent them from fulfilling their contractual duties. These circumstances typically include natural disasters, wars, terrorist attacks, or government actions.', 'clause_explanation', 5, true, ARRAY['contracts', 'force_majeure']),
('Explain employment at-will in simple terms', 'Employment at-will means that either the employer or employee can end the employment relationship at any time, for any reason (as long as it''s not illegal), without advance notice. However, there are exceptions for discrimination, retaliation, and violations of public policy.', 'simplification', 4, true, ARRAY['employment', 'at_will']),
('What should I look for in a rental agreement?', 'Key things to review in a rental agreement include: rent amount and due date, security deposit terms, lease duration, pet policies, maintenance responsibilities, rules about modifications, early termination clauses, and notice requirements for moving out.', 'qa', 4, true, ARRAY['rental', 'real_estate'])
ON CONFLICT DO NOTHING;