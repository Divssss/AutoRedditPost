import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Sparkles, RefreshCw, Send, User } from 'lucide-react';
import { RedditPost, AIComment, Context, ToneOption } from '@/types/signal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PostsListCardProps {
  posts: RedditPost[];
  comments: Record<string, AIComment>;
  setComments: React.Dispatch<React.SetStateAction<Record<string, AIComment>>>;
  contexts: Context[];
  customPrompt: string;
  selectedContext: string;
  emotions: ToneOption[];
  minWords: number;
  maxWords: number;
  isGenerating: string | null;
  setIsGenerating: (postId: string | null) => void;
  isPosting: string | null;
  setIsPosting: (postId: string | null) => void;
}

const PostsListCard = ({
  posts,
  comments,
  setComments,
  contexts,
  customPrompt,
  selectedContext,
  emotions,
  minWords,
  maxWords,
  isGenerating,
  setIsGenerating,
  isPosting,
  setIsPosting
}: PostsListCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get the selected personality name
  const getPersonalityName = () => {
    if (selectedContext && selectedContext !== 'none') {
      const context = contexts.find(c => c.id === selectedContext);
      return context?.name || '';
    }
    return '';
  };

  const generateComment = async (post: RedditPost) => {
    setIsGenerating(post.id);
    
    try {
      const contextData = selectedContext 
        ? contexts.find(c => c.id === selectedContext)?.context 
        : undefined;

      // Generate random word count between min and max
      const randomWordCount = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
      
      // Pick random emotion from the list
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      
      const enhancedPrompt = `${customPrompt}\n\nTarget length: approximately ${randomWordCount} words.\n\nUse ${randomEmotion.label} tone for this comment.`;

      console.log('Generating comment with:', {
        post_title: post.title,
        subreddit: post.subreddit,
        prompt: enhancedPrompt,
        context: contextData,
        randomWordCount
      });

      const { data, error } = await supabase.functions.invoke('generate-ai-comment', {
        body: {
          post_title: post.title,
          post_content: post.content || '',
          subreddit: post.subreddit,
          custom_prompt: enhancedPrompt,
          context: contextData,
          target_words: randomWordCount,
          emotions: emotions
        }
      });

      if (error) {
        console.error('Function invoke error:', error);
        throw error;
      }

      console.log('Comment generated:', data);

      // Save comment to database
      const { data: commentData, error: saveError } = await supabase
        .from('ai_comments')
        .upsert({
          reddit_post_id: post.id,
          user_id: user?.id,
          generated_comment: data.generated_comment,
          emotion_used: data.emotion_used,
          word_count_used: data.word_count_used
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving comment:', saveError);
      } else {
        setComments(prev => ({
          ...prev,
          [post.id]: commentData
        }));
      }

      toast({
        title: "Success",
        description: "Comment generated successfully"
      });
    } catch (error) {
      console.error('Error generating comment:', error);
      toast({
        title: "Error",
        description: "Failed to generate comment",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const postComment = async (post: RedditPost) => {
    const comment = comments[post.id];
    if (!comment) return;

    setIsPosting(post.id);
    
    try {
      const { error } = await supabase.functions.invoke('post-reddit-comment', {
        body: {
          reddit_post_id: post.reddit_post_id,
          comment: comment.generated_comment
        }
      });

      if (error) {
        throw error;
      }

      // Update comment as posted
      await supabase
        .from('ai_comments')
        .update({ is_posted: true, posted_at: new Date().toISOString() })
        .eq('id', comment.id);

      setComments(prev => ({
        ...prev,
        [post.id]: { ...prev[post.id], is_posted: true }
      }));

      toast({
        title: "Success",
        description: "Comment posted successfully"
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      });
    } finally {
      setIsPosting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Recent Posts ({posts.length})
        </CardTitle>
        <CardDescription>
          Posts matching your signal criteria
        </CardDescription>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No posts found yet</p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const comment = comments[post.id];
              return (
                <div key={post.id} className="border rounded-lg p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                    {post.content && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-3">
                        {post.content}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>u/{post.author}</span>
                      <span>{post.score} points</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Button
                        onClick={() => generateComment(post)}
                        disabled={isGenerating === post.id}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
                      >
                        {isGenerating === post.id ? (
                          <>
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            <span>Generating AI Magic...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            <span>✨ Generate Smart Comment</span>
                          </>
                        )}
                      </Button>

                      {comment && !comment.is_posted && (
                        <Button
                          onClick={() => postComment(post)}
                          disabled={isPosting === post.id}
                          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                        >
                          {isPosting === post.id ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>Posting...</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              <span>Post Comment</span>
                            </>
                          )}
                        </Button>
                      )}

                      {comment?.is_posted && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="px-3 py-1">
                            ✓ Posted
                          </Badge>
                          {comment.emotion_used && (
                            <Badge variant="outline" className="px-2 py-1 text-xs bg-purple-50 text-purple-700 border-purple-200">
                              {comment.emotion_used} tone
                            </Badge>
                          )}
                          {comment.word_count_used && (
                            <Badge variant="outline" className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {comment.word_count_used} words
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {comment && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                         <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-2">
                             <User className="h-4 w-4 text-blue-500" />
                             <span className="font-medium text-blue-700">
                               {getPersonalityName() ? `${getPersonalityName()} says` : 'AI Generated Comment'}
                             </span>
                           </div>
                          <div className="flex items-center gap-2">
                            {comment.emotion_used && (
                              <Badge variant="outline" className="px-2 py-1 text-xs bg-purple-100/50 text-purple-700 border-purple-300">
                                {comment.emotion_used} tone
                              </Badge>
                            )}
                            {comment.word_count_used && (
                              <Badge variant="outline" className="px-2 py-1 text-xs bg-blue-100/50 text-blue-700 border-blue-300">
                                {comment.word_count_used} words
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 italic">
                          "{comment.generated_comment}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostsListCard;