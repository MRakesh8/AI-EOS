import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { tasks } from "@/data/mock";
import { List, LayoutGrid, Plus, Bot, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Tasks() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  
  const columns = ["To Do", "In Progress", "Review", "Done"];

  return (
    <div className="space-y-6 pb-12 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">AI-assisted task management.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-background rounded-md border border-border p-1">
            <Button variant={view === "kanban" ? "secondary" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setView("kanban")}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setView("list")}>
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {view === "kanban" ? (
            <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex gap-4 overflow-x-auto pb-4">
              {columns.map((col, i) => (
                <div key={col} className="w-[300px] shrink-0 flex flex-col bg-muted/20 rounded-lg p-3 border border-border/30">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-semibold text-sm">{col}</h3>
                    <Badge variant="secondary" className="text-xs">{tasks.filter(t => t.status === col).length}</Badge>
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    {tasks.filter(t => t.status === col).map(task => (
                      <Card key={task.id} className="p-3 bg-card/60 backdrop-blur border-border/50 hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="text-[10px] font-mono border-muted-foreground/30">{task.id}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${
                            task.priority === 'Critical' ? "border-destructive text-destructive" :
                            task.priority === 'High' ? "border-chart-4 text-chart-4" : "border-muted-foreground"
                          }`}>{task.priority}</Badge>
                        </div>
                        <p className="text-sm font-medium leading-snug mb-3">{task.title}</p>
                        
                        <div className="w-full bg-background rounded-full h-1 mb-3">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${task.progress}%` }} />
                        </div>

                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Bot className="w-3 h-3 text-primary" /> {task.aiModule}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.time}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-y-auto">
              <Card className="bg-card/40 border-border/50">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/30 border-b border-border/50">
                    <tr>
                      <th className="p-3 font-medium text-muted-foreground w-24">ID</th>
                      <th className="p-3 font-medium text-muted-foreground">Title</th>
                      <th className="p-3 font-medium text-muted-foreground w-32">Status</th>
                      <th className="p-3 font-medium text-muted-foreground w-32">Priority</th>
                      <th className="p-3 font-medium text-muted-foreground w-40">AI Module</th>
                      <th className="p-3 font-medium text-muted-foreground w-24">Est</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                        <td className="p-3 font-mono text-xs">{task.id}</td>
                        <td className="p-3 font-medium">{task.title}</td>
                        <td className="p-3"><Badge variant="outline">{task.status}</Badge></td>
                        <td className="p-3">
                          <Badge variant="outline" className={`${task.priority === 'Critical' ? "border-destructive text-destructive" : ""}`}>{task.priority}</Badge>
                        </td>
                        <td className="p-3 flex items-center gap-2 text-xs"><Bot className="w-3.5 h-3.5 text-primary" /> {task.aiModule}</td>
                        <td className="p-3 text-muted-foreground">{task.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
