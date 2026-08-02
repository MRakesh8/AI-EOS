import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { RightPanel } from "./RightPanel";
import { BottomPanel } from "./BottomPanel";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground dark selection:bg-primary/30">
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0 bg-background/50">
          {/* Subtle gradient background for depth */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] -mr-[400px] -mt-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] -ml-[250px] -mb-[250px] rounded-full bg-chart-2/5 blur-3xl pointer-events-none" />
          
          <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth relative z-10">
            <div className="max-w-[1200px] mx-auto w-full">
              {children}
            </div>
          </div>
        </main>
        <RightPanel />
      </div>
      <BottomPanel />
    </div>
  );
}
