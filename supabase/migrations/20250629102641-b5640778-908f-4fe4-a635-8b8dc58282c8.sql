
-- Add unique constraint on user_id to support upsert operations
ALTER TABLE public.reddit_accounts 
ADD CONSTRAINT reddit_accounts_user_id_unique UNIQUE (user_id);

-- Also ensure RLS policies are correctly set up
-- Drop and recreate the service role policy to ensure it works properly
DROP POLICY IF EXISTS "Service role can manage reddit accounts" ON public.reddit_accounts;

-- Create a more specific policy for the service role
CREATE POLICY "Service role can manage reddit accounts" 
  ON public.reddit_accounts 
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);
