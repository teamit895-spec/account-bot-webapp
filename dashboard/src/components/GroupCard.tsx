'use client';

import { GroupData } from '@/types';
import clsx from 'clsx';

interface GroupCardProps {
  group: GroupData;
  compact?: boolean;
}

function getPercentClass(percent: number) {
  if (percent >= 50) return { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50' };
  if (percent >= 30) return { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/50' };
  return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50' };
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'ok': return { text: 'OK', color: 'bg-emerald-500/20 text-emerald-400' };
    case 'cached': return { text: 'КЭШ', color: 'bg-purple-500/20 text-purple-400' };
    case 'timeout': return { text: 'TIMEOUT', color: 'bg-amber-500/20 text-amber-400' };
    default: return { text: 'ERR', color: 'bg-red-500/20 text-red-400' };
  }
}

export default function GroupCard({ group, compact }: GroupCardProps) {
  const pc = getPercentClass(group.процент);
  const status = getStatusBadge(group.статус);
  
  const dayPurchases = (group.закупки_тг?.ру || 0) + (group.закупки_тг?.узб || 0);
  const weekPurchases = (group.закупки_тг_неделя?.ру || 0) + (group.закупки_тг_неделя?.узб || 0);

  return (
    <div className={clsx('bg-dark-card border rounded-xl overflow-hidden stat-card', pc.border)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-dark-border">
        <h3 className="font-bold text-white truncate">{group.имя}</h3>
        <span className={clsx('px-2 py-0.5 rounded text-xs font-bold', status.color)}>{status.text}</span>
      </div>

      {/* Stats Table */}
      <div className="p-2">
        {/* Header */}
        <div className="grid grid-cols-7 gap-1 text-[10px] text-gray-500 uppercase px-1 mb-1">
          <span></span>
          <span className="text-center">Люди</span>
          <span className="text-center text-purple-400">Тень</span>
          <span className="text-center text-cyan-400">Мороз</span>
          <span className="text-center text-amber-400">Вылет</span>
          <span className="text-center">Всего</span>
          <span className="text-center">%</span>
        </div>

        {/* RU */}
        <div className="grid grid-cols-7 gap-1 items-center px-1 py-1">
          <span className="text-emerald-400 font-bold text-xs">RU</span>
          <span className="text-center text-white text-sm">{group.ру?.людей || 0}</span>
          <span className="text-center text-purple-300 text-sm">{group.ру?.тень || 0}</span>
          <span className="text-center text-cyan-300 text-sm">{group.ру?.мороз || 0}</span>
          <span className="text-center text-amber-300 text-sm">{group.ру?.вылет || 0}</span>
          <span className="text-center text-white text-sm">{group.ру?.всего || 0}</span>
          <span className={clsx('text-center text-xs font-bold', getPercentClass(group.ру?.процент || 0).text)}>
            {group.ру?.процент || 0}%
          </span>
        </div>

        {/* UZB */}
        <div className="grid grid-cols-7 gap-1 items-center px-1 py-1">
          <span className="text-pink-400 font-bold text-xs">UZ</span>
          <span className="text-center text-white text-sm">{group.узб?.людей || 0}</span>
          <span className="text-center text-purple-300 text-sm">{group.узб?.тень || 0}</span>
          <span className="text-center text-cyan-300 text-sm">{group.узб?.мороз || 0}</span>
          <span className="text-center text-amber-300 text-sm">{group.узб?.вылет || 0}</span>
          <span className="text-center text-white text-sm">{group.узб?.всего || 0}</span>
          <span className={clsx('text-center text-xs font-bold', getPercentClass(group.узб?.процент || 0).text)}>
            {group.узб?.процент || 0}%
          </span>
        </div>

        {/* Total */}
        <div className="grid grid-cols-7 gap-1 items-center px-1 py-1 bg-dark-bg/50 rounded mt-1">
          <span className="text-blue-400 font-bold text-xs">Σ</span>
          <span className="text-center text-white text-sm font-medium">{group.юзеров}</span>
          <span className="text-center text-purple-300 text-sm font-medium">{group.тень}</span>
          <span className="text-center text-cyan-300 text-sm font-medium">{group.мороз}</span>
          <span className="text-center text-amber-300 text-sm font-medium">{group.вылет}</span>
          <span className="text-center text-white text-sm font-bold">{group.всего_слётов}</span>
          <span className={clsx('text-center text-xs font-bold px-1 rounded', pc.bg, pc.text)}>
            {group.процент}%
          </span>
        </div>
      </div>

      {/* Purchases */}
      <div className="border-t border-dark-border bg-dark-bg/20">
        <div className="flex items-center justify-between px-3 py-2 text-xs">
          <span className="text-emerald-400">📦 Сегодня</span>
          <div className="flex gap-2">
            <span className="text-emerald-300">ру {group.закупки_тг?.ру || 0}</span>
            <span className="text-pink-300">уз {group.закупки_тг?.узб || 0}</span>
          </div>
        </div>
        <div className="flex items-center justify-between px-3 py-2 text-xs border-t border-dark-border/50">
          <span className="text-blue-400">📊 Неделя</span>
          <div className="flex gap-2">
            <span className="text-emerald-300">ру {group.закупки_тг_неделя?.ру || 0}</span>
            <span className="text-pink-300">уз {group.закупки_тг_неделя?.узб || 0}</span>
            <span className="text-white font-medium">{weekPurchases}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
