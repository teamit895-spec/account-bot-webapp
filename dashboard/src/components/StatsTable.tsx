'use client';

import { StatsBlock, TotalStats } from '@/types';
import clsx from 'clsx';

interface StatsTableProps {
  ру: StatsBlock;
  узб: StatsBlock;
  всего: TotalStats;
}

function getPercentClass(percent: number) {
  if (percent >= 50) return { text: 'text-red-400', bg: 'bg-red-500/20' };
  if (percent >= 30) return { text: 'text-amber-400', bg: 'bg-amber-500/20' };
  return { text: 'text-emerald-400', bg: 'bg-emerald-500/20' };
}

export default function StatsTable({ ру, узб, всего }: StatsTableProps) {
  const rows = [
    { label: 'РУ', data: ру, color: 'emerald', border: 'border-l-emerald-500' },
    { label: 'УЗБ', data: узб, color: 'pink', border: 'border-l-pink-500' },
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
        осталось: всего.осталось
      }, 
      color: 'blue', 
      border: 'border-l-blue-500',
      isBold: true 
    },
  ];

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
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
        <tbody className="divide-y divide-dark-border">
          {rows.map((row, idx) => {
            const pc = getPercentClass(row.data.процент);
            return (
              <tr key={idx} className={clsx('border-l-2', row.border, row.isBold && 'bg-dark-bg/30')}>
                <td className={clsx('px-4 py-3 font-bold', `text-${row.color}-400`)}>{row.label}</td>
                <td className={clsx('px-4 py-3 text-center text-white', row.isBold && 'font-bold')}>{row.data.людей}</td>
                <td className={clsx('px-4 py-3 text-center text-white', row.isBold && 'font-bold')}>{row.data.взяли_тг}</td>
                <td className="px-4 py-3 text-center text-purple-300">{row.data.тень}</td>
                <td className="px-4 py-3 text-center text-cyan-300">{row.data.мороз}</td>
                <td className="px-4 py-3 text-center text-amber-300">{row.data.вылет}</td>
                <td className={clsx('px-4 py-3 text-center text-white', row.isBold && 'font-bold')}>{row.data.всего}</td>
                <td className="px-4 py-3 text-center">
                  <span className={clsx('px-2 py-1 rounded text-sm font-bold', pc.bg, pc.text)}>
                    {row.data.процент}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-emerald-400 font-bold">{row.data.осталось || 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
