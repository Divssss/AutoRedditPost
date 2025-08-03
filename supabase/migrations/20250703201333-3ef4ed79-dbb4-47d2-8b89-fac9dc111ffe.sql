-- Add tone column to user_prompts table
ALTER TABLE public.user_prompts 
ADD COLUMN tone TEXT DEFAULT 'professional';