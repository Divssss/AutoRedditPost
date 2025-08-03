
-- Create contexts table
CREATE TABLE public.contexts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  context TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_prompts table
CREATE TABLE public.user_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  signal_id UUID REFERENCES public.signals NOT NULL,
  prompt TEXT NOT NULL,
  min_number INTEGER DEFAULT 20,
  max_number INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, signal_id)
);

-- Add Row Level Security (RLS) to contexts table
ALTER TABLE public.contexts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contexts
CREATE POLICY "Users can view their own contexts" 
  ON public.contexts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contexts" 
  ON public.contexts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contexts" 
  ON public.contexts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contexts" 
  ON public.contexts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add Row Level Security (RLS) to user_prompts table
ALTER TABLE public.user_prompts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_prompts
CREATE POLICY "Users can view their own prompts" 
  ON public.user_prompts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prompts" 
  ON public.user_prompts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts" 
  ON public.user_prompts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts" 
  ON public.user_prompts 
  FOR DELETE 
  USING (auth.uid() = user_id);
