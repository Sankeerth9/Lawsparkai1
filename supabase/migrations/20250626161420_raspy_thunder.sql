-- Function to match documents by vector similarity
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index int,
  chunk_text text,
  document_title text,
  document_type text,
  source text,
  categories text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.document_id,
    de.chunk_index,
    de.chunk_text,
    ld.title as document_title,
    ld.document_type,
    ld.source,
    dm.categories,
    1 - (de.embedding <=> query_embedding) as similarity
  FROM
    document_embeddings de
  JOIN
    legal_documents ld ON de.document_id = ld.id
  LEFT JOIN
    document_metadata dm ON de.document_id = dm.document_id
  WHERE
    1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY
    similarity DESC
  LIMIT
    match_count;
END;
$$;

-- Function to search documents with filtering
-- Fixed parameter names to avoid duplicate "categories" parameter
CREATE OR REPLACE FUNCTION search_documents(
  query_text text,
  filter_document_types text[] DEFAULT NULL,
  filter_categories text[] DEFAULT NULL,
  date_from date DEFAULT NULL,
  date_to date DEFAULT NULL,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index int,
  chunk_text text,
  document_title text,
  document_type text,
  source text,
  categories text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_embedding vector(1536);
BEGIN
  -- This would call an external function to get embeddings in a real implementation
  -- For now, we'll use a placeholder and rely on the edge function
  
  RETURN QUERY
  SELECT
    de.id,
    de.document_id,
    de.chunk_index,
    de.chunk_text,
    ld.title as document_title,
    ld.document_type,
    ld.source,
    dm.categories,
    1 - (de.embedding <=> query_embedding) as similarity
  FROM
    document_embeddings de
  JOIN
    legal_documents ld ON de.document_id = ld.id
  LEFT JOIN
    document_metadata dm ON de.document_id = dm.document_id
  WHERE
    (filter_document_types IS NULL OR ld.document_type = ANY(filter_document_types))
    AND (filter_categories IS NULL OR dm.categories && filter_categories)
    AND (date_from IS NULL OR dm.publication_date >= date_from)
    AND (date_to IS NULL OR dm.publication_date <= date_to)
    AND 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY
    similarity DESC
  LIMIT
    match_count;
END;
$$;