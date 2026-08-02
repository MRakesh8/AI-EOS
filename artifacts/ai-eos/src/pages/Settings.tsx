import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Save, Github, Rocket, Settings2, Bell } from "lucide-react";

export function Settings() {
  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure AI-EOS environment and integrations.</p>
      </div>

      <Tabs defaultValue="integrations" className="flex flex-col md:flex-row gap-6">
        <TabsList className="flex flex-col h-auto w-full md:w-[200px] bg-transparent p-0 space-y-1">
          <TabsTrigger value="integrations" className="justify-start px-4 py-2 w-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Rocket className="w-4 h-4 mr-2" /> Integrations
          </TabsTrigger>
          <TabsTrigger value="preferences" className="justify-start px-4 py-2 w-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Settings2 className="w-4 h-4 mr-2" /> Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications" className="justify-start px-4 py-2 w-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Bell className="w-4 h-4 mr-2" /> Notifications
          </TabsTrigger>
        </TabsList>

        <div className="flex-1">
          <TabsContent value="integrations" className="m-0 space-y-6">
            <Card className="p-6 bg-card/40 border-border/50">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                <Github className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold text-lg">GitHub Repository</h3>
                  <p className="text-sm text-muted-foreground">Connect to sync codebase and CI status.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Repository URL</Label>
                  <Input defaultValue="https://github.com/acme/project-nexus" className="font-mono bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>Personal Access Token</Label>
                  <Input type="password" defaultValue="ghp_****************************" className="font-mono bg-background/50" />
                </div>
                <Button>Connect GitHub</Button>
              </div>
            </Card>

            <Card className="p-6 bg-card/40 border-border/50">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                <Rocket className="w-6 h-6 text-chart-2" />
                <div>
                  <h3 className="font-semibold text-lg">Antigravity Agent</h3>
                  <p className="text-sm text-muted-foreground">Configure local or remote AI processing nodes.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Endpoint URL</Label>
                  <Input defaultValue="http://localhost:11434" className="font-mono bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input type="password" defaultValue="****************" className="font-mono bg-background/50" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <Label className="text-base">Auto-Context Sync</Label>
                    <p className="text-xs text-muted-foreground">Continuously sync workspace files to agent memory.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="m-0 space-y-6">
            <Card className="p-6 bg-card/40 border-border/50 space-y-6">
              <h3 className="font-semibold text-lg pb-4 border-b border-border/50">Project Preferences</h3>
              
              <div className="space-y-2">
                <Label>Default Build Command</Label>
                <Input defaultValue="npm run build" className="font-mono bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label>Default Test Command</Label>
                <Input defaultValue="npm run test" className="font-mono bg-background/50" />
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div>
                  <Label className="text-base">Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">AI-EOS runs exclusively in Dark Mode.</p>
                </div>
                <Switch disabled checked />
              </div>
              
              <Button className="w-full mt-4"><Save className="w-4 h-4 mr-2"/> Save Preferences</Button>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="m-0 space-y-6">
            <Card className="p-6 bg-card/40 border-border/50 space-y-6">
              <h3 className="font-semibold text-lg pb-4 border-b border-border/50">Alert Settings</h3>
              
              <div className="space-y-4">
                {[
                  { label: "Build Failures", desc: "Get notified when CI pipeline fails.", on: true },
                  { label: "Agent Suggestions", desc: "New code generated by AI.", on: true },
                  { label: "System Metrics", desc: "High CPU or memory usage alerts.", on: true },
                  { label: "Task Updates", desc: "When tasks change status.", on: false }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">{item.label}</Label>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={item.on} />
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
