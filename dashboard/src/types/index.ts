export interface DashboardData {
  дата: string;
  день: string;
  время?: string;
  часовой_пояс?: string;
  это_сегодня: boolean;
  лист: string;
  статус?: string;
  всего: {
    юзеров: number;
    взяли_тг: number;
    тень: number;
    мороз: number;
    вылет: number;
    всего_слётов: number;
    процент: number;
    осталось: number;
  };
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
  files?: FileInfo[];
}

export interface FileInfo {
  name: string;
  size_mb: number;
  uploaded_at?: string;
}

export interface RecordingsData {
  users: RecordingUser[];
  short: string;
  room_name: string;
  is_mock?: boolean;
}

export type TabType = 'dashboard' | 'rooms' | 'groups' | 'personal' | 'recordings' | 'stats' | 'settings';
