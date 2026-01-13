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
  { key: 'recordings', label: 'Записи работы', icon: '📹' },
  { key: 'stats', label: 'Статистика', icon: '📈' },
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

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">📊</div>
            <div className="logo-text">
              <span className="logo-title">Stats Bot</span>
              <span className="logo-sub">v2.0 Dashboard</span>
            </div>
          </div>
        </div>

        <nav className="nav">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`nav-item ${activeTab === key ? 'active' : ''}`}
              onClick={() => handleTabClick(key)}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-collapse">
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <div className="status-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span className={`status-dot ${status.online ? 'online' : ''}`} />
            <span style={{
              fontWeight: 600,
              fontSize: '0.75rem',
              color: status.online ? 'var(--success)' : 'var(--error)'
            }}>
              {status.online ? 'Онлайн' : 'Офлайн'}
            </span>
          </div>
          <div className="status-meta">
            Аптайм: {status.uptime}<br />
            Групп: {status.groupsCount}
          </div>
        </div>
      </aside>
    </>
  );
}
