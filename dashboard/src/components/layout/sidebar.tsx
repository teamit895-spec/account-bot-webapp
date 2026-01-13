'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Video,
  BarChart3,
  Settings,
  ChevronLeft,
  Activity,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/groups', label: 'Группы', icon: Users },
  { href: '/personal', label: 'Личная статистика', icon: UserCircle },
  { href: '/recordings', label: 'Записи', icon: Video },
  { href: '/bot-stats', label: 'Статистика бота', icon: BarChart3 },
  { href: '/settings', label: 'Настройки', icon: Settings },
];

interface SidebarProps {
  botStatus?: {
    online: boolean;
    uptime: string;
    groups: number;
  };
}

export function Sidebar({ botStatus }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-50 transition-all duration-300',
        'bg-card border-r border-border flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-lg text-white">Stats Bot</h1>
              <p className="text-xs text-gray-500">v2.0 Dashboard</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/10 text-white border-l-2 border-purple-500'
                  : 'text-gray-400 hover:text-white hover:bg-hover'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  isActive
                    ? 'text-purple-400'
                    : 'text-gray-500 group-hover:text-purple-400'
                )}
              />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      {!collapsed && botStatus && (
        <div className="p-3 border-t border-border">
          <div className="p-3 rounded-lg bg-background">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  botStatus.online
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-red-500'
                )}
              />
              <span className="text-sm font-medium text-white">
                {botStatus.online ? 'Онлайн' : 'Офлайн'}
              </span>
            </div>
            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Аптайм</span>
                <span className="text-gray-400">{botStatus.uptime || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Групп</span>
                <span className="text-gray-400">{botStatus.groups}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-hover transition-colors"
      >
        <ChevronLeft
          className={cn(
            'w-4 h-4 text-gray-400 transition-transform',
            collapsed && 'rotate-180'
          )}
        />
      </button>
    </aside>
  );
}
