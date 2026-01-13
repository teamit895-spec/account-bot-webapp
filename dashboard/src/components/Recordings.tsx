'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RecordingsData, RecordingUser, ROOMS, DAYS_OF_WEEK, ALL_HOURS, TOTAL_RECORDING_HOURS, DAYS_SHORT } from '@/types';
import { fetchRecordings, clearRecordingsCache, getVideoStreamUrl, loadRecordingsFromSession, saveRecordingsToSession, clearRecordingsSession } from '@/lib/api';

export default function Recordings() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RecordingsData | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [videoModal, setVideoModal] = useState<{ url: string; title: string } | null>(null);

  const loadTeamRecordings = useCallback(async (teamShort: string, fromCache = true) => {
    setSelectedTeam(teamShort);
    setExpandedUsers(new Set());
    
    if (fromCache) {
      const cached = loadRecordingsFromSession(teamShort);
      if (cached) {
        setData(cached);
        setLoading(false);
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
    setVideoModal({ url, title: `${userId} - ${date} ${hourName}` });
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

  return (
    <div className="recordings-page">
      {/* Room Selector Grid */}
      <div className="rec-rooms-grid">
        {ROOMS.map(room => (
          <button
            key={room.short}
            className={`rec-room-btn ${selectedTeam === room.short ? 'active' : ''}`}
            onClick={() => loadTeamRecordings(room.short)}
          >
            {room.name}
          </button>
        ))}
      </div>

      {/* Refresh Button */}
      {selectedTeam && (
        <div className="rec-actions">
          <button className="action-btn primary" onClick={handleRefresh}>
            Обновить
          </button>
        </div>
      )}

      {/* Content */}
      {!selectedTeam ? (
        <div className="rec-empty-state">
          <div className="icon">📹</div>
          <p>Выберите комнату для просмотра записей</p>
        </div>
      ) : loading ? (
        <div className="rec-loading">
          <div className="loading-spinner" />
          <p>Загрузка записей...</p>
        </div>
      ) : data && data.users && data.users.length > 0 ? (
        <div className="rec-users-list">
          {data.users.map(user => {
            const isExpanded = expandedUsers.has(user.id);
            const todayData = Object.values(user.days || {}).find(d => d.is_today);
            
            let recordedHours = 0;
            let totalSize = 0;
            
            if (todayData?.hours) {
              Object.values(todayData.hours).forEach(h => {
                if (h.available) {
                  recordedHours++;
                  totalSize += h.size_mb || 0;
                }
              });
            }

            const weeklyHours = user.weekly?.recorded_hours || 0;
            const weeklyTotal = user.weekly?.total_hours || (TOTAL_RECORDING_HOURS * 7);
            const weeklyPercent = Math.round((weeklyHours / weeklyTotal) * 100);
            const weeklySize = user.weekly?.size_mb || 0;

            return (
              <div key={user.id} className={`rec-user-card-v2 ${isExpanded ? 'expanded' : ''}`}>
                <div className="rec-user-header-v2" onClick={() => toggleUser(user.id)}>
                  <div className="rec-user-avatar-v2">👤</div>
                  <div className="rec-user-info-v2">
                    <div className="rec-user-name-v2">{user.name}</div>
                    <div className="rec-user-meta-v2">{weeklyHours}/{weeklyTotal} часов</div>
                    <div className="rec-user-progress-bar">
                      <div 
                        className={`rec-user-progress-fill ${getPercentClass(weeklyPercent)}`}
                        style={{ width: `${weeklyPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="rec-user-stats-v2">
                    <div className={`rec-user-percent-v2 ${getPercentClass(weeklyPercent)}`}>
                      {weeklyPercent}%
                    </div>
                    <div className="rec-user-size-v2">{formatSize(weeklySize)}</div>
                  </div>
                  <div className="rec-user-toggle-v2">{isExpanded ? '▲' : '▼'}</div>
                </div>

                {isExpanded && (
                  <div className="rec-user-body-v2">
                    {/* Day Tabs */}
                    <div className="rec-day-tabs">
                      {DAYS_OF_WEEK.map((dayName, idx) => {
                        const dayData = user.days[dayName];
                        const isToday = dayData?.is_today;
                        const isFuture = dayData?.is_future;
                        
                        return (
                          <button
                            key={dayName}
                            className={`rec-day-tab ${selectedDay === dayName ? 'active' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}`}
                            onClick={() => setSelectedDay(dayName)}
                          >
                            {dayData?.date || DAYS_SHORT[idx]}
                          </button>
                        );
                      })}
                    </div>

                    {/* Hours Grid */}
                    {selectedDay && user.days[selectedDay] && (
                      <div className="rec-hours-section">
                        <div className="rec-hours-title">
                          Записи за {selectedDay}:
                        </div>
                        <div className="rec-hours-grid-v2">
                          {ALL_HOURS.map(hourInfo => {
                            const hourData = user.days[selectedDay]?.hours?.[hourInfo.name];
                            const isAvailable = hourData?.available;
                            const isFuture = user.days[selectedDay]?.is_future || 
                              (user.days[selectedDay]?.is_today && hourInfo.hour > getCurrentHour());

                            return (
                              <button
                                key={hourInfo.name}
                                className={`rec-hour-btn-v2 ${isAvailable ? 'available' : ''} ${isFuture ? 'future' : 'missing'}`}
                                onClick={() => isAvailable && !isFuture && selectedTeam && openVideo(
                                  selectedTeam,
                                  user.id,
                                  user.days[selectedDay]?.date || '',
                                  hourInfo.name
                                )}
                                disabled={!isAvailable || isFuture}
                              >
                                {hourInfo.hour}:00
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rec-empty-state">
          <div className="icon">📭</div>
          <p>Нет записей для этой комнаты</p>
          <button className="action-btn primary" onClick={handleRefresh}>
            Повторить
          </button>
        </div>
      )}

      {/* Video Modal */}
      {videoModal && (
        <div className="video-modal-overlay" onClick={() => setVideoModal(null)}>
          <div className="video-modal" onClick={e => e.stopPropagation()}>
            <div className="video-modal-header">
              <span>{videoModal.title}</span>
              <button onClick={() => setVideoModal(null)}>×</button>
            </div>
            <div className="video-modal-content">
              <video src={videoModal.url} controls autoPlay style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
