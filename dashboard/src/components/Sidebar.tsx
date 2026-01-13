'use client';

import { useState } from 'react';
import { TabType } from '@/types';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isOpen: boolean;
  onClose: () => void;
  status: {
    online: boolean;
    uptime: string;
    groupsCount: number;
  };
}

const tabs: { key: TabType; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Дашборд', icon: '📊' },
  { key: 'rooms', label: 'Комнаты', icon: '🏠' },
  { key: 'groups', label: 'Группы', icon: '👥' },
  { key: 'personal', label: 'Личная статистика', icon: '👤' },
  { key: 'recordings', label: 'Записи', icon: '📹' },
  { key: 'stats', label: 'Статистика бота', icon: '📈' },
  { key: 'settings', label: 'Настройки', icon: '⚙️' },
];

export default function Sidebar({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  status
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleTabClick = (tab: TabType) => {
    onTabChange(tab);
    onClose();
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <span>📊</span>
            </div>
            {!collapsed && (
              <div className="logo-text">
                <span className="logo-title">Статистика</span>
                <span className="logo-subtitle">слётов</span>
              </div>
            )}
          </div>
        </div>

        <nav className="nav">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`nav-item ${activeTab === key ? 'active' : ''}`}
              onClick={() => handleTabClick(key)}
              title={collapsed ? label : undefined}
            >
              <span className="nav-icon">{icon}</span>
              {!collapsed && <span className="nav-label">{label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button 
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <div className="status-box">
          <div className="status-header">
            <span className={`status-dot ${status.online ? 'online' : ''}`} />
            <span className="status-label">
              {status.online ? 'Онлайн' : 'Офлайн'}
            </span>
          </div>
          {!collapsed && (
            <div className="status-details">
              <div>Аптайм: {status.uptime}</div>
              <div>Групп: {status.groupsCount}</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
