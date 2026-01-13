import { DashboardData, WeeklyRanking, PersonalStats, RecordingsData, BotStatus } from '@/types';

const API_BASE = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || '') 
  : '';

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 30000) {
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

export async function fetchDashboard(date?: string): Promise<DashboardData> {
  const url = date 
    ? `${API_BASE}/api/dashboard?дата=${encodeURIComponent(date)}`
    : `${API_BASE}/api/dashboard`;
  
  const response = await fetchWithTimeout(url, {
    headers: { 'Accept': 'application/json' },
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard: ${response.status}`);
  }
  
  return response.json();
}

export async function fetchWeeklyRanking(): Promise<WeeklyRanking> {
  const response = await fetchWithTimeout(`${API_BASE}/api/weekly-ranking`, {
    headers: { 'Accept': 'application/json' },
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ranking: ${response.status}`);
  }
  
  return response.json();
}

export async function fetchPersonalStats(group: string): Promise<PersonalStats> {
  const response = await fetchWithTimeout(
    `${API_BASE}/api/personal-stats?group=${encodeURIComponent(group)}`,
    {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch personal stats: ${response.status}`);
  }
  
  return response.json();
}

export async function fetchRecordings(teamShort: string): Promise<RecordingsData> {
  const response = await fetchWithTimeout(
    `${API_BASE}/api/recordings/team?group=${encodeURIComponent(teamShort)}`,
    { cache: 'no-store' }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch recordings: ${response.status}`);
  }
  
  return response.json();
}

export async function fetchBotStatus(): Promise<BotStatus> {
  const response = await fetchWithTimeout(`${API_BASE}/api/status`, {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch status: ${response.status}`);
  }
  
  return response.json();
}

export async function clearCache(): Promise<void> {
  await fetchWithTimeout(`${API_BASE}/api/cache-clear`, { 
    method: 'POST',
    cache: 'no-store',
  });
}

export function getVideoStreamUrl(group: string, username: string, date: string, part: string): string {
  return `${API_BASE}/api/recordings/stream-converted?group=${encodeURIComponent(group)}&username=${encodeURIComponent(username)}&date=${encodeURIComponent(date)}&part=${encodeURIComponent(part)}`;
}

export function getVideoDirectUrl(group: string, username: string, date: string, part: string): string {
  return `${API_BASE}/api/recordings/video-url?group=${encodeURIComponent(group)}&username=${encodeURIComponent(username)}&date=${encodeURIComponent(date)}&part=${encodeURIComponent(part)}`;
}
