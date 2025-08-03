
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create reddit_accounts table to store connected Reddit accounts
CREATE TABLE public.reddit_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  reddit_username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create signals table for campaigns
CREATE TABLE public.signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  subreddit TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reddit_posts table to store fetched posts
CREATE TABLE public.reddit_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID REFERENCES public.signals NOT NULL,
  reddit_post_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT,
  author TEXT NOT NULL,
  subreddit TEXT NOT NULL,
  url TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_comments table to store generated comments
CREATE TABLE public.ai_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reddit_post_id UUID REFERENCES public.reddit_posts NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  generated_comment TEXT NOT NULL,
  is_posted BOOLEAN DEFAULT FALSE,
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reddit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reddit_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for reddit_accounts
CREATE POLICY "Users can view their own reddit accounts" ON public.reddit_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reddit accounts" ON public.reddit_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reddit accounts" ON public.reddit_accounts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reddit accounts" ON public.reddit_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for signals
CREATE POLICY "Users can view their own signals" ON public.signals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own signals" ON public.signals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own signals" ON public.signals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own signals" ON public.signals
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for reddit_posts
CREATE POLICY "Users can view posts from their signals" ON public.reddit_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.signals 
      WHERE signals.id = reddit_posts.signal_id 
      AND signals.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert posts for their signals" ON public.reddit_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.signals 
      WHERE signals.id = reddit_posts.signal_id 
      AND signals.user_id = auth.uid()
    )
  );

-- Create RLS policies for ai_comments
CREATE POLICY "Users can view their own comments" ON public.ai_comments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own comments" ON public.ai_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.ai_comments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.ai_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
