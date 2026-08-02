import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { projects } from "@/data/mock";
import { Plus, FolderKanban, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";

export function Projects() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage workspaces and deployments.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map((project, i) => (
          <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="p-5 flex flex-col h-full bg-card/40 border-border/50 hover:border-primary/40 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <FolderKanban className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{project.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className={
                  project.status === 'Active' ? "border-primary text-primary" : 
                  project.status === 'Completed' ? "border-chart-3 text-chart-3" : "border-muted-foreground text-muted-foreground"
                }>
                  {project.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {project.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-secondary text-xs rounded-sm px-2 py-0.5 font-mono">{tag}</Badge>
                ))}
              </div>

              <div className="mt-auto space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-foreground">Progress</span>
                    <span className="font-mono text-primary">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-1.5" />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mb-1"><Calendar className="w-3 h-3" /> Timeline</span>
                    <span className="text-xs font-mono">{project.start.slice(5)} to {project.end.slice(5)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mb-1"><Clock className="w-3 h-3" /> Remaining</span>
                    <span className="text-xs font-mono">{project.remainingTasks} tasks ({project.estCompletion})</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase mb-1">Milestone</span>
                    <span className="text-xs truncate">{project.currentMilestone}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
