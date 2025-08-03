
import { supabase } from '@/integrations/supabase/client';

export const fetchSignals = async (userId: string) => {
  const { data, error } = await supabase
    .from('signals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching signals:', error);
    return [];
  }

  return data || [];
};

export const fetchPostsForSignal = async (signalId: string) => {
  // First, fetch existing posts from database
  const { data: existingPosts } = await supabase
    .from('reddit_posts')
    .select('*')
    .eq('signal_id', signalId)
    .order('created_at', { ascending: false });

  return existingPosts || [];
};

export const fetchRedditPosts = async (signalId: string) => {
  try {
    const response = await supabase.functions.invoke('fetch-reddit-posts', {
      body: { signal_id: signalId }
    });

    if (response.error) {
      throw response.error;
    }

    // Refresh posts after fetching new ones
    const { data: updatedPosts } = await supabase
      .from('reddit_posts')
      .select('*')
      .eq('signal_id', signalId)
      .order('created_at', { ascending: false });

    return updatedPosts || [];
  } catch (error) {
    console.error('Error fetching Reddit posts:', error);
    return [];
  }
};

export const fetchCommentsForPosts = async (posts: any[]) => {
  const { data: aiComments } = await supabase
    .from('ai_comments')
    .select('*')
    .in('reddit_post_id', posts.map(p => p.id));

  if (aiComments) {
    const commentsMap: { [key: string]: any } = {};
    aiComments.forEach(comment => {
      commentsMap[comment.reddit_post_id] = comment;
    });
    return commentsMap;
  }
  return {};
};
