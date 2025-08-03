
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface RedditConnectionStatusProps {
  isCheckingReddit: boolean;
  redditConnected: boolean;
  onConnectReddit: () => void;
}

const RedditConnectionStatus = ({ 
  isCheckingReddit, 
  redditConnected, 
  onConnectReddit 
}: RedditConnectionStatusProps) => {
  if (isCheckingReddit) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500">Checking connection...</span>
      </div>
    );
  }

  if (redditConnected) {
    return (
      <Badge className="status-success px-4 py-2 rounded-lg font-medium">
        <CheckCircle className="h-4 w-4 mr-2" />
        Reddit Connected
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Badge className="status-error px-4 py-2 rounded-lg font-medium">
        <AlertCircle className="h-4 w-4 mr-2" />
        Not Connected
      </Badge>
      <Button onClick={onConnectReddit} variant="outline" className="rounded-lg font-medium">
        Connect Reddit
      </Button>
    </div>
  );
};

export default RedditConnectionStatus;
