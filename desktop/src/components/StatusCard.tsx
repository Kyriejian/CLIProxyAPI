import type { ReactNode } from 'react';

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export function StatusCard({ title, value, icon, subtitle }: StatusCardProps) {
  return (
    <div
      className="flex flex-col gap-4 p-6"
      style={{
        background: 'linear-gradient(145deg, color-mix(in srgb, var(--bg-primary) 86%, transparent), color-mix(in srgb, var(--bg-secondary) 72%, transparent))',
        border: '1px solid color-mix(in srgb, var(--border-color) 66%, transparent)',
        borderRadius: 'var(--radius-lg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        boxShadow: 'var(--shadow-card)',
        transition: 'border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease',
        animation: 'cardEnter 0.4s ease-out both',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--border-hover) 82%, transparent)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--border-color) 66%, transparent)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div
        className="w-11 h-11 flex items-center justify-center"
        style={{
          borderRadius: 'var(--radius-md)',
          background: 'color-mix(in srgb, var(--primary-color) 10%, var(--bg-secondary))',
          color: 'var(--primary-color)',
        }}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
          {value}
        </span>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{title}</span>
        {subtitle && (
          <span className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>{subtitle}</span>
        )}
      </div>
    </div>
  );
}
