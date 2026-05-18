export type IDEPlatform =
  | 'windsurf'
  | 'kiro'
  | 'cursor'
  | 'copilot'
  | 'codex'
  | 'antigravity'
  | 'gemini-cli'
  | 'codebuddy'
  | 'codebuddy-cn'
  | 'trae'
  | 'zed'
  | 'qoder';

export type AccountStatus = 'active' | 'inactive' | 'expired' | 'error' | 'suspended';

export type PlanType = 'free' | 'basic' | 'plus' | 'pro' | 'team' | 'enterprise' | 'unknown';

export interface AccountQuota {
  label: string;
  used: number;
  total: number;
  resetAt?: string;
  unit: string;
}

export interface IDEAccount {
  id: string;
  platform: IDEPlatform;
  email?: string;
  displayName?: string;
  status: AccountStatus;
  plan: PlanType;
  quotas: AccountQuota[];
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  tags: string[];
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDEInstance {
  id: string;
  platform: IDEPlatform;
  accountId: string;
  name: string;
  directory?: string;
  pid?: number;
  running: boolean;
  createdAt: string;
}

export const IDE_PLATFORM_INFO: Record<IDEPlatform, { name: string; icon: string; color: string }> = {
  windsurf: { name: 'Windsurf', icon: '🏄', color: '#00D4AA' },
  kiro: { name: 'Kiro', icon: '🤖', color: '#FF6B35' },
  cursor: { name: 'Cursor', icon: '📝', color: '#7C3AED' },
  copilot: { name: 'GitHub Copilot', icon: '🐙', color: '#238636' },
  codex: { name: 'Codex', icon: '⚡', color: '#10A37F' },
  antigravity: { name: 'Antigravity', icon: '🚀', color: '#E11D48' },
  'gemini-cli': { name: 'Gemini CLI', icon: '💎', color: '#4285F4' },
  codebuddy: { name: 'CodeBuddy', icon: '👨‍💻', color: '#F59E0B' },
  'codebuddy-cn': { name: 'CodeBuddy CN', icon: '🇨🇳', color: '#EF4444' },
  trae: { name: 'Trae', icon: '🔧', color: '#6366F1' },
  zed: { name: 'Zed', icon: '⚡', color: '#F97316' },
  qoder: { name: 'Qoder', icon: '🔮', color: '#8B5CF6' },
};
