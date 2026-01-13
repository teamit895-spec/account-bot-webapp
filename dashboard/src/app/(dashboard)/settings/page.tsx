'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { clearCache } from '@/lib/api';
import { RefreshCw, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [clearing, setClearing] = useState(false);

  async function handleClearCache() {
    setClearing(true);
    try {
      await clearCache();
      alert('Кэш очищен!');
    } catch (err) {
      alert('Ошибка очистки кэша');
    } finally {
      setClearing(false);
    }
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  return (
    <div className="animate-fade-in">
      <Header title="Настройки" />

      <Card className="max-w-2xl">
        <CardContent className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              API URL
            </label>
            <input
              type="text"
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none"
              value={apiUrl}
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              Изменить в .env.local (NEXT_PUBLIC_API_URL)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Кэширование
            </label>
            <Button onClick={handleClearCache} disabled={clearing} variant="primary">
              {clearing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Очистить кэш
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Версия
            </label>
            <p className="text-white">Stats Bot Dashboard v2.0</p>
            <p className="text-xs text-gray-500 mt-1">
              Next.js 14 + React 18 + TypeScript
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
