import { VerificationResult } from '../../types';

export interface AndroidBuildAdapter {
  buildGradle(projectPath: string): Promise<{ success: boolean; apkPath?: string; errors: string[] }>;
}

export interface AndroidTestAdapter {
  runUnitTests(projectPath: string): Promise<{ passed: boolean; testCount: number; failureCount: number; errors: string[] }>;
}

export interface AndroidRuntimeAdapter {
  verifyApkRuntime(apkPath: string): Promise<VerificationResult>;
}

export interface WebBuildAdapter {
  buildProject(projectPath: string): Promise<{ success: boolean; distPath?: string; errors: string[] }>;
}

export interface BrowserVerificationAdapter {
  verifyRuntime(url: string): Promise<VerificationResult>;
}

export type SystemThermalState = 'NORMAL' | 'ELEVATED' | 'COOLING' | 'CRITICAL' | 'UNKNOWN';

export interface SystemSafetyManager {
  getThermalState(): Promise<SystemThermalState>;
  shouldPauseExecution(): Promise<boolean>;
}
