import { ToolProfile, ToolStatus } from '../types';
import { LocalToolBridge } from './LocalToolBridge';

export class ToolDiscoveryService {
  private static instance: ToolDiscoveryService;

  private constructor() {}

  public static getInstance(): ToolDiscoveryService {
    if (!ToolDiscoveryService.instance) {
      ToolDiscoveryService.instance = new ToolDiscoveryService();
    }
    return ToolDiscoveryService.instance;
  }

  public async discoverTools(): Promise<ToolProfile[]> {
    const candidateTools: Array<{
      id: string;
      name: string;
      type: ToolProfile['type'];
      command: string;
      versionArg: string;
      supportedProjectTypes: ToolProfile['supportedProjectTypes'];
      capabilities: ToolProfile['capabilities'];
    }> = [
      { id: 'tool-git', name: 'Git CLI', type: 'CUSTOM', command: 'git', versionArg: '--version', supportedProjectTypes: ['Web', 'Android', 'Backend', 'Full Stack', 'Python'], capabilities: ['Git'] },
      { id: 'tool-node', name: 'Node.js Runtime', type: 'WEB_TOOL', command: 'node', versionArg: '-v', supportedProjectTypes: ['Web', 'Backend', 'Full Stack'], capabilities: ['Build', 'Testing'] },
      { id: 'tool-npm', name: 'NPM Package Manager', type: 'WEB_TOOL', command: 'npm', versionArg: '-v', supportedProjectTypes: ['Web', 'Backend', 'Full Stack'], capabilities: ['Build', 'Testing'] },
      { id: 'tool-pnpm', name: 'PNPM Package Manager', type: 'WEB_TOOL', command: 'pnpm', versionArg: '-v', supportedProjectTypes: ['Web', 'Backend', 'Full Stack'], capabilities: ['Build', 'Testing'] },
      { id: 'tool-yarn', name: 'Yarn Package Manager', type: 'WEB_TOOL', command: 'yarn', versionArg: '-v', supportedProjectTypes: ['Web', 'Backend', 'Full Stack'], capabilities: ['Build', 'Testing'] },
      { id: 'tool-bun', name: 'Bun Runtime', type: 'WEB_TOOL', command: 'bun', versionArg: '-v', supportedProjectTypes: ['Web', 'Backend', 'Full Stack'], capabilities: ['Build', 'Testing'] },
      { id: 'tool-tsc', name: 'TypeScript Compiler', type: 'BUILD_TOOL', command: 'tsc', versionArg: '-v', supportedProjectTypes: ['Web', 'Backend', 'Full Stack'], capabilities: ['Build'] },
      { id: 'tool-gradle', name: 'Gradle Wrapper', type: 'ANDROID_TOOL', command: 'gradle', versionArg: '-v', supportedProjectTypes: ['Android'], capabilities: ['Build', 'Testing'] }
    ];

    const bridge = LocalToolBridge.getInstance();
    const discovered: ToolProfile[] = [];

    for (const item of candidateTools) {
      const dummyProfile: ToolProfile = {
        id: item.id,
        name: item.name,
        type: item.type,
        executablePath: item.command,
        command: item.command,
        arguments: [item.versionArg],
        supportedProjectTypes: item.supportedProjectTypes,
        capabilities: item.capabilities,
        enabled: true,
        status: 'Not Configured',
        lastCheckedAt: null,
        version: null
      };

      const result = await bridge.executeTool(dummyProfile, [item.versionArg], process.cwd(), 5000);
      const now = new Date().toISOString();

      let status: ToolStatus = 'Unavailable';
      let version: string | null = null;

      if (result.success && result.stdout.trim().length > 0) {
        status = 'Available';
        version = result.stdout.trim().split('\n')[0];
      } else if (result.timedOut) {
        status = 'Unavailable';
      } else {
        status = 'Unavailable';
      }

      discovered.push({
        ...dummyProfile,
        status,
        version,
        lastCheckedAt: now
      });
    }

    return discovered;
  }
}
