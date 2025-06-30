/*
  # Fix document embeddings insert policy

  1. New Policies
    - Add INSERT policy for document_embeddings table
    - Add INSERT policy for document_metadata table
    - Ensure authenticated users can insert records

  2. Security
    - Maintains data security while enabling document indexing functionality
    - Allows the RAG feature to properly store document chunks and metadata
*/

-- Add INSERT policy for document_embeddings table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'document_embeddings' 
        AND policyname = 'Authenticated users can insert document embeddings'
    ) THEN
        EXECUTE 'CREATE POLICY "Authenticated users can insert document embeddings" 
                ON document_embeddings 
                FOR INSERT 
                TO authenticated 
                WITH CHECK (true)';
    END IF;
END
$$;

-- Add INSERT policy for document_metadata table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'document_metadata' 
        AND policyname = 'Authenticated users can insert document metadata'
    ) THEN
        EXECUTE 'CREATE POLICY "Authenticated users can insert document metadata" 
                ON document_metadata 
                FOR INSERT 
                TO authenticated 
                WITH CHECK (true)';
    END IF;
END
$$;