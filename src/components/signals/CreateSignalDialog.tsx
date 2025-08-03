
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface CreateSignalDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  redditConnected: boolean;
  isCheckingReddit: boolean;
  onCreateSignal: (values: any) => void;
}

const CreateSignalDialog = ({ 
  isOpen, 
  setIsOpen, 
  redditConnected, 
  isCheckingReddit, 
  onCreateSignal 
}: CreateSignalDialogProps) => {
  const form = useForm({
    defaultValues: {
      name: '',
      subreddit: '',
      keywords: ''
    }
  });

  const handleSubmit = (values: any) => {
    console.log('CreateSignalDialog - Form submitted with values:', values);
    
    // Validate required fields
    if (!values.name?.trim()) {
      console.error('Signal name is required');
      form.setError('name', { message: 'Signal name is required' });
      return;
    }
    
    if (!values.subreddit?.trim()) {
      console.error('Subreddit is required');
      form.setError('subreddit', { message: 'Subreddit is required' });
      return;
    }

    // Process keywords - they are optional and can be empty
    const keywordsArray = values.keywords && values.keywords.trim()
      ? values.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0)
      : [];
    
    console.log('Processed keywords:', keywordsArray);
    
    const signalData = {
      name: values.name.trim(),
      subreddit: values.subreddit.trim(),
      keywords: keywordsArray
    };
    
    console.log('Calling onCreateSignal with:', signalData);
    onCreateSignal(signalData);
    form.reset();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    console.log('Form submit event triggered');
    e.preventDefault();
    form.handleSubmit(handleSubmit)(e);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          disabled={!redditConnected || isCheckingReddit}
          className="btn-gradient interactive-scale"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Signal
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-xl border-border/50 max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Create New Signal
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Set up a new campaign to monitor Reddit posts and generate AI comments
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground">Signal Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="My Campaign" 
                      className="input-modern h-12" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subreddit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground">Subreddit</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="technology" 
                      className="input-modern h-12" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground">
                    Keywords 
                    <span className="text-xs text-muted-foreground font-normal ml-1">(comma separated, optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="AI, machine learning, automation (leave empty for all posts)" 
                      className="input-modern h-12" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full h-12 btn-gradient text-base font-semibold">
              Create Signal
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSignalDialog;
