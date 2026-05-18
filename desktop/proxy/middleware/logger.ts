export interface RequestLogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  model: string;
  provider: string;
  status: number;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  error?: string;
}

export interface ProxyStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokensUsed: number;
  tokensSaved: number;
  avgLatencyMs: number;
  requestsPerMinute: number;
  uptime: number;
  activeConnections: number;
}

export class RequestLogger {
  private logs: RequestLogEntry[] = [];
  private maxLogs = 10000;
  private startTime = Date.now();
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private totalTokens = 0;
  private tokensSaved = 0;
  private totalLatency = 0;

  log(entry: Omit<RequestLogEntry, 'id' | 'timestamp'>): void {
    const logEntry: RequestLogEntry = {
      ...entry,
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    this.totalRequests++;
    if (entry.status >= 200 && entry.status < 400) {
      this.successfulRequests++;
    } else {
      this.failedRequests++;
    }
    this.totalTokens += entry.inputTokens + entry.outputTokens;
    this.totalLatency += entry.latencyMs;
  }

  addTokensSaved(tokens: number): void {
    this.tokensSaved += tokens;
  }

  getRecentLogs(limit: number = 100): RequestLogEntry[] {
    return this.logs.slice(-limit).reverse();
  }

  getStats(): ProxyStats {
    const uptimeMs = Date.now() - this.startTime;
    const uptimeMinutes = uptimeMs / 60000;

    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      totalTokensUsed: this.totalTokens,
      tokensSaved: this.tokensSaved,
      avgLatencyMs: this.totalRequests > 0 ? Math.round(this.totalLatency / this.totalRequests) : 0,
      requestsPerMinute: uptimeMinutes > 0 ? Math.round(this.totalRequests / uptimeMinutes * 100) / 100 : 0,
      uptime: Math.floor(uptimeMs / 1000),
      activeConnections: 0,
    };
  }

  clear(): void {
    this.logs = [];
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.totalTokens = 0;
    this.tokensSaved = 0;
    this.totalLatency = 0;
  }
}
