'use client';

import { DashboardData } from '@/types';

interface StatsTableProps {
  data: DashboardData;
}

export default function StatsTable({ data }: StatsTableProps) {
  const ру = data.ру || { людей: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего: 0, процент: 0, осталось: 0 };
  const узб = data.узб || { людей: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего: 0, процент: 0, осталось: 0 };
  const всего = data.всего || { юзеров: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего_слётов: 0, процент: 0, осталось: 0 };

  const остатокРу = ру.осталось !== undefined ? ру.осталось : (ру.взяли_тг - ру.всего);
  const остатокУзб = узб.осталось !== undefined ? узб.осталось : (узб.взяли_тг - узб.всего);
  const остатокВсего = всего.осталось !== undefined ? всего.осталось : (всего.взяли_тг - всего.всего_слётов);

  return (
    <div className="summary-table">
      <table>
        <thead>
          <tr>
            <th>ТИП</th>
            <th>ЛЮДЕЙ</th>
            <th>ВЗЯЛИ ТГ</th>
            <th className="shadow-col">ТЕНЬ</th>
            <th className="frost-col">МОРОЗ</th>
            <th className="flight-col">ВЫЛЕТ</th>
            <th>ВСЕГО</th>
            <th>%</th>
            <th>ОСТАЛОСЬ</th>
          </tr>
        </thead>
        <tbody>
          <tr className="ru-row">
            <td>РУ</td>
            <td>{ру.людей ?? 0}</td>
            <td>{ру.взяли_тг ?? 0}</td>
            <td className="shadow-col">{ру.тень ?? 0}</td>
            <td className="frost-col">{ру.мороз ?? 0}</td>
            <td className="flight-col">{ру.вылет ?? 0}</td>
            <td>{ру.всего ?? 0}</td>
            <td><span className="percent-badge">{ру.процент ?? 0}%</span></td>
            <td>{остатокРу}</td>
          </tr>
          <tr className="uzb-row">
            <td>УЗБ</td>
            <td>{узб.людей ?? 0}</td>
            <td>{узб.взяли_тг ?? 0}</td>
            <td className="shadow-col">{узб.тень ?? 0}</td>
            <td className="frost-col">{узб.мороз ?? 0}</td>
            <td className="flight-col">{узб.вылет ?? 0}</td>
            <td>{узб.всего ?? 0}</td>
            <td><span className="percent-badge">{узб.процент ?? 0}%</span></td>
            <td>{остатокУзб}</td>
          </tr>
          <tr className="total-row">
            <td>ВСЕГО</td>
            <td>{всего.юзеров ?? 0}</td>
            <td>{всего.взяли_тг ?? 0}</td>
            <td className="shadow-col">{всего.тень ?? 0}</td>
            <td className="frost-col">{всего.мороз ?? 0}</td>
            <td className="flight-col">{всего.вылет ?? 0}</td>
            <td>{всего.всего_слётов ?? 0}</td>
            <td><span className="percent-badge">{всего.процент ?? 0}%</span></td>
            <td>{остатокВсего}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
