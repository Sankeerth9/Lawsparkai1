/*
  # Admin and ML Training System Schema

  1. New Tables
    - `users` - Extended user profiles with roles
    - `admin_users` - Admin-specific user management
    - `user_roles` - Role definitions and permissions
    - `user_permissions` - Granular permission system
    - `uploaded_datasets` - Dataset file management
    - `training_statistics` - Detailed training metrics per epoch
    - `model_versions` - Model version tracking
    - `training_logs` - Detailed training logs
    - `system_settings` - Application configuration
    - `audit_logs` - System audit trail

  2. Enhanced Tables
    - Enhanced `fine_tuning_jobs` with better tracking
    - Improved relationships and constraints

  3. Security
    - Enable RLS on all tables
    - Admin-only policies for sensitive data
    - User-specific data access policies
    - Service role policies for system operations

  4. Performance
    - Optimized indexes for common queries
    - Full-text search capabilities
    - Efficient relationship queries
*/

-- Create custom types for better data integrity
CREATE TYPE user_role_type AS ENUM ('user', 'admin', 'super_admin', 'analyst', 'moderator');
CREATE TYPE job_status_type AS ENUM ('pending', 'preparing', 'training', 'evaluating', 'completed', 'failed', 'cancelled', 'paused');
CREATE TYPE dataset_status_type AS ENUM ('uploading', 'processing', 'ready', 'failed', 'archived');
CREATE TYPE training_phase_type AS ENUM ('initialization', 'training', 'validation', 'evaluation', 'completion');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    role user_role_type DEFAULT 'user',
    
    -- Profile information
    organization text,
    job_title text,
    phone text,
    timezone text DEFAULT 'UTC',
    language text DEFAULT 'en',
    
    -- Account status
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    email_verified_at timestamptz,
    last_login_at timestamptz,
    
    -- Preferences
    preferences jsonb DEFAULT '{}',
    notification_settings jsonb DEFAULT '{
        "email_notifications": true,
        "training_updates": true,
        "system_alerts": true
    }',
    
    -- Usage tracking
    total_jobs_created integer DEFAULT 0,
    total_datasets_uploaded integer DEFAULT 0,
    storage_used_bytes bigint DEFAULT 0,
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Admin users table for enhanced admin management
CREATE TABLE IF NOT EXISTS admin_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Admin specific fields
    admin_level integer DEFAULT 1 CHECK (admin_level >= 1 AND admin_level <= 10),
    department text,
    supervisor_id uuid REFERENCES admin_users(id),
    
    -- Permissions
    permissions text[] DEFAULT '{}',
    access_level text DEFAULT 'standard' CHECK (access_level IN ('standard', 'elevated', 'full')),
    
    -- Security
    two_factor_enabled boolean DEFAULT false,
    last_password_change timestamptz,
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamptz,
    
    -- Audit
    created_by uuid REFERENCES admin_users(id),
    notes text,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- User roles and permissions system
CREATE TABLE IF NOT EXISTS user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    description text,
    permissions text[] DEFAULT '{}',
    is_system_role boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission text NOT NULL,
    resource text,
    granted_by uuid REFERENCES admin_users(id),
    expires_at timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, permission, resource)
);

-- Enhanced uploaded datasets table
CREATE TABLE IF NOT EXISTS uploaded_datasets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic information
    name text NOT NULL,
    description text,
    version text DEFAULT '1.0',
    
    -- File information
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size bigint NOT NULL,
    file_type text NOT NULL,
    mime_type text,
    checksum text,
    
    -- Dataset metadata
    dataset_type text NOT NULL CHECK (dataset_type IN ('training', 'validation', 'test', 'mixed')),
    format text NOT NULL CHECK (format IN ('jsonl', 'csv', 'parquet', 'json')),
    encoding text DEFAULT 'utf-8',
    
    -- Content analysis
    total_records integer DEFAULT 0,
    total_tokens integer DEFAULT 0,
    average_input_length real DEFAULT 0,
    average_output_length real DEFAULT 0,
    
    -- Quality metrics
    quality_score real CHECK (quality_score >= 0 AND quality_score <= 1),
    validation_errors jsonb DEFAULT '[]',
    data_distribution jsonb DEFAULT '{}',
    
    -- Processing status
    status dataset_status_type DEFAULT 'uploading',
    processing_progress real DEFAULT 0 CHECK (processing_progress >= 0 AND processing_progress <= 100),
    error_message text,
    
    -- Privacy and compliance
    contains_pii boolean DEFAULT false,
    anonymization_applied boolean DEFAULT false,
    compliance_checks jsonb DEFAULT '{}',
    retention_policy text,
    
    -- Usage tracking
    used_in_jobs integer DEFAULT 0,
    last_used_at timestamptz,
    
    -- Ownership and access
    uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    is_public boolean DEFAULT false,
    access_permissions jsonb DEFAULT '{}',
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    processed_at timestamptz,
    archived_at timestamptz
);

-- Enhanced fine-tuning jobs table
DROP TABLE IF EXISTS fine_tuning_jobs CASCADE;
CREATE TABLE fine_tuning_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Job identification
    name text NOT NULL,
    description text,
    job_number text UNIQUE, -- Auto-generated job number
    
    -- Model configuration
    model_name text NOT NULL,
    base_model text NOT NULL DEFAULT 'gemini-1.5-flash',
    target_model_name text,
    model_version text DEFAULT '1.0',
    
    -- Dataset configuration
    training_dataset_id uuid REFERENCES uploaded_datasets(id) ON DELETE SET NULL,
    validation_dataset_id uuid REFERENCES uploaded_datasets(id) ON DELETE SET NULL,
    test_dataset_id uuid REFERENCES uploaded_datasets(id) ON DELETE SET NULL,
    
    -- Training configuration
    config jsonb NOT NULL DEFAULT '{}',
    hyperparameters jsonb DEFAULT '{
        "learning_rate": 0.001,
        "batch_size": 16,
        "epochs": 3,
        "warmup_steps": 100,
        "weight_decay": 0.01,
        "gradient_accumulation_steps": 1
    }',
    
    -- Job status and progress
    status job_status_type DEFAULT 'pending',
    current_phase training_phase_type DEFAULT 'initialization',
    progress real DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- Training metrics (latest)
    current_epoch integer DEFAULT 0,
    total_epochs integer DEFAULT 3,
    current_step integer DEFAULT 0,
    total_steps integer DEFAULT 0,
    
    -- Performance metrics
    best_loss real,
    best_accuracy real,
    best_eval_score real,
    final_metrics jsonb DEFAULT '{}',
    
    -- Resource usage
    estimated_duration_minutes integer,
    actual_duration_minutes integer,
    compute_cost_cents integer DEFAULT 0,
    gpu_hours_used real DEFAULT 0,
    
    -- Model output
    model_id text,
    model_artifacts jsonb DEFAULT '{}',
    deployment_ready boolean DEFAULT false,
    
    -- Logs and debugging
    logs text[] DEFAULT '{}',
    error_logs text[] DEFAULT '{}',
    debug_info jsonb DEFAULT '{}',
    
    -- Focus areas and objectives
    focus_areas text[] DEFAULT '{}',
    success_criteria jsonb DEFAULT '{}',
    evaluation_metrics text[] DEFAULT '{}',
    
    -- Ownership and collaboration
    created_by uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
    team_members uuid[] DEFAULT '{}',
    
    -- Scheduling
    scheduled_start_time timestamptz,
    priority integer DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    started_at timestamptz,
    completed_at timestamptz,
    cancelled_at timestamptz
);

-- Training statistics table for detailed epoch-by-epoch tracking
CREATE TABLE IF NOT EXISTS training_statistics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES fine_tuning_jobs(id) ON DELETE CASCADE,
    
    -- Training progress
    epoch integer NOT NULL,
    step integer NOT NULL,
    phase training_phase_type NOT NULL,
    
    -- Loss metrics
    training_loss real,
    validation_loss real,
    test_loss real,
    
    -- Accuracy metrics
    training_accuracy real,
    validation_accuracy real,
    test_accuracy real,
    
    -- Learning metrics
    learning_rate real,
    gradient_norm real,
    weight_norm real,
    
    -- Performance metrics
    perplexity real,
    bleu_score real,
    rouge_score real,
    
    -- Custom metrics (flexible for different model types)
    custom_metrics jsonb DEFAULT '{}',
    
    -- Resource usage
    memory_usage_mb real,
    gpu_utilization_percent real,
    processing_time_seconds real,
    
    -- Hyperparameters at this step
    hyperparameters jsonb DEFAULT '{}',
    
    -- Timestamps
    recorded_at timestamptz DEFAULT now(),
    
    -- Constraints
    UNIQUE(job_id, epoch, step, phase)
);

-- Model versions table for tracking model evolution
CREATE TABLE IF NOT EXISTS model_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES fine_tuning_jobs(id) ON DELETE CASCADE,
    
    -- Version information
    version_number text NOT NULL,
    version_name text,
    description text,
    
    -- Model details
    model_size_mb real,
    parameter_count bigint,
    architecture_details jsonb DEFAULT '{}',
    
    -- Performance benchmarks
    benchmark_scores jsonb DEFAULT '{}',
    evaluation_results jsonb DEFAULT '{}',
    
    -- Model artifacts
    model_path text,
    config_path text,
    tokenizer_path text,
    
    -- Deployment information
    is_deployed boolean DEFAULT false,
    deployment_url text,
    deployment_config jsonb DEFAULT '{}',
    
    -- Usage tracking
    inference_count integer DEFAULT 0,
    last_inference_at timestamptz,
    
    created_at timestamptz DEFAULT now(),
    UNIQUE(job_id, version_number)
);

-- Training logs table for detailed logging
CREATE TABLE IF NOT EXISTS training_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES fine_tuning_jobs(id) ON DELETE CASCADE,
    
    -- Log details
    log_level text NOT NULL CHECK (log_level IN ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    message text NOT NULL,
    component text, -- e.g., 'trainer', 'evaluator', 'data_loader'
    
    -- Context
    epoch integer,
    step integer,
    phase training_phase_type,
    
    -- Additional data
    metadata jsonb DEFAULT '{}',
    stack_trace text,
    
    created_at timestamptz DEFAULT now()
);

-- System settings table for application configuration
CREATE TABLE IF NOT EXISTS system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL,
    description text,
    category text DEFAULT 'general',
    is_public boolean DEFAULT false,
    updated_by uuid REFERENCES admin_users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Audit logs table for system audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Action details
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id text,
    
    -- User information
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    user_email text,
    user_role text,
    
    -- Request details
    ip_address inet,
    user_agent text,
    request_id text,
    
    -- Changes
    old_values jsonb,
    new_values jsonb,
    
    -- Context
    metadata jsonb DEFAULT '{}',
    
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fine_tuning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
    ON users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Service role can manage all users"
    ON users FOR ALL
    TO service_role
    USING (true);

-- RLS Policies for admin_users table
CREATE POLICY "Admin users can read admin data"
    ON admin_users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Super admins can manage admin users"
    ON admin_users FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'super_admin'
        )
    );

CREATE POLICY "Service role can manage admin users"
    ON admin_users FOR ALL
    TO service_role
    USING (true);

-- RLS Policies for user_roles table
CREATE POLICY "Authenticated users can read roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage roles"
    ON user_roles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- RLS Policies for uploaded_datasets table
CREATE POLICY "Users can read own datasets"
    ON uploaded_datasets FOR SELECT
    TO authenticated
    USING (uploaded_by = auth.uid() OR is_public = true);

CREATE POLICY "Users can manage own datasets"
    ON uploaded_datasets FOR ALL
    TO authenticated
    USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can read all datasets"
    ON uploaded_datasets FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin', 'analyst')
        )
    );

CREATE POLICY "Service role can manage all datasets"
    ON uploaded_datasets FOR ALL
    TO service_role
    USING (true);

-- RLS Policies for fine_tuning_jobs table
CREATE POLICY "Users can read own jobs"
    ON fine_tuning_jobs FOR SELECT
    TO authenticated
    USING (created_by = auth.uid() OR auth.uid() = ANY(team_members));

CREATE POLICY "Users can manage own jobs"
    ON fine_tuning_jobs FOR ALL
    TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Admins can read all jobs"
    ON fine_tuning_jobs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin', 'analyst')
        )
    );

CREATE POLICY "Service role can manage all jobs"
    ON fine_tuning_jobs FOR ALL
    TO service_role
    USING (true);

-- RLS Policies for training_statistics table
CREATE POLICY "Users can read stats for own jobs"
    ON training_statistics FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM fine_tuning_jobs 
            WHERE fine_tuning_jobs.id = training_statistics.job_id 
            AND (fine_tuning_jobs.created_by = auth.uid() OR auth.uid() = ANY(fine_tuning_jobs.team_members))
        )
    );

CREATE POLICY "Service role can manage all training stats"
    ON training_statistics FOR ALL
    TO service_role
    USING (true);

-- RLS Policies for model_versions table
CREATE POLICY "Users can read versions for own jobs"
    ON model_versions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM fine_tuning_jobs 
            WHERE fine_tuning_jobs.id = model_versions.job_id 
            AND (fine_tuning_jobs.created_by = auth.uid() OR auth.uid() = ANY(fine_tuning_jobs.team_members))
        )
    );

CREATE POLICY "Service role can manage all model versions"
    ON model_versions FOR ALL
    TO service_role
    USING (true);

-- RLS Policies for training_logs table
CREATE POLICY "Users can read logs for own jobs"
    ON training_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM fine_tuning_jobs 
            WHERE fine_tuning_jobs.id = training_logs.job_id 
            AND (fine_tuning_jobs.created_by = auth.uid() OR auth.uid() = ANY(fine_tuning_jobs.team_members))
        )
    );

CREATE POLICY "Service role can manage all training logs"
    ON training_logs FOR ALL
    TO service_role
    USING (true);

-- RLS Policies for system_settings table
CREATE POLICY "Users can read public settings"
    ON system_settings FOR SELECT
    TO authenticated
    USING (is_public = true);

CREATE POLICY "Admins can read all settings"
    ON system_settings FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Super admins can manage settings"
    ON system_settings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'super_admin'
        )
    );

-- RLS Policies for audit_logs table
CREATE POLICY "Admins can read audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Service role can manage audit logs"
    ON audit_logs FOR ALL
    TO service_role
    USING (true);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_supervisor ON admin_users(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_level ON admin_users(admin_level);

CREATE INDEX IF NOT EXISTS idx_uploaded_datasets_uploaded_by ON uploaded_datasets(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploaded_datasets_status ON uploaded_datasets(status);
CREATE INDEX IF NOT EXISTS idx_uploaded_datasets_type ON uploaded_datasets(dataset_type);
CREATE INDEX IF NOT EXISTS idx_uploaded_datasets_created_at ON uploaded_datasets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_datasets_name_search ON uploaded_datasets USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_created_by ON fine_tuning_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_status ON fine_tuning_jobs(status);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_created_at ON fine_tuning_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_priority ON fine_tuning_jobs(priority DESC);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_team_members ON fine_tuning_jobs USING gin(team_members);

CREATE INDEX IF NOT EXISTS idx_training_statistics_job_id ON training_statistics(job_id);
CREATE INDEX IF NOT EXISTS idx_training_statistics_epoch_step ON training_statistics(job_id, epoch, step);
CREATE INDEX IF NOT EXISTS idx_training_statistics_recorded_at ON training_statistics(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_model_versions_job_id ON model_versions(job_id);
CREATE INDEX IF NOT EXISTS idx_model_versions_deployed ON model_versions(is_deployed);
CREATE INDEX IF NOT EXISTS idx_model_versions_created_at ON model_versions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_training_logs_job_id ON training_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_training_logs_level ON training_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_training_logs_created_at ON training_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_logs_component ON training_logs(component);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.job_number IS NULL THEN
        NEW.job_number := 'JOB-' || to_char(now(), 'YYYYMMDD') || '-' || 
                         LPAD(nextval('job_number_seq')::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create sequence for job numbers
CREATE SEQUENCE IF NOT EXISTS job_number_seq START 1;

-- Triggers for automatic updates
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uploaded_datasets_updated_at 
    BEFORE UPDATE ON uploaded_datasets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fine_tuning_jobs_updated_at 
    BEFORE UPDATE ON fine_tuning_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER generate_fine_tuning_job_number 
    BEFORE INSERT ON fine_tuning_jobs 
    FOR EACH ROW EXECUTE FUNCTION generate_job_number();

-- Insert default roles
INSERT INTO user_roles (name, description, permissions, is_system_role) VALUES
('user', 'Standard user with basic access', ARRAY['read_own_data', 'create_jobs', 'upload_datasets'], true),
('analyst', 'Data analyst with extended access', ARRAY['read_own_data', 'create_jobs', 'upload_datasets', 'view_analytics', 'export_data'], true),
('admin', 'Administrator with management access', ARRAY['read_all_data', 'manage_users', 'manage_jobs', 'view_analytics', 'system_settings'], true),
('super_admin', 'Super administrator with full access', ARRAY['*'], true)
ON CONFLICT (name) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
('max_dataset_size_mb', '1000', 'Maximum dataset file size in MB', 'limits', true),
('max_concurrent_jobs', '5', 'Maximum concurrent training jobs per user', 'limits', true),
('default_job_timeout_hours', '24', 'Default job timeout in hours', 'training', true),
('supported_model_types', '["gemini-1.5-flash", "gemini-1.5-pro"]', 'Supported base models', 'training', true),
('maintenance_mode', 'false', 'System maintenance mode flag', 'system', false),
('job_retention_days', '90', 'Number of days to retain completed jobs', 'cleanup', false)
ON CONFLICT (key) DO NOTHING;

-- Insert sample admin user (will be created when first admin signs up)
-- This is handled by the application logic, not in the migration