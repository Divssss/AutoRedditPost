
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface Signal {
  id: string;
  name: string;
  subreddit: string;
  keywords: string[];
  status: string;
  created_at: string;
  generated_count?: number;
  posted_count?: number;
}

interface SignalCardProps {
  signal: Signal;
  onDelete: (signalId: string, signalName: string) => void;
  deletingSignal: string | null;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal, onDelete, deletingSignal }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/signal/${signal.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Delete button clicked for signal:', signal.id, signal.name);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Confirming delete for signal:', signal.id, signal.name);
    onDelete(signal.id, signal.name);
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/signal/${signal.id}`);
  };

  return (
    <div
      className="group p-4 border border-border/30 rounded-xl bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm hover:border-primary/40 hover:from-card/80 hover:to-card/60 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/5"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors duration-300 truncate">
            {signal.name}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant={signal.status === 'active' ? 'default' : 'secondary'}
              className={cn(
                "px-2 py-1 text-xs font-medium",
                signal.status === 'active' 
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {signal.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              r/{signal.subreddit}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewClick}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary rounded-lg"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                disabled={deletingSignal === signal.id}
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-xl border-border/50" onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  Delete Signal
                </AlertDialogTitle>
                <AlertDialogDescription className="text-base leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold">"{signal.name}"</span>? This will permanently remove:
                  <ul className="list-disc list-inside mt-3 space-y-2 text-sm">
                    <li>The signal and all its settings</li>
                    <li>All related Reddit posts</li>
                    <li>All generated AI comments</li>
                    <li>Any scheduled automation</li>
                  </ul>
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-medium text-red-700 text-sm">⚠️ This action cannot be undone.</p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3">
                <AlertDialogCancel 
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-lg"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-lg"
                >
                  Delete Signal
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="space-y-2">
        {/* Keywords */}
        {signal.keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {signal.keywords.slice(0, 2).map((keyword: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20"
              >
                {keyword}
              </span>
            ))}
            {signal.keywords.length > 2 && (
              <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium">
                +{signal.keywords.length - 2} more
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="px-2 py-1 bg-muted/50 text-muted-foreground rounded-full text-xs">
              All posts
            </span>
          </div>
        )}

        {/* Comment Stats */}
        <div className="flex items-center gap-4 pt-2 border-t border-border/30">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs text-muted-foreground">
              {signal.generated_count || 0} generated
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-muted-foreground">
              {signal.posted_count || 0} posted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalCard;
