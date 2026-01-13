'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header, ErrorState } from '@/components/layout';
import { LoadingOverlay } from '@/components/ui';
import { GroupCard } from '@/components/dashboard';
import { fetchDashboard, clearCache } from '@/lib/api';
import type { DashboardData } from '@/types';

export default function GroupsPage() {
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    try { await clearCache(); } catch {}
    await loadData();
  };

  if (loading && !data) {
    return <LoadingOverlay message="Загрузка групп..." />;
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="animate-fade-in">
      <Header
        title="Группы"
        date={data?.дата}
        day={data?.день}
        lastUpdate={lastUpdate}
        loading={loading}
        onRefresh={handleRefresh}
      />

      {data?.группы && data.группы.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.группы.map((group, idx) => (
            <GroupCard key={idx} group={group} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          Нет данных о группах
        </div>
      )}
    </div>
  );
}
