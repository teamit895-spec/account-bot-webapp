'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import StatsTable from '@/components/StatsTable';
import GroupCard from '@/components/GroupCard';
import PersonalStatsPanel from '@/components/PersonalStats';
import RecordingsPanel from '@/components/Recordings';
import BotStatsPanel from '@/components/BotStats';
import { DashboardData, TabType, ROOMS } from '@/types';
import { fetchDashboard, clearCache } from '@/lib/api';
import clsx from 'clsx';
import { 
  Users, Target, Ghost, Snowflake, Plane, TrendingDown, RefreshCw, 
  Calendar, Clock, Package, Heart, AlertCircle
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboard();
      setData(result);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRefresh = async () => {
    try { await clearCache(); } catch (e) {}
    await loadData();
  };

  // Закупки - берём из data или ставим 0
  const purchasesTodayRu = data?.закупки_тг?.день?.ру ?? 0;
  const purchasesTodayUzb = data?.закупки_тг?.день?.узб ?? 0;
  const purchasesWeekRu = data?.закупки_тг?.неделя?.ру ?? 0;
  const purchasesWeekUzb = data?.закупки_тг?.неделя?.узб ?? 0;
  
  // Осталось ТГ
  const remainingRu = data?.ру?.осталось ?? 0;
  const remainingUzb = data?.узб?.осталось ?? 0;
  const remainingTotal = data?.всего?.осталось ?? 0;

  return (
    <div className="min-h-screen bg-dark-bg">
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        status={{
          online: !error && !!data,
          uptime: data?.метрики?.аптайм || '—',
          groups: data?.группы?.length || 14
        }}
      />

      <main className="ml-64 min-h-screen p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {activeTab === 'dashboard' && 'Дашборд'}
              {activeTab === 'rooms' && 'Комнаты'}
              {activeTab === 'groups' && 'Группы'}
              {activeTab === 'personal' && 'Личная статистика'}
              {activeTab === 'recordings' && 'Записи'}
              {activeTab === 'stats' && 'Статистика бота'}
              {activeTab === 'settings' && 'Настройки'}
            </h1>
            {data && (
              <div className="flex items-center gap-4 mt-1 text-sm">
                <span className="text-gray-400 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {data.дата} ({data.день})
                </span>
                {data.лист && <span className="text-accent-purple">📋 {data.лист}</span>}
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {lastUpdate?.toLocaleTimeString('ru-RU')}
                </span>
                {data.из_кеша && <span className="text-amber-400 text-xs">из кэша</span>}
              </div>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg hover:border-accent-purple/50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={clsx('w-4 h-4 text-gray-400', loading && 'animate-spin')} />
            <span className="text-sm text-gray-400">Обновить кэш</span>
          </button>
        </header>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          loading && !data ? (
            <LoadingSkeleton />
          ) : error && !data ? (
            <ErrorState message={error} onRetry={loadData} />
          ) : data ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard title="Всего людей" value={data.всего?.юзеров ?? 0} icon={Users} color="blue" />
                <StatCard title="Взяли ТГ" value={data.всего?.взяли_тг ?? 0} icon={Target} color="green" />
                <StatCard title="Тень" value={data.всего?.тень ?? 0} icon={Ghost} color="purple" />
                <StatCard title="Мороз" value={data.всего?.мороз ?? 0} icon={Snowflake} color="cyan" />
                <StatCard title="Вылет" value={data.всего?.вылет ?? 0} icon={Plane} color="yellow" />
                <StatCard 
                  title="% слётов" 
                  value={`${data.всего?.процент ?? 0}%`} 
                  subtitle={`Осталось: ${data.всего?.осталось ?? 0}`}
                  icon={TrendingDown} 
                  color={(data.всего?.процент ?? 0) >= 50 ? 'red' : (data.всего?.процент ?? 0) >= 30 ? 'yellow' : 'green'} 
                />
              </div>

              {/* Stats Table */}
              <StatsTable ру={data.ру} узб={data.узб} всего={data.всего} />

              {/* Purchases & Remaining - Как в старом дашборде */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Закуплено сегодня */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-400" />
                    📦 Закуплено сегодня
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <div className="flex items-baseline gap-2">
                        <span className="text-emerald-400 text-3xl font-bold">{purchasesTodayRu}</span>
                        <span className="text-emerald-300/70 text-sm">РУ</span>
                      </div>
                    </div>
                    <div className="flex-1 p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                      <div className="flex items-baseline gap-2">
                        <span className="text-pink-400 text-3xl font-bold">{purchasesTodayUzb}</span>
                        <span className="text-pink-300/70 text-sm">УЗБ</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Закуплено за неделю */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-400" />
                    📊 Закуплено за неделю
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <div className="flex items-baseline gap-2">
                        <span className="text-emerald-400 text-3xl font-bold">{purchasesWeekRu}</span>
                        <span className="text-emerald-300/70 text-sm">РУ</span>
                      </div>
                    </div>
                    <div className="flex-1 p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                      <div className="flex items-baseline gap-2">
                        <span className="text-pink-400 text-3xl font-bold">{purchasesWeekUzb}</span>
                        <span className="text-pink-300/70 text-sm">УЗБ</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Осталось ТГ */}
                <div className="bg-dark-card border border-accent-green/30 rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-green-400" />
                    💚 Осталось ТГ
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                      <div className="text-emerald-400 text-2xl font-bold">{remainingRu}</div>
                      <div className="text-emerald-300/70 text-xs">РУ</div>
                    </div>
                    <div className="flex-1 p-3 bg-pink-500/10 border border-pink-500/30 rounded-xl text-center">
                      <div className="text-pink-400 text-2xl font-bold">{remainingUzb}</div>
                      <div className="text-pink-300/70 text-xs">УЗБ</div>
                    </div>
                    <div className="flex-1 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-center">
                      <div className="text-blue-400 text-2xl font-bold">{remainingTotal}</div>
                      <div className="text-blue-300/70 text-xs">ВСЕГО</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Groups */}
              {data.группы && data.группы.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent-purple" />
                    Группы ({data.группы.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {data.группы.map((group, idx) => (
                      <GroupCard key={idx} group={group} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.группы?.map((group, idx) => (
              <GroupCard key={idx} group={group} />
            ))}
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {ROOMS.map((room) => (
              <div key={room.short} className="bg-dark-card border border-dark-border rounded-xl p-4 hover:border-accent-purple/50 transition-colors cursor-pointer">
                <p className="font-semibold text-white">{room.name}</p>
                <p className="text-xs text-gray-500 mt-1">{room.short}</p>
              </div>
            ))}
          </div>
        )}

        {/* Personal Stats Tab */}
        {activeTab === 'personal' && <PersonalStatsPanel />}

        {/* Recordings Tab */}
        {activeTab === 'recordings' && <RecordingsPanel />}

        {/* Bot Stats Tab */}
        {activeTab === 'stats' && <BotStatsPanel metrics={data?.метрики} />}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 max-w-2xl">
            <h2 className="text-xl font-semibold text-white mb-6">Настройки</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">API URL</label>
                <input
                  type="text"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white focus:border-accent-purple outline-none"
                  defaultValue={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Изменить в .env.local</p>
              </div>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80 transition-colors"
              >
                Очистить кэш
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, subtitle, icon: Icon, color }: { 
  title: string; value: string | number; subtitle?: string; icon: any; color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
    green: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
    cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30',
    yellow: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
    red: 'from-red-500/20 to-red-600/5 border-red-500/30',
  };
  const iconColors: Record<string, string> = {
    blue: 'text-blue-400', green: 'text-emerald-400', purple: 'text-purple-400',
    cyan: 'text-cyan-400', yellow: 'text-amber-400', red: 'text-red-400',
  };

  return (
    <div className={clsx('stat-card bg-gradient-to-br border rounded-xl p-4', colors[color])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={clsx('p-2 rounded-lg bg-white/5', iconColors[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-dark-card border border-dark-border rounded-xl animate-skeleton" />
        ))}
      </div>
      <div className="h-48 bg-dark-card border border-dark-border rounded-xl animate-skeleton" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-dark-card border border-dark-border rounded-xl animate-skeleton" />
        ))}
      </div>
    </div>
  );
}

// Error State
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-dark-card border border-dark-border rounded-xl">
      <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
      <p className="text-gray-400 mb-4 text-center">{message}</p>
      <button onClick={onRetry} className="px-6 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80">
        Повторить
      </button>
    </div>
  );
}
