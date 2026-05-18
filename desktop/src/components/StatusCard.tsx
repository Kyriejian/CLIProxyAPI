import type { ReactNode } from 'react';

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export function StatusCard({ title, value, icon, subtitle, color = 'bg-primary-600' }: StatusCardProps) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-primary-600/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-dark-muted mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-dark-muted mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
