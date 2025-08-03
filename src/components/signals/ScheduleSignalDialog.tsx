
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Settings } from 'lucide-react';

interface Signal {
  id: string;
  name: string;
  subreddit: string;
  keywords: string[];
  status: string;
  created_at: string;
}

interface ScheduledSignal {
  id: string;
  signal_id: string;
  start_time: string;
  frequency_hours: number;
  is_active: boolean;
  last_run: string | null;
  next_run: string;
}

interface ScheduleSignalDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedSignal: Signal | null;
  existingSchedule?: ScheduledSignal | null;
  onScheduleSignal: (values: any) => void;
}

const ScheduleSignalDialog = ({ 
  isOpen, 
  setIsOpen, 
  selectedSignal, 
  existingSchedule,
  onScheduleSignal 
}: ScheduleSignalDialogProps) => {
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [frequency, setFrequency] = useState('');

  // Helper function to get current date + 5 minutes in UTC
  const getCurrentDateTimePlus5MinUTC = () => {
    const now = new Date();
    const futureTime = new Date(now.getTime() + 5 * 60 * 1000); // Add 5 minutes
    
    // Get UTC date and time strings
    const dateStr = futureTime.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = futureTime.toISOString().split('T')[1].substring(0, 5); // HH:MM
    
    return { dateStr, timeStr };
  };

  // Load existing schedule data when dialog opens or prefill with current UTC time + 5 min
  useEffect(() => {
    if (isOpen && existingSchedule) {
      const scheduleDate = new Date(existingSchedule.start_time);
      setStartDate(scheduleDate.toISOString().split('T')[0]);
      setStartTime(scheduleDate.toISOString().split('T')[1].substring(0, 5));
      setFrequency(existingSchedule.frequency_hours.toString());
    } else if (isOpen && !existingSchedule) {
      // Prefill with current UTC date/time + 5 minutes for new schedules
      const { dateStr, timeStr } = getCurrentDateTimePlus5MinUTC();
      setStartDate(dateStr);
      setStartTime(timeStr);
      setFrequency('1'); // Default to 1 hour
    }
  }, [isOpen, existingSchedule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !startTime || !frequency) {
      return;
    }

    // Combine date and time into ISO string (treating input as UTC)
    const startDateTime = new Date(`${startDate}T${startTime}:00.000Z`);
    
    onScheduleSignal({
      startTime: startDateTime.toISOString(),
      frequency: frequency
    });

    // Reset form only if it's a new schedule
    if (!existingSchedule) {
      const { dateStr, timeStr } = getCurrentDateTimePlus5MinUTC();
      setStartDate(dateStr);
      setStartTime(timeStr);
      setFrequency('1');
    }
  };

  const frequencyOptions = [
    { value: '0.25', label: 'Every 15 minutes' },
    { value: '0.5', label: 'Every 30 minutes' },
    { value: '1', label: 'Every 1 hour' },
    { value: '2', label: 'Every 2 hours' },
    { value: '4', label: 'Every 4 hours' },
    { value: '6', label: 'Every 6 hours' },
    { value: '12', label: 'Every 12 hours' },
    { value: '24', label: 'Every 24 hours (Daily)' },
    { value: '48', label: 'Every 48 hours' },
    { value: '72', label: 'Every 72 hours' },
    { value: '168', label: 'Every 168 hours (Weekly)' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {existingSchedule ? 'Update Schedule' : 'Schedule Signal'}
          </DialogTitle>
          <DialogDescription>
            {selectedSignal 
              ? `${existingSchedule ? 'Update' : 'Schedule'} automated posting for "${selectedSignal.name}" signal`
              : 'Please select a signal first'
            }
          </DialogDescription>
        </DialogHeader>

        {selectedSignal && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date (UTC)</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time (UTC)</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {existingSchedule && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Current Schedule:</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>Status: <span className="font-medium">{existingSchedule.is_active ? 'Active' : 'Paused'}</span></p>
                  <p>Frequency: Every {existingSchedule.frequency_hours} hours</p>
                  <p>Next Run: {new Date(existingSchedule.next_run).toLocaleString()} UTC</p>
                  {existingSchedule.last_run && (
                    <p>Last Run: {new Date(existingSchedule.last_run).toLocaleString()} UTC</p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Scheduling Process:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Fetch the latest post matching signal criteria</li>
                <li>2. Generate AI comment for the post</li>
                <li>3. Automatically post comment to Reddit</li>
                <li className="font-medium">Note: Only 1 post will be processed per run</li>
              </ol>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {existingSchedule ? 'Update Schedule' : 'Schedule Signal'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleSignalDialog;
