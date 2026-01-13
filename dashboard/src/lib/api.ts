// ============================================================================
// API КЛИЕНТ
// ============================================================================

import type { 
  DashboardData, 
  WeeklyRanking, 
  PersonalStats, 
  RecordingsData, 
  BotStatus 
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// --- Утилиты ---

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

// --- API методы ---

export async function fetchDashboard(date?: string): Promise<DashboardData> {
  const params = date ? `?дата=${encodeURIComponent(date)}` : '';
  return fetchApi<DashboardData>(`/api/dashboard${params}`);
}

export async function fetchWeeklyRanking(): Promise<WeeklyRanking> {
  return fetchApi<WeeklyRanking>('/api/weekly-ranking');
}

export async function fetchPersonalStats(group: string): Promise<PersonalStats> {
  return fetchApi<PersonalStats>(
    `/api/personal-stats?group=${encodeURIComponent(group)}`
  );
}

export async function fetchRecordings(teamShort: string): Promise<RecordingsData> {
  return fetchApi<RecordingsData>(
    `/api/recordings/team?group=${encodeURIComponent(teamShort)}`
  );
}

export async function fetchBotStatus(): Promise<BotStatus> {
  return fetchApi<BotStatus>('/api/status');
}

export async function clearCache(): Promise<void> {
  await fetchApi('/api/cache-clear', { method: 'POST' });
}

// --- URL генераторы для видео ---

export function getVideoStreamUrl(
  group: string, 
  username: string, 
  date: string, 
  part: string
): string {
  const params = new URLSearchParams({ group, username, date, part });
  return `${API_BASE}/api/recordings/stream-converted?${params}`;
}

export function getVideoDirectUrl(
  group: string, 
  username: string, 
  date: string, 
  part: string
): string {
  const params = new URLSearchParams({ group, username, date, part });
  return `${API_BASE}/api/recordings/video-url?${params}`;
}
