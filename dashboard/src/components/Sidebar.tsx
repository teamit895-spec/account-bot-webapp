'use client';

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
  { key: 'rooms', label: 'Статистика комнат', icon: '🏠' },
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
            <span>Статистика слётов</span>
          </div>
        </div>

        <nav className="nav">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`nav-item ${activeTab === key ? 'active' : ''}`}
              onClick={() => handleTabClick(key)}
            >
              {icon} {label}
            </button>
          ))}
        </nav>

        <div className="status-box">
          <span className={`status-dot ${status.online ? 'online' : ''}`} />
          <span style={{
            fontWeight: 600,
            color: status.online ? 'var(--success)' : 'var(--error)'
          }}>
            {status.online ? 'Онлайн' : 'Офлайн'}
          </span>
          <div className="status-meta">
            Аптайм: {status.uptime}<br />
            Групп: {status.groupsCount}
          </div>
        </div>
      </aside>
    </>
  );
}
