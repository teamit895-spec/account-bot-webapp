'use client';

import { useState, useEffect } from 'react';
import { Server, Clock, Database, AlertCircle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { fetchBotStatus, clearCache } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { BotStatus, Metrics } from '@/types';

export default function BotStatsPage() {
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

  const isOnline = status?.статус === 'онлайн';

  return (
    <div className="animate-fade-in">
      <Header title="Статистика бота" />

      <div className="space-y-6">
        {/* Status Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Server className="w-6 h-6 text-purple-400" />
                Статус бота
              </h2>
              <Button onClick={loadStatus} disabled={loading} variant="ghost" size="sm">
                <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
              </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Online Status */}
              <div className="p-4 bg-background rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  {isOnline ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className="text-sm text-gray-400">Статус</span>
                </div>
                <p className={cn('text-xl font-bold', isOnline ? 'text-emerald-400' : 'text-red-400')}>
                  {isOnline ? 'Онлайн' : 'Офлайн'}
                </p>
              </div>

              {/* Uptime */}
              <div className="p-4 bg-background rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-400">Аптайм</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {status?.аптайм || '—'}
                </p>
              </div>

              {/* Processed */}
              <div className="p-4 bg-background rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-gray-400">Обработано</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {status?.сообщений_обработано || 0}
                </p>
              </div>

              {/* Errors */}
              <div className="p-4 bg-background rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-gray-400">Ошибок за час</span>
                </div>
                <p className={cn(
                  'text-xl font-bold',
                  (status?.ошибок_за_час || 0) > 0 ? 'text-red-400' : 'text-white'
                )}>
                  {status?.ошибок_за_час || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cache Management */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Управление кэшем</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-background rounded-xl">
                <p className="text-sm text-gray-400 mb-1">Размер буфера</p>
                <p className="text-white">
                  {status?.буфер?.размер || 0} записей
                </p>
              </div>
              <div className="p-4 bg-background rounded-xl">
                <p className="text-sm text-gray-400 mb-1">Групп в буфере</p>
                <p className="text-white">
                  {status?.буфер?.групп || 0}
                </p>
              </div>
            </div>

            <Button onClick={handleClearCache} disabled={clearing} variant="primary">
              {clearing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              Очистить кэш
            </Button>
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Метрики</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-background rounded-xl">
                <p className="text-3xl font-bold text-purple-400">
                  {status?.сообщений_обработано || 0}
                </p>
                <p className="text-sm text-gray-400">Обработано</p>
              </div>
              <div className="text-center p-4 bg-background rounded-xl">
                <p className="text-3xl font-bold text-blue-400">
                  {status?.сообщений_записано || 0}
                </p>
                <p className="text-sm text-gray-400">Записано</p>
              </div>
              <div className="text-center p-4 bg-background rounded-xl">
                <p className="text-3xl font-bold text-red-400">
                  {status?.ошибок_за_час || 0}
                </p>
                <p className="text-sm text-gray-400">Ошибок</p>
              </div>
              <div className="text-center p-4 bg-background rounded-xl">
                <p className="text-3xl font-bold text-amber-400">
                  {status?.буфер?.размер || 0}
                </p>
                <p className="text-sm text-gray-400">В очереди</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
