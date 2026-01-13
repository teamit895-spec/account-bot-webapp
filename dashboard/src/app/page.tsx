'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DashboardData,
  TabType,
  RoomsFilter,
  cleanGroupName
} from '@/types';
import {
  fetchDashboard,
  saveToLocalCache,
  loadFromLocalCache,
  healthCheck,
  clearCache
} from '@/lib/api';

import Sidebar from '@/components/Sidebar';
import StatsTable from '@/components/StatsTable';
import GroupCard from '@/components/GroupCard';
import RoomsTable from '@/components/RoomsTable';
import WeeklyStats from '@/components/WeeklyStats';
import PersonalStats from '@/components/PersonalStats';
import Recordings from '@/components/Recordings';
import BotStats, { SettingsView } from '@/components/BotStats';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [roomsFilter, setRoomsFilter] = useState<RoomsFilter>('all');

  const [botStatus, setBotStatus] = useState({
    online: false,
    uptime: '—',
    groupsCount: 0
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadData = useCallback(async (date?: string, force = false) => {
    if (!force && !date) {
      const cached = loadFromLocalCache();
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      const result = await fetchDashboard(date, force);
      setData(result);
      if (!date) {
        saveToLocalCache(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkBotStatus = useCallback(async () => {
    try {
      const status = await healthCheck();
      setBotStatus({
        online: status.bot_running ?? false,
        uptime: status.uptime ?? '—',
        groupsCount: status.groups_count ?? 0
      });
    } catch {
      setBotStatus({ online: false, uptime: '—', groupsCount: 0 });
    }
  }, []);

  useEffect(() => {
    loadData();
    checkBotStatus();

    const interval = setInterval(() => {
      if (activeTab === 'dashboard' && !selectedDate) {
        loadData(undefined, false);
      }
      checkBotStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, [loadData, checkBotStatus, activeTab, selectedDate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(selectedDate ?? undefined, true);
    setRefreshing(false);
    showToast('Данные обновлены');
  };

  const handleClearCache = async () => {
    setClearing(true);
    try {
      await clearCache();
      showToast('Кеш очищен');
      await loadData(undefined, true);
    } catch {
      showToast('Ошибка очистки кеша', 'error');
    } finally {
      setClearing(false);
    }
  };

  const displayDate = data?.выбранная_дата || data?.дата || '—';
  const displayDay = data?.день || '';
  const currentTime = data?.время || new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const renderContent = () => {
    if (loading && !data) {
      return (
        <div className="loading-container">
          <div className="loading-spinner" />
          <div style={{ color: 'var(--text-muted)' }}>Загрузка данных...</div>
        </div>
      );
    }

    if (error && !data) {
      return (
        <div className="loading-container">
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <div style={{ color: 'var(--error)' }}>{error}</div>
          <button className="btn btn-primary" onClick={() => loadData(undefined, true)}>
            Попробовать снова
          </button>
        </div>
      );
    }

    if (!data) return null;

    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab data={data} />;
      case 'rooms':
        return (
          <RoomsTable
            data={data}
            groups={data.группы || []}
            filter={roomsFilter}
            onFilterChange={setRoomsFilter}
          />
        );
      case 'groups':
        return (
          <WeeklyStats
            groups={data.группы || []}
            onRefreshCache={handleClearCache}
            refreshing={clearing}
          />
        );
      case 'personal':
        return <PersonalStats groups={data.группы || []} />;
      case 'recordings':
        return <Recordings />;
      case 'stats':
        return <BotStats data={data} />;
      case 'settings':
        return (
          <SettingsView
            data={data}
            onClearCache={handleClearCache}
            clearing={clearing}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        status={botStatus}
      />

      <main className="main">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <div>
              <h1>Дашборд</h1>
              <div className="header-subtitle">
                📅 {displayDate} ({displayDay}) &nbsp; ⏰ {currentTime}
              </div>
            </div>
          </div>
          <div className="header-right">
            <button
              className="btn btn-primary"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? <span className="spinner" /> : '🔄'}
            </button>
          </div>
        </header>

        <div className="content">
          {renderContent()}
        </div>
      </main>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  );
}

function DashboardTab({ data }: { data: DashboardData }) {
  const всего = data.всего || { юзеров: 0, взяли_тг: 0, тень: 0, мороз: 0, вылет: 0, всего_слётов: 0, процент: 0, осталось: 0 };
  const topUsers = data.топ_юзеры || [];
  const groups = data.группы || [];

  // Calculate purchases
  let закупленоСегодня = { ру: 0, узб: 0, всего: 0 };
  let закупленоНеделя = { ру: 0, узб: 0, всего: 0 };
  
  groups.forEach(g => {
    if (g.закупки_тг) {
      закупленоСегодня.ру += g.закупки_тг.ру || 0;
      закупленоСегодня.узб += g.закупки_тг.узб || 0;
    }
    if (g.закупки_тг_неделя) {
      закупленоНеделя.ру += g.закупки_тг_неделя.ру || 0;
      закупленоНеделя.узб += g.закупки_тг_неделя.узб || 0;
    }
  });
  закупленоСегодня.всего = закупленоСегодня.ру + закупленоСегодня.узб;
  закупленоНеделя.всего = закупленоНеделя.ру + закупленоНеделя.узб;

  const остаётся = всего.осталось ?? (всего.взяли_тг - всего.всего_слётов);

  return (
    <>
      {/* Stat Cards */}
      <div className="stat-cards-grid">
        <div className="stat-card-v2">
          <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>👥</div>
          <div className="stat-card-info">
            <div className="stat-card-label">ВСЕГО ЛЮДЕЙ</div>
            <div className="stat-card-value">{всего.юзеров}</div>
          </div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>📱</div>
          <div className="stat-card-info">
            <div className="stat-card-label">ВЗЯЛИ ТГ</div>
            <div className="stat-card-value">{всего.взяли_тг}</div>
          </div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>👤</div>
          <div className="stat-card-info">
            <div className="stat-card-label">ТЕНЬ</div>
            <div className="stat-card-value">{всего.тень}</div>
          </div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #22d3ee, #0891b2)' }}>❄️</div>
          <div className="stat-card-info">
            <div className="stat-card-label">МОРОЗ</div>
            <div className="stat-card-value">{всего.мороз}</div>
          </div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>✈️</div>
          <div className="stat-card-info">
            <div className="stat-card-label">ВЫЛЕТ</div>
            <div className="stat-card-value">{всего.вылет}</div>
          </div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #f472b6, #db2777)' }}>📊</div>
          <div className="stat-card-info">
            <div className="stat-card-label">% СЛЁТОВ</div>
            <div className="stat-card-value">{всего.процент}%</div>
            <div className="stat-card-sub">Осталось: {остаётся}</div>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <StatsTable data={data} />

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">Слёты по группам</div>
          <div className="chart-content">
            <GroupsBarChart groups={groups} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-header">Распределение слётов</div>
          <div className="chart-content">
            <PieChartComponent shadow={всего.тень} frost={всего.мороз} flight={всего.вылет} />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="bottom-row">
        <div className="bottom-section groups-section">
          <div className="section-header-v2">Группы</div>
          <div className="groups-list">
            {groups.slice(0, 6).map(g => (
              <GroupCard key={g.имя} group={g} />
            ))}
          </div>
        </div>
        <div className="bottom-section top-section">
          <div className="section-header-v2">Топ слётчиков</div>
          <div className="top-list-v2">
            {topUsers.length === 0 ? (
              <div className="no-data">Нет данных</div>
            ) : (
              topUsers.slice(0, 5).map((user, idx) => (
                <div key={user.имя + idx} className="top-item-v2">
                  <div className="top-rank-v2">{idx + 1}</div>
                  <div className="top-info-v2">
                    <div className="top-name-v2">{user.имя}</div>
                    <div className="top-group-v2">{cleanGroupName(user.группа)}</div>
                  </div>
                  <div className="top-value-v2">{user.всего}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Purchase Stats */}
      <div className="purchase-row">
        <div className="purchase-card today">
          <div className="purchase-icon">📦</div>
          <div className="purchase-info">
            <div className="purchase-title">Закуплено сегодня</div>
            <div className="purchase-values-v2">
              <span className="ru">🇷🇺 {закупленоСегодня.ру}</span>
              <span className="uzb">🇺🇿 {закупленоСегодня.узб}</span>
              <span className="total">{закупленоСегодня.всего}</span>
            </div>
          </div>
        </div>
        <div className="purchase-card week">
          <div className="purchase-icon">📊</div>
          <div className="purchase-info">
            <div className="purchase-title">Закуплено за неделю</div>
            <div className="purchase-values-v2">
              <span className="ru">🇷🇺 {закупленоНеделя.ру}</span>
              <span className="uzb">🇺🇿 {закупленоНеделя.узб}</span>
              <span className="total">{закупленоНеделя.всего}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Simple Bar Chart Component
function GroupsBarChart({ groups }: { groups: any[] }) {
  const maxSlots = Math.max(...groups.map(g => g.всего_слётов || 0), 1);
  const topGroups = [...groups].sort((a, b) => (b.всего_слётов || 0) - (a.всего_слётов || 0)).slice(0, 6);

  if (topGroups.length === 0) {
    return <div className="no-data">Нет данных</div>;
  }

  return (
    <div className="bar-chart">
      <div className="bar-chart-y-axis">
        {[4, 3, 2, 1, 0].map(n => (
          <div key={n} className="bar-chart-y-label">{Math.round((maxSlots / 4) * n)}</div>
        ))}
      </div>
      <div className="bar-chart-bars">
        {topGroups.map((g, idx) => (
          <div key={g.имя} className="bar-wrapper">
            <div 
              className="bar" 
              style={{ 
                height: `${((g.всего_слётов || 0) / maxSlots) * 100}%`,
                background: `hsl(${220 + idx * 30}, 70%, 50%)`
              }}
            />
            <div className="bar-label">{cleanGroupName(g.имя).substring(0, 8)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple Pie Chart Component
function PieChartComponent({ shadow, frost, flight }: { shadow: number; frost: number; flight: number }) {
  const total = shadow + frost + flight;
  
  if (total === 0) {
    return (
      <div className="pie-chart-container">
        <div className="pie-empty">Нет данных</div>
        <div className="pie-legend">
          <div className="pie-legend-item"><span className="dot shadow"></span> Тень</div>
          <div className="pie-legend-item"><span className="dot frost"></span> Мороз</div>
          <div className="pie-legend-item"><span className="dot flight"></span> Вылет</div>
        </div>
      </div>
    );
  }

  const shadowPct = (shadow / total) * 100;
  const frostPct = (frost / total) * 100;
  const flightPct = (flight / total) * 100;

  // Create conic gradient for pie chart
  const gradient = `conic-gradient(
    #a78bfa 0% ${shadowPct}%, 
    #22d3ee ${shadowPct}% ${shadowPct + frostPct}%, 
    #fbbf24 ${shadowPct + frostPct}% 100%
  )`;

  return (
    <div className="pie-chart-container">
      <div className="pie-chart" style={{ background: gradient }} />
      <div className="pie-legend">
        <div className="pie-legend-item"><span className="dot shadow"></span> Тень</div>
        <div className="pie-legend-item"><span className="dot frost"></span> Мороз</div>
        <div className="pie-legend-item"><span className="dot flight"></span> Вылет</div>
      </div>
    </div>
  );
}
