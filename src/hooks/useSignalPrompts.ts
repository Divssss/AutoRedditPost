import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_PROMPT } from '@/constants/prompts';

export const useSignalPrompts = (signalId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_PROMPT);
  const [selectedContext, setSelectedContext] = useState<string>('');
  
  const [minWords, setMinWords] = useState(20);
  const [maxWords, setMaxWords] = useState(50);
  const [minDelaySeconds, setMinDelaySeconds] = useState(30);
  const [maxDelaySeconds, setMaxDelaySeconds] = useState(120);

  const loadSavedPrompt = async () => {
    try {
      const { data, error } = await supabase
        .from('user_prompts')
        .select('prompt, min_number, max_number, min_delay_seconds, max_delay_seconds')
        .eq('user_id', user?.id)
        .eq('signal_id', signalId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('User prompt error:', error);
        return;
      }

      if (data) {
        console.log('Saved prompt loaded:', data);
        setCustomPrompt(data.prompt || DEFAULT_PROMPT);
        setMinWords(data.min_number || 20);
        setMaxWords(data.max_number || 50);
        setMinDelaySeconds(data.min_delay_seconds || 30);
        setMaxDelaySeconds(data.max_delay_seconds || 120);
      }
    } catch (error) {
      console.error('Error loading saved prompt:', error);
    }
  };

  const savePrompt = async () => {
    try {
      console.log('Saving prompt with data:', {
        user_id: user?.id,
        signal_id: signalId,
        prompt: customPrompt,
        min_number: minWords,
        max_number: maxWords,
        min_delay_seconds: minDelaySeconds,
        max_delay_seconds: maxDelaySeconds
      });

      const { data, error } = await supabase
        .from('user_prompts')
        .upsert({
          user_id: user?.id,
          signal_id: signalId,
          prompt: customPrompt,
          min_number: minWords,
          max_number: maxWords,
          min_delay_seconds: minDelaySeconds,
          max_delay_seconds: maxDelaySeconds
        }, {
          onConflict: 'user_id,signal_id'
        });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Save successful:', data);
      
      toast({
        title: "Success",
        description: "Prompt settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: "Error",
        description: `Failed to save prompt settings: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (signalId && user) {
      loadSavedPrompt();
    }
  }, [signalId, user]);

  return {
    customPrompt,
    setCustomPrompt,
    selectedContext,
    setSelectedContext,
    minWords,
    setMinWords,
    maxWords,
    setMaxWords,
    minDelaySeconds,
    setMinDelaySeconds,
    maxDelaySeconds,
    setMaxDelaySeconds,
    savePrompt
  };
};