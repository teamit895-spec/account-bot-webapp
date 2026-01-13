'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DashboardData,
  TabType,
  RoomsFilter,
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

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = selectedDate
      ? new Date(selectedDate.split('.').reverse().join('-'))
      : new Date();

    if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    if (currentDate > today) {
      setSelectedDate(null);
      loadData(undefined, false);
    } else {
      const formatted = `${String(currentDate.getDate()).padStart(2, '0')}.${String(currentDate.getMonth() + 1).padStart(2, '0')}.${currentDate.getFullYear()}`;
      setSelectedDate(formatted);
      loadData(formatted, false);
    }
  };

  const goToToday = () => {
    setSelectedDate(null);
    loadData(undefined, false);
  };

  const displayDate = data?.выбранная_дата || data?.дата || '—';
  const displayDay = data?.день || '';
  const isToday = data?.это_сегодня ?? true;

  const renderContent = () => {
    if (loading && !data) {
      return (
        <div className="loading-container">
          <div className="spinner" />
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
    <div className="layout">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        status={botStatus}
      />

      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <button
              className="menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {displayDate}
                {!isToday && <span className="past-date-badge">АРХИВ</span>}
              </h1>
              <div className="header-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                {displayDay}
                {data?.из_кеша && ' • из кеша'}
              </div>
            </div>
          </div>

          <div className="header-controls">
            <div className="date-nav" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <button
                className="date-nav-btn"
                onClick={() => navigateDate('prev')}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '1rem', cursor: 'pointer' }}
              >
                ←
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px', padding: '4px 8px' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{displayDate}</span>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{displayDay}</span>
              </div>
              <button
                className="date-nav-btn"
                onClick={() => navigateDate('next')}
                disabled={isToday}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '1rem', cursor: 'pointer', opacity: isToday ? 0.5 : 1 }}
              >
                →
              </button>
              {!isToday && (
                <button 
                  onClick={goToToday}
                  style={{ padding: '6px 12px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Сегодня
                </button>
              )}
            </div>
            <button
              className="btn btn-primary"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? <span className="spinner" /> : '🔄'} Обновить
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
  return (
    <>
      <StatsTable data={data} />

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">📋 Группы ({data.группы?.length || 0})</h2>
        </div>
        <div className="section-content">
          <div className="groups-grid">
            {data.группы?.map((group) => (
              <GroupCard key={group.имя} group={group} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
