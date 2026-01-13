'use client';

import { StatsBlock } from '@/types';
import clsx from 'clsx';

interface SummaryTableProps {
  ру: StatsBlock;
  узб: StatsBlock;
  всего: {
    юзеров: number;
    взяли_тг: number;
    тень: number;
    мороз: number;
    вылет: number;
    всего_слётов: number;
    процент: number;
    осталось: number;
  };
}

export default function SummaryTable({ ру, узб, всего }: SummaryTableProps) {
  const rows = [
    { 
      label: 'РУ', 
      data: ру, 
      className: 'bg-emerald-500/10 border-l-2 border-emerald-500',
      labelColor: 'text-emerald-400'
    },
    { 
      label: 'УЗБ', 
      data: узб, 
      className: 'bg-pink-500/10 border-l-2 border-pink-500',
      labelColor: 'text-pink-400'
    },
    { 
      label: 'ВСЕГО', 
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
      className: 'bg-blue-500/10 border-l-2 border-blue-500',
      labelColor: 'text-blue-400'
    },
  ];

  const getPercentColor = (percent: number) => {
    if (percent >= 50) return 'bg-red-500/30 text-red-400';
    if (percent >= 30) return 'bg-amber-500/30 text-amber-400';
    return 'bg-emerald-500/30 text-emerald-400';
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-bg/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Тип</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Людей</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Взяли ТГ</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-purple-400 uppercase tracking-wider">Тень</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-cyan-400 uppercase tracking-wider">Мороз</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-amber-400 uppercase tracking-wider">Вылет</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Всего</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-pink-400 uppercase tracking-wider">%</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-400 uppercase tracking-wider">Осталось</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {rows.map((row, index) => (
              <tr key={index} className={clsx('transition-colors hover:bg-white/5', row.className)}>
                <td className={clsx('px-4 py-3 font-bold', row.labelColor)}>{row.label}</td>
                <td className="px-4 py-3 text-center text-white font-medium">{row.data.людей}</td>
                <td className="px-4 py-3 text-center text-white font-medium">{row.data.взяли_тг}</td>
                <td className="px-4 py-3 text-center text-purple-300 font-medium">{row.data.тень}</td>
                <td className="px-4 py-3 text-center text-cyan-300 font-medium">{row.data.мороз}</td>
                <td className="px-4 py-3 text-center text-amber-300 font-medium">{row.data.вылет}</td>
                <td className="px-4 py-3 text-center text-white font-bold">{row.data.всего}</td>
                <td className="px-4 py-3 text-center">
                  <span className={clsx(
                    'px-2 py-1 rounded text-sm font-bold',
                    getPercentColor(row.data.процент)
                  )}>
                    {row.data.процент}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-emerald-400 font-bold">{row.data.осталось || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
