'use client';

import { GroupData } from '@/types';
import clsx from 'clsx';

interface GroupCardProps {
  group: GroupData;
  onClick?: () => void;
}

export default function GroupCard({ group, onClick }: GroupCardProps) {
  const getStatusColor = (percent: number) => {
    if (percent >= 50) return 'border-red-500/50';
    if (percent >= 30) return 'border-amber-500/50';
    return 'border-emerald-500/50';
  };

  const getPercentColor = (percent: number) => {
    if (percent >= 50) return 'text-red-400 bg-red-500/20';
    if (percent >= 30) return 'text-amber-400 bg-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/20';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok': return { text: 'OK', color: 'bg-emerald-500/20 text-emerald-400' };
      case 'cached': return { text: 'КЭШ', color: 'bg-purple-500/20 text-purple-400' };
      case 'timeout': return { text: 'ТАЙМАУТ', color: 'bg-amber-500/20 text-amber-400' };
      default: return { text: 'ERR', color: 'bg-red-500/20 text-red-400' };
    }
  };

  const statusBadge = getStatusBadge(group.статус);

  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative overflow-hidden rounded-xl transition-all duration-300',
        'bg-dark-card border hover:border-accent-purple/50 hover:shadow-lg hover:shadow-accent-purple/10',
        'hover:translate-y-[-2px] cursor-pointer',
        getStatusColor(group.процент)
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="font-bold text-white">{group.имя}</h3>
        <span className={clsx('px-2 py-0.5 rounded text-xs font-bold', statusBadge.color)}>
          {statusBadge.text}
        </span>
      </div>

      {/* Stats Table Header */}
      <div className="px-4 py-1">
        <div className="grid grid-cols-7 gap-1 text-[10px] text-gray-500 uppercase">
          <span>Люди</span>
          <span>ТГ</span>
          <span className="text-purple-400">Тень</span>
          <span className="text-cyan-400">Мороз</span>
          <span className="text-amber-400">Вылет</span>
          <span>Всего</span>
          <span>%</span>
        </div>
      </div>

      {/* RU Row */}
      <div className="px-4 py-1">
        <div className="grid grid-cols-7 gap-1 items-center">
          <span className="text-emerald-400 font-bold text-xs">RU</span>
          <span className="text-white text-sm">{group.ру?.людей || 0}</span>
          <span className="text-white text-sm">{group.ру?.взяли_тг || 0}</span>
          <span className="text-purple-300 text-sm">{group.ру?.тень || 0}</span>
          <span className="text-cyan-300 text-sm">{group.ру?.мороз || 0}</span>
          <span className="text-amber-300 text-sm">{group.ру?.вылет || 0}</span>
          <span className={clsx('text-sm font-bold', getPercentColor(group.ру?.процент || 0).split(' ')[0])}>
            {group.ру?.процент || 0}%
          </span>
        </div>
      </div>

      {/* UZB Row */}
      <div className="px-4 py-1">
        <div className="grid grid-cols-7 gap-1 items-center">
          <span className="text-pink-400 font-bold text-xs">UZ</span>
          <span className="text-white text-sm">{group.узб?.людей || 0}</span>
          <span className="text-white text-sm">{group.узб?.взяли_тг || 0}</span>
          <span className="text-purple-300 text-sm">{group.узб?.тень || 0}</span>
          <span className="text-cyan-300 text-sm">{group.узб?.мороз || 0}</span>
          <span className="text-amber-300 text-sm">{group.узб?.вылет || 0}</span>
          <span className={clsx('text-sm font-bold', getPercentColor(group.узб?.процент || 0).split(' ')[0])}>
            {group.узб?.процент || 0}%
          </span>
        </div>
      </div>

      {/* Total Row */}
      <div className="px-4 py-1 mb-2">
        <div className="grid grid-cols-7 gap-1 items-center bg-dark-bg/50 rounded py-1 px-1">
          <span className="text-blue-400 font-bold text-xs">Σ</span>
          <span className="text-white text-sm font-medium">{group.юзеров}</span>
          <span className="text-white text-sm font-medium">{group.взяли_тг}</span>
          <span className="text-purple-300 text-sm font-medium">{group.тень}</span>
          <span className="text-cyan-300 text-sm font-medium">{group.мороз}</span>
          <span className="text-amber-300 text-sm font-medium">{group.вылет}</span>
          <span className={clsx('text-sm font-bold px-1 rounded', getPercentColor(group.процент))}>
            {group.процент}%
          </span>
        </div>
      </div>

      {/* Purchases - Today */}
      <div className="px-4 py-2 border-t border-dark-border bg-dark-bg/30">
        <div className="flex items-center justify-between text-xs">
          <span className="text-emerald-400 flex items-center gap-1">
            📦 Закуплено сегодня
          </span>
          <div className="flex gap-3">
            <span className="text-emerald-300">
              <span className="text-gray-500">ру</span> {group.закупки_тг?.ру || 0}
            </span>
            <span className="text-pink-300">
              <span className="text-gray-500">уз</span> {group.закупки_тг?.узб || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Purchases - Week */}
      <div className="px-4 py-2 border-t border-dark-border/50 bg-dark-bg/20">
        <div className="flex items-center justify-between text-xs">
          <span className="text-blue-400 flex items-center gap-1">
            📊 За неделю
          </span>
          <div className="flex gap-3">
            <span className="text-emerald-300">
              <span className="text-gray-500">ру</span> {group.закупки_тг_неделя?.ру || 0}
            </span>
            <span className="text-pink-300">
              <span className="text-gray-500">уз</span> {group.закупки_тг_неделя?.узб || 0}
            </span>
            <span className="text-white font-medium">
              {(group.закупки_тг_неделя?.ру || 0) + (group.закупки_тг_неделя?.узб || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
