'use client';

import { GroupData } from '@/types';
import clsx from 'clsx';

interface GroupCardProps {
  group: GroupData;
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

export default function GroupCard({ group }: GroupCardProps) {
  const pc = getPercentClass(group.процент ?? 0);
  const status = getStatusBadge(group.статус || 'ok');
  
  // Безопасное получение данных
  const ruData = group.ру || { людей: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего: 0, процент: 0 };
  const uzData = group.узб || { людей: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего: 0, процент: 0 };
  
  // Закупки
  const purchaseTodayRu = group.закупки_тг?.ру ?? 0;
  const purchaseTodayUzb = group.закупки_тг?.узб ?? 0;
  const purchaseWeekRu = group.закупки_тг_неделя?.ру ?? 0;
  const purchaseWeekUzb = group.закупки_тг_неделя?.узб ?? 0;
  const purchaseWeekTotal = purchaseWeekRu + purchaseWeekUzb;

  return (
    <div className={clsx('bg-dark-card border rounded-xl overflow-hidden stat-card', pc.border)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-dark-border">
        <h3 className="font-bold text-white truncate">{group.имя}</h3>
        <span className={clsx('px-2 py-0.5 rounded text-xs font-bold', status.color)}>{status.text}</span>
      </div>

      {/* Stats Table */}
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
          <span className={clsx('text-center text-xs font-bold', getPercentClass(ruData.процент).text)}>
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
          <span className={clsx('text-center text-xs font-bold', getPercentClass(uzData.процент).text)}>
            {uzData.процент}%
          </span>
        </div>

        {/* Total Row */}
        <div className="grid grid-cols-7 gap-1 items-center px-1 py-1 bg-dark-bg/50 rounded mt-1">
          <span className="text-blue-400 font-bold text-xs">Σ</span>
          <span className="text-center text-white text-sm font-medium">{group.юзеров ?? 0}</span>
          <span className="text-center text-purple-300 text-sm font-medium">{group.тень ?? 0}</span>
          <span className="text-center text-cyan-300 text-sm font-medium">{group.мороз ?? 0}</span>
          <span className="text-center text-amber-300 text-sm font-medium">{group.вылет ?? 0}</span>
          <span className="text-center text-white text-sm font-bold">{group.всего_слётов ?? 0}</span>
          <span className={clsx('text-center text-xs font-bold px-1 rounded', pc.bg, pc.text)}>
            {group.процент ?? 0}%
          </span>
        </div>
      </div>

      {/* Purchases - Today */}
      <div className="border-t border-dark-border bg-dark-bg/20 px-3 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-emerald-400">📦 Закуплено сегодня</span>
          <span className="text-white">
            <span className="text-emerald-300">ру</span> {purchaseTodayRu}
            <span className="text-gray-500 mx-1">|</span>
            <span className="text-pink-300">уз</span> {purchaseTodayUzb}
          </span>
        </div>
      </div>

      {/* Purchases - Week */}
      <div className="border-t border-dark-border/50 bg-dark-bg/10 px-3 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-blue-400">📊 За неделю</span>
          <span className="text-white">
            <span className="text-emerald-300">ру</span> {purchaseWeekRu}
            <span className="text-gray-500 mx-1">|</span>
            <span className="text-pink-300">уз</span> {purchaseWeekUzb}
            <span className="text-gray-500 mx-1">|</span>
            <span className="font-medium">{purchaseWeekTotal}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
