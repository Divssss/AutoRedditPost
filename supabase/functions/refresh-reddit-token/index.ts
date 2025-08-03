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

    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error('User ID is required');
    }

    console.log('Refreshing Reddit token for user:', user_id);

    // Get Reddit account for the user
    const { data: redditAccount, error: accountError } = await supabaseClient
      .from('reddit_accounts')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (accountError || !redditAccount) {
      throw new Error('Reddit account not found');
    }

    if (!redditAccount.refresh_token) {
      throw new Error('No refresh token available');
    }

    console.log('Found Reddit account, refreshing token...');

    // Refresh the access token
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa('KK6aBPJDIdcAEajzdizfOQ:BuL0145NpbABia2WqoAqvVF-vKRAJA')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RedditSignal/1.0.0'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: redditAccount.refresh_token
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token refresh failed:', tokenResponse.status, errorText);
      throw new Error(`Token refresh failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('Token refresh error:', tokenData.error);
      throw new Error(`Token refresh error: ${tokenData.error}`);
    }

    console.log('Token refreshed successfully');

    // Update the access token in the database
    const { error: updateError } = await supabaseClient
      .from('reddit_accounts')
      .update({
        access_token: tokenData.access_token,
        expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to update token in database');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        access_token: tokenData.access_token
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in refresh-reddit-token function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});