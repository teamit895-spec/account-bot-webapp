'use client';

import { GroupData } from '@/types';
import clsx from 'clsx';

interface GroupCardProps {
  group: GroupData;
  onClick?: () => void;
}

export default function GroupCard({ group, onClick }: GroupCardProps) {
  const getStatusColor = (percent: number) => {
    if (percent >= 50) return 'border-red-500/50 bg-red-500/10';
    if (percent >= 30) return 'border-amber-500/50 bg-amber-500/10';
    return 'border-emerald-500/50 bg-emerald-500/10';
  };

  const getPercentColor = (percent: number) => {
    if (percent >= 50) return 'text-red-400 bg-red-500/20';
    if (percent >= 30) return 'text-amber-400 bg-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/20';
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative overflow-hidden rounded-xl p-4 transition-all duration-300 cursor-pointer',
        'bg-dark-card border hover:border-accent-purple/50 hover:shadow-lg hover:shadow-accent-purple/10',
        'hover:translate-y-[-2px]',
        getStatusColor(group.процент)
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white truncate">{group.имя}</h3>
        <span className={clsx(
          'px-2 py-0.5 rounded text-xs font-bold',
          getPercentColor(group.процент)
        )}>
          {group.процент}%
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-dark-bg/50 rounded-lg p-2">
          <p className="text-xs text-gray-500">Взяли ТГ</p>
          <p className="text-lg font-bold text-white">{group.взяли_тг}</p>
        </div>
        <div className="bg-dark-bg/50 rounded-lg p-2">
          <p className="text-xs text-gray-500">Слётов</p>
          <p className="text-lg font-bold text-white">{group.всего_слётов}</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-gray-400">Тень:</span>
          <span className="text-white font-medium">{group.тень}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-cyan-500" />
          <span className="text-gray-400">Мороз:</span>
          <span className="text-white font-medium">{group.мороз}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-gray-400">Вылет:</span>
          <span className="text-white font-medium">{group.вылет}</span>
        </div>
      </div>

      {/* Purchases */}
      {group.закупки_тг && (group.закупки_тг.ру > 0 || group.закупки_тг.узб > 0) && (
        <div className="mt-3 pt-3 border-t border-dark-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-medium">📦 Закуплено сегодня</span>
            <div className="flex gap-2">
              <span className="text-emerald-300">РУ: {group.закупки_тг.ру}</span>
              <span className="text-pink-300">УЗБ: {group.закупки_тг.узб}</span>
            </div>
          </div>
        </div>
      )}

      {/* Status indicator */}
      {group.статус !== 'ok' && (
        <div className="absolute top-2 right-2">
          <div className={clsx(
            'w-2 h-2 rounded-full',
            group.статус === 'cached' ? 'bg-purple-500' : 
            group.статус === 'timeout' ? 'bg-amber-500' : 'bg-red-500'
          )} />
        </div>
      )}
    </div>
  );
}
