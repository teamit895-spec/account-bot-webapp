'use client';

import { DashboardData } from '@/types';

interface StatsTableProps {
  data: DashboardData;
}

export default function StatsTable({ data }: StatsTableProps) {
  const ру = data.ру || { людей: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего: 0, процент: 0, осталось: 0 };
  const узб = data.узб || { людей: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего: 0, процент: 0, осталось: 0 };
  const всего = data.всего || { юзеров: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего_слётов: 0, процент: 0, осталось: 0 };

  return (
    <div className="summary-table">
      <table>
        <thead>
          <tr>
            <th>Тип</th>
            <th>👥 Людей</th>
            <th>📱 Взяли ТГ</th>
            <th>👤 Тень</th>
            <th>❄️ Мороз</th>
            <th>✈️ Вылет</th>
            <th>Всего</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          <tr className="ru-row">
            <td>🇷🇺 РУ</td>
            <td>{ру.людей ?? 0}</td>
            <td>{ру.взяли_тг ?? 0}</td>
            <td>{ру.тень ?? 0}</td>
            <td>{ру.мороз ?? 0}</td>
            <td>{ру.вылет ?? 0}</td>
            <td>{ру.всего ?? 0}</td>
            <td><span className="percent-cell">{ру.процент ?? 0}%</span></td>
          </tr>
          <tr className="uzb-row">
            <td>🇺🇿 УЗБ</td>
            <td>{узб.людей ?? 0}</td>
            <td>{узб.взяли_тг ?? 0}</td>
            <td>{узб.тень ?? 0}</td>
            <td>{узб.мороз ?? 0}</td>
            <td>{узб.вылет ?? 0}</td>
            <td>{узб.всего ?? 0}</td>
            <td><span className="percent-cell">{узб.процент ?? 0}%</span></td>
          </tr>
          <tr className="total-row">
            <td>📊 ВСЕГО</td>
            <td>{всего.юзеров ?? 0}</td>
            <td>{всего.взяли_тг ?? 0}</td>
            <td>{всего.тень ?? 0}</td>
            <td>{всего.мороз ?? 0}</td>
            <td>{всего.вылет ?? 0}</td>
            <td>{всего.всего_слётов ?? 0}</td>
            <td><span className="percent-cell">{всего.процент ?? 0}%</span></td>
          </tr>
          <tr className="alive-row">
            <td>💚 Осталось ТГ</td>
            <td colSpan={2} style={{ textAlign: 'center' }}>
              <span className="alive-cell">РУ: {ру.осталось ?? 0}</span>
            </td>
            <td colSpan={3} style={{ textAlign: 'center' }}>
              <span className="alive-cell">УЗБ: {узб.осталось ?? 0}</span>
            </td>
            <td colSpan={2} style={{ textAlign: 'center' }}>
              <span className="alive-cell">ВСЕГО: {всего.осталось ?? 0}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
