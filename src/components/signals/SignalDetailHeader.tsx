import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Download, Settings, Clock, Trash2, AlertTriangle } from 'lucide-react';
import { Signal, ScheduledSignal } from '@/types/signal';
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

interface SignalDetailHeaderProps {
  signal: Signal;
  scheduledSignal: ScheduledSignal | null;
  isFetchingPosts: boolean;
  onBack: () => void;
  onFetchPosts: () => void;
  onScheduleClick: () => void;
  onToggleSchedule: () => void;
  onDeleteSchedule: () => void;
}

const SignalDetailHeader = ({
  signal,
  scheduledSignal,
  isFetchingPosts,
  onBack,
  onFetchPosts,
  onScheduleClick,
  onToggleSchedule,
  onDeleteSchedule
}: SignalDetailHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="bg-white/10 border-white/20 text-foreground hover:bg-white/20 hover:text-foreground shadow-lg backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{signal.name}</h1>
          <p className="text-gray-600">
            r/{signal.subreddit} • {signal.keywords.length > 0 ? signal.keywords.join(', ') : 'All posts'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={signal.status === 'active' ? 'default' : 'secondary'}>
          {signal.status}
        </Badge>
        
        {/* Manual Fetch Posts Button */}
        <Button 
          variant="outline" 
          onClick={onFetchPosts}
          disabled={isFetchingPosts}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
        >
          {isFetchingPosts ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isFetchingPosts ? 'Fetching...' : 'Fetch Posts'}
        </Button>
        
        {/* Schedule Button */}
        {scheduledSignal ? (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={onScheduleClick}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {scheduledSignal.is_active ? 'Scheduled' : 'Paused'}
            </Button>
            <Button
              variant={scheduledSignal.is_active ? "destructive" : "default"}
              onClick={onToggleSchedule}
              size="sm"
            >
              {scheduledSignal.is_active ? 'Pause' : 'Resume'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Delete Schedule
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this schedule? This will stop all automated processing for this signal.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDeleteSchedule}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete Schedule
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <Button 
            variant="outline" 
            onClick={onScheduleClick}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Schedule Signal
          </Button>
        )}
      </div>
    </div>
  );
};

export default SignalDetailHeader;