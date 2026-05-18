import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderRegistry } from '../providers/registry.js';
import { ModelRegistry } from '../models/registry.js';

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = new ProviderRegistry();
  });

  it('should load default providers on construction', () => {
    const all = registry.getAll();
    expect(all.length).toBeGreaterThan(0);
    const names = all.map(p => p.name);
    expect(names).toContain('kiro');
    expect(names).toContain('openai');
    expect(names).toContain('anthropic');
    expect(names).toContain('gemini');
  });

  it('should add a custom provider', () => {
    const before = registry.getAll().length;
    const provider = registry.add({
      name: 'custom',
      displayName: 'Custom Provider',
      type: 'api-key',
      authMethod: 'api-key',
      baseUrl: 'https://api.custom.com/v1',
      models: [
        { id: 'c-1', name: 'custom-model', supportsStreaming: true, supportsTools: false, supportsVision: false },
      ],
    });

    expect(registry.getAll().length).toBe(before + 1);
    expect(provider.id).toBeDefined();
    expect(provider.name).toBe('custom');
    expect(provider.enabled).toBe(true);
    expect(provider.status).toBe('active');
    expect(provider.createdAt).toBeDefined();
  });

  it('should update an existing provider', () => {
    const kiro = registry.getByName('kiro');
    expect(kiro).toBeDefined();

    const updated = registry.update(kiro!.id, { displayName: 'Kiro Updated' });
    expect(updated.displayName).toBe('Kiro Updated');
    expect(updated.name).toBe('kiro');
    expect(updated.createdAt).toBe(kiro!.createdAt);
  });

  it('should throw when updating non-existent provider', () => {
    expect(() => registry.update('non-existent-id', { displayName: 'X' }))
      .toThrow('Provider non-existent-id not found');
  });

  it('should remove a provider', () => {
    const kiro = registry.getByName('kiro');
    expect(kiro).toBeDefined();
    const before = registry.getAll().length;

    registry.remove(kiro!.id);
    expect(registry.getAll().length).toBe(before - 1);
    expect(registry.get(kiro!.id)).toBeUndefined();
  });

  it('should get provider by name', () => {
    const openai = registry.getByName('openai');
    expect(openai).toBeDefined();
    expect(openai!.displayName).toBe('OpenAI');
  });

  it('should return undefined for unknown provider name', () => {
    expect(registry.getByName('unknown')).toBeUndefined();
  });

  it('should filter active providers', () => {
    const active = registry.getActive();
    for (const p of active) {
      expect(p.enabled).toBe(true);
      expect(p.status).toBe('active');
    }
  });

  it('should filter providers by type', () => {
    const free = registry.getByType('free');
    for (const p of free) {
      expect(p.type).toBe('free');
    }
    expect(free.length).toBeGreaterThan(0);
  });

  it('should get next provider for model via round-robin', () => {
    // Kiro is active and has claude-sonnet-4 alias
    const provider = registry.getNextForModel('kr/claude-sonnet-4');
    expect(provider).toBeDefined();
  });
});

describe('ModelRegistry', () => {
  let providerRegistry: ProviderRegistry;
  let modelRegistry: ModelRegistry;

  beforeEach(() => {
    providerRegistry = new ProviderRegistry();
    modelRegistry = new ModelRegistry(providerRegistry);
  });

  it('should list all models from all providers', () => {
    const models = modelRegistry.getAll();
    expect(models.length).toBeGreaterThan(0);

    for (const model of models) {
      expect(model.id).toBeDefined();
      expect(model.name).toBeDefined();
      expect(model.provider).toBeDefined();
      expect(model.providerDisplayName).toBeDefined();
    }
  });

  it('should filter available models (active providers only)', () => {
    const available = modelRegistry.getAvailable();
    for (const model of available) {
      expect(model.available).toBe(true);
    }
  });

  it('should find model by name', () => {
    // Kiro is active by default and has claude-sonnet-4
    const model = modelRegistry.findByName('claude-sonnet-4');
    expect(model).toBeDefined();
    expect(model!.provider).toBe('kiro');
  });

  it('should find model by alias', () => {
    const model = modelRegistry.findByName('kr/claude-sonnet-4');
    expect(model).toBeDefined();
    expect(model!.name).toBe('claude-sonnet-4');
  });

  it('should return undefined for unknown model', () => {
    expect(modelRegistry.findByName('nonexistent-model-xyz')).toBeUndefined();
  });

  it('should find provider for model', () => {
    const provider = modelRegistry.findProviderForModel('kr/claude-sonnet-4');
    expect(provider).toBeDefined();
  });

  it('should include pricing info when available', () => {
    const models = modelRegistry.getAll();
    const dsModel = models.find(m => m.provider === 'deepseek');
    if (dsModel) {
      expect(dsModel.pricing).toBeDefined();
      expect(dsModel.pricing!.inputPer1M).toBeGreaterThan(0);
    }
  });
});
