import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { ScheduledSignal } from '@/types/signal';

interface ScheduleStatusCardProps {
  scheduledSignal: ScheduledSignal;
}

const ScheduleStatusCard = ({ scheduledSignal }: ScheduleStatusCardProps) => {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Calendar className="h-5 w-5" />
          Schedule Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="font-medium text-blue-700">Status</p>
            <Badge variant={scheduledSignal.is_active ? "default" : "secondary"}>
              {scheduledSignal.is_active ? "Active" : "Paused"}
            </Badge>
          </div>
          <div>
            <p className="font-medium text-blue-700">Frequency</p>
            <p className="text-blue-600">Every {scheduledSignal.frequency_hours} hours</p>
          </div>
          <div>
            <p className="font-medium text-blue-700">Next Run</p>
            <p className="text-blue-600">{new Date(scheduledSignal.next_run).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-medium text-blue-700">Last Run</p>
            <p className="text-blue-600">
              {scheduledSignal.last_run ? new Date(scheduledSignal.last_run).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleStatusCard;