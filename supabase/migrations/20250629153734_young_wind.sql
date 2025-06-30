-- Check if policy exists before creating it
DO $$
BEGIN
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