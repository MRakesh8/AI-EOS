import { ProviderAdapter, ProviderProfile, ProviderModel, Task } from '../types';

export class ProviderManager {
  private static instance: ProviderManager;
  private adapters: Map<string, ProviderAdapter> = new Map();

  private constructor() {}

  public static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  public registerAdapter(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.providerId.toLowerCase(), adapter);
    this.adapters.set(adapter.providerName.toLowerCase(), adapter);
  }

  public getAdapter(providerId: string): ProviderAdapter | undefined {
    return this.adapters.get(providerId.toLowerCase());
  }

  public hasAdapter(providerId: string): boolean {
    return this.adapters.has(providerId.toLowerCase());
  }

  public getBestProviderAndModelForTask(
    task: Task,
    profiles: ProviderProfile[]
  ): { profile: ProviderProfile | null; modelId: string | null } {
    const enabledProfiles = profiles.filter(p => p.isEnabled);
    if (enabledProfiles.length === 0) {
      return { profile: null, modelId: null };
    }

    if (task.currentProviderProfileId) {
      const currentProfile = enabledProfiles.find(p => p.id === task.currentProviderProfileId);
      if (currentProfile) {
        const modelId = currentProfile.selectedModelId || (currentProfile.availableModels?.[0]?.id ?? null);
        return { profile: currentProfile, modelId };
      }
    }

    const bestProfile = enabledProfiles[0];
    const modelId = bestProfile.selectedModelId || (bestProfile.availableModels?.[0]?.id ?? null);
    return { profile: bestProfile, modelId };
  }

  public async checkProfileAvailability(profile: ProviderProfile): Promise<boolean> {
    const adapter = this.getAdapter(profile.providerName);
    if (!adapter) {
      return profile.isEnabled;
    }
    return adapter.checkAvailability(profile.id);
  }

  public async getAvailableModels(profile: ProviderProfile): Promise<ProviderModel[]> {
    const adapter = this.getAdapter(profile.providerName);
    if (!adapter) {
      return profile.availableModels || [];
    }
    return adapter.getModels(profile.id);
  }
}
