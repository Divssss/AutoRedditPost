import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import CommentEditor from './CommentEditor';
import RedditConnectionStatus from './RedditConnectionStatus';
import CreateSignalDialog from './CreateSignalDialog';
import RedditConnectionNotice from './RedditConnectionNotice';
import SignalCard from './SignalCard';
import { fetchSignals } from './SignalsPageHelpers';
import {
  Signal,
  Activity,
  FileText,
  MessageSquare,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Signal {
  id: string;
  name: string;
  subreddit: string;
  keywords: string[];
  status: string;
  created_at: string;
}

const SignalsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [redditConnected, setRedditConnected] = useState(false);
  const [isCheckingReddit, setIsCheckingReddit] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deletingSignal, setDeletingSignal] = useState<string | null>(null);

  const [dashboardStats, setDashboardStats] = useState({
    totalSignals: 0,
    activeSignals: 0,
    totalPosts: 0,
    totalComments: 0,
    postedComments: 0
  });

  const loadSignals = async () => {
    if (!user) return;
    
    try {
      console.log('Loading signals for user:', user.id);
      
      // Get signals with comment counts
      const { data, error } = await supabase
        .rpc('get_signals_with_stats', { user_id_param: user.id });

      if (error) {
        console.error('Signals error:', error);
        // Fallback to basic signal query if RPC fails
        const { data: basicData, error: basicError } = await supabase
          .from('signals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (basicError) throw basicError;
        setSignals(basicData || []);
        return;
      }
      
      console.log('Signals with stats loaded:', data);
      setSignals(data || []);
    } catch (error) {
      console.error('Error loading signals:', error);
      toast({
        title: "Error",
        description: "Failed to load signals",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkRedditConnection = async () => {
    if (!user) return;
    
    console.log('Checking Reddit connection for user:', user.id);
    setIsCheckingReddit(true);
    try {
      const { data, error } = await supabase
        .from('reddit_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      console.log('Reddit connection check result:', { data, error });
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking Reddit connection:', error);
        setRedditConnected(false);
      } else {
        setRedditConnected(!!data);
        console.log('Reddit connected:', !!data);
      }
    } catch (error) {
      console.error('Error checking Reddit connection:', error);
      setRedditConnected(false);
    } finally {
      setIsCheckingReddit(false);
    }
  };

  const loadDashboardStats = async () => {
    if (!user) return;

    try {
      // Get signal stats
      const { data: signalsData } = await supabase
        .from('signals')
        .select('status, id')
        .eq('user_id', user.id);

      const totalSignals = signalsData?.length || 0;
      const activeSignals = signalsData?.filter(s => s.status === 'active').length || 0;

      // Get posts stats
      const { data: postsData } = await supabase
        .from('reddit_posts')
        .select('id, signal_id')
        .in('signal_id', signalsData?.map(s => s.id) || []);

      const totalPosts = postsData?.length || 0;

      // Get comments stats
      const { data: commentsData } = await supabase
        .from('ai_comments')
        .select('is_posted')
        .eq('user_id', user.id);

      const totalComments = commentsData?.length || 0;
      const postedComments = commentsData?.filter(c => c.is_posted).length || 0;

      setDashboardStats({
        totalSignals,
        activeSignals,
        totalPosts,
        totalComments,
        postedComments
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const deleteSignal = async (signalId: string, signalName: string) => {
    console.log(`Starting deletion process for signal: ${signalName} (ID: ${signalId})`);
    setDeletingSignal(signalId);
    
    try {
      // First delete related scheduled signals
      console.log('Deleting scheduled signals...');
      const { error: scheduledError } = await supabase
        .from('scheduled_signals')
        .delete()
        .eq('signal_id', signalId);

      if (scheduledError) {
        console.error('Error deleting scheduled signals:', scheduledError);
      }

      // Get all posts for this signal
      console.log('Fetching posts for signal...');
      const { data: posts, error: postsSelectError } = await supabase
        .from('reddit_posts')
        .select('id')
        .eq('signal_id', signalId);

      if (postsSelectError) {
        console.error('Error fetching posts:', postsSelectError);
      }

      // Delete related AI comments for these posts
      if (posts && posts.length > 0) {
        console.log(`Deleting AI comments for ${posts.length} posts...`);
        const { error: commentsError } = await supabase
          .from('ai_comments')
          .delete()
          .in('reddit_post_id', posts.map(p => p.id));

        if (commentsError) {
          console.error('Error deleting AI comments:', commentsError);
        }
      }

      // Delete related posts
      console.log('Deleting reddit posts...');
      const { error: postsError } = await supabase
        .from('reddit_posts')
        .delete()
        .eq('signal_id', signalId);

      if (postsError) {
        console.error('Error deleting reddit posts:', postsError);
      }

      // Delete user prompts
      console.log('Deleting user prompts...');
      const { error: promptsError } = await supabase
        .from('user_prompts')
        .delete()
        .eq('signal_id', signalId);

      if (promptsError) {
        console.error('Error deleting user prompts:', promptsError);
      }

      // Finally delete the signal
      console.log('Deleting signal...');
      const { error: signalError } = await supabase
        .from('signals')
        .delete()
        .eq('id', signalId);

      if (signalError) {
        console.error('Error deleting signal:', signalError);
        throw signalError;
      }

      console.log(`Successfully deleted signal: ${signalName}`);
      toast({
        title: "Success",
        description: `Signal "${signalName}" deleted successfully`
      });

      loadSignals();
      loadDashboardStats();
    } catch (error) {
      console.error('Error deleting signal:', error);
      toast({
        title: "Error",
        description: "Failed to delete signal",
        variant: "destructive"
      });
    } finally {
      setDeletingSignal(null);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('User available, loading data for:', user.email);
      loadSignals();
      checkRedditConnection();
      loadDashboardStats();
    }
  }, [user]);

  useEffect(() => {
    // Check URL for connection status with better error handling
    const urlParams = new URLSearchParams(window.location.search);
    const redditConnectedParam = urlParams.get('reddit_connected');
    const errorParam = urlParams.get('error');

    if (redditConnectedParam === 'true') {
      toast({
        title: "Success!",
        description: "Reddit account connected successfully",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh connection status
      checkRedditConnection();
    }

    if (errorParam) {
      let errorMessage = "Failed to connect Reddit account. Please try again.";
      
      switch (errorParam) {
        case 'oauth_denied':
          errorMessage = "Reddit authorization was denied. Please try connecting again.";
          break;
        case 'missing_params':
          errorMessage = "Invalid callback parameters. Please try connecting again.";
          break;
        case 'invalid_state':
          errorMessage = "Invalid authentication state. Please try connecting again.";
          break;
        case 'invalid_user':
          errorMessage = "User authentication failed. Please log in and try again.";
          break;
        case 'token_exchange_failed':
          errorMessage = "Failed to exchange authorization code. Please try again.";
          break;
        case 'reddit_auth_failed':
          errorMessage = "Reddit authentication failed. Please try connecting again.";
          break;
        case 'user_info_failed':
          errorMessage = "Failed to get Reddit user information. Please try again.";
          break;
        case 'database_error':
          errorMessage = "Failed to save Reddit account information. Please try again.";
          break;
        case 'unexpected_error':
          errorMessage = "An unexpected error occurred. Please try again.";
          break;
      }

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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

  const createSignal = async (values: any) => {
    console.log('createSignal called with values:', values);
    console.log('Current user:', user?.id);
    console.log('Reddit connected:', redditConnected);

    if (!user) {
      console.error('No user found');
      toast({
        title: "Authentication Required",
        description: "Please log in to create a signal",
        variant: "destructive"
      });
      return;
    }

    if (!redditConnected) {
      console.error('Reddit not connected');
      toast({
        title: "Reddit Not Connected",
        description: "Please connect your Reddit account first",
        variant: "destructive"
      });
      return;
    }

    console.log('Attempting to create signal with data:', {
      user_id: user.id,
      name: values.name,
      subreddit: values.subreddit,
      keywords: values.keywords
    });

    try {
      const { data, error } = await supabase
        .from('signals')
        .insert({
          user_id: user.id,
          name: values.name,
          subreddit: values.subreddit,
          keywords: values.keywords
        })
        .select();

      console.log('Signal creation result:', { data, error });

      if (error) {
        console.error('Error creating signal:', error);
        toast({
          title: "Error",
          description: `Failed to create signal: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('Signal created successfully:', data);
      toast({
        title: "Success",
        description: "Signal created successfully"
      });

      setCreateDialogOpen(false);
      loadSignals();
      loadDashboardStats();
    } catch (error) {
      console.error('Exception creating signal:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating the signal",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Signals
          </h1>
          <p className="text-muted-foreground text-lg">Monitor Reddit and manage your AI comment campaigns</p>
        </div>
        <div className="flex items-center gap-4">
          <RedditConnectionStatus
            isCheckingReddit={isCheckingReddit}
            redditConnected={redditConnected}
            onConnectReddit={connectReddit}
          />
          
          <CreateSignalDialog
            isOpen={createDialogOpen}
            setIsOpen={setCreateDialogOpen}
            redditConnected={redditConnected}
            isCheckingReddit={isCheckingReddit}
            onCreateSignal={createSignal}
          />
        </div>
      </div>

      {/* Modern Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="card-elegant interactive-lift group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Signals</p>
                <p className="text-3xl font-bold text-foreground">{dashboardStats.totalSignals}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                <Signal className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant interactive-lift group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Active Signals</p>
                <p className="text-3xl font-bold text-foreground">{dashboardStats.activeSignals}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant interactive-lift group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Posts Found</p>
                <p className="text-3xl font-bold text-foreground">{dashboardStats.totalPosts}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant interactive-lift group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Comments Generated</p>
                <p className="text-3xl font-bold text-foreground">{dashboardStats.totalComments}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:shadow-orange-500/25 transition-all duration-300">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elegant interactive-lift group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Comments Posted</p>
                <p className="text-3xl font-bold text-foreground">{dashboardStats.postedComments}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-indigo-500/25 transition-all duration-300">
                <Send className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <RedditConnectionNotice
        redditConnected={redditConnected}
        isCheckingReddit={isCheckingReddit}
        onConnectReddit={connectReddit}
      />

      {/* Modern Signals List */}
      <Card className="card-elegant">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-primary to-primary-glow rounded-lg">
              <Signal className="h-5 w-5 text-primary-foreground" />
            </div>
            Your Signals ({signals.length})
          </CardTitle>
          <CardDescription className="text-base">
            Click on a signal to view posts and manage comments
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {signals.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Signal className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg mb-2">No signals created yet</p>
              <p className="text-sm text-muted-foreground">Create your first signal to start monitoring Reddit posts</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {signals.map((signal) => (
                <SignalCard
                  key={signal.id}
                  signal={signal}
                  onDelete={deleteSignal}
                  deletingSignal={deletingSignal}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SignalsPage;
