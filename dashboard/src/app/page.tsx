'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import GroupCard from '@/components/GroupCard';
import SummaryTable from '@/components/SummaryTable';
import { BarChartCard, DonutChart } from '@/components/Charts';
import RecordingsPanel from '@/components/RecordingsPanel';
import { LoadingSkeleton, ErrorState } from '@/components/LoadingState';
import { DashboardData, TabType, GroupData } from '@/types';
import { fetchDashboard, clearCache } from '@/lib/api';
import { 
  Users, 
  Target, 
  Ghost, 
  Snowflake, 
  Plane, 
  TrendingDown,
  RefreshCw,
  Calendar,
  Clock,
  Package,
  Heart
} from 'lucide-react';
import clsx from 'clsx';

// Mock data for demo when API is not available
const mockData: DashboardData = {
  дата: new Date().toISOString().split('T')[0],
  день: 'Понедельник',
  время: new Date().toLocaleTimeString('ru-RU'),
  это_сегодня: true,
  лист: '13.01-19.01',
  статус: 'ok',
  всего: {
    юзеров: 180,
    взяли_тг: 156,
    тень: 45,
    мороз: 23,
    вылет: 12,
    всего_слётов: 80,
    процент: 51,
    осталось: 76
  },
  ру: {
    людей: 90,
    взяли_тг: 78,
    тень: 22,
    мороз: 11,
    вылет: 6,
    всего: 39,
    процент: 50,
    осталось: 39
  },
  узб: {
    людей: 90,
    взяли_тг: 78,
    тень: 23,
    мороз: 12,
    вылет: 6,
    всего: 41,
    процент: 53,
    осталось: 37
  },
  группы: [],
  топ_юзеры: [],
  топ_группы: [],
  метрики: {
    аптайм: '24ч 15м',
    обработано: 1250,
    записано: 980,
    ошибок: 3,
    в_очереди: 12
  },
  закупки_тг: {
    день: { ру: 0, узб: 0 },
    неделя: { ру: 1090, узб: 0 }
  }
};

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
    } catch (err) {
      console.error('Failed to fetch data, using mock:', err);
      setData(mockData);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleClearCache = async () => {
    try {
      await clearCache();
      await loadData();
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
  };

  const chartData = data?.группы?.map(g => ({
    name: g.имя,
    тень: g.тень,
    мороз: g.мороз,
    вылет: g.вылет,
    value: g.всего_слётов
  })) || [];

  const pieData = [
    { name: 'Тень', value: data?.всего.тень || 0 },
    { name: 'Мороз', value: data?.всего.мороз || 0 },
    { name: 'Вылет', value: data?.всего.вылет || 0 },
  ];

  // Calculate remaining TG
  const remainingTG = {
    ру: (data?.ру?.осталось || 0),
    узб: (data?.узб?.осталось || 0),
    всего: (data?.всего?.осталось || 0)
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        status={{
          online: true,
          uptime: data?.метрики?.аптайм || '—',
          groups: data?.группы?.length || 14
        }}
      />

      {/* Main content */}
      <main className="ml-64 min-h-screen p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {activeTab === 'dashboard' && 'Дашборд'}
              {activeTab === 'rooms' && 'Комнаты'}
              {activeTab === 'groups' && 'Группы'}
              {activeTab === 'personal' && 'Личная статистика'}
              {activeTab === 'recordings' && 'Записи работы'}
              {activeTab === 'stats' && 'Статистика'}
              {activeTab === 'settings' && 'Настройки'}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              {data && (
                <>
                  <span className="text-gray-400 text-sm flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {data.дата} ({data.день})
                  </span>
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {lastUpdate?.toLocaleTimeString('ru-RU')}
                  </span>
                  {data.лист && (
                    <span className="text-accent-purple text-sm">
                      📋 {data.лист}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg hover:border-accent-purple/50 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={clsx('w-4 h-4 text-gray-400', loading && 'animate-spin')} />
              <span className="text-sm text-gray-400">Обновить кэш</span>
            </button>
          </div>
        </header>

        {/* Content */}
        {activeTab === 'dashboard' && (
          loading && !data ? (
            <LoadingSkeleton />
          ) : error && !data ? (
            <ErrorState message={error} onRetry={loadData} />
          ) : data ? (
            <div className="space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard
                  title="Всего людей"
                  value={data.всего.юзеров}
                  icon={<Users className="w-5 h-5" />}
                  color="blue"
                />
                <StatCard
                  title="Взяли ТГ"
                  value={data.всего.взяли_тг}
                  icon={<Target className="w-5 h-5" />}
                  color="green"
                />
                <StatCard
                  title="Тень"
                  value={data.всего.тень}
                  icon={<Ghost className="w-5 h-5" />}
                  color="purple"
                />
                <StatCard
                  title="Мороз"
                  value={data.всего.мороз}
                  icon={<Snowflake className="w-5 h-5" />}
                  color="cyan"
                />
                <StatCard
                  title="Вылет"
                  value={data.всего.вылет}
                  icon={<Plane className="w-5 h-5" />}
                  color="yellow"
                />
                <StatCard
                  title="% слётов"
                  value={`${data.всего.процент}%`}
                  subtitle={`Осталось: ${data.всего.осталось}`}
                  icon={<TrendingDown className="w-5 h-5" />}
                  color={data.всего.процент >= 50 ? 'red' : data.всего.процент >= 30 ? 'yellow' : 'green'}
                />
              </div>

              {/* Summary table */}
              <SummaryTable 
                ру={data.ру} 
                узб={data.узб} 
                всего={data.всего} 
              />

              {/* Purchases and Remaining TG - Combined Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Закуплено сегодня */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-400" />
                    Закуплено сегодня
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <p className="text-emerald-400 text-3xl font-bold">{data.закупки_тг?.день?.ру || 0}</p>
                      <p className="text-emerald-300/70 text-sm mt-1">РУ</p>
                    </div>
                    <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                      <p className="text-pink-400 text-3xl font-bold">{data.закупки_тг?.день?.узб || 0}</p>
                      <p className="text-pink-300/70 text-sm mt-1">УЗБ</p>
                    </div>
                  </div>
                </div>

                {/* Закуплено за неделю */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-400" />
                    Закуплено за неделю
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <p className="text-emerald-400 text-3xl font-bold">{data.закупки_тг?.неделя?.ру || 0}</p>
                      <p className="text-emerald-300/70 text-sm mt-1">РУ</p>
                    </div>
                    <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                      <p className="text-pink-400 text-3xl font-bold">{data.закупки_тг?.неделя?.узб || 0}</p>
                      <p className="text-pink-300/70 text-sm mt-1">УЗБ</p>
                    </div>
                  </div>
                </div>

                {/* Осталось ТГ */}
                <div className="bg-dark-card border border-accent-green/30 rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-green-400" />
                    💚 Осталось ТГ
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                      <p className="text-emerald-400 text-2xl font-bold">{remainingTG.ру}</p>
                      <p className="text-emerald-300/70 text-xs mt-1">РУ</p>
                    </div>
                    <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded-xl text-center">
                      <p className="text-pink-400 text-2xl font-bold">{remainingTG.узб}</p>
                      <p className="text-pink-300/70 text-xs mt-1">УЗБ</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-center">
                      <p className="text-blue-400 text-2xl font-bold">{remainingTG.всего}</p>
                      <p className="text-blue-300/70 text-xs mt-1">ВСЕГО</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts row */}
              {chartData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <BarChartCard data={chartData} title="Слёты по группам" />
                  </div>
                  <DonutChart data={pieData} title="Распределение слётов" />
                </div>
              )}

              {/* Groups */}
              {data.группы && data.группы.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent-purple" />
                    Группы ({data.группы.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {data.группы.map((group, index) => (
                      <GroupCard key={index} group={group} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null
        )}

        {activeTab === 'groups' && data && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-400">Всего групп: {data.группы?.length || 0}</p>
              <button
                onClick={handleClearCache}
                className="px-4 py-2 bg-accent-purple/20 text-accent-purple rounded-lg hover:bg-accent-purple/30 transition-colors"
              >
                Обновить
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.группы?.map((group, index) => (
                <GroupCard key={index} group={group} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'recordings' && (
          <RecordingsPanel />
        )}

        {activeTab === 'settings' && (
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Настройки</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">API URL</label>
                <input
                  type="text"
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:border-accent-purple outline-none"
                  placeholder="http://localhost:8000"
                  defaultValue={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClearCache}
                  className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80 transition-colors"
                >
                  Очистить кэш
                </button>
                <button
                  onClick={loadData}
                  className="px-4 py-2 bg-dark-hover border border-dark-border text-white rounded-lg hover:border-accent-purple/50 transition-colors"
                >
                  Обновить данные
                </button>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'rooms' || activeTab === 'personal' || activeTab === 'stats') && (
          <div className="flex items-center justify-center h-64 bg-dark-card border border-dark-border rounded-xl">
            <p className="text-gray-400">Раздел в разработке</p>
          </div>
        )}
      </main>
    </div>
  );
}
