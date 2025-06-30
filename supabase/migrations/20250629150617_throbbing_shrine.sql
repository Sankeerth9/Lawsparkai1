/*
  # Add INSERT policy for legal_documents table

  1. Security
    - Add policy to allow authenticated users to insert legal documents
    - This enables the document upload functionality in the RAG system

  2. Changes
    - Creates "Authenticated users can insert legal documents" policy
    - Allows any authenticated user to insert documents into legal_documents table
*/

CREATE POLICY "Authenticated users can insert legal documents"
  ON legal_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);