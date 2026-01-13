// ============================================================================
// ТИПЫ ДАННЫХ STATS BOT DASHBOARD
// ============================================================================

// --- Базовые типы статистики ---

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

// --- Данные группы ---

export interface GroupData {
  имя: string;
  юзеров: number;
  взяли_тг: number;
  тень: number;
  мороз: number;
  вылет: number;
  всего_слётов: number;
  процент: number;
  статус: 'ok' | 'cached' | 'timeout' | 'error' | 'no_chat';
  лист: string;
  ру: StatsBlock;
  узб: StatsBlock;
  закупки_тг?: PurchaseData;
  закупки_тг_неделя?: PurchaseData;
}

// --- Топ пользователи ---

export interface TopUser {
  имя: string;
  группа: string;
  тень: number;
  мороз: number;
  вылет: number;
  всего: number;
}

// --- Метрики ---

export interface Metrics {
  аптайм: string;
  обработано: number;
  записано: number;
  ошибок: number;
  в_очереди: number;
}

// --- Закупки ---

export interface PurchaseData {
  ру: number;
  узб: number;
  всего?: number;
}

// --- Главный Dashboard ---

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

// --- Рейтинг за неделю ---

export interface WeeklyRanking {
  лист: string;
  период: string;
  текущий_день: number;
  группы: RankingGroup[];
  из_кеша?: boolean;
}

export interface RankingGroup {
  имя: string;
  ранг: number;
  средний_процент: number;
  дней_с_данными: number;
  данные_дней: Record<string, { взяли_тг: number; слётов: number; процент: number }>;
  закупки_тг: PurchaseData;
}

// --- Личная статистика ---

export interface PersonalStats {
  group: string;
  sheet: string;
  users_count: number;
  users: PersonalUser[];
  из_кеша?: boolean;
}

export interface PersonalUser {
  name: string;
  row: number;
  type: 'ру' | 'узб';
  days: Record<string, DayStats>;
  weekly: WeeklyUserStats;
}

export interface DayStats {
  took: number;
  shadow: number;
  frost: number;
  flight: number;
  lost: number;
  left: number;
}

export interface WeeklyUserStats {
  took: number;
  shadow: number;
  frost: number;
  flight: number;
  lost: number;
  left: number;
  percent: number;
}

// --- Записи ---

export interface RecordingsData {
  users: RecordingUser[];
  short: string;
  room_name: string;
  is_mock?: boolean;
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

// --- Статус бота ---

export interface BotStatus {
  статус: string;
  аптайм: string;
  сообщений_обработано: number;
  сообщений_записано: number;
  ошибок_за_час: number;
  буфер?: {
    размер: number;
    групп: number;
  };
}

// --- Константы ---

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
] as const;

export const GROUP_NAMES = ROOMS.map(r => r.name);

export const HOURS = Array.from({ length: 15 }, (_, i) => 8 + i); // 8:00 - 22:00

export const DAYS_OF_WEEK = [
  'Понедельник', 'Вторник', 'Среда', 'Четверг', 
  'Пятница', 'Суббота', 'Воскресенье'
] as const;
