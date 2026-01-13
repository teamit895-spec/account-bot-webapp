'use client';

import { useState, useEffect } from 'react';
import { RecordingsData, RecordingUser, DayRecording } from '@/types';
import { fetchRecordings, getVideoStreamUrl } from '@/lib/api';
import clsx from 'clsx';
import { Video, User, Calendar, Clock, ChevronDown, Play, X } from 'lucide-react';

const ROOMS = [
  { name: 'ВИНН 1', short: 'vinn1' },
  { name: 'ВИНН 2', short: 'vinn2' },
  { name: 'БОРЦЫ', short: 'borcy' },
  { name: 'КИЕВ РЕКТОРАТ', short: 'kiev' },
  { name: 'ЗП 1', short: 'zp1' },
  { name: 'ЗП 2', short: 'zp2' },
  { name: 'АЗОВ 1', short: 'azov1' },
  { name: 'АЗОВ 2', short: 'azov2' },
  { name: 'ТОКИО', short: 'tokio' },
  { name: 'БЕРДЯНСК 1', short: 'berd1' },
  { name: 'БЕРДЯНСК 2', short: 'berd2' },
  { name: 'ЯРЫЙ', short: 'yaryj' },
  { name: 'ТК РЕКТОРАТ', short: 'tk_rekt' },
  { name: 'ГАЗОН', short: 'gazon' },
];

const HOURS = Array.from({ length: 15 }, (_, i) => 8 + i);

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}

function VideoModal({ isOpen, onClose, videoUrl, title }: VideoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl mx-4">
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-dark-border">
            <h3 className="font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="aspect-video bg-black">
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface UserCardProps {
  user: RecordingUser;
  teamShort: string;
  onPlayVideo: (user: string, date: string, hour: number) => void;
}

function UserCard({ user, teamShort, onPlayVideo }: UserCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const daysArray = Object.entries(user.days || {}).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-dark-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-white">{user.name}</p>
            <p className="text-xs text-gray-500">
              {user.weekly.available_hours || user.weekly.recorded_hours}/{user.weekly.total_hours} часов
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-accent-purple">{user.weekly.percent}%</p>
            <p className="text-xs text-gray-500">{user.weekly.size_mb.toFixed(1)} MB</p>
          </div>
          <ChevronDown className={clsx(
            'w-5 h-5 text-gray-400 transition-transform',
            expanded && 'rotate-180'
          )} />
        </div>
      </button>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="h-1 bg-dark-bg rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-accent-purple to-accent-blue"
            style={{ width: `${user.weekly.percent}%` }}
          />
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-dark-border p-4 space-y-4">
          {/* Day selector */}
          <div className="flex gap-2 flex-wrap">
            {daysArray.map(([date, day]) => (
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

          {/* Hours grid */}
          {selectedDay && user.days[selectedDay] && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Записи за {selectedDay}:</p>
              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-15 gap-2">
                {HOURS.map((hour) => {
                  const hourKey = `hour_${hour.toString().padStart(2, '0')}`;
                  const hourData = user.days[selectedDay].hours[hourKey];
                  const isAvailable = hourData?.available || hourData?.exists;

                  return (
                    <button
                      key={hour}
                      onClick={() => isAvailable && onPlayVideo(user.id, selectedDay, hour)}
                      disabled={!isAvailable}
                      className={clsx(
                        'relative p-2 rounded-lg text-xs font-medium transition-all',
                        isAvailable
                          ? 'bg-accent-green/20 text-accent-green hover:bg-accent-green/30 cursor-pointer'
                          : 'bg-dark-bg text-gray-600 cursor-not-allowed'
                      )}
                    >
                      {hour}:00
                      {isAvailable && (
                        <Play className="w-3 h-3 absolute bottom-0.5 right-0.5" />
                      )}
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

export default function RecordingsPanel() {
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0]);
  const [data, setData] = useState<RecordingsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoModal, setVideoModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: '',
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

  function handlePlayVideo(userId: string, date: string, hour: number) {
    const partName = `hour_${hour.toString().padStart(2, '0')}`;
    const url = getVideoStreamUrl(selectedRoom.short, userId, date, partName);
    setVideoModal({
      isOpen: true,
      url,
      title: `${userId} - ${date} ${hour}:00`,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Записи работы</h2>
          <p className="text-gray-400 text-sm mt-1">Просмотр видеозаписей по комнатам</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-accent-purple/20 text-accent-purple rounded-lg hover:bg-accent-purple/30 transition-colors"
        >
          Обновить
        </button>
      </div>

      {/* Room selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {ROOMS.map((room) => (
          <button
            key={room.short}
            onClick={() => setSelectedRoom(room)}
            className={clsx(
              'px-4 py-3 rounded-xl text-sm font-medium transition-all',
              selectedRoom.short === room.short
                ? 'bg-gradient-to-r from-accent-purple to-accent-blue text-white shadow-lg shadow-accent-purple/25'
                : 'bg-dark-card border border-dark-border text-gray-400 hover:text-white hover:border-accent-purple/50'
            )}
          >
            {room.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-dark-card border border-dark-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-dark-card border border-dark-border rounded-xl">
          <p className="text-red-400">{error}</p>
        </div>
      ) : data?.users?.length ? (
        <div className="space-y-4">
          {data.users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              teamShort={selectedRoom.short}
              onPlayVideo={handlePlayVideo}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center bg-dark-card border border-dark-border rounded-xl">
          <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Нет записей для этой комнаты</p>
        </div>
      )}

      {/* Video Modal */}
      <VideoModal
        isOpen={videoModal.isOpen}
        onClose={() => setVideoModal({ ...videoModal, isOpen: false })}
        videoUrl={videoModal.url}
        title={videoModal.title}
      />
    </div>
  );
}
