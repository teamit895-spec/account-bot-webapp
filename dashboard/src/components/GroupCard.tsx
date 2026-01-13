'use client';

import { GroupData, cleanGroupName } from '@/types';

interface GroupCardProps {
  group: GroupData;
}

function getStatusInfo(status: string): { className: string; badge: string; text: string } {
  switch (status) {
    case 'ok':
      return { className: '', badge: 'badge-success', text: 'OK' };
    case 'timeout':
      return { className: 'status-warning', badge: 'badge-warning', text: 'Таймаут' };
    case 'error':
      return { className: 'status-error', badge: 'badge-error', text: 'Ошибка' };
    case 'no_chat':
      return { className: 'status-warning', badge: 'badge-warning', text: 'Нет чата' };
    case 'cached':
      return { className: 'status-cached', badge: 'badge-cached', text: 'Из кеша' };
    default:
      return { className: 'status-warning', badge: 'badge-warning', text: '—' };
  }
}

export default function GroupCard({ group }: GroupCardProps) {
  const statusInfo = getStatusInfo(group.статус);
  const ру = group.ру || { людей: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего: 0, процент: 0 };
  const узб = group.узб || { людей: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего: 0, процент: 0 };

  const закупки_день = group.закупки_тг || { ру: 0, узб: 0 };
  const закупки_неделя = group.закупки_тг_неделя || { ру: 0, узб: 0 };
  const всего_день = (закупки_день.ру ?? 0) + (закупки_день.узб ?? 0);
  const всего_неделя = (закупки_неделя.ру ?? 0) + (закупки_неделя.узб ?? 0);

  return (
    <div className={`group-card ${statusInfo.className}`}>
      <div className="group-header">
        <span className="group-name">{cleanGroupName(group.имя)}</span>
        <span className={`badge ${statusInfo.badge}`}>{statusInfo.text}</span>
      </div>

      <table className="group-summary">
        <thead>
          <tr>
            <th></th>
            <th title="Людей в команде">Люди</th>
            <th title="Взяли Telegram в работу">ТГ</th>
            <th title="Тень - исчез">Тень</th>
            <th title="Мороз - заморозили">Мороз</th>
            <th title="Вылет - забанили">Вылет</th>
            <th title="Всего слётов">Всего</th>
            <th title="Процент слётов">%</th>
          </tr>
        </thead>
        <tbody>
          <tr className="ru">
            <td>🇷🇺</td>
            <td>{ру.людей ?? 0}</td>
            <td>{ру.взяли_тг ?? 0}</td>
            <td>{ру.тень ?? 0}</td>
            <td>{ру.мороз ?? 0}</td>
            <td>{ру.вылет ?? 0}</td>
            <td>{ру.всего ?? 0}</td>
            <td className="pct">{ру.процент ?? 0}%</td>
          </tr>
          <tr className="uzb">
            <td>🇺🇿</td>
            <td>{узб.людей ?? 0}</td>
            <td>{узб.взяли_тг ?? 0}</td>
            <td>{узб.тень ?? 0}</td>
            <td>{узб.мороз ?? 0}</td>
            <td>{узб.вылет ?? 0}</td>
            <td>{узб.всего ?? 0}</td>
            <td className="pct">{узб.процент ?? 0}%</td>
          </tr>
          <tr className="total">
            <td>📊</td>
            <td>{group.юзеров ?? 0}</td>
            <td>{group.взяли_тг ?? 0}</td>
            <td>{group.тень ?? 0}</td>
            <td>{group.мороз ?? 0}</td>
            <td>{group.вылет ?? 0}</td>
            <td>{group.всего_слётов ?? 0}</td>
            <td className="pct">{group.процент ?? 0}%</td>
          </tr>
        </tbody>
      </table>

      {/* Закупки ТГ - день */}
      <div className="tg-purchase-row day">
        <div className="purchase-label">📦 Загружено новых сегодня</div>
        <div className="purchase-values">
          <span className="purchase-ru">🇷🇺 {закупки_день.ру ?? 0}</span>
          <span className="purchase-uzb">🇺🇿 {закупки_день.узб ?? 0}</span>
          <span className="purchase-total">{всего_день}</span>
        </div>
      </div>

      {/* Закупки ТГ - неделя */}
      <div className="tg-purchase-row week">
        <div className="purchase-label">📦 За неделю</div>
        <div className="purchase-values">
          <span className="purchase-ru">🇷🇺 {закупки_неделя.ру ?? 0}</span>
          <span className="purchase-uzb">🇺🇿 {закупки_неделя.узб ?? 0}</span>
          <span className="purchase-total">{всего_неделя}</span>
        </div>
      </div>
    </div>
  );
}
