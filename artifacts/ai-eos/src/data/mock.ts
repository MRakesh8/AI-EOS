export const currentUser = {
  name: "Alex Chen",
  role: "Lead Engineer",
  avatar: "AC",
};

export const currentStatus = {
  project: "Project Nexus",
  sprint: "Sprint 23 — Auth & Security Layer",
  task: "Implement JWT refresh token rotation",
  nextTask: "Audit RBAC permissions",
  progress: 74,
};

export const metrics = {
  build: { status: "Success", time: "2m 34s", version: "v2.4.1" },
  tests: { passed: 847, total: 912, coverage: 93 },
  performance: 94,
  security: 78,
};

export const tasks = [
  { id: "TSK-104", title: "Implement JWT refresh token rotation", status: "In Progress", priority: "Critical", progress: 60, aiModule: "CodeGen v3", time: "2h" },
  { id: "TSK-105", title: "Audit RBAC permissions", status: "To Do", priority: "High", progress: 0, aiModule: "DocBot", time: "4h" },
  { id: "TSK-106", title: "Setup OAuth2 Providers", status: "Review", priority: "Medium", progress: 90, aiModule: "TestRunner AI", time: "1h" },
  { id: "TSK-107", title: "Refactor user service", status: "Done", priority: "Low", progress: 100, aiModule: "CodeGen v3", time: "8h" },
  { id: "TSK-108", title: "Write API e2e tests", status: "To Do", priority: "High", progress: 0, aiModule: "TestRunner AI", time: "3h" },
];

export const projects = [
  { id: "PRJ-1", name: "Project Nexus", description: "Distributed AI inference platform", tags: ["React", "TypeScript", "Node.js", "Python"], progress: 74, status: "Active", start: "2023-10-01", end: "2024-03-15", currentMilestone: "Auth Layer", remainingTasks: 12, estCompletion: "2w" },
  { id: "PRJ-2", name: "Hyperion API", description: "High-throughput real-time events pipeline", tags: ["Rust", "gRPC", "Kafka"], progress: 42, status: "Active", start: "2023-11-15", end: "2024-05-01", currentMilestone: "Data Ingestion", remainingTasks: 34, estCompletion: "8w" },
  { id: "PRJ-3", name: "Helios Dashboard", description: "Internal observability tools", tags: ["Vue", "Go", "ClickHouse"], progress: 95, status: "Active", start: "2023-08-01", end: "2023-12-20", currentMilestone: "Final Polish", remainingTasks: 3, estCompletion: "3d" },
  { id: "PRJ-4", name: "Legacy Migration", description: "Migrating v1 endpoints to v2", tags: ["Java", "Spring", "Postgres"], progress: 15, status: "Paused", start: "2023-09-01", end: "2024-06-01", currentMilestone: "DB Schema", remainingTasks: 89, estCompletion: "On Hold" },
  { id: "PRJ-5", name: "Aegis Security Scanner", description: "Automated vulnerability detection", tags: ["Python", "Docker", "Kubernetes"], progress: 100, status: "Completed", start: "2023-01-15", end: "2023-07-30", currentMilestone: "Deployed", remainingTasks: 0, estCompletion: "Done" },
];

export const notifications = [
  { id: 1, type: "Alert", title: "High CPU Usage", desc: "API Gateway nodes exceeding 85% utilization.", time: "2m ago", read: false },
  { id: 2, type: "Success", title: "Deploy Successful", desc: "Nexus v2.4.1 deployed to production.", time: "15m ago", read: false },
  { id: 3, type: "Info", title: "New PR Assigned", desc: "Alex assigned PR #492 for review.", time: "1h ago", read: true },
  { id: 4, type: "Success", title: "CI Checks Passed", desc: "All 912 tests passed for PR #492.", time: "2h ago", read: true },
  { id: 5, type: "Info", title: "AI Agent Report", desc: "CodeGen v3 generated 4 files.", time: "3h ago", read: true },
];

export const recentActivities = [
  { id: 1, action: "pushed to", target: "main", user: "Alex Chen", time: "10m ago" },
  { id: 2, action: "merged PR", target: "#491", user: "Sarah Jenkins", time: "1h ago" },
  { id: 3, action: "commented on", target: "TSK-104", user: "AI CodeGen", time: "2h ago" },
  { id: 4, action: "deployed", target: "staging", user: "System", time: "4h ago" },
];

export const chartData = {
  commits: Array.from({ length: 30 }).map((_, i) => ({ day: `Day ${i+1}`, commits: Math.floor(Math.random() * 20) + 5 })),
  tests: [{ name: "Passed", value: 847, fill: "hsl(var(--chart-3))" }, { name: "Failed", value: 65, fill: "hsl(var(--destructive))" }, { name: "Skipped", value: 0, fill: "hsl(var(--muted))" }],
  security: [{ name: "Critical", value: 2, fill: "hsl(var(--destructive))" }, { name: "High", value: 5, fill: "hsl(var(--chart-2))" }, { name: "Medium", value: 12, fill: "hsl(var(--chart-4))" }, { name: "Low", value: 24, fill: "hsl(var(--chart-1))" }],
  performance: Array.from({ length: 24 }).map((_, i) => ({ time: `${i}:00`, ms: Math.floor(Math.random() * 100) + 40 })),
  deploys: Array.from({ length: 8 }).map((_, i) => ({ week: `W${i+1}`, success: Math.floor(Math.random() * 10) + 2, failure: Math.floor(Math.random() * 2) }))
};
