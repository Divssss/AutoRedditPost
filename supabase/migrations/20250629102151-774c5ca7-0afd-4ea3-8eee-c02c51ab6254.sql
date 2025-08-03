
-- First, let's make sure the reddit_accounts table exists with proper structure
CREATE TABLE IF NOT EXISTS public.reddit_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reddit_username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reddit_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own reddit accounts" ON public.reddit_accounts;
DROP POLICY IF EXISTS "Users can insert their own reddit accounts" ON public.reddit_accounts;
DROP POLICY IF EXISTS "Users can update their own reddit accounts" ON public.reddit_accounts;
DROP POLICY IF EXISTS "Service role can manage reddit accounts" ON public.reddit_accounts;

-- Create policies for users to manage their own reddit accounts
CREATE POLICY "Users can view their own reddit accounts" 
  ON public.reddit_accounts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reddit accounts" 
  ON public.reddit_accounts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reddit accounts" 
  ON public.reddit_accounts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy for service role (used by edge functions)
CREATE POLICY "Service role can manage reddit accounts" 
  ON public.reddit_accounts 
  FOR ALL 
  USING (true);
