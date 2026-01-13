'use client';

import { useState, useEffect } from 'react';
import { PersonalStats as PersonalStatsType, GROUP_NAMES } from '@/types';
import { fetchPersonalStats } from '@/lib/api';
import clsx from 'clsx';
import { User, ChevronDown, Loader2 } from 'lucide-react';

export default function PersonalStatsPanel() {
  const [selectedGroup, setSelectedGroup] = useState(GROUP_NAMES[0]);
  const [data, setData] = useState<PersonalStatsType | null>(null);
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
    } catch (err) {
      setError('Не удалось загрузить данные');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function toggleUser(name: string) {
    const next = new Set(expandedUsers);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setExpandedUsers(next);
  }

  return (
    <div className="space-y-6">
      {/* Group Selector */}
      <div className="flex flex-wrap gap-2">
        {GROUP_NAMES.map((name) => (
          <button
            key={name}
            onClick={() => setSelectedGroup(name)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              selectedGroup === name
                ? 'bg-gradient-to-r from-accent-purple to-accent-blue text-white shadow-lg'
                : 'bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:border-accent-purple/50'
            )}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-accent-purple animate-spin" />
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-dark-card border border-dark-border rounded-xl">
          <p className="text-red-400">{error}</p>
          <button onClick={loadData} className="mt-4 px-4 py-2 bg-accent-purple rounded-lg text-white">
            Повторить
          </button>
        </div>
      ) : data?.юзеры?.length ? (
        <div className="space-y-3">
          {data.юзеры.map((user) => (
            <div key={user.имя} className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
              {/* User Header */}
              <button
                onClick={() => toggleUser(user.имя)}
                className="w-full p-4 flex items-center justify-between hover:bg-dark-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">{user.имя}</p>
                    <p className="text-xs text-gray-500">Строка: {user.строка}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {user.данные?.length > 0 && (
                    <div className="text-right text-sm">
                      <span className="text-purple-400">{user.данные.reduce((s, d) => s + d.тень, 0)} тень</span>
                      <span className="text-gray-500 mx-2">|</span>
                      <span className="text-cyan-400">{user.данные.reduce((s, d) => s + d.мороз, 0)} мороз</span>
                      <span className="text-gray-500 mx-2">|</span>
                      <span className="text-amber-400">{user.данные.reduce((s, d) => s + d.вылет, 0)} вылет</span>
                    </div>
                  )}
                  <ChevronDown className={clsx(
                    'w-5 h-5 text-gray-400 transition-transform',
                    expandedUsers.has(user.имя) && 'rotate-180'
                  )} />
                </div>
              </button>

              {/* User Details */}
              {expandedUsers.has(user.имя) && (
                <div className="border-t border-dark-border p-4">
                  {user.данные?.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-500 uppercase">
                          <th className="text-left py-2">День</th>
                          <th className="text-center py-2 text-purple-400">Тень</th>
                          <th className="text-center py-2 text-cyan-400">Мороз</th>
                          <th className="text-center py-2 text-amber-400">Вылет</th>
                          <th className="text-center py-2">Всего</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.данные.map((day, idx) => (
                          <tr key={idx} className="border-t border-dark-border/50">
                            <td className="py-2 text-white">{day.день}</td>
                            <td className="py-2 text-center text-purple-300">{day.тень}</td>
                            <td className="py-2 text-center text-cyan-300">{day.мороз}</td>
                            <td className="py-2 text-center text-amber-300">{day.вылет}</td>
                            <td className="py-2 text-center text-white font-medium">{day.всего}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Нет данных за эту неделю</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-dark-card border border-dark-border rounded-xl">
          <User className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Нет данных для группы {selectedGroup}</p>
        </div>
      )}
    </div>
  );
}
