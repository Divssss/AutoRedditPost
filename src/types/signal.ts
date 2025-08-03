export interface Signal {
  id: string;
  name: string;
  subreddit: string;
  keywords: string[];
  status: string;
  created_at: string;
}

export interface RedditPost {
  id: string;
  title: string;
  content: string;
  author: string;
  score: number;
  url: string;
  reddit_post_id: string;
  subreddit: string;
  created_at: string;
  fetched_at: string;
}

export interface Context {
  id: string;
  name: string;
  context: string;
}

export interface AIComment {
  id: string;
  generated_comment: string;
  is_posted: boolean;
  reddit_post_id: string;
  emotion_used?: string;
  word_count_used?: number;
}

export interface ScheduledSignal {
  id: string;
  signal_id: string;
  start_time: string;
  frequency_hours: number;
  is_active: boolean;
  last_run: string | null;
  next_run: string;
}

export interface ToneOption {
  value: string;
  label: string;
}