'use client';

import { cn, getPercentLevel, percentColors } from '@/lib/utils';
import type { StatsBlock, TotalStats } from '@/types';

interface StatsTableProps {
  ру: StatsBlock;
  узб: StatsBlock;
  всего: TotalStats;
}

export function StatsTable({ ру, узб, всего }: StatsTableProps) {
  const rows = [
    { 
      label: 'РУ', 
      data: ру, 
      labelColor: 'text-emerald-400',
      borderColor: 'border-l-emerald-500',
    },
    { 
      label: 'УЗБ', 
      data: узб, 
      labelColor: 'text-pink-400',
      borderColor: 'border-l-pink-500',
    },
    { 
      label: 'Σ', 
      data: {
        людей: всего.юзеров,
        взяли_тг: всего.взяли_тг,
        тень: всего.тень,
        мороз: всего.мороз,
        вылет: всего.вылет,
        всего: всего.всего_слётов,
        процент: всего.процент,
        осталось: всего.осталось,
      }, 
      labelColor: 'text-blue-400',
      borderColor: 'border-l-blue-500',
      isBold: true,
    },
  ];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full stats-table">
        <thead>
          <tr className="text-xs text-gray-400 uppercase">
            <th className="px-4 py-3 text-left font-semibold">Тип</th>
            <th className="px-4 py-3 text-center font-semibold">Людей</th>
            <th className="px-4 py-3 text-center font-semibold">ТГ</th>
            <th className="px-4 py-3 text-center font-semibold text-purple-400">Тень</th>
            <th className="px-4 py-3 text-center font-semibold text-cyan-400">Мороз</th>
            <th className="px-4 py-3 text-center font-semibold text-amber-400">Вылет</th>
            <th className="px-4 py-3 text-center font-semibold">Всего</th>
            <th className="px-4 py-3 text-center font-semibold text-pink-400">%</th>
            <th className="px-4 py-3 text-center font-semibold text-emerald-400">Осталось</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, idx) => {
            const level = getPercentLevel(row.data.процент);
            const colors = percentColors[level];
            
            return (
              <tr 
                key={idx} 
                className={cn(
                  'border-l-2',
                  row.borderColor,
                  row.isBold && 'bg-background/30'
                )}
              >
                <td className={cn('px-4 py-3 font-bold', row.labelColor)}>
                  {row.label}
                </td>
                <td className={cn('px-4 py-3 text-center text-white', row.isBold && 'font-bold')}>
                  {row.data.людей}
                </td>
                <td className={cn('px-4 py-3 text-center text-white', row.isBold && 'font-bold')}>
                  {row.data.взяли_тг}
                </td>
                <td className="px-4 py-3 text-center text-purple-300">
                  {row.data.тень}
                </td>
                <td className="px-4 py-3 text-center text-cyan-300">
                  {row.data.мороз}
                </td>
                <td className="px-4 py-3 text-center text-amber-300">
                  {row.data.вылет}
                </td>
                <td className={cn('px-4 py-3 text-center text-white', row.isBold && 'font-bold')}>
                  {row.data.всего}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn('px-2 py-1 rounded text-sm font-bold', colors.bg, colors.text)}>
                    {row.data.процент}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-emerald-400 font-bold">
                  {row.data.осталось || 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
