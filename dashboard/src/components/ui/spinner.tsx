'use client';

import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-600 border-t-purple-500',
        {
          'w-4 h-4': size === 'sm',
          'w-6 h-6': size === 'md',
          'w-8 h-8': size === 'lg',
        },
        className
      )}
    />
  );
}

export function LoadingOverlay({ message = 'Загрузка...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Spinner size="lg" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}
