import { ProviderRegistry, ProviderModel, ProviderEntry } from '../providers/registry.js';

export interface UnifiedModel {
  id: string;
  name: string;
  provider: string;
  providerDisplayName: string;
  alias?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  pricing?: { inputPer1M: number; outputPer1M: number; currency: string };
  available: boolean;
}

export class ModelRegistry {
  private providerRegistry: ProviderRegistry;

  constructor(providerRegistry: ProviderRegistry) {
    this.providerRegistry = providerRegistry;
  }

  getAll(): UnifiedModel[] {
    const models: UnifiedModel[] = [];
    for (const provider of this.providerRegistry.getAll()) {
      for (const model of provider.models) {
        models.push(this.toUnifiedModel(model, provider));
      }
    }
    return models;
  }

  getAvailable(): UnifiedModel[] {
    return this.getAll().filter(m => m.available);
  }

  findByName(name: string): UnifiedModel | undefined {
    for (const provider of this.providerRegistry.getActive()) {
      for (const model of provider.models) {
        if (model.name === name || model.alias === name || model.id === name) {
          return this.toUnifiedModel(model, provider);
        }
      }
    }
    return undefined;
  }

  findProviderForModel(modelName: string): ProviderEntry | undefined {
    return this.providerRegistry.getNextForModel(modelName);
  }

  private toUnifiedModel(model: ProviderModel, provider: ProviderEntry): UnifiedModel {
    return {
      id: `${provider.name}/${model.id}`,
      name: model.name,
      provider: provider.name,
      providerDisplayName: provider.displayName,
      alias: model.alias,
      contextWindow: model.contextWindow,
      maxOutputTokens: model.maxOutputTokens,
      supportsStreaming: model.supportsStreaming,
      supportsTools: model.supportsTools,
      supportsVision: model.supportsVision,
      pricing: model.pricing,
      available: provider.enabled && provider.status === 'active',
    };
  }
}
