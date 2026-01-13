'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <p className="text-gray-400 mb-4 text-center max-w-md">{message}</p>
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            <RefreshCw className="w-4 h-4" />
            Повторить
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
