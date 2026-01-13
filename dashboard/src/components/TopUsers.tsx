'use client';

import { TopUser } from '@/types';
import clsx from 'clsx';
import { Trophy, Medal, Award } from 'lucide-react';

interface TopUsersProps {
  users: TopUser[];
  title?: string;
}

const rankIcons = [Trophy, Medal, Award];
const rankColors = ['text-amber-400', 'text-gray-300', 'text-amber-600'];
const rankBg = ['bg-amber-500/20', 'bg-gray-500/20', 'bg-amber-700/20'];

export default function TopUsers({ users, title = 'Топ слётчиков' }: TopUsersProps) {
  const topThree = users.slice(0, 3);
  const rest = users.slice(3, 10);

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4">
      <h3 className="text-white font-semibold mb-4">{title}</h3>
      
      {/* Top 3 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {topThree.map((user, index) => {
          const Icon = rankIcons[index];
          return (
            <div 
              key={index} 
              className={clsx(
                'p-3 rounded-xl text-center',
                rankBg[index]
              )}
            >
              <Icon className={clsx('w-6 h-6 mx-auto mb-2', rankColors[index])} />
              <p className="text-white font-medium text-sm truncate">{user.имя}</p>
              <p className="text-xs text-gray-400 truncate">{user.группа}</p>
              <p className={clsx('text-lg font-bold mt-1', rankColors[index])}>
                {user.всего}
              </p>
            </div>
          );
        })}
      </div>

      {/* Rest of the list */}
      <div className="space-y-2">
        {rest.map((user, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-2 rounded-lg bg-dark-bg/50 hover:bg-dark-hover transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm font-medium w-5">{index + 4}</span>
              <div>
                <p className="text-white text-sm font-medium">{user.имя}</p>
                <p className="text-xs text-gray-500">{user.группа}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-purple-400">{user.тень}</span>
              <span className="text-gray-600">/</span>
              <span className="text-cyan-400">{user.мороз}</span>
              <span className="text-gray-600">/</span>
              <span className="text-amber-400">{user.вылет}</span>
              <span className="text-white font-bold ml-2">{user.всего}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
