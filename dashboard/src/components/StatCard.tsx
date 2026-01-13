'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'purple' | 'blue' | 'green' | 'yellow' | 'red' | 'pink' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses = {
  purple: {
    bg: 'from-purple-500/20 to-purple-600/5',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/20',
  },
  blue: {
    bg: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  green: {
    bg: 'from-emerald-500/20 to-emerald-600/5',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  yellow: {
    bg: 'from-amber-500/20 to-amber-600/5',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
  red: {
    bg: 'from-red-500/20 to-red-600/5',
    border: 'border-red-500/30',
    text: 'text-red-400',
    glow: 'shadow-red-500/20',
  },
  pink: {
    bg: 'from-pink-500/20 to-pink-600/5',
    border: 'border-pink-500/30',
    text: 'text-pink-400',
    glow: 'shadow-pink-500/20',
  },
  cyan: {
    bg: 'from-cyan-500/20 to-cyan-600/5',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
  },
};

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  color = 'purple',
  size = 'md' 
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div 
      className={clsx(
        'relative overflow-hidden rounded-xl transition-all duration-300',
        'bg-gradient-to-br border backdrop-blur-sm',
        'hover:scale-[1.02] hover:shadow-lg',
        colors.bg,
        colors.border,
        colors.glow,
        size === 'sm' && 'p-3',
        size === 'md' && 'p-4',
        size === 'lg' && 'p-6',
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl" />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className={clsx(
            'font-bold text-white',
            size === 'sm' && 'text-xl',
            size === 'md' && 'text-2xl',
            size === 'lg' && 'text-4xl',
          )}>
            {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
          </p>
          {subtitle && (
            <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={clsx(
              'flex items-center gap-1 mt-2 text-xs font-medium',
              trend.isPositive ? 'text-emerald-400' : 'text-red-400'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={clsx(
            'p-2 rounded-lg bg-white/5',
            colors.text
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
