import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import type { ProviderConfig, ProviderEntry } from '../providers/registry.js';
import type { RequestLogEntry } from '../middleware/logger.js';

function getDbPath(): string {
  try {
    return path.join(app.getPath('userData'), 'ai-proxy-manager.db');
  } catch {
    return path.join(process.cwd(), 'ai-proxy-manager.db');
  }
}

export class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath?: string) {
    this.db = new Database(dbPath ?? getDbPath());
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS providers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'api-key',
        status TEXT NOT NULL DEFAULT 'active',
        auth_method TEXT NOT NULL DEFAULT 'api-key',
        base_url TEXT,
        api_key TEXT,
        icon TEXT,
        models TEXT NOT NULL DEFAULT '[]',
        quota TEXT,
        priority INTEGER NOT NULL DEFAULT 50,
        enabled INTEGER NOT NULL DEFAULT 1,
        config TEXT,
        last_checked TEXT,
        round_robin_index INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        email TEXT,
        display_name TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        plan TEXT NOT NULL DEFAULT 'free',
        quotas TEXT NOT NULL DEFAULT '[]',
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        last_used TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS request_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        model TEXT NOT NULL,
        provider TEXT NOT NULL,
        status INTEGER NOT NULL,
        latency_ms INTEGER NOT NULL,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        error TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON request_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_logs_provider ON request_logs(provider);
      CREATE INDEX IF NOT EXISTS idx_logs_model ON request_logs(model);
      CREATE INDEX IF NOT EXISTS idx_accounts_platform ON accounts(platform);
    `);
  }

  // --- Providers ---

  saveProvider(entry: ProviderEntry): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO providers
        (id, name, display_name, type, status, auth_method, base_url, api_key, icon, models, quota, priority, enabled, config, last_checked, round_robin_index, created_at, updated_at)
      VALUES
        (@id, @name, @displayName, @type, @status, @authMethod, @baseUrl, @apiKey, @icon, @models, @quota, @priority, @enabled, @config, @lastChecked, @roundRobinIndex, @createdAt, @updatedAt)
    `);
    stmt.run({
      id: entry.id,
      name: entry.name,
      displayName: entry.displayName,
      type: entry.type,
      status: entry.status,
      authMethod: entry.authMethod,
      baseUrl: entry.baseUrl ?? null,
      apiKey: entry.apiKey ?? null,
      icon: entry.icon ?? null,
      models: JSON.stringify(entry.models),
      quota: entry.quota ? JSON.stringify(entry.quota) : null,
      priority: entry.priority,
      enabled: entry.enabled ? 1 : 0,
      config: entry.config ? JSON.stringify(entry.config) : null,
      lastChecked: entry.lastChecked ?? null,
      roundRobinIndex: entry.roundRobinIndex,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });
  }

  loadProviders(): ProviderEntry[] {
    const rows = this.db.prepare('SELECT * FROM providers ORDER BY priority ASC').all() as ProviderRow[];
    return rows.map(rowToProviderEntry);
  }

  deleteProvider(id: string): void {
    this.db.prepare('DELETE FROM providers WHERE id = ?').run(id);
  }

  // --- Accounts ---

  saveAccount(account: AccountRow): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO accounts
        (id, platform, email, display_name, status, plan, quotas, access_token, refresh_token, token_expires_at, tags, last_used, created_at, updated_at)
      VALUES
        (@id, @platform, @email, @displayName, @status, @plan, @quotas, @accessToken, @refreshToken, @tokenExpiresAt, @tags, @lastUsed, @createdAt, @updatedAt)
    `);
    stmt.run(account);
  }

  loadAccounts(): AccountRow[] {
    return this.db.prepare('SELECT * FROM accounts ORDER BY created_at DESC').all() as AccountRow[];
  }

  deleteAccount(id: string): void {
    this.db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
  }

  // --- Logs ---

  saveLog(entry: RequestLogEntry): void {
    const stmt = this.db.prepare(`
      INSERT INTO request_logs
        (id, timestamp, method, path, model, provider, status, latency_ms, input_tokens, output_tokens, error)
      VALUES
        (@id, @timestamp, @method, @path, @model, @provider, @status, @latencyMs, @inputTokens, @outputTokens, @error)
    `);
    stmt.run({
      id: entry.id,
      timestamp: entry.timestamp,
      method: entry.method,
      path: entry.path,
      model: entry.model,
      provider: entry.provider,
      status: entry.status,
      latencyMs: entry.latencyMs,
      inputTokens: entry.inputTokens,
      outputTokens: entry.outputTokens,
      error: entry.error ?? null,
    });
  }

  loadRecentLogs(limit: number = 100): RequestLogEntry[] {
    const rows = this.db.prepare(
      'SELECT * FROM request_logs ORDER BY timestamp DESC LIMIT ?'
    ).all(limit) as LogRow[];
    return rows.map(rowToLogEntry);
  }

  getLogStats(): { total: number; success: number; failed: number; totalTokens: number } {
    const row = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status >= 200 AND status < 400 THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END) as failed,
        SUM(input_tokens + output_tokens) as totalTokens
      FROM request_logs
    `).get() as { total: number; success: number; failed: number; totalTokens: number };
    return row;
  }

  pruneOldLogs(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge).toISOString();
    this.db.prepare('DELETE FROM request_logs WHERE timestamp < ?').run(cutoff);
  }

  close(): void {
    this.db.close();
  }
}

// Row type interfaces
interface ProviderRow {
  id: string;
  name: string;
  display_name: string;
  type: string;
  status: string;
  auth_method: string;
  base_url: string | null;
  api_key: string | null;
  icon: string | null;
  models: string;
  quota: string | null;
  priority: number;
  enabled: number;
  config: string | null;
  last_checked: string | null;
  round_robin_index: number;
  created_at: string;
  updated_at: string;
}

interface AccountRow {
  id: string;
  platform: string;
  email: string | null;
  displayName: string | null;
  status: string;
  plan: string;
  quotas: string;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
  tags: string;
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LogRow {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  model: string;
  provider: string;
  status: number;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  error: string | null;
}

function rowToProviderEntry(row: ProviderRow): ProviderEntry {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    type: row.type as ProviderEntry['type'],
    status: row.status as ProviderEntry['status'],
    authMethod: row.auth_method,
    baseUrl: row.base_url ?? undefined,
    apiKey: row.api_key ?? undefined,
    icon: row.icon ?? undefined,
    models: JSON.parse(row.models),
    quota: row.quota ? JSON.parse(row.quota) : undefined,
    priority: row.priority,
    enabled: row.enabled === 1,
    config: row.config ? JSON.parse(row.config) : undefined,
    lastChecked: row.last_checked ?? undefined,
    roundRobinIndex: row.round_robin_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToLogEntry(row: LogRow): RequestLogEntry {
  return {
    id: row.id,
    timestamp: row.timestamp,
    method: row.method,
    path: row.path,
    model: row.model,
    provider: row.provider,
    status: row.status,
    latencyMs: row.latency_ms,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    error: row.error ?? undefined,
  };
}
