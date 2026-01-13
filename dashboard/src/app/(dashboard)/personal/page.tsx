'use client';

import { useState, useEffect } from 'react';
import { User, ChevronDown, Loader2 } from 'lucide-react';
import { Header, ErrorState } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { fetchPersonalStats } from '@/lib/api';
import { cn, getPercentLevel, percentColors } from '@/lib/utils';
import { GROUP_NAMES, DAYS_OF_WEEK, type PersonalStats, type PersonalUser } from '@/types';

export default function PersonalStatsPage() {
  const [selectedGroup, setSelectedGroup] = useState(GROUP_NAMES[0]);
  const [data, setData] = useState<PersonalStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [selectedGroup]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPersonalStats(selectedGroup);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }

  function toggleUser(name: string) {
    const next = new Set(expandedUsers);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    setExpandedUsers(next);
  }

  return (
    <div className="animate-fade-in">
      <Header title="Личная статистика" />

      {/* Group Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {GROUP_NAMES.map((name) => (
          <Button
            key={name}
            variant={selectedGroup === name ? 'primary' : 'default'}
            size="sm"
            onClick={() => setSelectedGroup(name)}
          >
            {name}
          </Button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : data?.users?.length ? (
        <div className="space-y-3">
          {data.users.map((user) => (
            <UserCard
              key={user.name}
              user={user}
              expanded={expandedUsers.has(user.name)}
              onToggle={() => toggleUser(user.name)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-20">
            <User className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-gray-400">Нет данных для группы {selectedGroup}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UserCard({
  user,
  expanded,
  onToggle,
}: {
  user: PersonalUser;
  expanded: boolean;
  onToggle: () => void;
}) {
  const totalShadow = user.weekly?.shadow ?? 0;
  const totalFrost = user.weekly?.frost ?? 0;
  const totalFlight = user.weekly?.flight ?? 0;

  return (
    <Card>
      {/* User Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-white">{user.name}</p>
            <p className="text-xs text-gray-500">Строка: {user.row}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <span className="text-purple-400">{totalShadow} тень</span>
            <span className="text-gray-500 mx-2">|</span>
            <span className="text-cyan-400">{totalFrost} мороз</span>
            <span className="text-gray-500 mx-2">|</span>
            <span className="text-amber-400">{totalFlight} вылет</span>
          </div>
          <ChevronDown
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform',
              expanded && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* User Details */}
      {expanded && (
        <div className="border-t border-border p-4">
          {Object.keys(user.days || {}).length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="text-left py-2">День</th>
                  <th className="text-center py-2">Взял</th>
                  <th className="text-center py-2 text-purple-400">Тень</th>
                  <th className="text-center py-2 text-cyan-400">Мороз</th>
                  <th className="text-center py-2 text-amber-400">Вылет</th>
                  <th className="text-center py-2">Осталось</th>
                </tr>
              </thead>
              <tbody>
                {DAYS_OF_WEEK.map((day) => {
                  const dayData = user.days[day];
                  if (!dayData) return null;
                  return (
                    <tr key={day} className="border-t border-border/50">
                      <td className="py-2 text-white">{day}</td>
                      <td className="py-2 text-center text-white">{dayData.took}</td>
                      <td className="py-2 text-center text-purple-300">{dayData.shadow}</td>
                      <td className="py-2 text-center text-cyan-300">{dayData.frost}</td>
                      <td className="py-2 text-center text-amber-300">{dayData.flight}</td>
                      <td className="py-2 text-center text-emerald-400 font-medium">{dayData.left}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-center py-4">Нет данных за эту неделю</p>
          )}
        </div>
      )}
    </Card>
  );
}
