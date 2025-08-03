
-- Add rate limiting settings to user_prompts table
ALTER TABLE user_prompts 
ADD COLUMN min_delay_seconds INTEGER DEFAULT 30,
ADD COLUMN max_delay_seconds INTEGER DEFAULT 120;

-- Update existing records to have default values
UPDATE user_prompts 
SET min_delay_seconds = 30, max_delay_seconds = 120 
WHERE min_delay_seconds IS NULL OR max_delay_seconds IS NULL;
