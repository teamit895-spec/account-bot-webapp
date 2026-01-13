'use client';

import { useState, useEffect } from 'react';
import { Video, User, ChevronDown, Play, X, Loader2 } from 'lucide-react';
import { Header, ErrorState } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { fetchRecordings, getVideoStreamUrl } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ROOMS, HOURS, type RecordingsData, type RecordingUser } from '@/types';

type RoomType = (typeof ROOMS)[number];

export default function RecordingsPage() {
  const [selectedRoom, setSelectedRoom] = useState<RoomType>(ROOMS[0]);
  const [data, setData] = useState<RecordingsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [videoModal, setVideoModal] = useState<{
    open: boolean;
    url: string;
    title: string;
  }>({ open: false, url: '', title: '' });

  useEffect(() => {
    loadData();
  }, [selectedRoom]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRecordings(selectedRoom.short);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить записи');
    } finally {
      setLoading(false);
    }
  }

  function toggleUser(id: string) {
    const next = new Set(expandedUsers);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedUsers(next);
  }

  function playVideo(user: RecordingUser, date: string, hour: number) {
    const partName = `hour_${hour.toString().padStart(2, '0')}`;
    const url = getVideoStreamUrl(selectedRoom.short, user.id, date, partName);
    setVideoModal({
      open: true,
      url,
      title: `${user.name} • ${date} • ${hour}:00-${hour + 1}:00`,
    });
  }

  return (
    <div className="animate-fade-in">
      <Header title="Записи" />

      {/* Room Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
        {ROOMS.map((room) => (
          <Button
            key={room.short}
            variant={selectedRoom.short === room.short ? 'primary' : 'default'}
            size="sm"
            onClick={() => setSelectedRoom(room)}
          >
            {room.name}
          </Button>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <Button onClick={loadData} disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Обновить
        </Button>
      </div>

      {/* Content */}
      {loading && !data ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-card border border-border rounded-xl animate-skeleton" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : data?.users?.length ? (
        <div className="space-y-4">
          {data.users.map((user) => (
            <UserRecordingCard
              key={user.id}
              user={user}
              expanded={expandedUsers.has(user.id)}
              onToggle={() => toggleUser(user.id)}
              onPlay={(date, hour) => playVideo(user, date, hour)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-20">
            <Video className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-gray-400">Нет записей для {selectedRoom.name}</p>
          </CardContent>
        </Card>
      )}

      {/* Video Modal */}
      {videoModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-5xl bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-white">{videoModal.title}</h3>
              <button
                onClick={() => setVideoModal({ ...videoModal, open: false })}
                className="p-2 hover:bg-hover rounded-lg"
              >
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

function UserRecordingCard({
  user,
  expanded,
  onToggle,
  onPlay,
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
    <Card>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-white">{user.name}</p>
            <p className="text-xs text-gray-500">
              {availableHours}/{user.weekly.total_hours} часов
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-purple-400">{user.weekly.percent}%</p>
            <p className="text-xs text-gray-500">{user.weekly.size_mb.toFixed(1)} MB</p>
          </div>
          <ChevronDown
            className={cn('w-5 h-5 text-gray-400 transition-transform', expanded && 'rotate-180')}
          />
        </div>
      </button>

      {/* Progress Bar */}
      <div className="px-4 pb-2">
        <div className="h-1 bg-background rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
            style={{ width: `${user.weekly.percent}%` }}
          />
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Day Selector */}
          <div className="flex gap-2 flex-wrap">
            {daysArray.map(([date]) => (
              <Button
                key={date}
                variant={selectedDay === date ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedDay(selectedDay === date ? null : date)}
              >
                {new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </Button>
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
                      className={cn(
                        'relative p-2 rounded-lg text-xs font-medium transition-all',
                        isAvailable
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer border border-emerald-500/30'
                          : 'bg-background text-gray-600 cursor-not-allowed'
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
    </Card>
  );
}
