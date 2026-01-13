// ===== Dashboard Data =====
export interface DashboardData {
  дата: string;
  выбранная_дата?: string;
  день: string;
  время?: string;
  часовой_пояс?: string;
  это_сегодня: boolean;
  лист: string;
  статус?: string;
  аптайм?: string;
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
  обновляется?: boolean;
  бот_недоступен?: boolean;
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

// ===== Weekly Stats =====
export interface WeeklyStats {
  лист: string;
  период: string;
  текущий_день: number;
  группы: WeeklyGroup[];
  из_кеша?: boolean;
}

export interface WeeklyGroup {
  имя: string;
  ранг: number;
  средний_процент: number;
  дней_с_данными: number;
  данные_дней: Record<string, DayStats>;
  закупки_тг?: PurchaseData;
}

export interface DayStats {
  взяли_тг: number;
  слётов: number;
  процент: number;
}

// ===== Personal Stats =====
export interface PersonalStatsResponse {
  group: string;
  sheet: string;
  users_count: number;
  users: PersonalUser[];
  из_кеша?: boolean;
}

export interface PersonalUser {
  name: string;
  row: number;
  type: 'ру' | 'узб' | 'ру+узб';
  days: Record<string, PersonalDayData>;
  weekly: {
    took: number;
    shadow: number;
    frost: number;
    flight: number;
    lost: number;
    left: number;
    percent: number;
  };
}

export interface PersonalDayData {
  took: number;
  shadow: number;
  frost: number;
  flight: number;
  lost: number;
  left: number;
}

// ===== Recordings =====
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
  exists?: boolean;
  size_mb: number;
  files?: HourFile[];
}

export interface HourFile {
  name: string;
  size_mb: number;
  uploaded_at?: string;
}

// ===== Bot Status =====
export interface BotStatus {
  статус: string;
  аптайм: string;
  сообщений_обработано: number;
  сообщений_записано: number;
  ошибок_за_час: number;
  буфер?: {
    размер: number;
    ожидает: number;
  };
}

export interface CacheStats {
  дашборд: { записей: number; ttl_сек: number };
  рейтинг: { есть: boolean; актуален: boolean; ttl_сек: number };
  личная_стат: { записей: number; ttl_сек: number };
  семафор: { доступно: number; макс: number };
  записи: { кеш_записей: number; ttl_сек: number };
}

export interface Settings {
  имя_бота: string;
  часовой_пояс: number;
  начало_ру: number;
  конец_ру: number;
  начало_узб: number;
  конец_узб: number;
  групп: number;
}

// ===== UI Types =====
export type TabType = 'dashboard' | 'rooms' | 'groups' | 'personal' | 'recordings' | 'stats' | 'settings';
export type RoomsFilter = 'all' | 'ru' | 'uzb' | 'total';
export type PersonalTypeFilter = 'all' | 'ру' | 'узб';

// ===== Constants =====
export const ROOMS = [
  { name: 'ВИНН 1', short: 'vinn1' },
  { name: 'ВИНН 2', short: 'vinn2' },
  { name: 'ТОКИО', short: 'tokio' },
  { name: 'БОРЦЫ', short: 'borcy' },
  { name: 'КИЕВ РЕКТОРАТ', short: 'kiev' },
  { name: 'ЗП 1', short: 'zp1' },
  { name: 'ЗП 2', short: 'zp2' },
  { name: 'АЗОВ 1', short: 'azov1' },
  { name: 'АЗОВ 2', short: 'azov2' },
  { name: 'БЕРДЯНСК 1', short: 'berd1' },
  { name: 'БЕРДЯНСК 2', short: 'berd2' },
  { name: 'ЯРЫЙ', short: 'yaryj' },
  { name: 'ТК РЕКТОРАТ', short: 'tk_rekt' },
  { name: 'ГАЗОН', short: 'gazon' },
];

export const RECORDING_START_HOUR = 8;
export const RECORDING_END_HOUR = 23;
export const TOTAL_RECORDING_HOURS = RECORDING_END_HOUR - RECORDING_START_HOUR;

export const ALL_HOURS = Array.from({ length: TOTAL_RECORDING_HOURS }, (_, i) => ({
  hour: RECORDING_START_HOUR + i,
  name: `hour_${(RECORDING_START_HOUR + i).toString().padStart(2, '0')}`,
  label: `${(RECORDING_START_HOUR + i).toString().padStart(2, '0')}:00`,
}));

export const DAYS_OF_WEEK = [
  'Понедельник', 'Вторник', 'Среда', 'Четверг',
  'Пятница', 'Суббота', 'Воскресенье'
];

export const DAYS_SHORT = ['Пон', 'Вто', 'Сре', 'Чет', 'Пят', 'Суб', 'Вск'];

// Group name mapping
export const GROUP_NAME_MAP: Record<string, string> = {
  'ВИНН 1 СЛЁТЫ ТГ': 'ВИНН 1',
  'ВИНН 2 СЛЁТЫ ТГ': 'ВИНН 2',
  'СТАТИСТИКА СЛЕТОВ БОРЦЫ': 'БОРЦЫ',
  'СТАТИСТИКА СЛЕТОВ КИЕВ': 'КИЕВ РЕКТОРАТ',
  'СТАТИСТИКА СЛЕТОВ ЗП 1': 'ЗП 1',
  'СТАТИСТИКА СЛЕТОВ ЗП 2': 'ЗП 2',
  'СТАТИСТИКА СЛЕТОВ АЗОВ 1': 'АЗОВ 1',
  'СТАТИСТИКА СЛЕТОВ АЗОВ 2': 'АЗОВ 2',
  'ТК СТАТИСТИКА': 'ТОКИО',
  'НОВАЯ СТАТИСТИКА СЛЁТОВ ТГ!!!': 'БЕРДЯНСК 1',
  'Берд2 Новая Статистика слетов': 'БЕРДЯНСК 2',
  'Статистика Улётов Шанхай': 'ЯРЫЙ',
  'Tokyo Statistica': 'ТК РЕКТОРАТ',
  'СЛЕТЫ ГАЗОН СТАТИСТИКА': 'ГАЗОН',
};

export function cleanGroupName(name: string): string {
  if (!name) return 'Группа';

  if (GROUP_NAME_MAP[name]) return GROUP_NAME_MAP[name];

  const upperName = name.toUpperCase();
  for (const [key, val] of Object.entries(GROUP_NAME_MAP)) {
    if (upperName === key.toUpperCase()) return val;
  }

  let cleanName = name
    .replace(/НОВАЯ\s*СТАТИСТИКА\s*СЛЁТОВ?\s*ТГ!*/gi, '')
    .replace(/СТАТИСТИКА\s*СЛЕТОВ?\s*/gi, '')
    .replace(/\s*СЛЁТЫ?\s*ТГ\s*$/gi, '')
    .replace(/\s*СТАТИСТИКА\s*$/gi, '')
    .trim();

  return cleanName || 'Группа';
}
