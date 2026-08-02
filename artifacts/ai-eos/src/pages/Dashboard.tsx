import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { currentStatus, metrics, tasks, recentActivities } from "@/data/mock";
import { motion } from "framer-motion";
import { PlayCircle, CheckCircle2, ShieldAlert, Activity, CheckSquare } from "lucide-react";

export function Dashboard() {
  return (
    <div className="space-y-6 pb-12">
      {/* Row 1: Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-5 h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
            <h3 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Current Project</h3>
            <div className="text-lg font-bold text-foreground mb-1">{currentStatus.project}</div>
            <div className="text-sm text-primary">{currentStatus.sprint}</div>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-2">
          <Card className="p-5 h-full bg-card/50 backdrop-blur-sm border-border/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <h3 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Active Task</h3>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl font-bold text-foreground mb-1">{currentStatus.task}</div>
                <div className="text-sm text-muted-foreground">Next: {currentStatus.nextTask}</div>
              </div>
              <Badge variant="outline" className="border-primary text-primary">In Progress</Badge>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-5 h-full bg-card/50 backdrop-blur-sm border-border/50 flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <h3 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3 w-full text-center z-10">Sprint Progress</h3>
            <div className="relative flex items-center justify-center w-24 h-24 z-10">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted" />
                <motion.circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-primary" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * currentStatus.progress) / 100} initial={{ strokeDashoffset: 251.2 }} animate={{ strokeDashoffset: 251.2 - (251.2 * currentStatus.progress) / 100 }} transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xl font-bold font-mono">
                {currentStatus.progress}%
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Row 3: Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "Build Status", val: metrics.build.status, sub: metrics.build.time, icon: PlayCircle, color: "text-chart-3" },
          { title: "Test Coverage", val: `${metrics.tests.passed}/${metrics.tests.total}`, sub: `${metrics.tests.coverage}% covered`, icon: CheckCircle2, color: "text-primary" },
          { title: "Performance", val: metrics.performance, sub: "Score / 100", icon: Activity, color: "text-chart-4" },
          { title: "Security Score", val: metrics.security, sub: "Score / 100", icon: ShieldAlert, color: "text-chart-2" }
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.1 }}>
            <Card className="p-4 bg-card/30 border-border/40 hover:bg-card/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs text-muted-foreground font-semibold uppercase">{m.title}</h3>
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <div className="text-2xl font-bold font-mono mb-1">{m.val}</div>
              <div className="text-xs text-muted-foreground">{m.sub}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Row 4: Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col bg-card/40 border-border/50">
          <div className="p-4 border-b border-border/50 flex justify-between items-center">
            <h3 className="text-sm font-semibold flex items-center gap-2"><CheckSquare className="w-4 h-4 text-primary" /> Task Queue</h3>
            <Badge variant="secondary">Active Sprint</Badge>
          </div>
          <div className="p-0 overflow-y-auto max-h-[300px]">
            {tasks.map((task, i) => (
              <div key={task.id} className="p-4 border-b border-border/50 hover:bg-accent/30 transition-colors flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{task.id}</span>
                    <span className="font-medium text-sm truncate">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <Badge variant="outline" className={
                      task.priority === 'Critical' ? "border-destructive text-destructive" :
                      task.priority === 'High' ? "border-chart-4 text-chart-4" : "border-muted-foreground text-muted-foreground"
                    }>{task.priority}</Badge>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {task.aiModule}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm mb-1">{task.status}</div>
                  <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: `${task.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col bg-card/40 border-border/50">
          <div className="p-4 border-b border-border/50">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-chart-2" /> Recent Activity</h3>
          </div>
          <div className="p-4 overflow-y-auto max-h-[300px] space-y-6">
            {recentActivities.map((act, i) => (
              <div key={act.id} className="relative pl-6">
                <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-border border-2 border-background z-10" />
                {i !== recentActivities.length - 1 && (
                  <div className="absolute left-1 top-3.5 bottom-[-24px] w-[1px] bg-border" />
                )}
                <div className="text-sm">
                  <span className="font-medium">{act.user}</span> <span className="text-muted-foreground">{act.action}</span> <span className="font-mono text-primary">{act.target}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{act.time}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
