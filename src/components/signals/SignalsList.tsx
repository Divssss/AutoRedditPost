
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Signal, Eye, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SignalsListProps {
  signals: any[];
  selectedSignal: any;
  onSelectSignal: (signal: any) => void;
  onSignalDeleted?: () => void;
}

const SignalsList = ({ signals, selectedSignal, onSelectSignal, onSignalDeleted }: SignalsListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deletingSignal, setDeletingSignal] = useState<string | null>(null);

  const deleteSignal = async (signalId: string, signalName: string) => {
    console.log('Starting deletion process for signal:', signalId, signalName);
    setDeletingSignal(signalId);
    
    try {
      // Step 1: Delete AI comments first (by getting posts first)
      console.log('Step 1: Getting posts for signal to delete AI comments:', signalId);
      const { data: posts, error: postsError } = await supabase
        .from('reddit_posts')
        .select('id')
        .eq('signal_id', signalId);

      if (postsError) {
        console.error('Error fetching posts for deletion:', postsError);
        throw postsError;
      }

      console.log('Found posts to delete comments for:', posts?.length || 0);

      if (posts && posts.length > 0) {
        console.log('Step 1a: Deleting AI comments for posts:', posts.map(p => p.id));
        const { error: commentsError } = await supabase
          .from('ai_comments')
          .delete()
          .in('reddit_post_id', posts.map(p => p.id));

        if (commentsError) {
          console.error('Error deleting AI comments:', commentsError);
          throw commentsError;
        }
        console.log('Successfully deleted AI comments');
      }

      // Step 2: Delete user prompts
      console.log('Step 2: Deleting user prompts for signal:', signalId);
      const { error: promptsError } = await supabase
        .from('user_prompts')
        .delete()
        .eq('signal_id', signalId);

      if (promptsError) {
        console.error('Error deleting user prompts:', promptsError);
        throw promptsError;
      }
      console.log('Successfully deleted user prompts');

      // Step 3: Delete scheduled signals
      console.log('Step 3: Deleting scheduled signals for signal:', signalId);
      const { error: scheduledError } = await supabase
        .from('scheduled_signals')
        .delete()
        .eq('signal_id', signalId);

      if (scheduledError) {
        console.error('Error deleting scheduled signals:', scheduledError);
        throw scheduledError;
      }
      console.log('Successfully deleted scheduled signals');

      // Step 4: Delete Reddit posts
      console.log('Step 4: Deleting Reddit posts for signal:', signalId);
      const { error: redditPostsError } = await supabase
        .from('reddit_posts')
        .delete()
        .eq('signal_id', signalId);

      if (redditPostsError) {
        console.error('Error deleting Reddit posts:', redditPostsError);
        throw redditPostsError;
      }
      console.log('Successfully deleted Reddit posts');

      // Step 5: Finally delete the signal
      console.log('Step 5: Deleting the signal itself:', signalId);
      const { error: signalError } = await supabase
        .from('signals')
        .delete()
        .eq('id', signalId);

      if (signalError) {
        console.error('Error deleting signal:', signalError);
        throw signalError;
      }

      console.log('Successfully deleted signal:', signalId, signalName);

      toast({
        title: "Success",
        description: `Signal "${signalName}" deleted successfully`
      });

      if (onSignalDeleted) {
        onSignalDeleted();
      }

      // If the deleted signal was selected, clear selection
      if (selectedSignal?.id === signalId) {
        onSelectSignal(null);
      }
    } catch (error) {
      console.error('Error deleting signal:', error);
      toast({
        title: "Error",
        description: `Failed to delete signal "${signalName}": ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setDeletingSignal(null);
    }
  };

  const viewSignalDetails = (signal: any) => {
    navigate(`/signal/${signal.id}`);
  };

  return (
    <div className="lg:col-span-1">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Signal className="h-5 w-5" />
            Your Signals ({signals.length})
          </CardTitle>
          <CardDescription>
            Click on a signal to view posts and manage comments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No signals created yet</p>
          ) : (
            <div className="space-y-3">
              {signals.map((signal) => (
                <div
                  key={signal.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSignal?.id === signal.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 
                      className="font-semibold text-lg flex-1"
                      onClick={() => onSelectSignal(signal)}
                    >
                      {signal.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={signal.status === 'active' ? 'default' : 'secondary'}>
                        {signal.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewSignalDetails(signal)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            disabled={deletingSignal === signal.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                              Delete Signal
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{signal.name}"? This will permanently remove:
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>The signal and all its settings</li>
                                <li>All related Reddit posts</li>
                                <li>All generated AI comments</li>
                                <li>Any scheduled automation</li>
                              </ul>
                              <p className="mt-2 font-medium text-red-600">This action cannot be undone.</p>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteSignal(signal.id, signal.name)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete Signal
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div 
                    className="space-y-2"
                    onClick={() => onSelectSignal(signal)}
                  >
                    <p className="text-sm text-gray-600">
                      <strong>r/{signal.subreddit}</strong>
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {signal.keywords.slice(0, 3).map((keyword: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                      {signal.keywords.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          +{signal.keywords.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SignalsList;
