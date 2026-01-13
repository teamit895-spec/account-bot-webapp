'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import GroupCard from '@/components/GroupCard';
import SummaryTable from '@/components/SummaryTable';
import TopUsers from '@/components/TopUsers';
import { AreaChartCard, BarChartCard, DonutChart } from '@/components/Charts';
import RecordingsPanel from '@/components/RecordingsPanel';
import { LoadingSkeleton, ErrorState } from '@/components/LoadingState';
import { DashboardData, TabType } from '@/types';
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
  Clock
} from 'lucide-react';
import clsx from 'clsx';

// Mock data for demo when API is not available
const mockData: DashboardData = {
  дата: new Date().toISOString().split('T')[0],
  день: 'Понедельник',
  время: new Date().toLocaleTimeString('ru-RU'),
  это_сегодня: true,
  лист: '01.01-07.01',
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
  группы: [
    { имя: 'ВИНН 1', юзеров: 25, взяли_тг: 22, тень: 8, мороз: 4, вылет: 2, всего_слётов: 14, процент: 64, статус: 'ok', лист: '01.01-07.01', ру: { людей: 12, взяли_тг: 11, тень: 4, мороз: 2, вылет: 1, всего: 7, процент: 64 }, узб: { людей: 13, взяли_тг: 11, тень: 4, мороз: 2, вылет: 1, всего: 7, процент: 64 } },
    { имя: 'ВИНН 2', юзеров: 28, взяли_тг: 24, тень: 6, мороз: 3, вылет: 1, всего_слётов: 10, процент: 42, статус: 'ok', лист: '01.01-07.01', ру: { людей: 14, взяли_тг: 12, тень: 3, мороз: 2, вылет: 0, всего: 5, процент: 42 }, узб: { людей: 14, взяли_тг: 12, тень: 3, мороз: 1, вылет: 1, всего: 5, процент: 42 } },
    { имя: 'БОРЦЫ', юзеров: 22, взяли_тг: 18, тень: 5, мороз: 2, вылет: 1, всего_слётов: 8, процент: 44, статус: 'ok', лист: '01.01-07.01', ру: { людей: 11, взяли_тг: 9, тень: 3, мороз: 1, вылет: 0, всего: 4, процент: 44 }, узб: { людей: 11, взяли_тг: 9, тень: 2, мороз: 1, вылет: 1, всего: 4, процент: 44 } },
    { имя: 'КИЕВ', юзеров: 30, взяли_тг: 26, тень: 9, мороз: 5, вылет: 3, всего_слётов: 17, процент: 65, статус: 'ok', лист: '01.01-07.01', ру: { людей: 15, взяли_тг: 13, тень: 5, мороз: 2, вылет: 1, всего: 8, процент: 62 }, узб: { людей: 15, взяли_тг: 13, тень: 4, мороз: 3, вылет: 2, всего: 9, процент: 69 } },
    { имя: 'ЗП 1', юзеров: 20, взяли_тг: 17, тень: 4, мороз: 2, вылет: 1, всего_слётов: 7, процент: 41, статус: 'ok', лист: '01.01-07.01', ру: { людей: 10, взяли_тг: 9, тень: 2, мороз: 1, вылет: 0, всего: 3, процент: 33 }, узб: { людей: 10, взяли_тг: 8, тень: 2, мороз: 1, вылет: 1, всего: 4, процент: 50 } },
    { имя: 'ТОКИО', юзеров: 25, взяли_тг: 21, тень: 7, мороз: 4, вылет: 2, всего_слётов: 13, процент: 62, статус: 'ok', лист: '01.01-07.01', ру: { людей: 13, взяли_тг: 11, тень: 4, мороз: 2, вылет: 1, всего: 7, процент: 64 }, узб: { людей: 12, взяли_тг: 10, тень: 3, мороз: 2, вылет: 1, всего: 6, процент: 60 } },
  ],
  топ_юзеры: [
    { имя: 'Денни Оушен', группа: 'ВИНН 1', тень: 5, мороз: 3, вылет: 2, всего: 10 },
    { имя: 'Бугай', группа: 'ВИНН 2', тень: 4, мороз: 3, вылет: 1, всего: 8 },
    { имя: 'Лепа', группа: 'БОРЦЫ', тень: 4, мороз: 2, вылет: 1, всего: 7 },
    { имя: 'Шторм', группа: 'КИЕВ', тень: 3, мороз: 2, вылет: 1, всего: 6 },
    { имя: 'Рустам', группа: 'ЗП 1', тень: 3, мороз: 1, вылет: 1, всего: 5 },
  ],
  топ_группы: [],
  метрики: {
    аптайм: '24ч 15м',
    обработано: 1250,
    записано: 980,
    ошибок: 3,
    в_очереди: 12
  },
  закупки_тг: {
    день: { ру: 120, узб: 85 },
    неделя: { ру: 450, узб: 320 }
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
      // Use mock data in demo mode
      setData(mockData);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every 60 seconds
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

  return (
    <div className="min-h-screen bg-dark-bg">
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        status={{
          online: true,
          uptime: data?.метрики?.аптайм || '—',
          groups: data?.группы?.length || 0
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
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClearCache}
              className="p-2 rounded-lg bg-dark-card border border-dark-border hover:border-accent-purple/50 transition-colors"
              title="Обновить данные"
            >
              <RefreshCw className={clsx('w-5 h-5 text-gray-400', loading && 'animate-spin')} />
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
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <BarChartCard data={chartData} title="Слёты по группам" />
                </div>
                <DonutChart data={pieData} title="Распределение слётов" />
              </div>

              {/* Groups and Top users */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="text-white font-semibold mb-4">Группы</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.группы?.slice(0, 6).map((group, index) => (
                      <GroupCard key={index} group={group} />
                    ))}
                  </div>
                </div>
                <TopUsers users={data.топ_юзеры || []} />
              </div>

              {/* Purchases */}
              {data.закупки_тг && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                    <h3 className="text-white font-semibold mb-3">📦 Закуплено сегодня</h3>
                    <div className="flex gap-4">
                      <div className="flex-1 p-3 bg-emerald-500/10 rounded-lg">
                        <p className="text-emerald-400 text-2xl font-bold">{data.закупки_тг.день.ру}</p>
                        <p className="text-emerald-300/70 text-sm">РУ</p>
                      </div>
                      <div className="flex-1 p-3 bg-pink-500/10 rounded-lg">
                        <p className="text-pink-400 text-2xl font-bold">{data.закупки_тг.день.узб}</p>
                        <p className="text-pink-300/70 text-sm">УЗБ</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                    <h3 className="text-white font-semibold mb-3">📊 Закуплено за неделю</h3>
                    <div className="flex gap-4">
                      <div className="flex-1 p-3 bg-emerald-500/10 rounded-lg">
                        <p className="text-emerald-400 text-2xl font-bold">{data.закупки_тг.неделя.ру}</p>
                        <p className="text-emerald-300/70 text-sm">РУ</p>
                      </div>
                      <div className="flex-1 p-3 bg-pink-500/10 rounded-lg">
                        <p className="text-pink-400 text-2xl font-bold">{data.закупки_тг.неделя.узб}</p>
                        <p className="text-pink-300/70 text-sm">УЗБ</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null
        )}

        {activeTab === 'groups' && data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.группы?.map((group, index) => (
              <GroupCard key={index} group={group} />
            ))}
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
                  className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white"
                  placeholder="http://localhost:8000"
                  defaultValue={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
                />
              </div>
              <button
                onClick={handleClearCache}
                className="px-4 py-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80 transition-colors"
              >
                Очистить кэш
              </button>
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
