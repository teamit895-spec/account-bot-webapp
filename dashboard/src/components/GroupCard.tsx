'use client';

import { GroupData, cleanGroupName } from '@/types';

interface GroupCardProps {
  group: GroupData;
}

function getStatusInfo(status: string): { badge: string; text: string } {
  switch (status) {
    case 'ok':
      return { badge: 'ok', text: 'OK' };
    case 'timeout':
      return { badge: 'warning', text: 'Таймаут' };
    case 'error':
      return { badge: 'error', text: 'Ошибка' };
    case 'no_chat':
      return { badge: 'warning', text: 'Нет чата' };
    case 'cached':
      return { badge: 'cached', text: 'Кеш' };
    default:
      return { badge: 'warning', text: '—' };
  }
}

export default function GroupCard({ group }: GroupCardProps) {
  const statusInfo = getStatusInfo(group.статус);
  const ру = group.ру || { людей: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего: 0, процент: 0 };
  const узб = group.узб || { людей: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего: 0, процент: 0 };

  const закупки_день = group.закупки_тг || { ру: 0, узб: 0 };
  const закупки_неделя = group.закупки_тг_неделя || { ру: 0, узб: 0 };

  return (
    <div className="group-card-v2">
      <div className="group-card-header">
        <span className="group-card-name">{cleanGroupName(group.имя)}</span>
        <span className={`status-badge ${statusInfo.badge}`}>{statusInfo.text}</span>
      </div>

      <table className="group-stats-table">
        <thead>
          <tr>
            <th></th>
            <th>ЛЮДИ</th>
            <th className="col-shadow">ТЕНЬ</th>
            <th className="col-frost">МОРОЗ</th>
            <th className="col-flight">ВЫЛЕТ</th>
            <th>ВСЕГО</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          <tr className="row-ru">
            <td className="type-label">RU</td>
            <td>{ру.людей ?? 0}</td>
            <td className="col-shadow">{ру.тень ?? 0}</td>
            <td className="col-frost">{ру.мороз ?? 0}</td>
            <td className="col-flight">{ру.вылет ?? 0}</td>
            <td>{ру.всего ?? 0}</td>
            <td><span className="pct-badge ru">{ру.процент ?? 0}%</span></td>
          </tr>
          <tr className="row-uz">
            <td className="type-label">UZ</td>
            <td>{узб.людей ?? 0}</td>
            <td className="col-shadow">{узб.тень ?? 0}</td>
            <td className="col-frost">{узб.мороз ?? 0}</td>
            <td className="col-flight">{узб.вылет ?? 0}</td>
            <td>{узб.всего ?? 0}</td>
            <td><span className="pct-badge uz">{узб.процент ?? 0}%</span></td>
          </tr>
          <tr className="row-total">
            <td className="type-label">Σ</td>
            <td>{group.юзеров ?? 0}</td>
            <td className="col-shadow">{group.тень ?? 0}</td>
            <td className="col-frost">{group.мороз ?? 0}</td>
            <td className="col-flight">{group.вылет ?? 0}</td>
            <td>{group.всего_слётов ?? 0}</td>
            <td><span className="pct-badge total">{group.процент ?? 0}%</span></td>
          </tr>
        </tbody>
      </table>

      <div className="group-purchases">
        <div className="purchase-line">
          <span className="purchase-icon">📦</span>
          <span className="purchase-text">Закуплено сегодня</span>
          <span className="purchase-vals">
            <span className="ru">ру {закупки_день.ру ?? 0}</span>
            <span className="sep">|</span>
            <span className="uz">уз {закупки_день.узб ?? 0}</span>
          </span>
        </div>
        <div className="purchase-line">
          <span className="purchase-icon">📊</span>
          <span className="purchase-text">За неделю</span>
          <span className="purchase-vals">
            <span className="ru">ру {закупки_неделя.ру ?? 0}</span>
            <span className="sep">|</span>
            <span className="uz">уз {закупки_неделя.узб ?? 0}</span>
            {(закупки_неделя.ру || закупки_неделя.узб) ? (
              <span className="total">{(закупки_неделя.ру ?? 0) + (закупки_неделя.узб ?? 0)}</span>
            ) : null}
          </span>
        </div>
      </div>
    </div>
  );
}
