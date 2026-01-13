'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, Building2, Users, UserCircle, Video, 
  BarChart3, Settings, ChevronLeft, Activity
} from 'lucide-react';
import { TabType } from '@/types';
import clsx from 'clsx';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  status?: { online: boolean; uptime: string; groups: number };
}

const navItems: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { id: 'rooms', label: 'Комнаты', icon: Building2 },
  { id: 'groups', label: 'Группы', icon: Users },
  { id: 'personal', label: 'Личная статистика', icon: UserCircle },
  { id: 'recordings', label: 'Записи', icon: Video },
  { id: 'stats', label: 'Статистика бота', icon: BarChart3 },
  { id: 'settings', label: 'Настройки', icon: Settings },
];

export default function Sidebar({ activeTab, onTabChange, status }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={clsx(
      'fixed left-0 top-0 h-screen z-50 transition-all duration-300',
      'bg-dark-card border-r border-dark-border flex flex-col',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-dark-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center flex-shrink-0">
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

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                isActive 
                  ? 'bg-gradient-to-r from-accent-purple/20 to-accent-blue/10 text-white border-l-2 border-accent-purple' 
                  : 'text-gray-400 hover:text-white hover:bg-dark-hover'
              )}
            >
              <Icon className={clsx(
                'w-5 h-5 flex-shrink-0',
                isActive ? 'text-accent-purple' : 'text-gray-500 group-hover:text-accent-purple'
              )} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Status */}
      {!collapsed && status && (
        <div className="p-3 border-t border-dark-border">
          <div className="p-3 rounded-lg bg-dark-bg">
            <div className="flex items-center gap-2 mb-2">
              <div className={clsx(
                'w-2 h-2 rounded-full',
                status.online ? 'bg-accent-green status-online' : 'bg-accent-red'
              )} />
              <span className="text-sm font-medium text-white">
                {status.online ? 'Онлайн' : 'Офлайн'}
              </span>
            </div>
            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Аптайм</span>
                <span className="text-gray-400">{status.uptime || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Групп</span>
                <span className="text-gray-400">{status.groups}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-dark-card border border-dark-border flex items-center justify-center hover:bg-dark-hover"
      >
        <ChevronLeft className={clsx('w-4 h-4 text-gray-400', collapsed && 'rotate-180')} />
      </button>
    </aside>
  );
}
