import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSignalDetail } from '@/hooks/useSignalDetail';
import { useSignalPrompts } from '@/hooks/useSignalPrompts';
import SignalDetailHeader from '@/components/signals/SignalDetailHeader';
import ScheduleStatusCard from '@/components/signals/ScheduleStatusCard';
import CommentSettingsCard from '@/components/signals/CommentSettingsCard';
import PostsListCard from '@/components/signals/PostsListCard';
import ScheduleSignalDialog from '@/components/signals/ScheduleSignalDialog';
import { EMOTION_OPTIONS } from '@/constants/prompts';
import { ToneOption } from '@/types/signal';

const SignalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [emotions, setEmotions] = useState<ToneOption[]>(EMOTION_OPTIONS);

  const {
    signal,
    posts,
    contexts,
    comments,
    setComments,
    scheduledSignal,
    setScheduledSignal,
    isLoading,
    isGenerating,
    setIsGenerating,
    isPosting,
    setIsPosting,
    isFetchingPosts,
    loadScheduledSignal,
    fetchPostsManually
  } = useSignalDetail(id!);

  const {
    customPrompt,
    setCustomPrompt,
    selectedContext,
    setSelectedContext,
    minWords,
    setMinWords,
    maxWords,
    setMaxWords,
    savePrompt
  } = useSignalPrompts(id!);

  // Load saved emotions and context on component mount
  useEffect(() => {
    const loadSavedSettings = () => {
      const savedEmotions = localStorage.getItem(`signal_emotions_${id}`);
      const savedContext = localStorage.getItem(`signal_context_${id}`);
      
      if (savedEmotions) {
        try {
          setEmotions(JSON.parse(savedEmotions));
        } catch (error) {
          console.error('Error parsing saved emotions:', error);
        }
      }
      
      if (savedContext && savedContext !== 'none') {
        setSelectedContext(savedContext);
      }
    };

    if (id) {
      loadSavedSettings();
    }
  }, [id, setSelectedContext]);

  // Save emotions and context to localStorage when they change
  useEffect(() => {
    if (id) {
      localStorage.setItem(`signal_emotions_${id}`, JSON.stringify(emotions));
    }
  }, [emotions, id]);

  useEffect(() => {
    if (id) {
      localStorage.setItem(`signal_context_${id}`, selectedContext);
    }
  }, [selectedContext, id]);

  const scheduleSignal = async (values: any) => {
    const startTime = new Date(values.startTime);
    const frequencyHours = parseInt(values.frequency);
    
    // Calculate next run time
    const nextRun = new Date(startTime);
    
    try {
      if (scheduledSignal) {
        // Update existing schedule
        const { error } = await supabase
          .from('scheduled_signals')
          .update({
            start_time: startTime.toISOString(),
            frequency_hours: frequencyHours,
            next_run: nextRun.toISOString(),
            is_active: true
          })
          .eq('id', scheduledSignal.id);

        if (error) {
          throw error;
        }
      } else {
        // Create new schedule
        const { error } = await supabase
          .from('scheduled_signals')
          .insert({
            signal_id: id,
            user_id: user?.id,
            start_time: startTime.toISOString(),
            frequency_hours: frequencyHours,
            next_run: nextRun.toISOString()
          });

        if (error) {
          throw error;
        }
      }

      toast({
        title: "Success",
        description: scheduledSignal ? "Schedule updated successfully" : "Signal scheduled successfully"
      });

      setScheduleDialogOpen(false);
      loadScheduledSignal(); // Reload the schedule
    } catch (error) {
      console.error('Error scheduling signal:', error);
      toast({
        title: "Error",
        description: "Failed to schedule signal",
        variant: "destructive"
      });
    }
  };

  const toggleSchedule = async () => {
    if (!scheduledSignal) return;

    try {
      const { error } = await supabase
        .from('scheduled_signals')
        .update({ is_active: !scheduledSignal.is_active })
        .eq('id', scheduledSignal.id);

      if (error) {
        throw error;
      }

      setScheduledSignal(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
      
      toast({
        title: "Success",
        description: `Schedule ${scheduledSignal.is_active ? 'paused' : 'activated'}`
      });
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive"
      });
    }
  };

  const deleteSchedule = async () => {
    if (!scheduledSignal) return;

    try {
      const { error } = await supabase
        .from('scheduled_signals')
        .delete()
        .eq('id', scheduledSignal.id);

      if (error) {
        throw error;
      }

      setScheduledSignal(null);
      
      toast({
        title: "Success",
        description: "Schedule deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Signal not found</h2>
          <button onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <SignalDetailHeader
          signal={signal}
          scheduledSignal={scheduledSignal}
          isFetchingPosts={isFetchingPosts}
          onBack={() => navigate('/')}
          onFetchPosts={fetchPostsManually}
          onScheduleClick={() => setScheduleDialogOpen(true)}
          onToggleSchedule={toggleSchedule}
          onDeleteSchedule={deleteSchedule}
        />

        {scheduledSignal && (
          <ScheduleStatusCard scheduledSignal={scheduledSignal} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <CommentSettingsCard
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              selectedContext={selectedContext}
              setSelectedContext={setSelectedContext}
              minWords={minWords}
              setMinWords={setMinWords}
              maxWords={maxWords}
              setMaxWords={setMaxWords}
              contexts={contexts}
              emotions={emotions}
              setEmotions={setEmotions}
              onSave={savePrompt}
            />
          </div>

          <div className="lg:col-span-2">
            <PostsListCard
              posts={posts}
              comments={comments}
              setComments={setComments}
              contexts={contexts}
              customPrompt={customPrompt}
              selectedContext={selectedContext}
              emotions={emotions}
              minWords={minWords}
              maxWords={maxWords}
              isGenerating={isGenerating}
              setIsGenerating={setIsGenerating}
              isPosting={isPosting}
              setIsPosting={setIsPosting}
            />
          </div>
        </div>

        <ScheduleSignalDialog
          isOpen={scheduleDialogOpen}
          setIsOpen={setScheduleDialogOpen}
          selectedSignal={signal}
          existingSchedule={scheduledSignal}
          onScheduleSignal={scheduleSignal}
        />
      </div>
    </div>
  );
};

export default SignalDetail;
