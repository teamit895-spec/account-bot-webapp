'use client';

import { DashboardData, GroupData, RoomsFilter, cleanGroupName } from '@/types';

interface RoomsTableProps {
  data: DashboardData;
  groups: GroupData[];
  filter: RoomsFilter;
  onFilterChange: (filter: RoomsFilter) => void;
}

export default function RoomsTable({ data, groups, filter, onFilterChange }: RoomsTableProps) {
  const ру = data.ру || { людей: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего: 0, процент: 0 };
  const узб = data.узб || { людей: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего: 0, процент: 0 };
  const всего = data.всего || { юзеров: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего_слётов: 0, процент: 0 };

  const showRu = filter === 'all' || filter === 'ru';
  const showUzb = filter === 'all' || filter === 'uzb';
  const showTotal = filter === 'all' || filter === 'total';

  const names = groups.map(gr => cleanGroupName(gr.имя));

  const renderRow = (
    type: 'ru' | 'uzb' | 'total',
    label: string,
    getter: (gr: GroupData) => number,
    total: number,
    bold = false
  ) => (
    <tr className={type} key={`${type}-${label}`}>
      <td>{label}</td>
      {groups.map((gr, i) => {
        const val = getter(gr);
        return (
          <td key={i}>
            {val === 0 ? <span className="val-zero">0</span> : bold ? <b>{val}</b> : val}
          </td>
        );
      })}
      <td>{bold ? <b>{total}</b> : total}</td>
    </tr>
  );

  const renderPercentRow = (
    type: 'ru' | 'uzb' | 'total',
    label: string,
    getter: (gr: GroupData) => number,
    total: number
  ) => (
    <tr className={type} key={`${type}-${label}`}>
      <td>{label}</td>
      {groups.map((gr, i) => (
        <td key={i}><span className="pct-badge">{getter(gr)}%</span></td>
      ))}
      <td><span className="pct-badge">{total}%</span></td>
    </tr>
  );

  return (
    <>
      <div className="filters">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => onFilterChange('all')}>Все</button>
        <button className={`filter-btn ru ${filter === 'ru' ? 'active' : ''}`} onClick={() => onFilterChange('ru')}>🇷🇺 Только РУ</button>
        <button className={`filter-btn uzb ${filter === 'uzb' ? 'active' : ''}`} onClick={() => onFilterChange('uzb')}>🇺🇿 Только УЗБ</button>
        <button className={`filter-btn total ${filter === 'total' ? 'active' : ''}`} onClick={() => onFilterChange('total')}>📊 Только общее</button>
      </div>

      <div className="cards-grid">
        <div className="stat-card ru">
          <div className="stat-card-label">🇷🇺 РУ - Всего слётов</div>
          <div className="stat-card-value">{ру.всего ?? 0}</div>
          <div className="stat-card-meta">из {ру.взяли_тг ?? 0} взявших ТГ • <b>{ру.процент ?? 0}%</b></div>
        </div>
        <div className="stat-card uzb">
          <div className="stat-card-label">🇺🇿 УЗБ - Всего слётов</div>
          <div className="stat-card-value">{узб.всего ?? 0}</div>
          <div className="stat-card-meta">из {узб.взяли_тг ?? 0} взявших ТГ • <b>{узб.процент ?? 0}%</b></div>
        </div>
        <div className="stat-card total">
          <div className="stat-card-label">📊 Общее - Всего слётов</div>
          <div className="stat-card-value">{всего.всего_слётов ?? 0}</div>
          <div className="stat-card-meta">из {всего.взяли_тг ?? 0} взявших ТГ • <b>{всего.процент ?? 0}%</b></div>
        </div>
      </div>

      <div className="rooms-table-container">
        <div className="rooms-table-header">
          <h2 className="rooms-table-title">📋 Сравнение по комнатам</h2>
          <span className="rooms-table-hint">← Прокрутите для просмотра всех групп →</span>
        </div>
        <div className="rooms-table-scroll">
          <table className="rooms-table">
            <thead>
              <tr>
                <th>Показатель</th>
                {names.map((n, i) => <th key={i}>{n}</th>)}
                <th>ИТОГО</th>
              </tr>
            </thead>
            <tbody>
              {showRu && (
                <>
                  <tr className="section-header"><td colSpan={groups.length + 2}>🇷🇺 РОССИЯ</td></tr>
                  {renderRow('ru', '📱 Телег в работе', gr => gr.ру?.взяли_тг ?? 0, ру.взяли_тг ?? 0)}
                  {renderRow('ru', '❄️ Мороз', gr => gr.ру?.мороз ?? 0, ру.мороз ?? 0)}
                  {renderRow('ru', '👤 Тень', gr => gr.ру?.тень ?? 0, ру.тень ?? 0)}
                  {renderRow('ru', '✈️ Вылет', gr => gr.ру?.вылет ?? 0, ру.вылет ?? 0)}
                  {renderRow('ru', '📊 Итог слётов', gr => gr.ру?.всего ?? 0, ру.всего ?? 0, true)}
                  {renderPercentRow('ru', '📈 Процент', gr => gr.ру?.процент ?? 0, ру.процент ?? 0)}
                </>
              )}
              {showUzb && (
                <>
                  <tr className="section-header"><td colSpan={groups.length + 2}>🇺🇿 УЗБЕКИСТАН</td></tr>
                  {renderRow('uzb', '📱 Телег в работе', gr => gr.узб?.взяли_тг ?? 0, узб.взяли_тг ?? 0)}
                  {renderRow('uzb', '❄️ Мороз', gr => gr.узб?.мороз ?? 0, узб.мороз ?? 0)}
                  {renderRow('uzb', '👤 Тень', gr => gr.узб?.тень ?? 0, узб.тень ?? 0)}
                  {renderRow('uzb', '✈️ Вылет', gr => gr.узб?.вылет ?? 0, узб.вылет ?? 0)}
                  {renderRow('uzb', '📊 Итог слётов', gr => gr.узб?.всего ?? 0, узб.всего ?? 0, true)}
                  {renderPercentRow('uzb', '📈 Процент', gr => gr.узб?.процент ?? 0, узб.процент ?? 0)}
                </>
              )}
              {showTotal && (
                <>
                  <tr className="section-header"><td colSpan={groups.length + 2}>📊 ОБЩЕЕ</td></tr>
                  {renderRow('total', '📱 Телег в работе', gr => gr.взяли_тг ?? 0, всего.взяли_тг ?? 0)}
                  {renderRow('total', '❄️ Мороз', gr => gr.мороз ?? 0, всего.мороз ?? 0)}
                  {renderRow('total', '👤 Тень', gr => gr.тень ?? 0, всего.тень ?? 0)}
                  {renderRow('total', '✈️ Вылет', gr => gr.вылет ?? 0, всего.вылет ?? 0)}
                  {renderRow('total', '📊 Итог слётов', gr => gr.всего_слётов ?? 0, всего.всего_слётов ?? 0, true)}
                  {renderPercentRow('total', '📈 Процент', gr => gr.процент ?? 0, всего.процент ?? 0)}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="legend">
        <div className="legend-item"><div className="legend-color ru" />Россия</div>
        <div className="legend-item"><div className="legend-color uzb" />Узбекистан</div>
        <div className="legend-item"><div className="legend-color total" />Общее</div>
      </div>
    </>
  );
}
