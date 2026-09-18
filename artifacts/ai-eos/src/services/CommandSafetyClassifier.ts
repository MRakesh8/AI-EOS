import { CommandSafetyClass } from '../types';

export class CommandSafetyClassifier {
  private static instance: CommandSafetyClassifier;

  private blockedPatterns: RegExp[] = [
    /rm\s+-rf\b/i,
    /rmdir\s+\/s\b/i,
    /del\s+\/f\s+\/s/i,
    /git\s+push\s+.*--force/i,
    /git\s+push\s+.*-f\b/i,
    /git\s+reset\s+--hard/i,
    /format\s+[a-z]:/i,
    /diskpart/i,
    /fdisk/i,
    /mkfs/i,
    /drop\s+database/i,
    /drop\s+table/i,
    /truncate\s+table/i,
    /net\s+user/i,
    /takeown\s+\/f/i
  ];

  private safePatterns: RegExp[] = [
    /^git\s+status$/i,
    /^git\s+diff/i,
    /^git\s+log/i,
    /^npm\s+test$/i,
    /^npm\s+run\s+typecheck$/i,
    /^tsc\s+--noEmit$/i,
    /^dir\b/i,
    /^ls\b/i,
    /^node\s+-v$/i,
    /^npm\s+-v$/i
  ];

  private constructor() {}

  public static getInstance(): CommandSafetyClassifier {
    if (!CommandSafetyClassifier.instance) {
      CommandSafetyClassifier.instance = new CommandSafetyClassifier();
    }
    return CommandSafetyClassifier.instance;
  }

  public classifyCommand(cmd: string): CommandSafetyClass {
    const trimmed = cmd.trim();

    for (const pattern of this.blockedPatterns) {
      if (pattern.test(trimmed)) {
        return 'BLOCKED';
      }
    }

    for (const pattern of this.safePatterns) {
      if (pattern.test(trimmed)) {
        return 'SAFE';
      }
    }

    return 'REQUIRES_APPROVAL';
  }
}
