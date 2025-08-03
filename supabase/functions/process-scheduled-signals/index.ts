
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to process a single post with proper background task handling
async function processSinglePost(
  postData: any, 
  supabaseClient: any, 
  redditAccount: any, 
  userPrompt: any, 
  contexts: any[], 
  signalId: string,
  userId: string
): Promise<boolean> {
  const taskId = `signal-${signalId}-single-post`;
  console.log(`[${taskId}] === Processing single post ===`);
  console.log(`[${taskId}] Post: ${postData.title}`);
  
  try {
    // Insert new post first
    const { data: newPost, error: insertError } = await supabaseClient
      .from('reddit_posts')
      .insert({
        signal_id: signalId,
        reddit_post_id: postData.id,
        title: postData.title,
        content: postData.selftext || '',
        author: postData.author,
        subreddit: postData.subreddit,
        url: `https://reddit.com${postData.permalink}`,
        score: postData.score,
        created_at: new Date(postData.created_utc * 1000).toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[${taskId}] Error inserting post:`, insertError);
      return false;
    }

    console.log(`[${taskId}] Inserted new post: ${newPost.id}`);

    // Calculate delay for this comment
    const minDelay = (userPrompt?.min_delay_seconds || 30) * 1000;
    const maxDelay = (userPrompt?.max_delay_seconds || 120) * 1000;
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    
    console.log(`[${taskId}] Waiting ${delay}ms before comment generation...`);
    
    // Wait for the delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    console.log(`[${taskId}] === Starting comment generation and posting ===`);
    
    // Prepare prompt based on user settings
    let customPrompt = userPrompt?.prompt || "You're replying to a Reddit thread. Be helpful, engaging, and natural. Keep your response relevant to the discussion. Avoid being overly promotional.";
    const minWords = userPrompt?.min_number || 20;
    const maxWords = userPrompt?.max_number || 50;
    
    // Generate random word count between min and max
    const randomWordCount = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
    
    console.log(`[${taskId}] Using prompt with target ${randomWordCount} words (${minWords}-${maxWords})`);
    
    // Use first available context if any
    const contextData = contexts && contexts.length > 0 ? contexts[0].context : undefined;
    if (contextData) {
      console.log(`[${taskId}] Using context data (${contextData.length} chars) for comment generation`);
    }

    const { data: commentData, error: commentError } = await supabaseClient.functions.invoke('generate-ai-comment', {
      body: {
        post_title: postData.title,
        post_content: postData.selftext || '',
        subreddit: postData.subreddit,
        custom_prompt: customPrompt,
        context: contextData,
        target_words: randomWordCount
      }
    });

    if (commentError) {
      console.error(`[${taskId}] Error generating comment:`, commentError);
      return false;
    }

    console.log(`[${taskId}] AI comment generated successfully (${commentData.generated_comment?.length || 0} chars)`);

    // Save generated comment
    const { data: savedComment, error: saveError } = await supabaseClient
      .from('ai_comments')
      .insert({
        reddit_post_id: newPost.id,
        user_id: userId,
        generated_comment: commentData.generated_comment
      })
      .select()
      .single();

    if (saveError) {
      console.error(`[${taskId}] Error saving comment:`, saveError);
      return false;
    }

    console.log(`[${taskId}] Comment saved to database with ID: ${savedComment.id}`);

    // Add additional delay before posting to Reddit to avoid rate limits
    const prePostDelay = Math.floor(Math.random() * 10000) + 5000; // 5-15 seconds
    console.log(`[${taskId}] Waiting additional ${prePostDelay}ms before posting to Reddit...`);
    await new Promise(resolve => setTimeout(resolve, prePostDelay));

    // Post comment to Reddit
    const formData = new FormData();
    formData.append('thing_id', `t3_${postData.id}`);
    formData.append('text', commentData.generated_comment);

    console.log(`[${taskId}] Posting comment to Reddit...`);
    console.log(`[${taskId}] Reddit post ID: ${postData.id}`);
    console.log(`[${taskId}] Comment length: ${commentData.generated_comment.length}`);
    
    const postCommentResponse = await fetch('https://oauth.reddit.com/api/comment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${redditAccount.access_token}`,
        'User-Agent': 'RedditSignal/1.0.0'
      },
      body: formData
    });

    const responseText = await postCommentResponse.text();
    console.log(`[${taskId}] Reddit comment post response status: ${postCommentResponse.status}`);
    console.log(`[${taskId}] Reddit comment post response:`, responseText);

    if (postCommentResponse.ok) {
      // Parse the response to check for errors
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.log(`[${taskId}] Response is not JSON, treating as success`);
        responseData = { success: true };
      }

      // Check if Reddit returned an error in the response
      if (responseData.jquery && responseData.success === false) {
        console.error(`[${taskId}] Reddit API returned error in response:`, responseData);
        
        // Check for rate limit specifically
        const errorMessage = JSON.stringify(responseData);
        if (errorMessage.includes('RATELIMIT') || errorMessage.includes('doing that a lot')) {
          console.error(`[${taskId}] Reddit rate limit hit - skipping this comment`);
          return false; // Return false to indicate failure due to rate limit
        } else {
          console.error(`[${taskId}] Comment posting failed due to Reddit API error`);
          return false;
        }
      } else {
        // Mark comment as posted
        const { error: updateError } = await supabaseClient
          .from('ai_comments')
          .update({ 
            is_posted: true, 
            posted_at: new Date().toISOString() 
          })
          .eq('id', savedComment.id);

        if (updateError) {
          console.error(`[${taskId}] Error updating comment status:`, updateError);
          return false;
        } else {
          console.log(`[${taskId}] ✅ Successfully posted comment for post: ${postData.title}`);
          return true; // Return true to indicate successful posting
        }
      }
    } else {
      console.error(`[${taskId}] ❌ Failed to post comment to Reddit. Status: ${postCommentResponse.status}`);
      console.error(`[${taskId}] Response:`, responseText);
      return false;
    }
  } catch (error) {
    console.error(`[${taskId}] Error in single post processing:`, error);
    return false;
  }
  
  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('=== Starting process-scheduled-signals function ===');
    console.log('Current time:', new Date().toISOString());

    // Get all active scheduled signals that are due to run
    const now = new Date();
    const { data: scheduledSignals, error: scheduledError } = await supabaseClient
      .from('scheduled_signals')
      .select(`
        *,
        signals!fk_scheduled_signals_signal_id (
          id,
          name,
          subreddit,
          keywords,
          user_id
        )
      `)
      .eq('is_active', true)
      .lte('next_run', now.toISOString());

    if (scheduledError) {
      console.error('Error fetching scheduled signals:', scheduledError);
      throw scheduledError;
    }

    console.log(`Found ${scheduledSignals?.length || 0} signals to process`);

    if (!scheduledSignals || scheduledSignals.length === 0) {
      console.log('No scheduled signals due for processing');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No scheduled signals due for processing',
          processed_signals: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;
    let errorCount = 0;
    let successfulPosts = 0;

    // Group signals by user to ensure only 1 signal per user is processed
    const signalsByUser = new Map<string, any[]>();
    for (const signal of scheduledSignals) {
      if (!signalsByUser.has(signal.user_id)) {
        signalsByUser.set(signal.user_id, []);
      }
      signalsByUser.get(signal.user_id)!.push(signal);
    }

    console.log(`Grouped signals by user: ${signalsByUser.size} users with signals to process`);

    // Process only 1 signal per user
    const signalsToProcess = [];
    for (const [userId, userSignals] of signalsByUser) {
      // Pick the first signal for each user (or you could randomize)
      const selectedSignal = userSignals[0];
      signalsToProcess.push(selectedSignal);
      console.log(`Selected signal "${selectedSignal.signals.name}" for user ${userId} (out of ${userSignals.length} signals)`);
    }

    console.log(`Will process ${signalsToProcess.length} signals (1 per user)`);

    for (const scheduledSignal of signalsToProcess) {
      try {
        console.log(`\n=== Processing signal: ${scheduledSignal.signals.name} (ID: ${scheduledSignal.signal_id}) ===`);

        // Get Reddit access token for the user
        const { data: redditAccount, error: accountError } = await supabaseClient
          .from('reddit_accounts')
          .select('*')
          .eq('user_id', scheduledSignal.user_id)
          .single();

        if (accountError || !redditAccount) {
          console.error(`No Reddit account found for user: ${scheduledSignal.user_id}`);
          errorCount++;
          continue;
        }

        console.log(`Found Reddit account for user: ${scheduledSignal.user_id}`);

        // Get user's custom prompt settings for this signal
        const { data: userPrompt } = await supabaseClient
          .from('user_prompts')
          .select('*')
          .eq('user_id', scheduledSignal.user_id)
          .eq('signal_id', scheduledSignal.signal_id)
          .single();

        console.log('User prompt settings:', userPrompt ? 'Found custom settings' : 'Using default settings');

        // Get user's contexts
        const { data: contexts } = await supabaseClient
          .from('contexts')
          .select('*')
          .eq('user_id', scheduledSignal.user_id)
          .order('created_at', { ascending: false });

        console.log(`Found ${contexts?.length || 0} contexts for user`);

        // Fetch posts from Reddit API - limit to 10 for efficiency since we only need 1
        const redditUrl = `https://oauth.reddit.com/r/${scheduledSignal.signals.subreddit}/new.json?limit=10`;
        console.log(`Fetching from Reddit URL: ${redditUrl}`);

        const redditResponse = await fetch(redditUrl, {
          headers: {
            'Authorization': `Bearer ${redditAccount.access_token}`,
            'User-Agent': 'RedditSignal/1.0.0'
          }
        });

        if (!redditResponse.ok) {
          console.error(`Reddit API error for signal ${scheduledSignal.signals.name}: ${redditResponse.status} ${redditResponse.statusText}`);
          const errorText = await redditResponse.text();
          console.error('Reddit API error response:', errorText);
          errorCount++;
          continue;
        }

        const redditData = await redditResponse.json();
        const posts = redditData.data?.children || [];
        console.log(`Fetched ${posts.length} posts from Reddit`);

        // Filter posts by keywords only if keywords exist and are not empty
        let filteredPosts = posts;
        if (scheduledSignal.signals.keywords && scheduledSignal.signals.keywords.length > 0) {
          // Filter out any empty keywords first
          const validKeywords = scheduledSignal.signals.keywords.filter((keyword: string) => keyword && keyword.trim().length > 0);
          
          if (validKeywords.length > 0) {
            filteredPosts = posts.filter((post: any) => {
              const title = post.data.title.toLowerCase();
              const content = (post.data.selftext || '').toLowerCase();
              
              return validKeywords.some((keyword: string) => 
                title.includes(keyword.toLowerCase()) || 
                content.includes(keyword.toLowerCase())
              );
            });
            console.log(`Found ${filteredPosts.length} matching posts for keywords: ${validKeywords.join(', ')}`);
          } else {
            console.log(`No valid keywords specified, using all ${posts.length} posts`);
          }
        } else {
          console.log(`No keywords specified, using all ${posts.length} posts`);
        }

        // Find the latest post that doesn't already exist in our database
        let latestNewPost = null;
        for (const post of filteredPosts) {
          const { data: existingPost } = await supabaseClient
            .from('reddit_posts')
            .select('id')
            .eq('reddit_post_id', post.data.id)
            .single();

          if (!existingPost) {
            latestNewPost = post;
            break; // Take the first (latest) new post only
          }
        }

        if (latestNewPost) {
          console.log(`Processing 1 new post: ${latestNewPost.data.title}`);
          
          // Process the single post and wait for completion
          const postSuccess = await processSinglePost(
            latestNewPost.data,
            supabaseClient,
            redditAccount,
            userPrompt,
            contexts,
            scheduledSignal.signal_id,
            scheduledSignal.user_id
          );

          if (postSuccess) {
            successfulPosts++;
            console.log(`✅ Successfully processed and posted comment for signal: ${scheduledSignal.signals.name}`);
          } else {
            console.log(`❌ Failed to process or post comment for signal: ${scheduledSignal.signals.name}`);
          }
        } else {
          console.log('No new posts found to process');
        }

        // Update next run time (handle fractional hours)
        const frequencyMilliseconds = scheduledSignal.frequency_hours * 60 * 60 * 1000;
        const nextRun = new Date(now.getTime() + frequencyMilliseconds);
        const { error: updateError } = await supabaseClient
          .from('scheduled_signals')
          .update({
            last_run: now.toISOString(),
            next_run: nextRun.toISOString()
          })
          .eq('id', scheduledSignal.id);

        if (updateError) {
          console.error('Error updating schedule:', updateError);
        }

        console.log(`=== Completed processing signal: ${scheduledSignal.signals.name} ===`);
        console.log(`Stats - New posts found: ${latestNewPost ? 1 : 0}, Successfully posted: ${latestNewPost && successfulPosts > 0 ? 1 : 0}`);
        console.log(`Next run scheduled for: ${nextRun.toISOString()}`);
        
        processedCount++;
        
      } catch (error) {
        console.error(`Error processing signal ${scheduledSignal.signals.name}:`, error);
        errorCount++;
      }
    }

    console.log(`=== Finished processing scheduled signals ===`);
    console.log(`Processed: ${processedCount}, Errors: ${errorCount}, Successful posts: ${successfulPosts}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed_signals: processedCount,
        error_count: errorCount,
        successful_posts: successfulPosts,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-scheduled-signals function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
