import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Signal, RedditPost, Context, AIComment, ScheduledSignal } from '@/types/signal';

export const useSignalDetail = (signalId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [signal, setSignal] = useState<Signal | null>(null);
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [comments, setComments] = useState<Record<string, AIComment>>({});
  const [scheduledSignal, setScheduledSignal] = useState<ScheduledSignal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState<string | null>(null);
  const [isFetchingPosts, setIsFetchingPosts] = useState(false);

  const loadScheduledSignal = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_signals')
        .select('*')
        .eq('signal_id', signalId)
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading scheduled signal:', error);
        return;
      }

      if (data) {
        setScheduledSignal(data);
      }
    } catch (error) {
      console.error('Error loading scheduled signal:', error);
    }
  };

  const loadSignalData = async () => {
    try {
      // Load signal details
      const { data: signalData, error: signalError } = await supabase
        .from('signals')
        .select('*')
        .eq('id', signalId)
        .single();

      if (signalError) {
        console.error('Signal error:', signalError);
        throw signalError;
      }
      
      console.log('Signal loaded:', signalData);
      setSignal(signalData);

      // Load posts for this signal
      const { data: postsData, error: postsError } = await supabase
        .from('reddit_posts')
        .select('*')
        .eq('signal_id', signalId)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Posts error:', postsError);
        throw postsError;
      }
      
      console.log('Posts loaded:', postsData);
      setPosts(postsData || []);

      // Load comments for posts
      if (postsData && postsData.length > 0) {
        const { data: commentsData, error: commentsError } = await supabase
          .from('ai_comments')
          .select('*')
          .in('reddit_post_id', postsData.map(p => p.id));

        if (commentsError) {
          console.error('Comments error:', commentsError);
        } else {
          const commentsMap = (commentsData || []).reduce((acc, comment) => {
            acc[comment.reddit_post_id] = comment;
            return acc;
          }, {} as Record<string, AIComment>);
          setComments(commentsMap);
        }
      }
    } catch (error) {
      console.error('Error loading signal data:', error);
      toast({
        title: "Error",
        description: "Failed to load signal data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadContexts = async () => {
    try {
      const { data, error } = await supabase
        .from('contexts')
        .select('id, name, context')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Contexts error:', error);
        throw error;
      }

      console.log('Contexts loaded:', data);
      setContexts(data || []);
    } catch (error) {
      console.error('Error loading contexts:', error);
    }
  };

  const fetchPostsManually = async () => {
    if (!signal) return;
    
    setIsFetchingPosts(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-reddit-posts', {
        body: { signal_id: signal.id }
      });

      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: `Fetched ${data?.newPostsCount || 0} new posts from Reddit`
      });

      // Reload the signal data to show new posts
      loadSignalData();
    } catch (error) {
      console.error('Error fetching posts manually:', error);
      toast({
        title: "Error",
        description: "Failed to fetch posts from Reddit",
        variant: "destructive"
      });
    } finally {
      setIsFetchingPosts(false);
    }
  };

  useEffect(() => {
    if (signalId && user) {
      loadSignalData();
      loadContexts();
      loadScheduledSignal();
    }
  }, [signalId, user]);

  return {
    signal,
    posts,
    contexts,
    comments,
    setComments,
    scheduledSignal,
    setScheduledSignal,
    isLoading,
    isGenerating,
    setIsGenerating,
    isPosting,
    setIsPosting,
    isFetchingPosts,
    loadSignalData,
    loadScheduledSignal,
    fetchPostsManually
  };
};