'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { fetchDashboard } from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [botStatus, setBotStatus] = useState({
    online: false,
    uptime: '—',
    groups: 0,
  });

  const loadStatus = useCallback(async () => {
    try {
      const data = await fetchDashboard();
      setBotStatus({
        online: true,
        uptime: data.метрики?.аптайм || '—',
        groups: data.группы?.length || 0,
      });
    } catch {
      setBotStatus(prev => ({ ...prev, online: false }));
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 60000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar botStatus={botStatus} />
      <main className="ml-64 min-h-screen p-6">
        {children}
      </main>
    </div>
  );
}
