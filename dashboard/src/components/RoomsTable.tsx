'use client';

import { useState } from 'react';
import { DashboardData, GroupData, RoomsFilter, cleanGroupName } from '@/types';

interface RoomsTableProps {
  data: DashboardData;
  groups: GroupData[];
  filter: RoomsFilter;
  onFilterChange: (filter: RoomsFilter) => void;
}

export default function RoomsTable({ data, groups, filter, onFilterChange }: RoomsTableProps) {
  // Статистические столбцы
  const statCols = ['взяли_тг', 'тень', 'мороз', 'вылет', 'всего', '%'];
  const statLabels: Record<string, string> = {
    'взяли_тг': 'Взяли ТГ',
    'тень': 'Тень',
    'мороз': 'Мороз',
    'вылет': 'Вылет',
    'всего': 'Всего',
    '%': '%'
  };

  // Функция получения значения
  const getValue = (group: GroupData, col: string, type: 'ру' | 'узб' | 'total'): number | string => {
    if (type === 'total') {
      if (col === 'взяли_тг') return group.взяли_тг || 0;
      if (col === 'тень') return group.тень || 0;
      if (col === 'мороз') return group.мороз || 0;
      if (col === 'вылет') return group.вылет || 0;
      if (col === 'всего') return group.всего_слётов || 0;
      if (col === '%') return `${group.процент || 0}%`;
    } else {
      const stats = type === 'ру' ? group.ру : group.узб;
      if (!stats) return 0;
      if (col === 'взяли_тг') return stats.взяли_тг || 0;
      if (col === 'тень') return stats.тень || 0;
      if (col === 'мороз') return stats.мороз || 0;
      if (col === 'вылет') return stats.вылет || 0;
      if (col === 'всего') return stats.всего || 0;
      if (col === '%') return `${stats.процент || 0}%`;
    }
    return 0;
  };

  // Итоговые значения
  const getTotalValue = (col: string, type: 'ру' | 'узб' | 'total'): number | string => {
    if (type === 'total') {
      const t = data.всего || {};
      if (col === 'взяли_тг') return t.взяли_тг || 0;
      if (col === 'тень') return t.тень || 0;
      if (col === 'мороз') return t.мороз || 0;
      if (col === 'вылет') return t.вылет || 0;
      if (col === 'всего') return t.всего_слётов || 0;
      if (col === '%') return `${t.процент || 0}%`;
    } else {
      const stats = type === 'ру' ? data.ру : data.узб;
      if (!stats) return 0;
      if (col === 'взяли_тг') return stats.взяли_тг || 0;
      if (col === 'тень') return stats.тень || 0;
      if (col === 'мороз') return stats.мороз || 0;
      if (col === 'вылет') return stats.вылет || 0;
      if (col === 'всего') return stats.всего || 0;
      if (col === '%') return `${stats.процент || 0}%`;
    }
    return 0;
  };

  // Фильтрация строк
  const showRu = filter === 'all' || filter === 'ru';
  const showUzb = filter === 'all' || filter === 'uzb';
  const showTotal = filter === 'all' || filter === 'total';

  return (
    <div className="rooms-table-container">
      <div className="rooms-table-header">
        <div className="rooms-table-title">
          <span>🏠</span> Статистика комнат
        </div>
        <div className="filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => onFilterChange('all')}
          >
            Все
          </button>
          <button 
            className={`filter-btn ru ${filter === 'ru' ? 'active' : ''}`}
            onClick={() => onFilterChange('ru')}
          >
            🇷🇺 РУ
          </button>
          <button 
            className={`filter-btn uzb ${filter === 'uzb' ? 'active' : ''}`}
            onClick={() => onFilterChange('uzb')}
          >
            🇺🇿 УЗБ
          </button>
          <button 
            className={`filter-btn total ${filter === 'total' ? 'active' : ''}`}
            onClick={() => onFilterChange('total')}
          >
            📊 Всего
          </button>
        </div>
      </div>

      <div className="rooms-table-scroll">
        <table className="rooms-table">
          <thead>
            <tr>
              <th>Группа</th>
              {statCols.map(col => (
                <th key={col}>{statLabels[col]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group, idx) => (
              <>
                {/* РУ строка */}
                {showRu && (
                  <tr key={`${group.имя}-ru`} className="ru">
                    <td>{idx === 0 || !showUzb ? cleanGroupName(group.имя) : ''}</td>
                    {statCols.map(col => {
                      const val = getValue(group, col, 'ру');
                      return (
                        <td key={col} className={val === 0 ? 'val-zero' : ''}>
                          {col === '%' ? <span className="pct-badge">{val}</span> : val}
                        </td>
                      );
                    })}
                  </tr>
                )}
                {/* УЗБ строка */}
                {showUzb && (
                  <tr key={`${group.имя}-uzb`} className="uzb">
                    <td>{!showRu ? cleanGroupName(group.имя) : ''}</td>
                    {statCols.map(col => {
                      const val = getValue(group, col, 'узб');
                      return (
                        <td key={col} className={val === 0 ? 'val-zero' : ''}>
                          {col === '%' ? <span className="pct-badge">{val}</span> : val}
                        </td>
                      );
                    })}
                  </tr>
                )}
                {/* Итого по группе */}
                {showTotal && (
                  <tr key={`${group.имя}-total`} className="total">
                    <td>{!showRu && !showUzb ? cleanGroupName(group.имя) : 'Σ ' + cleanGroupName(group.имя)}</td>
                    {statCols.map(col => {
                      const val = getValue(group, col, 'total');
                      return (
                        <td key={col} className={val === 0 ? 'val-zero' : ''}>
                          {col === '%' ? <span className="pct-badge">{val}</span> : val}
                        </td>
                      );
                    })}
                  </tr>
                )}
              </>
            ))}
            
            {/* Общий итог */}
            <tr className="section-header">
              <td colSpan={statCols.length + 1}>ИТОГО ПО ВСЕМ ГРУППАМ</td>
            </tr>
            {showRu && (
              <tr className="ru">
                <td>🇷🇺 Россия</td>
                {statCols.map(col => {
                  const val = getTotalValue(col, 'ру');
                  return (
                    <td key={col}>
                      {col === '%' ? <span className="pct-badge">{val}</span> : val}
                    </td>
                  );
                })}
              </tr>
            )}
            {showUzb && (
              <tr className="uzb">
                <td>🇺🇿 Узбекистан</td>
                {statCols.map(col => {
                  const val = getTotalValue(col, 'узб');
                  return (
                    <td key={col}>
                      {col === '%' ? <span className="pct-badge">{val}</span> : val}
                    </td>
                  );
                })}
              </tr>
            )}
            {showTotal && (
              <tr className="total">
                <td>📊 Общее</td>
                {statCols.map(col => {
                  const val = getTotalValue(col, 'total');
                  return (
                    <td key={col}>
                      {col === '%' ? <span className="pct-badge">{val}</span> : val}
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
