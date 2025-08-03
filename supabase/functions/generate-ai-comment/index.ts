
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const getRandomEmotion = (emotions: any[]): string => {
  if (!emotions || emotions.length === 0) {
    return 'Professional'; // fallback
  }
  const randomIndex = Math.floor(Math.random() * emotions.length);
  return emotions[randomIndex].label;
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { post_title, post_content, subreddit, custom_prompt, context, target_words, emotions } = await req.json();

    // Get random emotion for this comment
    const randomEmotion = getRandomEmotion(emotions);

    let systemPrompt = custom_prompt || `You are a helpful assistant that generates engaging, relevant comments for Reddit posts. 
    Create comments that are:
    - Relevant to the post content
    - Naturally conversational
    - Add value to the discussion
    - Avoid buzzwords or corporate speak
    - Appropriate for the r/${subreddit} subreddit
    - Between 50-200 characters
    - Not overly promotional or spammy
    
    Do not include any hashtags or promotional language.`;

    // Add context to the system prompt if provided
    if (context && context.trim()) {
      systemPrompt += `\n\nContext about the business/user:\n${context}`;
    }

    // Add target word count and emotion to the prompt
    if (target_words) {
      systemPrompt += `\n\nTarget length: approximately ${target_words} words.`;
    }
    
    systemPrompt += `\n\nStrictly tone of the reddit comment - ${randomEmotion}`;

    console.log('Selected emotion for this comment:', randomEmotion);

    const userPrompt = `Generate a comment for this Reddit post:
    Title: ${post_title}
    Content: ${post_content}
    Subreddit: r/${subreddit}`;

    // Log the full prompt being sent to OpenAI
    console.log('=== OpenAI Request ===');
    console.log('System Prompt:', systemPrompt);
    console.log('User Prompt:', userPrompt);
    console.log('Post Details:', { post_title, subreddit });
    console.log('Context provided:', context ? 'Yes' : 'No');
    console.log('=====================');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('OpenAI API error:', data.error);
      throw new Error(data.error.message || 'OpenAI API error');
    }

    const generatedComment = data.choices?.[0]?.message?.content;
    
    if (!generatedComment) {
      throw new Error('No comment generated');
    }

    console.log('Generated comment:', generatedComment);

    return new Response(
      JSON.stringify({ 
        generated_comment: generatedComment,
        emotion_used: randomEmotion,
        word_count_used: target_words
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-ai-comment function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
