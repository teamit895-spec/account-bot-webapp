import {
  DashboardData,
  WeeklyStats,
  PersonalStatsResponse,
  RecordingsData,
  BotStatus,
  CacheStats,
  Settings
} from '@/types';

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || '')
  : '';

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 30000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function fetchDashboard(date?: string, force = false): Promise<DashboardData> {
  const params = new URLSearchParams();
  if (date) params.set('дата', date);
  if (force) params.set('force', 'true');

  const url = params.toString()
    ? `${API_BASE}/api/dashboard?${params}`
    : `${API_BASE}/api/dashboard`;

  const response = await fetchWithTimeout(url, {
    headers: { 'Accept': 'application/json' },
    cache: 'no-store',
  }, 15000);

  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard: ${response.status}`);
  }

  return response.json();
}

export async function fetchWeeklyStats(force = false): Promise<WeeklyStats> {
  const url = force
    ? `${API_BASE}/api/weekly-stats?force=true`
    : `${API_BASE}/api/weekly-stats`;

  const response = await fetchWithTimeout(url, {
    headers: { 'Accept': 'application/json' },
    cache: 'no-store',
  }, 30000);

  if (!response.ok) {
    throw new Error(`Failed to fetch weekly stats: ${response.status}`);
  }

  return response.json();
}

export async function fetchPersonalStats(group: string, force = false): Promise<PersonalStatsResponse> {
  const params = new URLSearchParams({ group });
  if (force) params.set('force', 'true');

  const response = await fetchWithTimeout(
    `${API_BASE}/api/personal-stats?${params}`,
    { headers: { 'Accept': 'application/json' }, cache: 'no-store' },
    30000
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch personal stats: ${response.status}`);
  }

  return response.json();
}

export async function fetchRecordings(teamShort: string): Promise<RecordingsData> {
  const response = await fetchWithTimeout(
    `${API_BASE}/api/recordings/team?group=${encodeURIComponent(teamShort)}`,
    { cache: 'no-store' },
    30000
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch recordings: ${response.status}`);
  }

  return response.json();
}

export async function clearRecordingsCache(): Promise<void> {
  await fetchWithTimeout(
    `${API_BASE}/api/recordings/cache-clear`,
    { method: 'POST', cache: 'no-store' }
  );
}

export function getVideoStreamUrl(
  group: string,
  username: string,
  date: string,
  part: string
): string {
  return `${API_BASE}/api/recordings/stream-converted?group=${encodeURIComponent(group)}&username=${encodeURIComponent(username)}&date=${encodeURIComponent(date)}&part=${encodeURIComponent(part)}`;
}

export function getVideoDirectUrl(
  group: string,
  username: string,
  date: string,
  part: string
): string {
  return `${API_BASE}/api/recordings/video-url?group=${encodeURIComponent(group)}&username=${encodeURIComponent(username)}&date=${encodeURIComponent(date)}&part=${encodeURIComponent(part)}`;
}

export async function fetchBotStatus(): Promise<BotStatus> {
  const response = await fetchWithTimeout(
    `${API_BASE}/api/status`,
    { cache: 'no-store' },
    10000
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch status: ${response.status}`);
  }

  return response.json();
}

export async function fetchSettings(): Promise<Settings> {
  const response = await fetchWithTimeout(
    `${API_BASE}/api/settings`,
    { cache: 'no-store' },
    10000
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch settings: ${response.status}`);
  }

  return response.json();
}

export async function fetchCacheStats(): Promise<CacheStats> {
  const response = await fetchWithTimeout(
    `${API_BASE}/api/cache-stats`,
    { cache: 'no-store' },
    10000
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch cache stats: ${response.status}`);
  }

  return response.json();
}

export async function clearCache(): Promise<{ статус: string; сообщение: string }> {
  const response = await fetchWithTimeout(
    `${API_BASE}/api/cache-clear`,
    { method: 'POST', cache: 'no-store' }
  );

  return response.json();
}

export async function healthCheck(): Promise<{
  status: string;
  bot_running?: boolean;
  uptime?: string;
  groups_count?: number;
}> {
  const response = await fetchWithTimeout(
    `${API_BASE}/health`,
    { cache: 'no-store' },
    5000
  );

  return response.json();
}

// Local Cache
const CACHE_KEY = 'stats_dashboard_cache';
const CACHE_TTL = 5 * 60 * 1000;

export function saveToLocalCache(data: DashboardData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      time: Date.now(),
      data: data
    }));
  } catch (e) {
    console.warn('Failed to save to cache:', e);
  }
}

export function loadFromLocalCache(): DashboardData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.time < CACHE_TTL) {
        return parsed.data;
      }
    }
  } catch (e) {
    console.warn('Failed to load from cache:', e);
  }
  return null;
}

// Recordings Cache (session)
const REC_CACHE_TTL = 2 * 60 * 1000;

export function saveRecordingsToSession(teamShort: string, data: RecordingsData): void {
  try {
    sessionStorage.setItem(`rec_${teamShort}`, JSON.stringify({
      data: data,
      ts: Date.now()
    }));
  } catch (e) {
    console.warn('Failed to save recordings:', e);
  }
}

export function loadRecordingsFromSession(teamShort: string): RecordingsData | null {
  try {
    const stored = sessionStorage.getItem(`rec_${teamShort}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.ts < REC_CACHE_TTL) {
        return parsed.data;
      }
    }
  } catch (e) {
    console.warn('Failed to load recordings:', e);
  }
  return null;
}

export function clearRecordingsSession(): void {
  try {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('rec_')) sessionStorage.removeItem(key);
    });
  } catch (e) {
    console.warn('Failed to clear recordings session:', e);
  }
}
