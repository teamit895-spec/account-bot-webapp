'use client';

import { Package, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { PurchaseData } from '@/types';

interface PurchasesBlockProps {
  today: PurchaseData;
  week: PurchaseData;
  remaining: { ру: number; узб: number; всего: number };
}

export function PurchasesBlock({ today, week, remaining }: PurchasesBlockProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Today */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            📦 Закуплено сегодня
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="flex items-baseline gap-2">
                <span className="text-emerald-400 text-3xl font-bold">{today.ру}</span>
                <span className="text-emerald-300/70 text-sm">РУ</span>
              </div>
            </div>
            <div className="flex-1 p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
              <div className="flex items-baseline gap-2">
                <span className="text-pink-400 text-3xl font-bold">{today.узб}</span>
                <span className="text-pink-300/70 text-sm">УЗБ</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Week */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            📊 Закуплено за неделю
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="flex items-baseline gap-2">
                <span className="text-emerald-400 text-3xl font-bold">{week.ру}</span>
                <span className="text-emerald-300/70 text-sm">РУ</span>
              </div>
            </div>
            <div className="flex-1 p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
              <div className="flex items-baseline gap-2">
                <span className="text-pink-400 text-3xl font-bold">{week.узб}</span>
                <span className="text-pink-300/70 text-sm">УЗБ</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remaining */}
      <Card className="border-emerald-500/30">
        <CardContent className="p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-green-400" />
            💚 Осталось ТГ
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
              <div className="text-emerald-400 text-2xl font-bold">{remaining.ру}</div>
              <div className="text-emerald-300/70 text-xs">РУ</div>
            </div>
            <div className="flex-1 p-3 bg-pink-500/10 border border-pink-500/30 rounded-xl text-center">
              <div className="text-pink-400 text-2xl font-bold">{remaining.узб}</div>
              <div className="text-pink-300/70 text-xs">УЗБ</div>
            </div>
            <div className="flex-1 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-center">
              <div className="text-blue-400 text-2xl font-bold">{remaining.всего}</div>
              <div className="text-blue-300/70 text-xs">ВСЕГО</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
