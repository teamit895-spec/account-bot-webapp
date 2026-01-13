'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Target, Ghost, Snowflake, Plane, TrendingDown } from 'lucide-react';
import { Header, ErrorState } from '@/components/layout';
import { StatCard, LoadingOverlay } from '@/components/ui';
import { StatsTable, GroupCard, PurchasesBlock } from '@/components/dashboard';
import { fetchDashboard, clearCache } from '@/lib/api';
import { getPercentLevel } from '@/lib/utils';
import type { DashboardData } from '@/types';

export default function DashboardPage() {
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
    try {
      await clearCache();
    } catch {}
    await loadData();
  };

  // Loading state
  if (loading && !data) {
    return <LoadingOverlay message="Загрузка дашборда..." />;
  }

  // Error state
  if (error && !data) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  // No data
  if (!data) {
    return <ErrorState message="Нет данных" onRetry={loadData} />;
  }

  // Calculate values
  const purchasesToday = data.закупки_тг?.день ?? { ру: 0, узб: 0 };
  const purchasesWeek = data.закупки_тг?.неделя ?? { ру: 0, узб: 0 };
  const remaining = {
    ру: data.ру?.осталось ?? 0,
    узб: data.узб?.осталось ?? 0,
    всего: data.всего?.осталось ?? 0,
  };

  const percentLevel = getPercentLevel(data.всего?.процент ?? 0);
  const percentColor = percentLevel === 'danger' ? 'red' : percentLevel === 'warning' ? 'yellow' : 'green';

  return (
    <div className="animate-fade-in">
      <Header
        title="Дашборд"
        date={data.дата}
        day={data.день}
        sheet={data.лист}
        lastUpdate={lastUpdate}
        isFromCache={data.из_кеша}
        loading={loading}
        onRefresh={handleRefresh}
      />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Всего людей"
            value={data.всего?.юзеров ?? 0}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Взяли ТГ"
            value={data.всего?.взяли_тг ?? 0}
            icon={Target}
            color="green"
          />
          <StatCard
            title="Тень"
            value={data.всего?.тень ?? 0}
            icon={Ghost}
            color="purple"
          />
          <StatCard
            title="Мороз"
            value={data.всего?.мороз ?? 0}
            icon={Snowflake}
            color="cyan"
          />
          <StatCard
            title="Вылет"
            value={data.всего?.вылет ?? 0}
            icon={Plane}
            color="yellow"
          />
          <StatCard
            title="% слётов"
            value={`${data.всего?.процент ?? 0}%`}
            subtitle={`Осталось: ${data.всего?.осталось ?? 0}`}
            icon={TrendingDown}
            color={percentColor}
          />
        </div>

        {/* Stats Table */}
        <StatsTable ру={data.ру} узб={data.узб} всего={data.всего} />

        {/* Purchases Block */}
        <PurchasesBlock
          today={purchasesToday}
          week={purchasesWeek}
          remaining={remaining}
        />

        {/* Groups */}
        {data.группы && data.группы.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
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
    </div>
  );
}
