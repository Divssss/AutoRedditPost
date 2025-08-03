
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Signal, MessageSquare, TrendingUp, Plus } from 'lucide-react';

interface Stats {
  activeSignals: number;
  totalComments: number;
  totalPosts: number;
}

interface DashboardHomeProps {
  onNavigate: (page: string) => void;
}

const DashboardHome = ({ onNavigate }: DashboardHomeProps) => {
  const [stats, setStats] = useState<Stats>({ activeSignals: 0, totalComments: 0, totalPosts: 0 });
  const [recentSignals, setRecentSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch signals count
      const { count: signalsCount } = await supabase
        .from('signals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('status', 'active');

      // Fetch comments count
      const { count: commentsCount } = await supabase
        .from('ai_comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Fetch posts count
      const { count: postsCount } = await supabase
        .from('reddit_posts')
        .select('*, signals!inner(*)', { count: 'exact', head: true })
        .eq('signals.user_id', user?.id);

      // Fetch recent signals
      const { data: signals } = await supabase
        .from('signals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        activeSignals: signalsCount || 0,
        totalComments: commentsCount || 0,
        totalPosts: postsCount || 0,
      });

      setRecentSignals(signals || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
        <p className="opacity-90">Manage your Reddit campaigns and AI-generated comments from here.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Signals</CardTitle>
            <Signal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSignals}</div>
            <p className="text-xs text-muted-foreground">
              Campaigns monitoring Reddit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments}</div>
            <p className="text-xs text-muted-foreground">
              Generated comments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reddit Posts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              Posts discovered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent signals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Signals</CardTitle>
            <CardDescription>Your latest Reddit monitoring campaigns</CardDescription>
          </div>
          <Button onClick={() => onNavigate('signals')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Signal
          </Button>
        </CardHeader>
        <CardContent>
          {recentSignals.length === 0 ? (
            <div className="text-center py-8">
              <Signal className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No signals yet</h3>
              <p className="text-gray-500 mb-4">Create your first signal to start monitoring Reddit posts.</p>
              <Button onClick={() => onNavigate('signals')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Signal
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSignals.map((signal) => (
                <div key={signal.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{signal.name}</h4>
                    <p className="text-sm text-gray-500">
                      r/{signal.subreddit} • {signal.keywords.join(', ')}
                    </p>
                  </div>
                  <Badge className={getStatusColor(signal.status)}>
                    {signal.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
