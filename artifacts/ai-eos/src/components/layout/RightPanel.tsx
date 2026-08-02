import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { currentStatus, notifications } from "@/data/mock";
import { Zap, GitBranch, Github, Play, Rocket, UploadCloud, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function RightPanel() {
  return (
    <aside className="w-[280px] flex-shrink-0 border-l border-border bg-card/30 flex flex-col h-full overflow-y-auto backdrop-blur-md relative z-20">
      <div className="p-5 space-y-6">
        
        {/* AI Status */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            AI Engine
          </h3>
          <Card className="p-4 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">Active</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-3">
              <span>Uptime: 99.99%</span>
              <span>Tasks: 1,420</span>
            </div>
          </Card>
        </div>

        {/* Antigravity / Agent Status */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Rocket className="w-3.5 h-3.5" />
            Agent Status
          </h3>
          <Card className="p-4 border-chart-2/20 bg-chart-2/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-chart-2">Connected</span>
              <div className="w-1.5 h-1.5 rounded-full bg-chart-2 shadow-[0_0_5px_hsl(var(--chart-2))]" />
            </div>
            <div className="space-y-2 mt-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tokens/s</span>
                <span className="font-mono">2,450</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Context</span>
                <span className="font-mono">128k</span>
              </div>
            </div>
          </Card>
        </div>

        {/* GitHub Status */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Github className="w-3.5 h-3.5" />
            Repository
          </h3>
          <Card className="p-4 bg-background/50 border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">feat/auth-layer</span>
            </div>
            <p className="text-xs text-muted-foreground truncate mb-3">
              Last commit: 8b2a19f
            </p>
            <Badge variant="outline" className="border-chart-3 text-chart-3 bg-chart-3/10">
              CI: Passing
            </Badge>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="h-9 justify-start bg-background/50">
              <UploadCloud className="w-3.5 h-3.5 mr-2 text-primary" />
              Deploy
            </Button>
            <Button variant="outline" size="sm" className="h-9 justify-start bg-background/50">
              <Play className="w-3.5 h-3.5 mr-2 text-chart-3" />
              Run Tests
            </Button>
            <Button variant="outline" size="sm" className="h-9 justify-start bg-background/50">
              <RefreshCw className="w-3.5 h-3.5 mr-2 text-chart-4" />
              Build
            </Button>
            <Button variant="outline" size="sm" className="h-9 justify-start bg-background/50">
              <GitBranch className="w-3.5 h-3.5 mr-2 text-chart-2" />
              Push
            </Button>
          </div>
        </div>

        {/* Project Summary */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project Sprint</h3>
          <Card className="p-4 bg-background/50 border-border/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{currentStatus.progress}%</span>
              <span className="text-xs text-muted-foreground">Sprint 23</span>
            </div>
            <Progress value={currentStatus.progress} className="h-1.5 mb-3" />
            <p className="text-xs text-muted-foreground line-clamp-2">
              {currentStatus.task}
            </p>
          </Card>
        </div>

        {/* Recent Notifications Mini */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent</h3>
          <div className="space-y-2">
            {notifications.slice(0, 3).map(notif => (
              <div key={notif.id} className="text-xs p-2 rounded bg-background/50 border border-border/50 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">{notif.title}</span>
                  <span className="text-[10px] text-muted-foreground">{notif.time}</span>
                </div>
                <span className="text-muted-foreground truncate">{notif.desc}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </aside>
  );
}
