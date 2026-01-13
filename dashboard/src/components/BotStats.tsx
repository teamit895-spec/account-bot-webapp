'use client';

import { useState, useEffect } from 'react';
import { BotStatus, Metrics } from '@/types';
import { fetchBotStatus, clearCache } from '@/lib/api';
import clsx from 'clsx';
import { Server, Clock, Database, AlertCircle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';

interface BotStatsProps {
  metrics?: Metrics;
}

export default function BotStatsPanel({ metrics }: BotStatsProps) {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    try {
      const result = await fetchBotStatus();
      setStatus(result);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleClearCache() {
    setClearing(true);
    try {
      await clearCache();
      await loadStatus();
    } catch (err) {
      console.error('Failed to clear cache:', err);
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-accent-purple" />
            Статус бота
          </h2>
          <button
            onClick={loadStatus}
            disabled={loading}
            className="p-2 bg-dark-hover rounded-lg hover:bg-dark-border transition-colors"
          >
            <RefreshCw className={clsx('w-5 h-5 text-gray-400', loading && 'animate-spin')} />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Online Status */}
          <div className="p-4 bg-dark-bg rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              {status?.online ? (
                <CheckCircle className="w-5 h-5 text-accent-green" />
              ) : (
                <AlertCircle className="w-5 h-5 text-accent-red" />
              )}
              <span className="text-sm text-gray-400">Статус</span>
            </div>
            <p className={clsx('text-xl font-bold', status?.online ? 'text-accent-green' : 'text-accent-red')}>
              {status?.online ? 'Онлайн' : 'Офлайн'}
            </p>
          </div>

          {/* Uptime */}
          <div className="p-4 bg-dark-bg rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-accent-blue" />
              <span className="text-sm text-gray-400">Аптайм</span>
            </div>
            <p className="text-xl font-bold text-white">{metrics?.аптайм || status?.uptime || '—'}</p>
          </div>

          {/* Processed */}
          <div className="p-4 bg-dark-bg rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-accent-purple" />
              <span className="text-sm text-gray-400">Обработано</span>
            </div>
            <p className="text-xl font-bold text-white">{metrics?.обработано || 0}</p>
          </div>

          {/* Errors */}
          <div className="p-4 bg-dark-bg rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-accent-red" />
              <span className="text-sm text-gray-400">Ошибок</span>
            </div>
            <p className={clsx('text-xl font-bold', (metrics?.ошибок || 0) > 0 ? 'text-accent-red' : 'text-white')}>
              {metrics?.ошибок || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Cache Management */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Управление кэшем</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-dark-bg rounded-xl">
            <p className="text-sm text-gray-400 mb-1">Кэш дашборда</p>
            <p className="text-white">
              {status?.cache?.dashboard?.size || 0} записей • TTL: {status?.cache?.dashboard?.ttl || 30}с
            </p>
          </div>
          <div className="p-4 bg-dark-bg rounded-xl">
            <p className="text-sm text-gray-400 mb-1">Кэш рейтинга</p>
            <p className="text-white">
              {status?.cache?.ranking?.size || 0} записей • TTL: {status?.cache?.ranking?.ttl || 60}с
            </p>
          </div>
        </div>

        <button
          onClick={handleClearCache}
          disabled={clearing}
          className="px-6 py-3 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80 transition-colors flex items-center gap-2"
        >
          {clearing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          Очистить кэш
        </button>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Метрики</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-dark-bg rounded-xl">
              <p className="text-3xl font-bold text-accent-purple">{metrics.обработано}</p>
              <p className="text-sm text-gray-400">Обработано</p>
            </div>
            <div className="text-center p-4 bg-dark-bg rounded-xl">
              <p className="text-3xl font-bold text-accent-blue">{metrics.записано}</p>
              <p className="text-sm text-gray-400">Записано</p>
            </div>
            <div className="text-center p-4 bg-dark-bg rounded-xl">
              <p className="text-3xl font-bold text-accent-red">{metrics.ошибок}</p>
              <p className="text-sm text-gray-400">Ошибок</p>
            </div>
            <div className="text-center p-4 bg-dark-bg rounded-xl">
              <p className="text-3xl font-bold text-accent-yellow">{metrics.в_очереди}</p>
              <p className="text-sm text-gray-400">В очереди</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
