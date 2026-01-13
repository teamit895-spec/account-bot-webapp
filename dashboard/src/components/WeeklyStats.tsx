'use client';

import { useState, useEffect, useCallback } from 'react';
import { WeeklyStats as WeeklyStatsType, WeeklyGroup, GroupData, cleanGroupName } from '@/types';
import { fetchWeeklyStats } from '@/lib/api';
import GroupCard from './GroupCard';

interface WeeklyStatsViewProps {
  groups: GroupData[];
  onRefreshCache: () => void;
  refreshing: boolean;
}

export default function WeeklyStatsView({ groups, onRefreshCache, refreshing }: WeeklyStatsViewProps) {
  const [weeklyData, setWeeklyData] = useState<WeeklyStatsType | null>(null);
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
    if (pct <= 3) return 'excellent';
    if (pct <= 5) return 'good';
    if (pct <= 7) return 'warning';
    return 'bad';
  };

  const getMedal = (rank: number) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const filteredGroups = (weeklyData?.группы || [])
    .filter(гр => гр.дней_с_данными > 0)
    .sort((a, b) => a.средний_процент - b.средний_процент);

  const maxPercent = Math.max(...filteredGroups.map(g => g.средний_процент), 10);

  return (
    <div className="groups-page">
      {/* Weekly Stats Table */}
      <div className="weekly-container">
        <div className="weekly-header">
          <div className="weekly-title">
            <span className="weekly-icon">📊</span>
            Средний % вылетов за неделю
          </div>
          {weeklyData?.период && (
            <div className="weekly-period">{weeklyData.период}</div>
          )}
        </div>

        {loading ? (
          <div className="weekly-loading">
            <div className="loading-spinner" />
            <p>Загрузка статистики...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="weekly-empty">
            <p>🔭 Нет данных за эту неделю</p>
          </div>
        ) : (
          <table className="weekly-table-v2">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>ГРУППА</th>
                <th style={{ width: '100px', textAlign: 'right' }}>СРЕДНИЙ %</th>
                <th style={{ width: '200px' }}>ПРОГРЕСС</th>
                <th style={{ width: '80px', textAlign: 'right' }}>ДНЕЙ</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group, idx) => {
                const rank = idx + 1;
                const medal = getMedal(rank);
                const pctClass = getPercentClass(group.средний_процент);
                const barWidth = (group.средний_процент / maxPercent) * 100;

                return (
                  <tr key={group.имя}>
                    <td>
                      <div className={`rank-badge ${rank <= 3 ? `rank-${rank}` : ''}`}>
                        {medal || rank}
                      </div>
                    </td>
                    <td className="group-name-cell">
                      {medal && <span className="medal-icon">{medal}</span>}
                      {cleanGroupName(group.имя)}
                    </td>
                    <td className="percent-cell">
                      <span className={`percent-value ${pctClass}`}>
                        {group.средний_процент.toFixed(2)}%
                      </span>
                    </td>
                    <td>
                      <div className="progress-bar-container">
                        <div 
                          className={`progress-bar-fill ${pctClass}`}
                          style={{ width: `${Math.min(barWidth, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="days-cell">
                      {group.дней_с_данными} из {weeklyData?.текущий_день || 7}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* All Groups Section */}
      <div className="all-groups-section">
        <div className="all-groups-header">
          <div className="all-groups-title">
            <span>👥</span> Все группы
          </div>
          <div className="all-groups-actions">
            <button 
              className="action-btn" 
              onClick={() => loadWeeklyData(true)} 
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : '📊'} Обновить рейтинг
            </button>
            <button 
              className="action-btn primary" 
              onClick={onRefreshCache} 
              disabled={refreshing}
            >
              {refreshing ? <span className="spinner" /> : '🔄'} Обновить кеш
            </button>
          </div>
        </div>
        <div className="groups-grid-v2">
          {groups.map(gr => <GroupCard key={gr.имя} group={gr} />)}
        </div>
      </div>
    </div>
  );
}
