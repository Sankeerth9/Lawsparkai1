/*
  # RAG System Tables

  1. New Tables
    - `document_embeddings_config` - Configuration for document embedding process
    - `document_embedding_jobs` - Track document embedding processing jobs
    - `document_embedding_chunks` - Store document chunks with embeddings for vector search

  2. Functions
    - Added function to search document chunks by similarity
    - Added triggers for automatic timestamp updates

  3. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Create document embeddings configuration table
CREATE TABLE IF NOT EXISTS document_embeddings_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    embedding_model text NOT NULL DEFAULT 'text-embedding-3-small',
    embedding_dimensions integer NOT NULL DEFAULT 1536,
    chunk_size integer NOT NULL DEFAULT 1000,
    chunk_overlap integer NOT NULL DEFAULT 200,
    similarity_threshold float NOT NULL DEFAULT 0.7,
    max_results_per_query integer NOT NULL DEFAULT 5,
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create document embedding jobs table
CREATE TABLE IF NOT EXISTS document_embedding_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    config_id uuid REFERENCES document_embeddings_config(id),
    total_chunks integer DEFAULT 0,
    processed_chunks integer DEFAULT 0,
    error_message text,
    started_at timestamptz,
    completed_at timestamptz,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create document embedding chunks table
CREATE TABLE IF NOT EXISTS document_embedding_chunks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
    job_id uuid REFERENCES document_embedding_jobs(id) ON DELETE SET NULL,
    chunk_index integer NOT NULL,
    chunk_text text NOT NULL,
    embedding vector(1536),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(document_id, chunk_index)
);

-- Enable Row Level Security on all tables
ALTER TABLE document_embeddings_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embedding_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embedding_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_embeddings_config
CREATE POLICY "Service role can manage document embeddings config"
    ON document_embeddings_config
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Admins can manage document embeddings config"
    ON document_embeddings_config
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Authenticated users can read document embeddings config"
    ON document_embeddings_config
    FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for document_embedding_jobs
CREATE POLICY "Service role can manage document embedding jobs"
    ON document_embedding_jobs
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Users can manage their own document embedding jobs"
    ON document_embedding_jobs
    FOR ALL
    TO authenticated
    USING (created_by = auth.uid());

-- Modified policy to avoid referencing non-existent uploaded_by column
CREATE POLICY "Users can read document embedding jobs"
    ON document_embedding_jobs
    FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for document_embedding_chunks
CREATE POLICY "Service role can manage document embedding chunks"
    ON document_embedding_chunks
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Authenticated users can read document embedding chunks"
    ON document_embedding_chunks
    FOR SELECT
    TO authenticated
    USING (true);

-- Modified policy to avoid referencing non-existent uploaded_by column
CREATE POLICY "Authenticated users can insert document embedding chunks"
    ON document_embedding_chunks
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_document_embedding_jobs_document_id
    ON document_embedding_jobs(document_id);

CREATE INDEX IF NOT EXISTS idx_document_embedding_jobs_status
    ON document_embedding_jobs(status);

CREATE INDEX IF NOT EXISTS idx_document_embedding_chunks_document_id
    ON document_embedding_chunks(document_id);

CREATE INDEX IF NOT EXISTS idx_document_embedding_chunks_job_id
    ON document_embedding_chunks(job_id);

-- Create vector index for similarity search
CREATE INDEX IF NOT EXISTS idx_document_embedding_chunks_embedding
    ON document_embedding_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Function for automatic timestamp updates
CREATE TRIGGER update_document_embeddings_config_updated_at
    BEFORE UPDATE ON document_embeddings_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_embedding_jobs_updated_at
    BEFORE UPDATE ON document_embedding_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_embedding_chunks_updated_at
    BEFORE UPDATE ON document_embedding_chunks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to search document chunks by similarity
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  max_results integer DEFAULT 5,
  filter_document_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index integer,
  chunk_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dec.id,
    dec.document_id,
    dec.chunk_index,
    dec.chunk_text,
    1 - (dec.embedding <=> query_embedding) as similarity
  FROM
    document_embedding_chunks dec
  WHERE
    (filter_document_ids IS NULL OR dec.document_id = ANY(filter_document_ids))
    AND 1 - (dec.embedding <=> query_embedding) > similarity_threshold
  ORDER BY
    similarity DESC
  LIMIT
    max_results;
END;
$$;

-- Insert default configuration
INSERT INTO document_embeddings_config (
    embedding_model,
    embedding_dimensions,
    chunk_size,
    chunk_overlap,
    similarity_threshold,
    max_results_per_query,
    is_active
) VALUES (
    'text-embedding-3-small',
    1536,
    1000,
    200,
    0.7,
    5,
    true
) ON CONFLICT DO NOTHING;