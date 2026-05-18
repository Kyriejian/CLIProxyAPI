import type { Request, Response, NextFunction } from 'express';

export class AuthMiddleware {
  private validKeys: Set<string>;

  constructor(apiKeys: string[]) {
    this.validKeys = new Set(apiKeys);
  }

  handle(req: Request, res: Response, next: NextFunction): void {
    if (req.path === '/health' || req.path.startsWith('/api/')) {
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: { message: 'Missing Authorization header', type: 'auth_error', code: 'missing_api_key' } });
      return;
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!this.validKeys.has(token)) {
      res.status(401).json({ error: { message: 'Invalid API key', type: 'auth_error', code: 'invalid_api_key' } });
      return;
    }

    next();
  }

  addKey(key: string): void {
    this.validKeys.add(key);
  }

  removeKey(key: string): void {
    this.validKeys.delete(key);
  }
}
