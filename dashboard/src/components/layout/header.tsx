'use client';

import { RefreshCw, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  date?: string;
  day?: string;
  sheet?: string;
  lastUpdate?: Date | null;
  isFromCache?: boolean;
  loading?: boolean;
  onRefresh?: () => void;
}

export function Header({
  title,
  date,
  day,
  sheet,
  lastUpdate,
  isFromCache,
  loading,
  onRefresh,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {(date || sheet || lastUpdate) && (
          <div className="flex items-center gap-4 mt-1 text-sm">
            {date && (
              <span className="text-gray-400 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {date} {day && `(${day})`}
              </span>
            )}
            {sheet && (
              <span className="text-purple-400">📋 {sheet}</span>
            )}
            {lastUpdate && (
              <span className="text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {lastUpdate.toLocaleTimeString('ru-RU')}
              </span>
            )}
            {isFromCache && (
              <span className="text-amber-400 text-xs">из кэша</span>
            )}
          </div>
        )}
      </div>
      
      {onRefresh && (
        <Button onClick={onRefresh} disabled={loading}>
          <RefreshCw
            className={cn('w-4 h-4', loading && 'animate-spin')}
          />
          <span>Обновить</span>
        </Button>
      )}
    </header>
  );
}
