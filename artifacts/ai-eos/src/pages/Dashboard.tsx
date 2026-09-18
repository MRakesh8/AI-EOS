import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAppStore, getProjectProgress, getProjectStats } from "@/store/useAppStore";
import { motion } from "framer-motion";
import { PlayCircle, CheckCircle2, ShieldAlert, Activity, CheckSquare, GitBranch, Rocket, FileText } from "lucide-react";

import { TaskExecutionPanel } from "@/components/TaskExecutionPanel";
import { ToolVerificationPanel } from "@/components/ToolVerificationPanel";
import { RootCausePanel } from "@/components/RootCausePanel";
import { GitIntelligencePanel } from "@/components/GitIntelligencePanel";
import { UnfinishedTaskModal } from "@/components/UnfinishedTaskModal";
import { RootCauseAnalysisEngine } from "@/services/RootCauseAnalysisEngine";
import { ProjectVerificationEngine } from "@/services/ProjectVerificationEngine";

export function Dashboard() {
  const { projects, tasks, requirements, activeProjectId, providerProfiles, accountSwitchLogs } = useAppStore();

  const activeProject = useMemo(() => {
    if (activeProjectId) return projects.find((p: any) => p.id === activeProjectId);
    if (projects.length === 0) return null;
    return [...projects].sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  }, [activeProjectId, projects]);

  const projectTasks = activeProject ? tasks.filter((t: any) => t.projectId === activeProject.id) : [];
  const activeTask = projectTasks.find((t: any) =>
    ['EXECUTING', 'PLANNING', 'VERIFYING', 'RECOVERING', 'PARTIALLY_COMPLETE', 'PAUSED'].includes(t.status)
  ) || null;

  const rcaReport = useMemo(() => {
    if (!activeTask) return null;
    const feedback = ProjectVerificationEngine.getInstance().getLastStructuredErrorFeedback();
    if (!feedback) return null;
    return RootCauseAnalysisEngine.getInstance().analyzeFailure(activeTask, feedback, null, []);
  }, [activeTask]);

  const handleCreateProject = async () => {
    if (!window.electronAPI) {
      alert("Electron API not available. Run in Electron desktop mode.");
      return;
    }
    const folder = await window.electronAPI.pickFolder();
    if (!folder) return;

    const aieosPath = `${folder}/.aieos`;
    await window.electronAPI.ensureDir(aieosPath);
    const projectName = folder.split(/[/\\]/).pop() || "Local Workspace";
    await window.electronAPI.writeFile(`${aieosPath}/project.json`, JSON.stringify({ name: projectName, path: folder }));

    useAppStore.getState().createProject({
      name: projectName,
      description: 'Local workspace',
      projectType: 'Web',
      techStack: [],
      status: 'Active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      path: folder,
      pushPolicy: 'ASK_BEFORE_PUSH'
    });
  };

  const handleOpenProject = async () => {
    if (!window.electronAPI) {
      alert("Electron API not available. Run in Electron desktop mode.");
      return;
    }
    const folder = await window.electronAPI.pickFolder();
    if (!folder) return;

    const aieosPath = `${folder}/.aieos`;
    const existsRes = await window.electronAPI.exists(aieosPath);

    if (!existsRes.exists) {
      const init = confirm("This folder does not contain an AI-EOS project. Initialize one?");
      if (!init) return;
      await window.electronAPI.ensureDir(aieosPath);
      const projectName = folder.split(/[/\\]/).pop() || "Imported Project";
      await window.electronAPI.writeFile(`${aieosPath}/project.json`, JSON.stringify({ name: projectName, path: folder }));

      useAppStore.getState().createProject({
        name: projectName,
        description: 'Imported workspace',
        projectType: 'Web',
        techStack: [],
        status: 'Active',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        path: folder,
        pushPolicy: 'ASK_BEFORE_PUSH'
      });
    } else {
      const projContent = await window.electronAPI.readFile(`${aieosPath}/project.json`);
      if (projContent.success && projContent.content) {
        try {
          const parsed = JSON.parse(projContent.content);
          useAppStore.getState().createProject({
            name: parsed.name || "Loaded Project",
            description: 'Loaded workspace',
            projectType: 'Web',
            techStack: [],
            status: 'Active',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            path: folder,
            pushPolicy: 'ASK_BEFORE_PUSH'
          });
        } catch (e) {}
      }
    }
  };

  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-16">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
          <Card className="p-8 text-center bg-card/60 backdrop-blur-xl border-border/60 shadow-xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
              <Rocket className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Welcome to AI-EOS</h2>
              <p className="text-sm text-muted-foreground mt-1">Autonomous Engineering Operating System</p>
            </div>
            <div className="space-y-3 pt-2">
              <Button size="lg" className="w-full" onClick={handleCreateProject}>
                Initialize Local Project Folder
              </Button>
              <Button size="lg" variant="outline" className="w-full" onClick={handleOpenProject}>
                Open Existing Workspace
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  const stats = getProjectStats(activeProject.id);
  const progress = getProjectProgress(activeProject.id);

  const activeProfile = activeTask?.currentProviderProfileId
    ? providerProfiles.find((p: any) => p.id === activeTask.currentProviderProfileId)
    : providerProfiles.find((p: any) => p.isEnabled) || null;

  const projectLogs = accountSwitchLogs.filter((l: any) => l.projectId === activeProject.id);

  return (
    <div className="space-y-6 pb-12">
      <UnfinishedTaskModal projectId={activeProject.id} />

      {/* Header Bar */}
      <div className="flex justify-between items-center bg-card/40 border border-border/40 p-4 rounded-lg">
        <div>
          <h1 className="text-xl font-bold text-foreground">{activeProject.name}</h1>
          <p className="text-xs text-muted-foreground font-mono">{activeProject.path || 'No local path configured'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary text-primary">{activeProject.projectType}</Badge>
          <Badge variant="outline" className="border-green-500 text-green-500">{activeProject.status}</Badge>
        </div>
      </div>

      {/* Row 1: Active Execution Control Panel */}
      <TaskExecutionPanel projectId={activeProject.id} />

      {/* Row 2: Root Cause Analysis Engine Panel */}
      <RootCausePanel rcaReport={rcaReport} />

      {/* Row 3: Git Intelligence & Repository Panel */}
      <GitIntelligencePanel projectId={activeProject.id} />

      {/* Row 4: Local Tool Bridge & Verification Panel */}
      <ToolVerificationPanel projectId={activeProject.id} />

      {/* Row 5: Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "Total Tasks", val: stats.totalTasks, sub: `${stats.completedTasks} completed`, icon: CheckSquare, color: "text-primary" },
          { title: "In Progress", val: stats.inProgressTasks, sub: `${stats.blockedTasks} blocked`, icon: Activity, color: "text-chart-3" },
          { title: "Requirements", val: stats.totalRequirements, sub: `${stats.approvedRequirements} approved`, icon: PlayCircle, color: "text-chart-4" },
          { title: "Overall Progress", val: `${progress}%`, sub: "Execution completion", icon: CheckCircle2, color: "text-chart-2" }
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * i }}>
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

      {/* Row 6: Coding Provider & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        <Card className="flex flex-col bg-card/40 border-border/50 p-5 relative overflow-hidden">
          <h3 className="text-xs text-muted-foreground font-semibold uppercase mb-4 flex items-center gap-2">
            <Rocket className="w-4 h-4 text-chart-2" /> Current Coding Provider
          </h3>
          {activeProfile ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-lg font-bold">{activeProfile.providerName}</div>
                  <div className="text-sm text-muted-foreground">{activeProfile.profileName}</div>
                </div>
                <Badge variant="outline" className={activeProfile.lastKnownStatus === 'Working' || activeProfile.lastKnownStatus === 'Available' ? "border-green-500/50 text-green-500" : "border-yellow-500/50 text-yellow-500"}>
                  {activeProfile.lastKnownStatus}
                </Badge>
              </div>
              <div className="pt-4 border-t border-border/50">
                <div className="text-xs text-muted-foreground mb-1">Current Task Context</div>
                <div className="text-sm truncate">{activeTask ? (activeTask.title || activeTask.name) : "None"}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground pt-2">No active provider selected.</div>
          )}
        </Card>

        <Card className="flex flex-col bg-card/40 border-border/50">
          <div className="p-4 border-b border-border/50">
            <h3 className="text-sm font-semibold flex items-center gap-2"><GitBranch className="w-4 h-4 text-primary" /> Provider History</h3>
          </div>
          <div className="p-4 overflow-y-auto h-[200px] space-y-4">
            {projectLogs.length === 0 ? (
              <div className="text-sm text-center text-muted-foreground py-4">No provider switches recorded.</div>
            ) : (
              projectLogs.map((log: any) => (
                <div key={log.id} className="text-sm border-l-2 border-primary/50 pl-3 py-1">
                  <div className="font-semibold flex justify-between">
                    <span>{log.previousProvider} → {log.newProvider}</span>
                    <span className="text-xs text-muted-foreground font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Reason: <span className="text-foreground">{log.reason}</span></div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Row 7: Task Queue */}
      <Card className="flex flex-col bg-card/40 border-border/50">
        <div className="p-4 border-b border-border/50 flex justify-between items-center">
          <h3 className="text-sm font-semibold flex items-center gap-2"><CheckSquare className="w-4 h-4 text-primary" /> Task Queue</h3>
          <Badge variant="secondary">Queue Status</Badge>
        </div>
        <div className="p-0 overflow-y-auto max-h-[300px]">
          {projectTasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No tasks found in project.</div>
          ) : (
            projectTasks.map((task: any) => (
              <div key={task.id} className="p-4 border-b border-border/50 hover:bg-accent/30 transition-colors flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{task.id}</span>
                    <span className="font-medium text-sm truncate">{task.title || task.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <Badge variant="outline" className={
                      task.priority === 'Critical' ? "border-destructive text-destructive" :
                      task.priority === 'High' ? "border-chart-4 text-chart-4" : "border-muted-foreground text-muted-foreground"
                    }>{task.priority}</Badge>
                    <span className="text-muted-foreground font-mono">
                      Category: {task.category || 'General'}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="outline" className="mb-1">{task.status}</Badge>
                  <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden mt-1">
                    <div className="bg-primary h-full" style={{ width: `${task.progress}%` }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
