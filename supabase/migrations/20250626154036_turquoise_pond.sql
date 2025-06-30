/*
  # Create Vector Store for RAG

  1. New Tables
    - `document_embeddings` - Stores document chunks and their vector embeddings
    - `document_metadata` - Stores metadata about documents
    - `embedding_models` - Stores information about embedding models
    - `vector_search_logs` - Logs vector search queries and results

  2. Extensions
    - Enables pgvector extension for vector similarity search

  3. Indexes
    - Creates indexes for efficient vector search
*/

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Document Embeddings Table
CREATE TABLE IF NOT EXISTS document_embeddings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
    chunk_index integer NOT NULL,
    chunk_text text NOT NULL,
    embedding vector(1536),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(document_id, chunk_index)
);

-- Document Metadata Table
CREATE TABLE IF NOT EXISTS document_metadata (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    source text,
    author text,
    publication_date date,
    keywords text[],
    categories text[],
    citation text,
    url text,
    license text,
    version text,
    language text DEFAULT 'en',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(document_id)
);

-- Embedding Models Table
CREATE TABLE IF NOT EXISTS embedding_models (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    provider text NOT NULL,
    dimensions integer NOT NULL,
    version text,
    description text,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(name, provider, version)
);

-- Vector Search Logs Table
CREATE TABLE IF NOT EXISTS vector_search_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    query text NOT NULL,
    embedding vector(1536),
    num_results integer NOT NULL,
    similarity_threshold float,
    filter_criteria jsonb,
    execution_time_ms integer,
    result_ids uuid[],
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE embedding_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE vector_search_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_embeddings
CREATE POLICY "Service role can manage document embeddings"
    ON document_embeddings
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Authenticated users can read document embeddings"
    ON document_embeddings
    FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for document_metadata
CREATE POLICY "Service role can manage document metadata"
    ON document_metadata
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Authenticated users can read document metadata"
    ON document_metadata
    FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for embedding_models
CREATE POLICY "Service role can manage embedding models"
    ON embedding_models
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Authenticated users can read embedding models"
    ON embedding_models
    FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policies for vector_search_logs
CREATE POLICY "Service role can manage vector search logs"
    ON vector_search_logs
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY "Users can read their own vector search logs"
    ON vector_search_logs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create indexes for vector search
CREATE INDEX IF NOT EXISTS idx_document_embeddings_document_id
    ON document_embeddings(document_id);

-- Create vector index for similarity search
CREATE INDEX IF NOT EXISTS idx_document_embeddings_embedding
    ON document_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Create index for metadata filtering
CREATE INDEX IF NOT EXISTS idx_document_metadata_keywords
    ON document_metadata USING gin(keywords);

CREATE INDEX IF NOT EXISTS idx_document_metadata_categories
    ON document_metadata USING gin(categories);

-- Create index for search logs
CREATE INDEX IF NOT EXISTS idx_vector_search_logs_user_id
    ON vector_search_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_vector_search_logs_created_at
    ON vector_search_logs(created_at DESC);

-- Functions for automatic timestamp updates
CREATE TRIGGER update_document_embeddings_updated_at
    BEFORE UPDATE ON document_embeddings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_metadata_updated_at
    BEFORE UPDATE ON document_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_embedding_models_updated_at
    BEFORE UPDATE ON embedding_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default embedding model
INSERT INTO embedding_models (name, provider, dimensions, version, description, is_default)
VALUES ('text-embedding-3-small', 'openai', 1536, '1.0', 'OpenAI text-embedding-3-small model', true)
ON CONFLICT (name, provider, version) DO NOTHING;