
-- Create a table for scheduled signals
CREATE TABLE public.scheduled_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  frequency_hours INTEGER NOT NULL, -- frequency in hours
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.scheduled_signals ENABLE ROW LEVEL SECURITY;

-- Create policies for scheduled_signals
CREATE POLICY "Users can view their own scheduled signals" 
  ON public.scheduled_signals 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled signals" 
  ON public.scheduled_signals 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled signals" 
  ON public.scheduled_signals 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled signals" 
  ON public.scheduled_signals 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job that runs every 5 minutes to check for scheduled signals
SELECT cron.schedule(
  'process-scheduled-signals',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://phdzvdzzgmzejpznfjqx.supabase.co/functions/v1/process-scheduled-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZHp2ZHp6Z216ZWpwem5manF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExODkzNzAsImV4cCI6MjA2Njc2NTM3MH0.IL7HBA8GidLvwg3HXlUJKU4M-tMRJsD5oCxsYWO73gw"}'::jsonb,
        body:='{"scheduled_check": true}'::jsonb
    ) as request_id;
  $$
);
