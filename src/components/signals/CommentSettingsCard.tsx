import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Save, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Context, ToneOption } from '@/types/signal';
import EditableEmotions from './EditableEmotions';

interface CommentSettingsCardProps {
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  selectedContext: string;
  setSelectedContext: (context: string) => void;
  minWords: number;
  setMinWords: (words: number) => void;
  maxWords: number;
  setMaxWords: (words: number) => void;
  contexts: Context[];
  emotions: ToneOption[];
  setEmotions: (emotions: ToneOption[]) => void;
  onSave: () => void;
}

const CommentSettingsCard = ({
  customPrompt,
  setCustomPrompt,
  selectedContext,
  setSelectedContext,
  minWords,
  setMinWords,
  maxWords,
  setMaxWords,
  contexts,
  emotions,
  setEmotions,
  onSave
}: CommentSettingsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Comment Settings
        </CardTitle>
        <CardDescription>
          Configure how AI comments are generated
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Custom Prompt</label>
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter your custom prompt..."
            rows={4}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Select Personality</label>
          <Select value={selectedContext} onValueChange={setSelectedContext}>
            <SelectTrigger>
              <SelectValue placeholder="Choose personality (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No personality</SelectItem>
              {contexts.map((context) => (
                <SelectItem key={context.id} value={context.id}>
                  {context.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <EditableEmotions emotions={emotions} onEmotionsChange={setEmotions} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium">Min Words</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Minimum word count for generated comments. A random number between min and max will be used for each comment.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <Input
                type="number"
                value={minWords}
                onChange={(e) => setMinWords(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={100}
                className="pr-16"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                words
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium">Max Words</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Maximum word count for generated comments. A random number between min and max will be used for each comment.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <Input
                type="number"
                value={maxWords}
                onChange={(e) => setMaxWords(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={200}
                className="pr-16"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                words
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Info className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Comment Length</span>
          </div>
          <p className="text-sm text-amber-700">
            For each comment, the system will randomly pick a number between {minWords} and {maxWords} words to create natural variation.
          </p>
        </div>

        <Button onClick={onSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default CommentSettingsCard;