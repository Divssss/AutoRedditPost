
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

    const { signal_id } = await req.json();

    console.log('Fetching signal for ID:', signal_id);

    // Get the signal details
    const { data: signal, error: signalError } = await supabaseClient
      .from('signals')
      .select('*')
      .eq('id', signal_id)
      .single();

    if (signalError) {
      console.error('Signal query error:', signalError);
      throw new Error(`Signal query failed: ${signalError.message}`);
    }

    if (!signal) {
      console.error('No signal found with ID:', signal_id);
      throw new Error('Signal not found');
    }

    console.log('Found signal:', signal.name, 'for user:', signal.user_id);

    // Get Reddit access token for the user
    const { data: redditAccount, error: accountError } = await supabaseClient
      .from('reddit_accounts')
      .select('*')
      .eq('user_id', signal.user_id)
      .single();

    if (accountError) {
      console.error('Reddit account query error:', accountError);
      throw new Error(`Reddit account query failed: ${accountError.message}`);
    }

    if (!redditAccount) {
      console.error('No Reddit account found for user:', signal.user_id);
      throw new Error('Reddit account not connected');
    }

    console.log('Found Reddit account for user:', redditAccount.reddit_username);

    // Fetch posts from Reddit API
    const redditResponse = await fetch(
      `https://oauth.reddit.com/r/${signal.subreddit}/new.json?limit=25`,
      {
        headers: {
          'Authorization': `Bearer ${redditAccount.access_token}`,
          'User-Agent': 'RedditSignal/1.0.0'
        }
      }
    );

    if (!redditResponse.ok) {
      const errorText = await redditResponse.text();
      console.error('Reddit API error:', redditResponse.status, errorText);
      throw new Error(`Failed to fetch from Reddit API: ${redditResponse.status} ${errorText}`);
    }

    const redditData = await redditResponse.json();
    const posts = redditData.data.children;

    console.log(`Fetched ${posts.length} posts from Reddit`);

    // Filter posts by keywords only if keywords exist and are not empty
    let filteredPosts = posts;
    if (signal.keywords && signal.keywords.length > 0 && signal.keywords.some((keyword: string) => keyword.trim() !== '')) {
      // Filter out empty keywords
      const validKeywords = signal.keywords.filter((keyword: string) => keyword.trim() !== '');
      
      if (validKeywords.length > 0) {
        filteredPosts = posts.filter((post: any) => {
          const title = post.data.title.toLowerCase();
          const content = (post.data.selftext || '').toLowerCase();
          
          return validKeywords.some((keyword: string) => 
            title.includes(keyword.toLowerCase()) || 
            content.includes(keyword.toLowerCase())
          );
        });
        console.log(`Filtered to ${filteredPosts.length} posts matching keywords: ${validKeywords.join(', ')}`);
      } else {
        console.log(`No valid keywords found, processing all ${posts.length} posts`);
      }
    } else {
      console.log(`No keywords specified or all keywords empty, processing all ${posts.length} posts`);
    }

    // Store new posts in database
    let newPostsCount = 0;
    for (const post of filteredPosts) {
      const postData = post.data;
      
      // Check if post already exists
      const { data: existingPost } = await supabaseClient
        .from('reddit_posts')
        .select('id')
        .eq('reddit_post_id', postData.id)
        .single();

      if (!existingPost) {
        const { error: insertError } = await supabaseClient
          .from('reddit_posts')
          .insert({
            signal_id: signal_id,
            reddit_post_id: postData.id,
            title: postData.title,
            content: postData.selftext || '',
            author: postData.author,
            subreddit: postData.subreddit,
            url: `https://reddit.com${postData.permalink}`,
            score: postData.score,
            created_at: new Date(postData.created_utc * 1000).toISOString()
          });

        if (insertError) {
          console.error('Error inserting post:', insertError);
        } else {
          newPostsCount++;
        }
      }
    }

    console.log(`Inserted ${newPostsCount} new posts`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        posts_processed: filteredPosts.length,
        newPostsCount: newPostsCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-reddit-posts function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
