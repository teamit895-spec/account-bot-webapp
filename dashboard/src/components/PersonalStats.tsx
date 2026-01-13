'use client';

import { useState, useCallback } from 'react';
import { PersonalStatsResponse, PersonalUser, GroupData, cleanGroupName, PersonalTypeFilter, DAYS_SHORT } from '@/types';
import { fetchPersonalStats } from '@/lib/api';

interface PersonalStatsProps {
  groups: GroupData[];
}

export default function PersonalStats({ groups }: PersonalStatsProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PersonalStatsResponse | null>(null);
  const [typeFilter, setTypeFilter] = useState<PersonalTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const loadPersonalStats = useCallback(async (teamName: string) => {
    setLoading(true);
    setSelectedTeam(teamName);
    setExpandedCards(new Set());
    try {
      const result = await fetchPersonalStats(teamName);
      setData(result);
    } catch (error) {
      console.error('Personal stats error:', error);
      setData(null);
    }
    setLoading(false);
  }, []);

  const toggleCard = (userId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  let filteredUsers = data?.users || [];
  if (typeFilter !== 'all') {
    filteredUsers = filteredUsers.filter(u => {
      if (typeFilter === 'ру') return u.type === 'ру' || u.type === 'ру+узб';
      if (typeFilter === 'узб') return u.type === 'узб' || u.type === 'ру+узб';
      return u.type === typeFilter;
    });
  }
  if (searchQuery) {
    const search = searchQuery.toLowerCase();
    filteredUsers = filteredUsers.filter(u => u.name.toLowerCase().includes(search));
  }

  const teams = groups.map(gr => ({
    name: gr.имя,
    cleanName: cleanGroupName(gr.имя),
    count: gr.юзеров || 0
  }));

  return (
    <div>
      <div className="team-buttons">
        {teams.map(t => (
          <button
            key={t.name}
            className={`team-btn ${selectedTeam === t.name ? 'active' : ''}`}
            onClick={() => loadPersonalStats(t.name)}
          >
            {t.cleanName}
            <span className="team-count">{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="no-data-message">
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          <p>Загрузка личной статистики...</p>
        </div>
      ) : !selectedTeam ? (
        <div className="no-data-message">
          <div className="icon">👆</div>
          <h3>Выберите команду</h3>
          <p>Нажмите на кнопку команды выше для просмотра личной статистики</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="no-data-message">
          <div className="icon">🔍</div>
          <h3>Нет данных</h3>
          <p>Не найдено пользователей по заданным критериям</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="🔍 Поиск по имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, minWidth: '200px', padding: '10px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.875rem' }}
            />
            <button className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>Все</button>
            <button className={`filter-btn ru ${typeFilter === 'ру' ? 'active' : ''}`} onClick={() => setTypeFilter('ру')}>🇷🇺 РУ</button>
            <button className={`filter-btn uzb ${typeFilter === 'узб' ? 'active' : ''}`} onClick={() => setTypeFilter('узб')}>🇺🇿 УЗБ</button>
          </div>
          <div className="users-grid">
            {filteredUsers.map(user => (
              <UserCard key={user.name + user.row} user={user} expanded={expandedCards.has(user.name)} onToggle={() => toggleCard(user.name)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function UserCard({ user, expanded, onToggle }: { user: PersonalUser; expanded: boolean; onToggle: () => void }) {
  const typeClass = user.type === 'узб' ? 'uzb' : 'ru';
  const typeLabel = user.type === 'узб' ? 'УЗБ' : user.type === 'ру+узб' ? 'РУ+УЗБ' : 'РУ';
  const { took, lost, left, percent } = user.weekly;
  const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

  return (
    <div className={`user-card ${typeClass}${expanded ? ' expanded' : ''}`}>
      <div className="user-card-header" onClick={onToggle}>
        <div className="user-name">
          {user.name}
          <span className="user-type-badge">{typeLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="user-row-badge">#{user.row}</span>
          <span className="expand-icon">▼</span>
        </div>
      </div>
      <div className="user-card-summary">
        <div className="summary-item took"><div className="summary-item-label">Взял ТГ</div><div className="summary-item-value">{took}</div></div>
        <div className="summary-item lost"><div className="summary-item-label">Слётов</div><div className="summary-item-value">{lost}</div></div>
        <div className="summary-item left"><div className="summary-item-label">Осталось</div><div className="summary-item-value">{left}</div></div>
        <div className="summary-item percent"><div className="summary-item-label">% слётов</div><div className="summary-item-value">{percent}%</div></div>
      </div>
      <div className="user-card-details">
        <div className="days-breakdown">
          {DAYS.map((day, i) => {
            const dd = user.days[day];
            if (!dd || dd.took <= 0) return null;
            return (
              <div key={day} className="day-row">
                <div className="day-name">{DAYS_SHORT[i]}</div>
                <div className="day-formula">
                  Взял <span className="took">{dd.took}</span> - вылетело <span className="lost">{dd.lost}</span> = осталось <span className="left">{dd.left}</span>
                </div>
              </div>
            );
          })}
          {took > 0 && (
            <div className="day-row total-row">
              <div className="day-name">ИТОГО</div>
              <div className="day-formula">
                Взял <span className="took">{took}</span> - вылетело <span className="lost">{lost}</span> = осталось <span className="left">{left}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
