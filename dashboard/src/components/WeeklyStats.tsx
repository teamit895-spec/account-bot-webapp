'use client';

import { useState, useEffect, useCallback } from 'react';
import { WeeklyStats, GroupData, cleanGroupName } from '@/types';
import { fetchWeeklyStats } from '@/lib/api';
import GroupCard from './GroupCard';

interface WeeklyStatsViewProps {
  groups: GroupData[];
  onRefreshCache: () => void;
  refreshing: boolean;
}

export default function WeeklyStatsView({ groups, onRefreshCache, refreshing }: WeeklyStatsViewProps) {
  const [weeklyData, setWeeklyData] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadWeeklyData = useCallback(async (force = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await fetchWeeklyStats(force);
      setWeeklyData(result);
    } catch (error) {
      console.error('Weekly stats error:', error);
    }
    setLoading(false);
  }, [loading]);

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const getPercentClass = (pct: number) => {
    if (pct <= 12) return 'good';
    if (pct <= 20) return 'warning';
    return 'bad';
  };

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
  };

  const medals = ['🥇', '🥈', '🥉'];
  const filteredGroups = (weeklyData?.группы || []).filter(
    гр => гр.дней_с_данными > 0 && гр.средний_процент >= 0.1
  );

  return (
    <>
      {loading ? (
        <div className="weekly-stats-container">
          <div className="weekly-stats-header">
            <div className="weekly-stats-title"><span>📊</span> Средний % вылетов за неделю</div>
          </div>
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 10px' }} />
            <p>Загрузка статистики...</p>
          </div>
        </div>
      ) : weeklyData && filteredGroups.length > 0 ? (
        <div className="weekly-stats-container">
          <div className="weekly-stats-header">
            <div className="weekly-stats-title"><span>📊</span> Средний % вылетов за неделю</div>
            <div className="weekly-stats-period">{weeklyData.период || ''}</div>
          </div>
          <table className="weekly-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Группа</th>
                <th style={{ width: '100px' }}>Средний %</th>
                <th style={{ width: '140px' }}>Прогресс</th>
                <th style={{ width: '80px' }}>Дней</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((гр, idx) => {
                const rank = idx + 1;
                const pctClass = getPercentClass(гр.средний_процент);
                const rankClass = getRankClass(rank);
                const barWidth = Math.min(100, (гр.средний_процент / 30) * 100);
                const medal = rank <= 3 ? medals[rank - 1] + ' ' : '';
                return (
                  <tr key={гр.имя}>
                    <td><div className={`weekly-rank ${rankClass}`}>{rank}</div></td>
                    <td className="weekly-name">{medal}{cleanGroupName(гр.имя)}</td>
                    <td><span className={`weekly-percent ${pctClass}`}>{гр.средний_процент}%</span></td>
                    <td><div className="weekly-bar"><div className={`weekly-bar-fill ${pctClass}`} style={{ width: `${barWidth}%` }} /></div></td>
                    <td className="weekly-days">{гр.дней_с_данными} из {weeklyData.текущий_день || 7}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : weeklyData ? (
        <div className="weekly-stats-container">
          <div className="weekly-stats-header">
            <div className="weekly-stats-title"><span>📊</span> Средний % вылетов за неделю</div>
            <div className="weekly-stats-period">{weeklyData.период || ''}</div>
          </div>
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>🔭 Нет данных за эту неделю</p>
          </div>
        </div>
      ) : null}

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">📋 Все группы</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn" onClick={() => loadWeeklyData(true)} disabled={loading}>
              {loading ? <span className="spinner" /> : '🔄'} Обновить рейтинг
            </button>
            <button className="btn btn-primary" onClick={onRefreshCache} disabled={refreshing}>
              {refreshing ? <span className="spinner" /> : '🔄'} Обновить кеш
            </button>
          </div>
        </div>
        <div className="section-content">
          <div className="groups-grid">
            {groups.map(gr => <GroupCard key={gr.имя} group={gr} />)}
          </div>
        </div>
      </div>
    </>
  );
}
