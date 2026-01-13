'use client';

import { useState, useEffect } from 'react';
import { RecordingsData, RecordingUser, ROOMS, HOURS } from '@/types';
import { fetchRecordings, getVideoStreamUrl } from '@/lib/api';
import clsx from 'clsx';
import { Video, User, ChevronDown, Play, X, Loader2, Download } from 'lucide-react';

export default function RecordingsPanel() {
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0]);
  const [data, setData] = useState<RecordingsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [videoModal, setVideoModal] = useState<{ open: boolean; url: string; title: string }>({
    open: false, url: '', title: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedRoom]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRecordings(selectedRoom.short);
      setData(result);
    } catch (err) {
      setError('Не удалось загрузить записи');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function toggleUser(id: string) {
    const next = new Set(expandedUsers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedUsers(next);
  }

  function playVideo(user: RecordingUser, date: string, hour: number) {
    const partName = `hour_${hour.toString().padStart(2, '0')}`;
    const url = getVideoStreamUrl(selectedRoom.short, user.id, date, partName);
    setVideoModal({
      open: true,
      url,
      title: `${user.name} • ${date} • ${hour}:00-${hour + 1}:00`
    });
  }

  return (
    <div className="space-y-6">
      {/* Room Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {ROOMS.map((room) => (
          <button
            key={room.short}
            onClick={() => setSelectedRoom(room)}
            className={clsx(
              'px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              selectedRoom.short === room.short
                ? 'bg-gradient-to-r from-accent-purple to-accent-blue text-white shadow-lg shadow-accent-purple/25'
                : 'bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:border-accent-purple/50'
            )}
          >
            {room.name}
          </button>
        ))}
      </div>

      {/* Refresh */}
      <div className="flex justify-end">
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-accent-purple/20 text-accent-purple rounded-lg hover:bg-accent-purple/30 transition-colors flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Обновить
        </button>
      </div>

      {/* Content */}
      {loading && !data ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-dark-card border border-dark-border rounded-xl animate-skeleton" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-dark-card border border-dark-border rounded-xl">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-accent-purple text-white rounded-lg">
            Повторить
          </button>
        </div>
      ) : data?.users?.length ? (
        <div className="space-y-4">
          {data.users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              expanded={expandedUsers.has(user.id)}
              onToggle={() => toggleUser(user.id)}
              onPlay={(date, hour) => playVideo(user, date, hour)}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-dark-card border border-dark-border rounded-xl">
          <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Нет записей для {selectedRoom.name}</p>
        </div>
      )}

      {/* Video Modal */}
      {videoModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-5xl bg-dark-card border border-dark-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-dark-border">
              <h3 className="font-semibold text-white">{videoModal.title}</h3>
              <button onClick={() => setVideoModal({ ...videoModal, open: false })} className="p-2 hover:bg-dark-hover rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <video src={videoModal.url} controls autoPlay className="w-full h-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserCard({ 
  user, 
  expanded, 
  onToggle, 
  onPlay 
}: { 
  user: RecordingUser; 
  expanded: boolean; 
  onToggle: () => void;
  onPlay: (date: string, hour: number) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const daysArray = Object.entries(user.days || {}).sort((a, b) => b[0].localeCompare(a[0]));
  const availableHours = user.weekly.available_hours ?? user.weekly.recorded_hours;

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
      {/* Header */}
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between hover:bg-dark-hover transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-white">{user.name}</p>
            <p className="text-xs text-gray-500">{availableHours}/{user.weekly.total_hours} часов</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-accent-purple">{user.weekly.percent}%</p>
            <p className="text-xs text-gray-500">{user.weekly.size_mb.toFixed(1)} MB</p>
          </div>
          <ChevronDown className={clsx('w-5 h-5 text-gray-400 transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {/* Progress */}
      <div className="px-4 pb-2">
        <div className="h-1 bg-dark-bg rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent-purple to-accent-blue" style={{ width: `${user.weekly.percent}%` }} />
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-dark-border p-4 space-y-4">
          {/* Day Selector */}
          <div className="flex gap-2 flex-wrap">
            {daysArray.map(([date]) => (
              <button
                key={date}
                onClick={() => setSelectedDay(selectedDay === date ? null : date)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  selectedDay === date
                    ? 'bg-accent-purple text-white'
                    : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-hover'
                )}
              >
                {new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </button>
            ))}
          </div>

          {/* Hours Grid */}
          {selectedDay && user.days[selectedDay] && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Записи за {selectedDay}:</p>
              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-15 gap-2">
                {HOURS.map((hour) => {
                  const hourKey = `hour_${hour.toString().padStart(2, '0')}`;
                  const hourData = user.days[selectedDay]?.hours?.[hourKey];
                  const isAvailable = hourData?.available || hourData?.exists;

                  return (
                    <button
                      key={hour}
                      onClick={() => isAvailable && onPlay(selectedDay, hour)}
                      disabled={!isAvailable}
                      className={clsx(
                        'relative p-2 rounded-lg text-xs font-medium transition-all',
                        isAvailable
                          ? 'bg-accent-green/20 text-accent-green hover:bg-accent-green/30 cursor-pointer border border-accent-green/30'
                          : 'bg-dark-bg text-gray-600 cursor-not-allowed'
                      )}
                    >
                      {hour}:00
                      {isAvailable && <Play className="w-3 h-3 absolute bottom-0.5 right-0.5" />}
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
}
