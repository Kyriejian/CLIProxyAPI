import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { ProxyRouter } from './router.js';
import { ProviderRegistry } from './providers/registry.js';
import { ModelRegistry } from './models/registry.js';
import { RequestLogger } from './middleware/logger.js';
import { AuthMiddleware } from './auth/apikey.js';

const DEFAULT_PORT = 18765;
const DEFAULT_HOST = '127.0.0.1';

export interface ProxyServerConfig {
  host?: string;
  port?: number;
  apiKeys?: string[];
  enableAuth?: boolean;
  enableCors?: boolean;
  routingStrategy?: 'round-robin' | 'priority' | 'least-used' | 'random';
  rtkCompression?: boolean;
  maxRetries?: number;
}

export class ProxyServer {
  private app: express.Application;
  private server: ReturnType<express.Application['listen']> | null = null;
  private config: Required<ProxyServerConfig>;
  private providerRegistry: ProviderRegistry;
  private modelRegistry: ModelRegistry;
  private router: ProxyRouter;
  private requestLogger: RequestLogger;
  private authMiddleware: AuthMiddleware | null = null;

  constructor(config: ProxyServerConfig = {}) {
    this.config = {
      host: config.host ?? DEFAULT_HOST,
      port: config.port ?? DEFAULT_PORT,
      apiKeys: config.apiKeys ?? [],
      enableAuth: config.enableAuth ?? false,
      enableCors: config.enableCors ?? true,
      routingStrategy: config.routingStrategy ?? 'round-robin',
      rtkCompression: config.rtkCompression ?? true,
      maxRetries: config.maxRetries ?? 3,
    };

    this.app = express();
    this.providerRegistry = new ProviderRegistry();
    this.modelRegistry = new ModelRegistry(this.providerRegistry);
    this.requestLogger = new RequestLogger();
    this.router = new ProxyRouter(
      this.providerRegistry,
      this.modelRegistry,
      this.requestLogger,
      {
        strategy: this.config.routingStrategy,
        rtkCompression: this.config.rtkCompression,
        maxRetries: this.config.maxRetries,
      }
    );

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    if (this.config.enableCors) {
      this.app.use(cors());
    }
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.text({ type: 'text/event-stream' }));

    this.authMiddleware = new AuthMiddleware(this.config.apiKeys);
    if (this.config.enableAuth && this.config.apiKeys.length > 0) {
      this.app.use('/v1', this.authMiddleware.handle.bind(this.authMiddleware));
    }
  }

  private setupRoutes(): void {
    // OpenAI-compatible endpoints
    this.app.post('/v1/chat/completions', (req, res) => this.router.handleChatCompletion(req, res));
    this.app.get('/v1/models', (req, res) => this.router.handleListModels(req, res));
    this.app.post('/v1/embeddings', (req, res) => this.router.handleEmbeddings(req, res));

    // Anthropic-compatible endpoints
    this.app.post('/v1/messages', (req, res) => this.router.handleAnthropicMessages(req, res));

    // Management API
    this.app.get('/api/status', (_req, res) => this.handleStatus(res));
    this.app.get('/api/providers', (_req, res) => this.handleGetProviders(res));
    this.app.post('/api/providers', (req, res) => this.handleAddProvider(req, res));
    this.app.put('/api/providers/:id', (req, res) => this.handleUpdateProvider(req, res));
    this.app.delete('/api/providers/:id', (req, res) => this.handleDeleteProvider(req, res));
    this.app.post('/api/providers/:id/test', (req, res) => this.handleTestProvider(req, res));
    this.app.get('/api/models', (_req, res) => this.handleGetModels(res));
    this.app.get('/api/stats', (_req, res) => this.handleGetStats(res));
    this.app.get('/api/logs', (req, res) => this.handleGetLogs(req, res));
    this.app.get('/api/accounts', (_req, res) => this.handleGetAccounts(res));
    this.app.post('/api/accounts', (req, res) => this.handleAddAccount(req, res));
    this.app.delete('/api/accounts/:id', (req, res) => this.handleDeleteAccount(req, res));

    // API Key management
    this.app.get('/api/keys', (_req, res) => this.handleGetKeys(res));
    this.app.post('/api/keys', (req, res) => this.handleAddKey(req, res));
    this.app.post('/api/keys/generate', (_req, res) => this.handleGenerateKey(res));
    this.app.delete('/api/keys/:key', (req, res) => this.handleDeleteKey(req, res));
    this.app.put('/api/config/auth', (req, res) => this.handleUpdateAuthConfig(req, res));

    // Health check
    this.app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  }

  private handleStatus(res: express.Response): void {
    res.json({
      status: 'running',
      version: '1.0.0',
      host: this.config.host,
      port: this.config.port,
      providers: this.providerRegistry.getAll().length,
      models: this.modelRegistry.getAll().length,
      stats: this.requestLogger.getStats(),
    });
  }

  private handleGetProviders(res: express.Response): void {
    res.json(this.providerRegistry.getAll());
  }

  private handleAddProvider(req: express.Request, res: express.Response): void {
    try {
      const provider = this.providerRegistry.add(req.body);
      res.status(201).json(provider);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  }

  private handleUpdateProvider(req: express.Request, res: express.Response): void {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const provider = this.providerRegistry.update(id, req.body);
      res.json(provider);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  }

  private handleDeleteProvider(req: express.Request, res: express.Response): void {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    this.providerRegistry.remove(id);
    res.status(204).send();
  }

  private async handleTestProvider(req: express.Request, res: express.Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await this.router.testProvider(id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }

  private handleGetModels(res: express.Response): void {
    res.json(this.modelRegistry.getAll());
  }

  private handleGetStats(res: express.Response): void {
    res.json(this.requestLogger.getStats());
  }

  private handleGetLogs(req: express.Request, res: express.Response): void {
    const limit = parseInt(req.query.limit as string) || 100;
    res.json(this.requestLogger.getRecentLogs(limit));
  }

  private handleGetAccounts(_res: express.Response): void {
    _res.json([]);
  }

  private handleAddAccount(req: express.Request, res: express.Response): void {
    res.status(201).json(req.body);
  }

  private handleDeleteAccount(req: express.Request, res: express.Response): void {
    res.status(204).send();
  }

  private handleGetKeys(res: express.Response): void {
    res.json({
      keys: this.config.apiKeys,
      authEnabled: this.config.enableAuth,
    });
  }

  private handleAddKey(req: express.Request, res: express.Response): void {
    const { key } = req.body;
    if (!key || typeof key !== 'string') {
      res.status(400).json({ error: 'API key is required' });
      return;
    }
    if (this.config.apiKeys.includes(key)) {
      res.status(409).json({ error: 'Key already exists' });
      return;
    }
    this.config.apiKeys.push(key);
    this.authMiddleware?.addKey(key);
    res.status(201).json({ key, total: this.config.apiKeys.length });
  }

  private handleGenerateKey(res: express.Response): void {
    const key = `sk-proxy-${crypto.randomBytes(24).toString('hex')}`;
    this.config.apiKeys.push(key);
    this.authMiddleware?.addKey(key);
    res.status(201).json({ key, total: this.config.apiKeys.length });
  }

  private handleDeleteKey(req: express.Request, res: express.Response): void {
    const keyParam = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    const index = this.config.apiKeys.indexOf(keyParam);
    if (index === -1) {
      res.status(404).json({ error: 'Key not found' });
      return;
    }
    this.config.apiKeys.splice(index, 1);
    this.authMiddleware?.removeKey(keyParam);
    res.status(200).json({ deleted: true, total: this.config.apiKeys.length });
  }

  private handleUpdateAuthConfig(req: express.Request, res: express.Response): void {
    const { enableAuth } = req.body;
    if (typeof enableAuth === 'boolean') {
      this.config.enableAuth = enableAuth;
    }
    res.json({ enableAuth: this.config.enableAuth, keys: this.config.apiKeys.length });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, this.config.host, () => {
        console.log(`AI Proxy Manager running at http://${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  getProviderRegistry(): ProviderRegistry {
    return this.providerRegistry;
  }

  getModelRegistry(): ModelRegistry {
    return this.modelRegistry;
  }
}
