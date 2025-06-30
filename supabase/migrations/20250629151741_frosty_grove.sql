/*
  # Add INSERT policy for legal_documents table if it doesn't exist
  
  1. Changes
    - Adds a policy allowing authenticated users to insert documents into legal_documents table
    - Uses DO block to check if policy exists before creating it
    - Prevents "policy already exists" error
*/

DO $$
BEGIN
    -- Check if the policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'legal_documents' 
        AND policyname = 'Authenticated users can insert legal documents'
    ) THEN
        -- Create the policy only if it doesn't exist
        EXECUTE 'CREATE POLICY "Authenticated users can insert legal documents" 
                ON legal_documents 
                FOR INSERT 
                TO authenticated 
                WITH CHECK (true)';
    END IF;
END
$$;