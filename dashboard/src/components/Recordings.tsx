'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RecordingsData, RecordingUser, ROOMS, DAYS_OF_WEEK, ALL_HOURS, TOTAL_RECORDING_HOURS } from '@/types';
import { fetchRecordings, clearRecordingsCache, getVideoStreamUrl, loadRecordingsFromSession, saveRecordingsToSession, clearRecordingsSession } from '@/lib/api';

export default function Recordings() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RecordingsData | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [videoModal, setVideoModal] = useState<{ teamShort: string; userId: string; date: string; currentHour: string; url: string | null; loading: boolean; files: any[] } | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadTeamRecordings = useCallback(async (teamShort: string, fromCache = true) => {
    setSelectedTeam(teamShort);
    setExpandedUsers(new Set());
    if (fromCache) {
      const cached = loadRecordingsFromSession(teamShort);
      if (cached) {
        setData(cached);
        setLoading(false);
        fetchRecordings(teamShort).then(fresh => { setData(fresh); saveRecordingsToSession(teamShort, fresh); }).catch(console.error);
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

  useEffect(() => {
    if (selectedTeam && !videoModal) {
      refreshIntervalRef.current = setInterval(() => loadTeamRecordings(selectedTeam, false), 60000);
    }
    return () => { if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current); };
  }, [selectedTeam, videoModal, loadTeamRecordings]);

  const handleRefresh = async () => {
    clearRecordingsSession();
    try { await clearRecordingsCache(); } catch (e) { console.warn('Cache clear failed:', e); }
    if (selectedTeam) await loadTeamRecordings(selectedTeam, false);
  };

  const toggleUser = (userId: string) => {
    setExpandedUsers(prev => { const next = new Set(prev); if (next.has(userId)) next.delete(userId); else next.add(userId); return next; });
  };

  const openVideo = async (teamShort: string, userId: string, date: string, hourName: string, files: any[] = []) => {
    setVideoModal({ teamShort, userId, date, currentHour: hourName, url: null, loading: true, files });
    if (files.length > 1) { setVideoModal(prev => prev ? { ...prev, loading: false } : null); return; }
    const fileToLoad = files.length === 1 ? files[0].name : hourName;
    await loadVideoUrl(teamShort, userId, date, fileToLoad);
  };

  const loadVideoUrl = async (teamShort: string, userId: string, date: string, partName: string) => {
    setVideoModal(prev => prev ? { ...prev, loading: true } : null);
    const url = getVideoStreamUrl(teamShort, userId, date, partName);
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        setVideoModal(prev => prev ? { ...prev, url, loading: false, currentHour: partName } : null);
      } else {
        setVideoModal(prev => prev ? { ...prev, url: null, loading: false } : null);
      }
    } catch (error) {
      console.error('Video URL error:', error);
      setVideoModal(prev => prev ? { ...prev, url: null, loading: false } : null);
    }
  };

  const closeVideo = () => setVideoModal(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.code === 'Escape' && videoModal) closeVideo(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [videoModal]);

  const formatSize = (mb: number) => { if (!mb || mb <= 0) return '—'; if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`; return `${Math.round(mb)} MB`; };
  const getPercentClass = (percent: number) => { if (percent >= 80) return 'good'; if (percent >= 50) return 'warning'; return 'bad'; };
  const getCurrentHour = () => new Date().getHours();

  return (
    <div>
      <div className="rec-info-banner">
        <div className="rec-info-item"><span className="icon">⏰</span><span className="label">Расписание:</span><span className="value">08:00 - 23:00</span></div>
        <div className="rec-info-item"><span className="icon">📊</span><span className="label">Всего часов:</span><span className="value">{TOTAL_RECORDING_HOURS} в день</span></div>
        <div className="rec-info-item"><span className="icon">📅</span><span className="label">Хранение:</span><span className="value">3 дня</span></div>
      </div>
      <div className="rec-team-buttons">
        {ROOMS.map(room => (
          <button key={room.short} className={`rec-team-btn ${selectedTeam === room.short ? 'active' : ''}`} onClick={() => loadTeamRecordings(room.short)}>{room.name}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🔄 Авто</span>
          <button className="rec-team-btn" onClick={handleRefresh}>⟳ Обновить</button>
        </div>
      </div>
      {!selectedTeam ? (
        <div className="no-data-message"><div className="icon" style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>📹</div><p>Выберите команду для просмотра записей</p></div>
      ) : loading ? (
        <><div className="rec-users-grid">{[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" />)}</div><div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}><p>Загрузка записей...</p></div></>
      ) : data && data.users && data.users.length > 0 ? (
        <div className="rec-users-grid">
          {data.users.map(user => {
            const todayData = Object.values(user.days || {}).find(d => d.is_today);
            let recordedHours = 0, todaySize = 0;
            if (todayData && todayData.hours) { for (const [, hourData] of Object.entries(todayData.hours)) { if (hourData.available === true) { recordedHours++; todaySize += hourData.size_mb || 0; } } }
            const todayPercent = Math.round((recordedHours / TOTAL_RECORDING_HOURS) * 100);
            return (
              <div key={user.id} className={`rec-user-card ${expandedUsers.has(user.id) ? 'expanded' : ''}`}>
                <div className="rec-user-header" onClick={() => toggleUser(user.id)}>
                  <div className="rec-user-avatar">{user.name.charAt(0)}</div>
                  <div className="rec-user-info">
                    <div className="rec-user-name">{user.name}</div>
                    <div className="rec-user-meta"><span>📹 {recordedHours}/{TOTAL_RECORDING_HOURS}</span><span>💾 {formatSize(todaySize)}</span></div>
                  </div>
                  <div className={`rec-user-percent ${getPercentClass(todayPercent)}`}>{todayPercent}%</div>
                  <div className="rec-user-toggle">▼</div>
                </div>
                <div className="rec-user-body">
                  {DAYS_OF_WEEK.map(dayName => {
                    const dayData = user.days[dayName] || { hours: {}, is_future: false, is_today: false, hours_count: 0, total_size_mb: 0, date: '' };
                    const { is_future, is_today, hours = {}, date, total_size_mb } = dayData;
                    let actualRecorded = 0;
                    for (const [, hd] of Object.entries(hours)) { if (hd.available) actualRecorded++; }
                    const dayClass = is_today ? 'today' : is_future ? 'future' : '';
                    return (
                      <div key={dayName} className="rec-day-row">
                        <div className="rec-day-header">
                          <div className={`rec-day-name ${dayClass}`}>{dayName}{is_today ? ' (сегодня)' : ''}</div>
                          <div className="rec-day-stats">{actualRecorded}/{TOTAL_RECORDING_HOURS} • {formatSize(total_size_mb)}</div>
                        </div>
                        <div className="rec-hours-timeline">
                          {ALL_HOURS.map(hourInfo => {
                            const hourData = hours[hourInfo.name] || { available: false, size_mb: 0, files: [] };
                            const isAvailable = hourData.available;
                            const isCurrentHour = is_today && hourInfo.hour === getCurrentHour();
                            const isFutureHour = is_future || (is_today && hourInfo.hour > getCurrentHour());
                            const files = hourData.files || [];
                            let slotClass = 'rec-hour-slot';
                            if (isFutureHour) slotClass += ' future';
                            else if (isAvailable) slotClass += ' available';
                            else slotClass += ' missing';
                            if (isCurrentHour) slotClass += ' current';
                            const canClick = isAvailable && !isFutureHour;
                            return (
                              <div key={hourInfo.name} className={slotClass} title={isAvailable ? `${hourInfo.label} - ${formatSize(hourData.size_mb)}` : 'Нет записи'} onClick={() => canClick && openVideo(selectedTeam!, user.id, date, hourInfo.name, files)} style={{ cursor: canClick ? 'pointer' : 'default' }}>
                                {hourInfo.hour}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-data-message"><div className="icon" style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>📭</div><p>Нет записей</p><button className="btn btn-primary" onClick={handleRefresh} style={{ marginTop: '16px' }}>🔄 Повторить</button></div>
      )}
      {videoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={(e) => e.target === e.currentTarget && closeVideo()}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '550px', maxHeight: '90vh', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>📹 {videoModal.userId.replace(/_/g, ' ').toUpperCase()} — {videoModal.date}</div>
              <button onClick={closeVideo} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ position: 'relative', background: '#000', minHeight: '300px' }}>
              {videoModal.loading ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <div className="loading-spinner" /><p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Загрузка видео...</p>
                </div>
              ) : videoModal.url ? (
                <video src={videoModal.url} controls autoPlay style={{ width: '100%', maxHeight: '50vh' }} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>⚠️</div><p>Видео недоступно</p>
                </div>
              )}
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {videoModal.currentHour ? `Час: ${videoModal.currentHour.replace('hour_', '')}:00` : ''}
              </div>
              {videoModal.url && <a href={videoModal.url} download className="btn btn-primary">⬇️ Скачать</a>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
