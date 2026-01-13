'use client';

import { cn, getPercentLevel, percentColors, getStatusBadge } from '@/lib/utils';
import type { GroupData } from '@/types';

interface GroupCardProps {
  group: GroupData;
}

export function GroupCard({ group }: GroupCardProps) {
  const level = getPercentLevel(group.процент ?? 0);
  const colors = percentColors[level];
  const status = getStatusBadge(group.статус || 'ok');

  const ruData = group.ру || { людей: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего: 0, процент: 0 };
  const uzData = group.узб || { людей: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего: 0, процент: 0 };

  const purchaseTodayRu = group.закупки_тг?.ру ?? 0;
  const purchaseTodayUzb = group.закупки_тг?.узб ?? 0;
  const purchaseWeekRu = group.закупки_тг_неделя?.ру ?? 0;
  const purchaseWeekUzb = group.закупки_тг_неделя?.узб ?? 0;

  return (
    <div 
      className={cn(
        'bg-card border rounded-xl overflow-hidden',
        'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/10',
        colors.border
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-bold text-white truncate">{group.имя}</h3>
        <span className={cn('px-2 py-0.5 rounded text-xs font-bold', status.className)}>
          {status.text}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="p-2">
        {/* Header Row */}
        <div className="grid grid-cols-7 gap-1 text-[10px] text-gray-500 uppercase px-1 mb-1">
          <span></span>
          <span className="text-center">Люди</span>
          <span className="text-center text-purple-400">Тень</span>
          <span className="text-center text-cyan-400">Мороз</span>
          <span className="text-center text-amber-400">Вылет</span>
          <span className="text-center">Всего</span>
          <span className="text-center">%</span>
        </div>

        {/* RU Row */}
        <div className="grid grid-cols-7 gap-1 items-center px-1 py-1">
          <span className="text-emerald-400 font-bold text-xs">RU</span>
          <span className="text-center text-white text-sm">{ruData.людей}</span>
          <span className="text-center text-purple-300 text-sm">{ruData.тень}</span>
          <span className="text-center text-cyan-300 text-sm">{ruData.мороз}</span>
          <span className="text-center text-amber-300 text-sm">{ruData.вылет}</span>
          <span className="text-center text-white text-sm">{ruData.всего}</span>
          <span className={cn('text-center text-xs font-bold', percentColors[getPercentLevel(ruData.процент)].text)}>
            {ruData.процент}%
          </span>
        </div>

        {/* UZB Row */}
        <div className="grid grid-cols-7 gap-1 items-center px-1 py-1">
          <span className="text-pink-400 font-bold text-xs">UZ</span>
          <span className="text-center text-white text-sm">{uzData.людей}</span>
          <span className="text-center text-purple-300 text-sm">{uzData.тень}</span>
          <span className="text-center text-cyan-300 text-sm">{uzData.мороз}</span>
          <span className="text-center text-amber-300 text-sm">{uzData.вылет}</span>
          <span className="text-center text-white text-sm">{uzData.всего}</span>
          <span className={cn('text-center text-xs font-bold', percentColors[getPercentLevel(uzData.процент)].text)}>
            {uzData.процент}%
          </span>
        </div>

        {/* Total Row */}
        <div className="grid grid-cols-7 gap-1 items-center px-1 py-1 bg-background/50 rounded mt-1">
          <span className="text-blue-400 font-bold text-xs">Σ</span>
          <span className="text-center text-white text-sm font-medium">{group.юзеров ?? 0}</span>
          <span className="text-center text-purple-300 text-sm font-medium">{group.тень ?? 0}</span>
          <span className="text-center text-cyan-300 text-sm font-medium">{group.мороз ?? 0}</span>
          <span className="text-center text-amber-300 text-sm font-medium">{group.вылет ?? 0}</span>
          <span className="text-center text-white text-sm font-bold">{group.всего_слётов ?? 0}</span>
          <span className={cn('text-center text-xs font-bold px-1 rounded', colors.bg, colors.text)}>
            {group.процент ?? 0}%
          </span>
        </div>
      </div>

      {/* Purchases Today */}
      <div className="border-t border-border bg-background/20 px-3 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-emerald-400">📦 Сегодня</span>
          <span className="text-white">
            <span className="text-emerald-300">ру</span> {purchaseTodayRu}
            <span className="text-gray-500 mx-1">|</span>
            <span className="text-pink-300">уз</span> {purchaseTodayUzb}
          </span>
        </div>
      </div>

      {/* Purchases Week */}
      <div className="border-t border-border/50 bg-background/10 px-3 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-blue-400">📊 Неделя</span>
          <span className="text-white">
            <span className="text-emerald-300">ру</span> {purchaseWeekRu}
            <span className="text-gray-500 mx-1">|</span>
            <span className="text-pink-300">уз</span> {purchaseWeekUzb}
          </span>
        </div>
      </div>
    </div>
  );
}
