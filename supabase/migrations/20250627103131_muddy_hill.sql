/*
  # Add INSERT policy for api_usage table

  1. Security
    - Add policy for authenticated users to insert their own API usage records
    - Ensures users can only insert records with their own user_id
    - Maintains data security while enabling logging functionality

  2. Changes
    - CREATE POLICY for INSERT operations on api_usage table
    - Policy restricts insertion to records where user_id matches authenticated user's ID
*/

-- Add INSERT policy for api_usage table to allow authenticated users to log their own API usage
CREATE POLICY "Users can insert their own API usage"
  ON api_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);