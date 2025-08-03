
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { reddit_post_id, comment } = await req.json();

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('Looking for Reddit account for user:', user.id);

    // Get Reddit access token for the user
    const { data: redditAccount, error: accountError } = await supabaseClient
      .from('reddit_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (accountError) {
      console.error('Reddit account query error:', accountError);
      throw new Error(`Reddit account query failed: ${accountError.message}`);
    }

    if (!redditAccount) {
      console.error('No Reddit account found for user:', user.id);
      throw new Error('Reddit account not connected');
    }

    console.log('Found Reddit account:', redditAccount.reddit_username);

    // Post comment to Reddit
    const formData = new FormData();
    formData.append('thing_id', `t3_${reddit_post_id}`);
    formData.append('text', comment);

    let redditResponse = await fetch('https://oauth.reddit.com/api/comment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${redditAccount.access_token}`,
        'User-Agent': 'RedditSignal/1.0.0'
      },
      body: formData
    });

    // If unauthorized, try to refresh token and retry
    if (redditResponse.status === 401) {
      console.log('Access token expired, attempting to refresh...');
      
      const refreshResponse = await supabaseClient.functions.invoke('refresh-reddit-token', {
        body: { user_id: user.id }
      });

      if (refreshResponse.error) {
        console.error('Token refresh failed:', refreshResponse.error);
        throw new Error('Reddit token expired and refresh failed. Please reconnect your Reddit account.');
      }

      // Get the updated access token
      const { data: updatedAccount, error: updatedAccountError } = await supabaseClient
        .from('reddit_accounts')
        .select('access_token')
        .eq('user_id', user.id)
        .single();

      if (updatedAccountError || !updatedAccount) {
        throw new Error('Failed to get updated Reddit token');
      }

      // Retry the comment post with new token
      redditResponse = await fetch('https://oauth.reddit.com/api/comment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${updatedAccount.access_token}`,
          'User-Agent': 'RedditSignal/1.0.0'
        },
        body: formData
      });
    }

    if (!redditResponse.ok) {
      const errorText = await redditResponse.text();
      console.error('Reddit API error:', errorText);
      throw new Error(`Reddit API error: ${errorText}`);
    }

    const redditData = await redditResponse.json();
    console.log('Reddit response:', redditData);

    return new Response(
      JSON.stringify({ 
        success: true,
        reddit_response: redditData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in post-reddit-comment function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

