import { AuditLogEntry } from '../types';

export class AuditLogService {
  private static instance: AuditLogService;
  private memoryLogs: Map<string, AuditLogEntry[]> = new Map();

  private constructor() {}

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  public async loadAuditLogs(projectPath: string): Promise<AuditLogEntry[]> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const res = await window.electronAPI.readFile(`${projectPath}/.aieos/audit_log.json`);
      if (res.success && res.content) {
        try { return JSON.parse(res.content); } catch (e) {}
      }
    } else {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.join(projectPath, '.aieos', 'audit_log.json');
        if (fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, 'utf8');
          return JSON.parse(raw);
        }
      } catch (e) {}
    }
    return this.memoryLogs.get(projectPath) || [];
  }

  public async recordAuditLog(projectPath: string, entryInput: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const existing = await this.loadAuditLogs(projectPath);
    const newEntry: AuditLogEntry = {
      ...entryInput,
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };

    const updated = [newEntry, ...existing];
    this.memoryLogs.set(projectPath, updated);

    if (typeof window !== 'undefined' && window.electronAPI) {
      await window.electronAPI.writeFile(`${projectPath}/.aieos/audit_log.json`, JSON.stringify(updated, null, 2));
    } else {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const aieosDir = path.join(projectPath, '.aieos');
        if (!fs.existsSync(aieosDir)) fs.mkdirSync(aieosDir, { recursive: true });
        fs.writeFileSync(path.join(aieosDir, 'audit_log.json'), JSON.stringify(updated, null, 2), 'utf8');
      } catch (e) {}
    }

    return newEntry;
  }
}
