import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Terminal, Network, ShieldAlert, Cpu, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const mockConsoleLogs = [
  "[AI-EOS] Initializing engine core...",
  "[SYSTEM] Loading environment configuration.",
  "[AGENT] Connecting to LLM provider (latency: 42ms).",
  "[BUILD] Watching for file changes...",
  "[SERVER] API Gateway listening on port 8080.",
  "[AGENT] Ready for instructions."
];

export function BottomPanel() {
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const heightClass = expanded ? "h-[350px]" : "h-[180px]";

  useEffect(() => {
    // Type out logs sequentially
    let i = 0;
    const interval = setInterval(() => {
      if (i < mockConsoleLogs.length) {
        setLogs(prev => [...prev, mockConsoleLogs[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className="border-t border-border bg-[#0a0a0c] w-full flex flex-col relative z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
      animate={{ height: expanded ? 350 : 180 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Tabs defaultValue="console" className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 border-b border-border/50 bg-background/50 backdrop-blur-md">
          <TabsList className="h-10 bg-transparent p-0">
            <TabsTrigger value="console" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-full text-xs font-mono">
              <Terminal className="w-3.5 h-3.5 mr-2" />
              Console
            </TabsTrigger>
            <TabsTrigger value="build" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-chart-2 rounded-none px-4 h-full text-xs font-mono">
              <Cpu className="w-3.5 h-3.5 mr-2" />
              Build Logs
            </TabsTrigger>
            <TabsTrigger value="network" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-chart-4 rounded-none px-4 h-full text-xs font-mono">
              <Network className="w-3.5 h-3.5 mr-2" />
              Network
            </TabsTrigger>
            <TabsTrigger value="server" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-chart-3 rounded-none px-4 h-full text-xs font-mono">
              <ShieldAlert className="w-3.5 h-3.5 mr-2" />
              Server Logs
            </TabsTrigger>
          </TabsList>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-accent rounded text-muted-foreground transition-colors"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
          <TabsContent value="console" className="m-0 h-full">
            <div className="space-y-1">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-primary/50 shrink-0">{new Date().toISOString().split('T')[1].slice(0,-1)}</span>
                  <span className={log.includes("[AGENT]") ? "text-primary" : log.includes("[SERVER]") ? "text-chart-3" : ""}>
                    {log}
                  </span>
                </div>
              ))}
              <div className="flex gap-3 items-center">
                <span className="text-primary/50 shrink-0">{new Date().toISOString().split('T')[1].slice(0,-1)}</span>
                <span className="flex items-center gap-1">
                  Waiting for input
                  <span className="w-2 h-3 bg-primary inline-block terminal-cursor"></span>
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="build" className="m-0 h-full">
            <div className="space-y-1 text-chart-2">
              <div>[vite] Rebuilding...</div>
              <div>[vite] 12 modules transformed.</div>
              <div>[tsc] Typecheck passed in 1.2s.</div>
              <div className="text-chart-3">✓ Built successfully.</div>
            </div>
          </TabsContent>

          <TabsContent value="network" className="m-0 h-full">
            <table className="w-full text-left">
              <thead>
                <tr className="text-muted-foreground/50 border-b border-border/30">
                  <th className="pb-1 font-normal w-24">Method</th>
                  <th className="pb-1 font-normal">Path</th>
                  <th className="pb-1 font-normal w-24">Status</th>
                  <th className="pb-1 font-normal w-24">Time</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr><td className="text-chart-4 py-1">GET</td><td>/api/v1/projects</td><td className="text-chart-3">200 OK</td><td>42ms</td></tr>
                <tr><td className="text-chart-4 py-1">POST</td><td>/api/v1/tasks</td><td className="text-chart-3">201 Created</td><td>112ms</td></tr>
                <tr><td className="text-destructive py-1">GET</td><td>/api/v1/metrics/err</td><td className="text-destructive">500 ERR</td><td>18ms</td></tr>
              </tbody>
            </table>
          </TabsContent>

          <TabsContent value="server" className="m-0 h-full text-foreground/80">
            <div>{"{"} "level": "info", "time": 1699999999, "msg": "Server listening on 0.0.0.0:8080" {"}"}</div>
            <div>{"{"} "level": "warn", "time": 1699999999, "msg": "High memory usage detected", "mem": "85%" {"}"}</div>
            <div>{"{"} "level": "info", "time": 1699999999, "reqId": "req-123", "msg": "Request completed" {"}"}</div>
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  );
}
