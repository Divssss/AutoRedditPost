-- Create function to get signals with comment stats
CREATE OR REPLACE FUNCTION get_signals_with_stats(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  subreddit TEXT,
  keywords TEXT[],
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  generated_count BIGINT,
  posted_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.name,
    s.subreddit,
    s.keywords,
    s.status,
    s.created_at,
    s.updated_at,
    COALESCE(COUNT(ai.id) FILTER (WHERE ai.generated_comment IS NOT NULL), 0) as generated_count,
    COALESCE(COUNT(ai.id) FILTER (WHERE ai.is_posted = true), 0) as posted_count
  FROM signals s
  LEFT JOIN reddit_posts rp ON s.id = rp.signal_id
  LEFT JOIN ai_comments ai ON rp.id = ai.reddit_post_id
  WHERE s.user_id = user_id_param
  GROUP BY s.id, s.user_id, s.name, s.subreddit, s.keywords, s.status, s.created_at, s.updated_at
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql;