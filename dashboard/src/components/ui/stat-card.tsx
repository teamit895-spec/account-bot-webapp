'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'cyan' | 'yellow' | 'red' | 'pink';
}

const colorStyles = {
  blue: {
    gradient: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
  },
  green: {
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-400',
  },
  purple: {
    gradient: 'from-purple-500/20 to-purple-600/5',
    border: 'border-purple-500/30',
    icon: 'text-purple-400',
  },
  cyan: {
    gradient: 'from-cyan-500/20 to-cyan-600/5',
    border: 'border-cyan-500/30',
    icon: 'text-cyan-400',
  },
  yellow: {
    gradient: 'from-amber-500/20 to-amber-600/5',
    border: 'border-amber-500/30',
    icon: 'text-amber-400',
  },
  red: {
    gradient: 'from-red-500/20 to-red-600/5',
    border: 'border-red-500/30',
    icon: 'text-red-400',
  },
  pink: {
    gradient: 'from-pink-500/20 to-pink-600/5',
    border: 'border-pink-500/30',
    icon: 'text-pink-400',
  },
};

export function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <div
      className={cn(
        'bg-gradient-to-br border rounded-xl p-4',
        'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/10',
        styles.gradient,
        styles.border
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn('p-2 rounded-lg bg-white/5', styles.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
