
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface RedditConnectionNoticeProps {
  redditConnected: boolean;
  isCheckingReddit: boolean;
  onConnectReddit: () => void;
}

const RedditConnectionNotice = ({ redditConnected, isCheckingReddit, onConnectReddit }: RedditConnectionNoticeProps) => {
  if (redditConnected || isCheckingReddit) {
    return null;
  }

  return (
    <Card className="status-warning border-amber-200 rounded-xl">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-lg">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800 text-lg">Reddit Account Required</h3>
            <p className="text-amber-700">
              Connect your Reddit account to start monitoring posts and generating AI comments.
            </p>
          </div>
          <Button onClick={onConnectReddit} className="btn-gradient">
            Connect Reddit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RedditConnectionNotice;
