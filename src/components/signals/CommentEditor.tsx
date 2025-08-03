
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Send } from 'lucide-react';

interface CommentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
  postContent: string;
  subreddit: string;
  existingComment?: string;
  onCommentGenerated: (comment: string) => void;
  onCommentPosted: () => void;
}

const CommentEditor = ({
  isOpen,
  onClose,
  postId,
  postTitle,
  postContent,
  subreddit,
  existingComment,
  onCommentGenerated,
  onCommentPosted
}: CommentEditorProps) => {
  const { toast } = useToast();
  const [comment, setComment] = useState(existingComment || '');
  const [customPrompt, setCustomPrompt] = useState(
    `You are a helpful assistant that generates engaging, relevant comments for Reddit posts. 
Create comments that are:
- Relevant to the post content
- Naturally conversational
- Add value to the discussion
- Avoid buzzwords or corporate speak
- Don’t use emojis or exclaimation marks.
- Dont use perfect english.
- Keep the tone casual, honest, and human
- Appropriate for the r/${subreddit} subreddit
- Between 50-200 characters
- Not overly promotional or spammy

Do not include any hashtags or promotional language.`
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const generateComment = async () => {
    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-ai-comment', {
        body: {
          post_title: postTitle,
          post_content: postContent,
          subreddit: subreddit,
          custom_prompt: customPrompt
        }
      });

      if (response.error) {
        throw response.error;
      }

      const generatedComment = response.data.comment;
      setComment(generatedComment);
      onCommentGenerated(generatedComment);

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
      setIsGenerating(false);
    }
  };

  const postComment = async () => {
    if (!comment.trim()) {
      toast({
        title: "Error",
        description: "Please generate or write a comment first",
        variant: "destructive"
      });
      return;
    }

    setIsPosting(true);
    try {
      const response = await supabase.functions.invoke('post-reddit-comment', {
        body: {
          reddit_post_id: postId,
          comment: comment
        }
      });

      if (response.error) {
        throw response.error;
      }

      onCommentPosted();
      onClose();

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
      setIsPosting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Comment</DialogTitle>
          <DialogDescription>
            Customize your comment for: {postTitle}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Custom Prompt (Optional)</label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Customize the AI prompt for generating comments..."
              className="min-h-[120px]"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generateComment}
              disabled={isGenerating}
              variant="outline"
              className="flex-1"
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {existingComment ? 'Regenerate' : 'Generate'} Comment
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Generated Comment</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Your comment will appear here..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={postComment}
              disabled={isPosting || !comment.trim()}
            >
              {isPosting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Post Comment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentEditor;
