// ============================================================================
// УТИЛИТЫ
// ============================================================================

import { type ClassValue, clsx } from 'clsx';

// --- Классы ---

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// --- Форматирование ---

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// --- Цвета по проценту ---

export type PercentLevel = 'good' | 'warning' | 'danger';

export function getPercentLevel(percent: number): PercentLevel {
  if (percent >= 50) return 'danger';
  if (percent >= 30) return 'warning';
  return 'good';
}

export const percentColors: Record<PercentLevel, { text: string; bg: string; border: string }> = {
  good: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/50',
  },
  warning: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/50',
  },
  danger: {
    text: 'text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
  },
};

// --- Статусы ---

export function getStatusBadge(status: string): { text: string; className: string } {
  switch (status) {
    case 'ok':
      return { text: 'OK', className: 'bg-emerald-500/20 text-emerald-400' };
    case 'cached':
      return { text: 'КЭШ', className: 'bg-purple-500/20 text-purple-400' };
    case 'timeout':
      return { text: 'TIMEOUT', className: 'bg-amber-500/20 text-amber-400' };
    case 'no_chat':
      return { text: 'NO CHAT', className: 'bg-gray-500/20 text-gray-400' };
    default:
      return { text: 'ERR', className: 'bg-red-500/20 text-red-400' };
  }
}
