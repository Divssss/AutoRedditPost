-- Add columns to store emotion and word count used for AI comments
ALTER TABLE public.ai_comments 
ADD COLUMN emotion_used TEXT,
ADD COLUMN word_count_used INTEGER;