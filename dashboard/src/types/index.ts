export interface DashboardData {
  дата: string;
  день: string;
  время?: string;
  это_сегодня: boolean;
  лист: string;
  статус?: string;
  всего: TotalStats;
  ру: StatsBlock;
  узб: StatsBlock;
  группы: GroupData[];
  топ_юзеры: TopUser[];
  топ_группы: GroupData[];
  метрики: Metrics;
  закупки_тг?: {
    день: PurchaseData;
    неделя: PurchaseData;
  };
  из_кеша?: boolean;
}

export interface TotalStats {
  юзеров: number;
  взяли_тг: number;
  тень: number;
  мороз: number;
  вылет: number;
  всего_слётов: number;
  процент: number;
  осталось: number;
}

export interface StatsBlock {
  людей: number;
  взяли_тг: number;
  тень: number;
  мороз: number;
  вылет: number;
  всего: number;
  процент: number;
  осталось?: number;
}

export interface GroupData {
  имя: string;
  юзеров: number;
  взяли_тг: number;
  тень: number;
  мороз: number;
  вылет: number;
  всего_слётов: number;
  процент: number;
  статус: string;
  лист: string;
  ру: StatsBlock;
  узб: StatsBlock;
  закупки_тг?: PurchaseData;
  закупки_тг_неделя?: PurchaseData;
}

export interface TopUser {
  имя: string;
  группа: string;
  тень: number;
  мороз: number;
  вылет: number;
  всего: number;
}

export interface Metrics {
  аптайм: string;
  обработано: number;
  записано: number;
  ошибок: number;
  в_очереди: number;
}

export interface PurchaseData {
  ру: number;
  узб: number;
  всего?: number;
}

export interface WeeklyRanking {
  лист: string;
  дата: string;
  группы: RankingGroup[];
}

export interface RankingGroup {
  имя: string;
  юзеры: RankingUser[];
}

export interface RankingUser {
  имя: string;
  тень: number;
  мороз: number;
  вылет: number;
  всего: number;
}

export interface PersonalStats {
  группа: string;
  юзеры: PersonalUser[];
}

export interface PersonalUser {
  имя: string;
  строка: number;
  данные: UserDayData[];
}

export interface UserDayData {
  день: string;
  тень: number;
  мороз: number;
  вылет: number;
  всего: number;
}

export interface RecordingsData {
  users: RecordingUser[];
  short: string;
  room_name: string;
}

export interface RecordingUser {
  name: string;
  id: string;
  row: number;
  weekly: {
    total_hours: number;
    recorded_hours: number;
    available_hours?: number;
    size_mb: number;
    percent: number;
  };
  days: Record<string, DayRecording>;
}

export interface DayRecording {
  date: string;
  hours: Record<string, HourData>;
  hours_count: number;
  total_hours: number;
  total_size_mb: number;
  is_future: boolean;
  is_today: boolean;
}

export interface HourData {
  available: boolean;
  exists: boolean;
  size_mb: number;
  files?: { name: string; size_mb: number }[];
}

export interface BotStatus {
  online: boolean;
  uptime: string;
  version: string;
  groups_count: number;
  cache: {
    dashboard: { size: number; ttl: number };
    ranking: { size: number; ttl: number };
  };
}

export type TabType = 'dashboard' | 'rooms' | 'groups' | 'personal' | 'recordings' | 'stats' | 'settings';

export const ROOMS = [
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

export const HOURS = Array.from({ length: 15 }, (_, i) => 8 + i);

export const GROUP_NAMES = [
  'ВИНН 1', 'ВИНН 2', 'БОРЦЫ', 'КИЕВ РЕКТОРАТ', 'ЗП 1', 'ЗП 2',
  'АЗОВ 1', 'АЗОВ 2', 'ТОКИО', 'БЕРДЯНСК 1', 'БЕРДЯНСК 2', 'ЯРЫЙ', 'ТК РЕКТОРАТ', 'ГАЗОН'
];
