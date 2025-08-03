
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RedditCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          console.error('Reddit OAuth error:', error);
          navigate('/?error=reddit_auth_failed');
          return;
        }

        if (!code || !state) {
          console.error('Missing code or state parameter');
          navigate('/?error=reddit_auth_failed');
          return;
        }

        // Call our Supabase function with the code and state
        const response = await fetch(`https://phdzvdzzgmzejpznfjqx.supabase.co/functions/v1/reddit-oauth-callback?code=${code}&state=${state}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZHp2ZHp6Z216ZWpwem5manF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExODkzNzAsImV4cCI6MjA2Njc2NTM3MH0.IL7HBA8GidLvwg3HXlUJKU4M-tMRJsD5oCxsYWO73gw`
          }
        });

        if (response.redirected) {
          window.location.href = response.url;
        } else if (response.ok) {
          navigate('/?reddit_connected=true');
        } else {
          throw new Error('Failed to process OAuth callback');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/?error=reddit_auth_failed');
      }
    };

    handleRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Connecting your Reddit account...</p>
      </div>
    </div>
  );
};

export default RedditCallback;
