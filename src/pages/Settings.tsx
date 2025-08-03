import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [redditConnected, setRedditConnected] = useState(false);
  const [isCheckingReddit, setIsCheckingReddit] = useState(true);
  const [redditUsername, setRedditUsername] = useState<string>('');

  useEffect(() => {
    if (user) {
      checkRedditConnection();
    }
  }, [user]);

  const checkRedditConnection = async () => {
    if (!user) return;
    
    setIsCheckingReddit(true);
    try {
      const { data, error } = await supabase
        .from('reddit_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking Reddit connection:', error);
        setRedditConnected(false);
      } else {
        setRedditConnected(!!data);
        if (data) {
          setRedditUsername(data.reddit_username);
        }
      }
    } catch (error) {
      console.error('Error checking Reddit connection:', error);
      setRedditConnected(false);
    } finally {
      setIsCheckingReddit(false);
    }
  };

  const connectReddit = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to connect your Reddit account",
        variant: "destructive"
      });
      return;
    }

    const clientId = 'KK6aBPJDIdcAEajzdizfOQ';
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/reddit/callback`);
    const scope = 'identity,read,submit';
    const state = btoa(JSON.stringify({ user_id: user.id }));
    
    const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${redirectUri}&duration=permanent&scope=${scope}`;
    
    window.location.href = authUrl;
  };

  const disconnectReddit = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reddit_accounts')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setRedditConnected(false);
      setRedditUsername('');
      
      toast({
        title: "Success",
        description: "Reddit account disconnected successfully"
      });
    } catch (error) {
      console.error('Error disconnecting Reddit:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect Reddit account",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-muted-foreground text-lg">Manage your account and integrations</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/')} className="interactive-lift">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card className="card-elegant interactive-lift">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary-glow/5">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-3 bg-gradient-to-br from-primary to-primary-glow rounded-xl shadow-lg">
                <SettingsIcon className="h-6 w-6 text-primary-foreground" />
              </div>
              Reddit Integration
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Connect your Reddit account to fetch posts and post comments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {isCheckingReddit ? (
              <div className="flex items-center gap-3 justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-muted-foreground">Checking connection...</span>
              </div>
            ) : redditConnected ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Badge className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm">
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Connected
                    </Badge>
                    <div className="flex flex-col">
                      <span className="font-medium text-emerald-800">
                        u/{redditUsername}
                      </span>
                      <span className="text-xs text-emerald-600">
                        Ready to use
                      </span>
                    </div>
                  </div>
                  <Button onClick={disconnectReddit} variant="outline" className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30">
                    Disconnect Reddit
                  </Button>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-muted-foreground leading-relaxed">
                    🎉 Your Reddit account is connected and ready to use. You can now create signals 
                    to monitor subreddits and post intelligent comments automatically.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="destructive" className="px-3 py-1.5 shadow-sm">
                      <AlertCircle className="h-4 w-4 mr-1.5" />
                      Not Connected
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Connect your Reddit account to start monitoring subreddits and posting comments automatically.
                  </p>
                </div>
                <Button 
                  onClick={connectReddit} 
                  className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-primary-foreground font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 interactive-scale"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Connect Reddit Account
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;