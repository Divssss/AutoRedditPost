
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
    // Use service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('Received OAuth callback:', { code: !!code, state: !!state, error });

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `https://reddit-signal-scribe.lovable.app/?error=oauth_denied`,
          ...corsHeaders
        }
      });
    }

    if (!code || !state) {
      console.error('Missing required parameters:', { hasCode: !!code, hasState: !!state });
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `https://reddit-signal-scribe.lovable.app/?error=missing_params`,
          ...corsHeaders
        }
      });
    }

    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch (parseError) {
      console.error('Failed to parse state parameter:', parseError);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `https://reddit-signal-scribe.lovable.app/?error=invalid_state`,
          ...corsHeaders
        }
      });
    }

    const userId = stateData.user_id;
    if (!userId) {
      console.error('No user_id in state');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `https://reddit-signal-scribe.lovable.app/?error=invalid_user`,
          ...corsHeaders
        }
      });
    }

    console.log('Processing OAuth for user:', userId);

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa('KK6aBPJDIdcAEajzdizfOQ:BuL0145NpbABia2WqoAqvVF-vKRAJA')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RedditSignal/1.0.0'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `https://reddit-signal-scribe.lovable.app/auth/reddit/callback`
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `https://reddit-signal-scribe.lovable.app/?error=token_exchange_failed`,
          ...corsHeaders
        }
      });
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('Token exchange error:', tokenData.error);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `https://reddit-signal-scribe.lovable.app/?error=reddit_auth_failed`,
          ...corsHeaders
        }
      });
    }

    console.log('Token exchange successful');

    // Get user info from Reddit
    const userResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'RedditSignal/1.0.0'
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('User info fetch failed:', userResponse.status, errorText);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `https://reddit-signal-scribe.lovable.app/?error=user_info_failed`,
          ...corsHeaders
        }
      });
    }

    const userData = await userResponse.json();
    console.log('Got Reddit user data:', userData.name);

    // Check if account already exists
    const { data: existingAccount } = await supabaseClient
      .from('reddit_accounts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingAccount) {
      // Update existing account
      const { error: updateError } = await supabaseClient
        .from('reddit_accounts')
        .update({
          reddit_username: userData.name,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Database update error:', updateError);
        return new Response(null, {
          status: 302,
          headers: {
            'Location': `https://reddit-signal-scribe.lovable.app/?error=database_error`,
            ...corsHeaders
          }
        });
      }
    } else {
      // Insert new account
      const { error: insertError } = await supabaseClient
        .from('reddit_accounts')
        .insert({
          user_id: userId,
          reddit_username: userData.name,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        return new Response(null, {
          status: 302,
          headers: {
            'Location': `https://reddit-signal-scribe.lovable.app/?error=database_error`,
            ...corsHeaders
          }
        });
      }
    }

    console.log('Successfully stored Reddit account info');

    // Redirect back to the app with success
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `https://reddit-signal-scribe.lovable.app/?reddit_connected=true`,
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error in reddit-oauth-callback function:', error);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `https://reddit-signal-scribe.lovable.app/?error=unexpected_error`,
        ...corsHeaders
      }
    });
  }
});
