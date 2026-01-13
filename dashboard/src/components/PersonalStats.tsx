'use client';

import { useState, useCallback } from 'react';
import { PersonalStatsResponse, PersonalUser, GroupData, cleanGroupName, PersonalTypeFilter, DAYS_SHORT, ROOMS } from '@/types';
import { fetchPersonalStats } from '@/lib/api';

interface PersonalStatsProps {
  groups: GroupData[];
}

export default function PersonalStats({ groups }: PersonalStatsProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PersonalStatsResponse | null>(null);
  const [typeFilter, setTypeFilter] = useState<PersonalTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const loadPersonalStats = useCallback(async (teamName: string) => {
    setLoading(true);
    setError(null);
    setSelectedTeam(teamName);
    setExpandedCards(new Set());
    
    try {
      const result = await fetchPersonalStats(teamName);
      setData(result);
    } catch (err) {
      console.error('Personal stats error:', err);
      setError('Не удалось загрузить данные');
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

  // Get teams from ROOMS constant
  const teams = ROOMS.map(room => ({
    name: room.name,
    short: room.short
  }));

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

  return (
    <div className="personal-page">
      {/* Team Buttons */}
      <div className="team-buttons-grid">
        {teams.map(t => (
          <button
            key={t.short}
            className={`team-btn-v2 ${selectedTeam === t.name ? 'active' : ''}`}
            onClick={() => loadPersonalStats(t.name)}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="personal-loading">
          <div className="loading-spinner" />
          <p>Загрузка личной статистики...</p>
        </div>
      ) : error ? (
        <div className="personal-error">
          <p className="error-text">{error}</p>
          <button 
            className="action-btn primary"
            onClick={() => selectedTeam && loadPersonalStats(selectedTeam)}
          >
            Повторить
          </button>
        </div>
      ) : !selectedTeam ? (
        <div className="personal-empty">
          <div className="icon">👆</div>
          <h3>Выберите команду</h3>
          <p>Нажмите на кнопку команды выше для просмотра личной статистики</p>
        </div>
      ) : filteredUsers.length === 0 && data ? (
        <div className="personal-empty">
          <div className="icon">🔍</div>
          <h3>Нет данных</h3>
          <p>Не найдено пользователей по заданным критериям</p>
        </div>
      ) : data ? (
        <>
          {/* Filters */}
          <div className="personal-filters-row">
            <input
              type="text"
              placeholder="🔍 Поиск по имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-v2"
            />
            <div className="filter-buttons">
              <button 
                className={`filter-btn-v2 ${typeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                Все
              </button>
              <button 
                className={`filter-btn-v2 ru ${typeFilter === 'ру' ? 'active' : ''}`}
                onClick={() => setTypeFilter('ру')}
              >
                🇷🇺 РУ
              </button>
              <button 
                className={`filter-btn-v2 uz ${typeFilter === 'узб' ? 'active' : ''}`}
                onClick={() => setTypeFilter('узб')}
              >
                🇺🇿 УЗБ
              </button>
            </div>
          </div>

          {/* Users */}
          <div className="personal-users-grid">
            {filteredUsers.map(user => (
              <UserCard 
                key={user.name + user.row} 
                user={user} 
                expanded={expandedCards.has(user.name)} 
                onToggle={() => toggleCard(user.name)} 
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function UserCard({ user, expanded, onToggle }: { user: PersonalUser; expanded: boolean; onToggle: () => void }) {
  const typeClass = user.type === 'узб' ? 'uz' : user.type === 'ру+узб' ? 'ru-uz' : 'ru';
  const typeLabel = user.type === 'узб' ? 'УЗБ' : user.type === 'ру+узб' ? 'РУ+УЗБ' : 'РУ';
  const { took, lost, left, percent } = user.weekly;
  const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

  return (
    <div className={`personal-user-card ${typeClass} ${expanded ? 'expanded' : ''}`}>
      <div className="personal-user-header" onClick={onToggle}>
        <div className="personal-user-info">
          <span className="personal-user-name">{user.name}</span>
          <span className={`personal-user-type ${typeClass}`}>{typeLabel}</span>
        </div>
        <div className="personal-user-right">
          <span className="personal-user-row">#{user.row}</span>
          <span className="expand-icon">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      
      <div className="personal-user-summary">
        <div className="summary-item took">
          <div className="label">Взял ТГ</div>
          <div className="value">{took}</div>
        </div>
        <div className="summary-item lost">
          <div className="label">Слётов</div>
          <div className="value">{lost}</div>
        </div>
        <div className="summary-item left">
          <div className="label">Осталось</div>
          <div className="value">{left}</div>
        </div>
        <div className="summary-item percent">
          <div className="label">% слётов</div>
          <div className="value">{percent}%</div>
        </div>
      </div>

      {expanded && (
        <div className="personal-user-details">
          <div className="days-list">
            {DAYS.map((day, i) => {
              const dd = user.days[day];
              if (!dd || dd.took <= 0) return null;
              return (
                <div key={day} className="day-item">
                  <span className="day-label">{DAYS_SHORT[i]}</span>
                  <span className="day-formula">
                    Взял <span className="took">{dd.took}</span> - вылетело <span className="lost">{dd.lost}</span> = осталось <span className="left">{dd.left}</span>
                  </span>
                </div>
              );
            })}
            {took > 0 && (
              <div className="day-item total">
                <span className="day-label">ИТОГО</span>
                <span className="day-formula">
                  Взял <span className="took">{took}</span> - вылетело <span className="lost">{lost}</span> = осталось <span className="left">{left}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
