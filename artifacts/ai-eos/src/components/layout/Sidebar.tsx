import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  BarChart3, 
  Bell, 
  Settings,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { currentUser } from "@/data/mock";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar h-full relative z-20">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 text-primary">
          <div className="relative flex items-center justify-center w-8 h-8 rounded bg-primary/10 border border-primary/20">
            <Cpu className="w-4 h-4 text-primary" />
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
          <span className="font-bold tracking-wider text-sm">AI-EOS</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer group",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md shadow-[0_0_8px_hsl(var(--primary))]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border/50">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-sidebar-accent/50 cursor-pointer transition-colors">
          <Avatar className="w-8 h-8 border border-border">
            <AvatarFallback className="bg-primary/20 text-primary text-xs">{currentUser.avatar}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground">{currentUser.name}</span>
            <span className="text-[10px] text-muted-foreground">{currentUser.role}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
