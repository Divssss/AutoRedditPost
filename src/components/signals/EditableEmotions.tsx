import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ToneOption } from '@/types/signal';

interface EditableEmotionsProps {
  emotions: ToneOption[];
  onEmotionsChange: (emotions: ToneOption[]) => void;
}

const EditableEmotions = ({ emotions, onEmotionsChange }: EditableEmotionsProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newEmotion, setNewEmotion] = useState('');

  const handleAddEmotion = () => {
    if (newEmotion.trim() && !emotions.find(e => e.label.toLowerCase() === newEmotion.toLowerCase())) {
      const newEmotionOption: ToneOption = {
        value: newEmotion.toLowerCase().replace(/\s+/g, '_'),
        label: newEmotion.trim()
      };
      onEmotionsChange([...emotions, newEmotionOption]);
      setNewEmotion('');
      setIsAdding(false);
    }
  };

  const handleRemoveEmotion = (emotionToRemove: ToneOption) => {
    onEmotionsChange(emotions.filter(e => e.value !== emotionToRemove.value));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddEmotion();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewEmotion('');
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm font-medium text-blue-800">Available Emotions</label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-blue-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p>The system will randomly select one of these emotions for each comment to add variety and authenticity.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="text-sm text-blue-600 mb-3">The system will randomly select one of these emotions for each comment to add variety and authenticity.</p>
      <div className="flex flex-wrap gap-2">
        {emotions.map((emotion) => (
          <div key={emotion.value} className="flex items-center gap-1">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
              {emotion.label}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-blue-600 hover:text-red-600 hover:bg-red-50"
              onClick={() => handleRemoveEmotion(emotion)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {isAdding ? (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={newEmotion}
              onChange={(e) => setNewEmotion(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter emotion..."
              className="h-8 w-24 text-xs"
              autoFocus
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={handleAddEmotion}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-full"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default EditableEmotions;