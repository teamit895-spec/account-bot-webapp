'use client';

import { useState, useCallback } from 'react';
import { RecordingsData, RecordingUser, ROOMS, DAYS_OF_WEEK, ALL_HOURS, TOTAL_RECORDING_HOURS, DAYS_SHORT } from '@/types';
import { fetchRecordings, clearRecordingsCache, getVideoStreamUrl, loadRecordingsFromSession, saveRecordingsToSession, clearRecordingsSession } from '@/lib/api';

export default function Recordings() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RecordingsData | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [videoModal, setVideoModal] = useState<{ url: string; title: string } | null>(null);

  const loadTeamRecordings = useCallback(async (teamShort: string, fromCache = true) => {
    setSelectedTeam(teamShort);
    setExpandedUsers(new Set());
    
    if (fromCache) {
      const cached = loadRecordingsFromSession(teamShort);
      if (cached) {
        setData(cached);
        setLoading(false);
        // Background refresh
        fetchRecordings(teamShort).then(fresh => { 
          setData(fresh); 
          saveRecordingsToSession(teamShort, fresh); 
        }).catch(console.error);
        return;
      }
    }
    
    setLoading(true);
    try {
      const result = await fetchRecordings(teamShort);
      setData(result);
      saveRecordingsToSession(teamShort, result);
    } catch (error) {
      console.error('Recordings error:', error);
      setData(null);
    }
    setLoading(false);
  }, []);

  const handleRefresh = async () => {
    clearRecordingsSession();
    try { await clearRecordingsCache(); } catch (e) { console.warn('Cache clear failed:', e); }
    if (selectedTeam) await loadTeamRecordings(selectedTeam, false);
  };

  const toggleUser = (userId: string) => {
    setExpandedUsers(prev => { 
      const next = new Set(prev); 
      if (next.has(userId)) next.delete(userId); 
      else next.add(userId); 
      return next; 
    });
  };

  const openVideo = (teamShort: string, userId: string, date: string, hourName: string) => {
    const url = getVideoStreamUrl(teamShort, userId, date, hourName);
    const userName = userId.replace(/_/g, ' ').toUpperCase();
    setVideoModal({ url, title: `📹 ${userName} — ${date} ${hourName.replace('hour_', '')}:00` });
  };

  const formatSize = (mb: number) => { 
    if (!mb || mb <= 0) return '—'; 
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`; 
    return `${Math.round(mb)} MB`; 
  };

  const getPercentClass = (percent: number) => { 
    if (percent >= 80) return 'good'; 
    if (percent >= 50) return 'warning'; 
    return 'bad'; 
  };

  const getCurrentHour = () => new Date().getHours();

  const selectedTeamName = ROOMS.find(r => r.short === selectedTeam)?.name || '';

  return (
    <div className="recordings-page">
      {/* Info Banner */}
      <div className="rec-info-banner">
        <div className="rec-info-item">
          <span className="icon">⏰</span>
          <span className="label">Расписание:</span>
          <span className="value">08:00 - 23:00 (почасово)</span>
        </div>
        <div className="rec-info-item">
          <span className="icon">📊</span>
          <span className="label">Всего часов:</span>
          <span className="value">{TOTAL_RECORDING_HOURS} в день</span>
        </div>
        <div className="rec-info-item">
          <span className="icon">📅</span>
          <span className="label">Хранение:</span>
          <span className="value">3 дня</span>
        </div>
      </div>

      {/* Team Buttons */}
      <div className="rec-team-buttons">
        {ROOMS.map(room => (
          <button
            key={room.short}
            className={`rec-team-btn ${selectedTeam === room.short ? 'active' : ''}`}
            onClick={() => loadTeamRecordings(room.short)}
          >
            {room.name}
          </button>
        ))}
        <div className="rec-actions-inline">
          <span className="auto-refresh-label" title="Автообновление каждые 60 сек">🔄 Авто</span>
          <button className="rec-team-btn" onClick={handleRefresh} title="Обновить данные записей сейчас">
            ⟳ Обновить
          </button>
        </div>
      </div>

      {/* Content */}
      {!selectedTeam ? (
        <div className="rec-empty">
          <div className="rec-empty-icon">📹</div>
          <p>Выберите команду для просмотра записей</p>
        </div>
      ) : loading ? (
        <div className="rec-loading">
          <div className="loading-spinner" />
          <p>Загрузка записей {selectedTeamName}...</p>
        </div>
      ) : data && data.users && data.users.length > 0 ? (
        <div className="rec-users-grid">
          {data.users.map(user => {
            const isExpanded = expandedUsers.has(user.id);
            
            // Find today's data
            const todayData = Object.values(user.days || {}).find(d => d.is_today);
            
            // Count recorded hours for today
            let recordedHours = 0;
            let todaySize = 0;
            
            if (todayData?.hours) {
              Object.values(todayData.hours).forEach(h => {
                if (h.available) {
                  recordedHours++;
                  todaySize += h.size_mb || 0;
                }
              });
            }

            const todayPercent = Math.round((recordedHours / TOTAL_RECORDING_HOURS) * 100);
            const percentClass = getPercentClass(todayPercent);

            return (
              <div key={user.id} className={`rec-user-card ${isExpanded ? 'expanded' : ''}`}>
                <div className="rec-user-header" onClick={() => toggleUser(user.id)}>
                  <div className="rec-user-avatar">{user.name.charAt(0)}</div>
                  <div className="rec-user-info">
                    <div className="rec-user-name">{user.name}</div>
                    <div className="rec-user-meta">
                      <span>📹 {recordedHours}/{TOTAL_RECORDING_HOURS} часов</span>
                      <span>💾 {formatSize(todaySize)}</span>
                    </div>
                  </div>
                  <div className={`rec-user-percent ${percentClass}`}>{todayPercent}%</div>
                  <div className="rec-user-toggle">▼</div>
                </div>
                
                <div className="rec-user-body">
                  {isExpanded && (
                    <UserDays 
                      user={user} 
                      teamShort={selectedTeam!} 
                      onOpenVideo={openVideo}
                      getCurrentHour={getCurrentHour}
                      formatSize={formatSize}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rec-empty">
          <div className="rec-empty-icon">📭</div>
          <p>Нет записей для {selectedTeamName}</p>
          <button className="btn btn-primary" onClick={handleRefresh} style={{ marginTop: '16px' }}>
            🔄 Повторить
          </button>
        </div>
      )}

      {/* Video Modal */}
      {videoModal && (
        <div className="rec-modal-overlay" onClick={() => setVideoModal(null)}>
          <div className="rec-modal" onClick={e => e.stopPropagation()}>
            <div className="rec-modal-header">
              <div className="rec-modal-title">{videoModal.title}</div>
              <button className="rec-modal-close" onClick={() => setVideoModal(null)}>×</button>
            </div>
            <div className="rec-video-container">
              <video 
                src={videoModal.url} 
                controls 
                autoPlay 
                style={{ width: '100%', maxHeight: '70vh' }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Separate component for user days rendering
function UserDays({ 
  user, 
  teamShort, 
  onOpenVideo, 
  getCurrentHour,
  formatSize 
}: { 
  user: RecordingUser; 
  teamShort: string; 
  onOpenVideo: (team: string, userId: string, date: string, hour: string) => void;
  getCurrentHour: () => number;
  formatSize: (mb: number) => string;
}) {
  return (
    <div className="rec-days-container">
      {DAYS_OF_WEEK.map((dayName, dayIdx) => {
        const dayData = user.days ? user.days[dayName] : null;
        if (!dayData) return null;

        const isToday = dayData.is_today;
        const isFutureDay = dayData.is_future;
        
        // Count hours for this day
        let dayRecorded = 0;
        let daySize = 0;
        if (dayData.hours) {
          Object.values(dayData.hours).forEach(h => {
            if (h.available) {
              dayRecorded++;
              daySize += h.size_mb || 0;
            }
          });
        }

        const dayPercent = Math.round((dayRecorded / TOTAL_RECORDING_HOURS) * 100);

        return (
          <div key={dayName} className={`rec-day-section ${isToday ? 'today' : ''} ${isFutureDay ? 'future' : ''}`}>
            <div className="rec-day-header">
              <span className="rec-day-name">
                {DAYS_SHORT[dayIdx]} {dayData.date ? `(${dayData.date.split('-').slice(1).join('.')})` : ''}
                {isToday && <span className="today-badge">Сегодня</span>}
              </span>
              <span className="rec-day-stats">
                {dayRecorded}/{TOTAL_RECORDING_HOURS} • {formatSize(daySize)}
              </span>
            </div>
            
            <div className="rec-hours-grid">
              {ALL_HOURS.map(hourInfo => {
                const hourData = dayData.hours?.[hourInfo.name];
                const isAvailable = hourData?.available;
                const isFutureHour = isFutureDay || (isToday && hourInfo.hour > getCurrentHour());
                const isCurrentHour = isToday && hourInfo.hour === getCurrentHour();

                let slotClass = 'rec-hour-slot';
                if (isAvailable) slotClass += ' available';
                else slotClass += ' missing';
                if (isFutureHour) slotClass += ' future';
                if (isCurrentHour) slotClass += ' current';

                return (
                  <div
                    key={hourInfo.name}
                    className={slotClass}
                    onClick={() => {
                      if (isAvailable && !isFutureHour && dayData.date) {
                        onOpenVideo(teamShort, user.id, dayData.date, hourInfo.name);
                      }
                    }}
                    title={isAvailable ? `${hourInfo.label} - ${formatSize(hourData?.size_mb || 0)}` : 'Нет записи'}
                  >
                    {hourInfo.hour}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
