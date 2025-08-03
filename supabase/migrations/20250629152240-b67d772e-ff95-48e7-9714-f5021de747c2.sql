
-- Enable required extensions for cron jobs and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing cron job if it exists
SELECT cron.unschedule('process-scheduled-signals');

-- Create a new cron job that runs every 5 minutes to check for scheduled signals
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

-- Verify the cron job is scheduled
SELECT * FROM cron.job WHERE jobname = 'process-scheduled-signals';
