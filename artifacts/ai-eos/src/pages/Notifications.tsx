import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { notifications } from "@/data/mock";
import { Check, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Notifications() {
  const [notifs, setNotifs] = useState(notifications);

  const markAllRead = () => {
    setNotifs(notifs.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: number) => {
    setNotifs(notifs.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">System events and alerts.</p>
        </div>
        <Button variant="outline" onClick={markAllRead} size="sm">
          <Check className="w-4 h-4 mr-2" />
          Mark all read
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="alert">Alerts</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        {["all", "alert", "info"].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-0">
            <div className="space-y-3">
              <AnimatePresence>
                {notifs
                  .filter(n => tab === "all" || (tab === "alert" ? n.type === "Alert" : n.type !== "Alert"))
                  .map(n => (
                  <motion.div 
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 rounded-lg border ${n.read ? 'bg-card/20 border-border/30 opacity-70' : 'bg-card border-border hover:border-primary/40'} flex gap-4 transition-colors cursor-pointer`}
                    onClick={() => markRead(n.id)}
                  >
                    <div className="mt-1">
                      {n.type === 'Alert' ? <AlertTriangle className="w-5 h-5 text-destructive" /> : 
                       n.type === 'Success' ? <CheckCircle className="w-5 h-5 text-chart-3" /> : 
                       <Info className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-foreground">{n.title}</h4>
                        <span className="text-xs text-muted-foreground">{n.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{n.desc}</p>
                    </div>
                    {!n.read && (
                      <div className="flex items-center justify-center shrink-0">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
