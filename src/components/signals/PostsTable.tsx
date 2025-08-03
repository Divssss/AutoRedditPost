
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, ExternalLink, Clock, User, ArrowUp, Edit, Sparkles } from 'lucide-react';

interface Signal {
  id: string;
  name: string;
  subreddit: string;
  keywords: string[];
  status: string;
  created_at: string;
}

interface RedditPost {
  id: string;
  reddit_post_id: string;
  title: string;
  content: string;
  author: string;
  subreddit: string;
  url: string;
  score: number;
  created_at: string;
  signal_id: string;
}

interface AIComment {
  id: string;
  generated_comment: string;
  is_posted: boolean;
  reddit_post_id: string;
}

interface PostsTableProps {
  selectedSignal: Signal | null;
  posts: RedditPost[];
  comments: { [key: string]: AIComment };
  isLoading: boolean;
  onGenerateComment: (postId: string) => void;
  onPostComment: (postId: string) => void;
  onBulkPostComments: () => void;
  formatTimeAgo: (dateString: string) => string;
}

const PostsTable = ({
  selectedSignal,
  posts,
  comments,
  isLoading,
  onGenerateComment,
  onPostComment,
  onBulkPostComments,
  formatTimeAgo
}: PostsTableProps) => {
  const unpostedComments = Object.entries(comments).filter(([_, comment]) => !comment.is_posted);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {selectedSignal ? `Posts for ${selectedSignal.name}` : 'Select a Signal'}
            </CardTitle>
            <CardDescription>
              {selectedSignal ? `r/${selectedSignal.subreddit}` : 'Choose a signal to view posts'}
            </CardDescription>
          </div>
          {selectedSignal && posts.length > 0 && unpostedComments.length > 0 && (
            <Button 
              onClick={onBulkPostComments} 
              variant="outline"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-none"
            >
              <Send className="h-4 w-4 mr-2" />
              Bulk Post Comments ({unpostedComments.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!selectedSignal ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Select a signal to view posts</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No posts found for this signal</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Post</TableHead>
                <TableHead>Time Posted</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>AI Comment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => {
                const comment = comments[post.id];
                return (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium line-clamp-2">{post.title}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="h-3 w-3" />
                          u/{post.author}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(post.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ArrowUp className="h-3 w-3 text-orange-500" />
                        {post.score}
                      </div>
                    </TableCell>
                    <TableCell>
                      {comment ? (
                        <div className="max-w-xs">
                          <p className="text-sm line-clamp-2">{comment.generated_comment}</p>
                          {comment.is_posted && (
                            <Badge variant="secondary" className="mt-1">
                              Posted ✓
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No comment generated</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(post.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onGenerateComment(post.id)}
                          variant="outline"
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none"
                        >
                          {comment ? <Edit className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                        </Button>
                        {comment && !comment.is_posted && (
                          <Button
                            size="sm"
                            onClick={() => onPostComment(post.id)}
                            variant="default"
                            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        )}
                        {comment?.is_posted && (
                          <Badge variant="secondary">Posted</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default PostsTable;
