import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { TaskExecutionCore } from '@/services/TaskExecutionCore';
import { Task } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertOctagon, RotateCw, Eye, Trash2 } from 'lucide-react';

export function UnfinishedTaskModal({ projectId }: { projectId: string }) {
  const { tasks, recoverUnfinishedTask } = useAppStore();
  const [unfinishedTask, setUnfinishedTask] = useState<Task | null>(null);

  useEffect(() => {
    const projectTasks = tasks.filter((t: any) => t.projectId === projectId);
    const unfinished = TaskExecutionCore.getInstance().detectUnfinishedTasks(projectTasks);
    if (unfinished.length > 0) {
      setUnfinishedTask(unfinished[0]);
    } else {
      setUnfinishedTask(null);
    }
  }, [tasks, projectId]);

  if (!unfinishedTask) return null;

  const handleAction = async (action: 'resume' | 'review' | 'discard') => {
    await recoverUnfinishedTask(unfinishedTask.id, action);
    setUnfinishedTask(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="max-w-md w-full p-6 bg-card border-border shadow-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <AlertOctagon className="w-6 h-6 text-yellow-500 shrink-0" />
          <div>
            <h3 className="font-bold text-base text-foreground">Unfinished Task Detected</h3>
            <p className="text-xs text-muted-foreground">Application restart recovery triggered</p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center bg-muted/30 p-2 rounded">
            <span className="font-semibold text-foreground">{unfinishedTask.title || unfinishedTask.name}</span>
            <Badge variant="outline" className="font-mono text-[10px]">{unfinishedTask.status}</Badge>
          </div>
          <p className="text-muted-foreground leading-relaxed">{unfinishedTask.description}</p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button size="sm" onClick={() => handleAction('resume')} className="w-full">
            <RotateCw className="w-4 h-4 mr-2" /> Resume Task
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleAction('review')} className="w-full">
            <Eye className="w-4 h-4 mr-2" /> Review Task State
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleAction('discard')} className="w-full">
            <Trash2 className="w-4 h-4 mr-2" /> Discard Unfinished Task
          </Button>
        </div>
      </Card>
    </div>
  );
}
