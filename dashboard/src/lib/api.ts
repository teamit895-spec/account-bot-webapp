import { DashboardData, RecordingsData } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchDashboard(date?: string): Promise<DashboardData> {
  const url = date 
    ? `${API_BASE}/api/dashboard?дата=${encodeURIComponent(date)}`
    : `${API_BASE}/api/dashboard`;
  
  const response = await fetch(url, { 
    next: { revalidate: 30 },
    headers: { 'Accept': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  
  return response.json();
}

export async function fetchWeeklyRanking(): Promise<any> {
  const response = await fetch(`${API_BASE}/api/weekly-ranking`, {
    next: { revalidate: 60 }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch weekly ranking');
  }
  
  return response.json();
}

export async function fetchPersonalStats(group: string): Promise<any> {
  const response = await fetch(`${API_BASE}/api/personal-stats?group=${encodeURIComponent(group)}`, {
    next: { revalidate: 60 }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch personal stats');
  }
  
  return response.json();
}

export async function fetchRecordings(teamShort: string): Promise<RecordingsData> {
  const response = await fetch(`${API_BASE}/api/recordings/team?group=${encodeURIComponent(teamShort)}`, {
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch recordings');
  }
  
  return response.json();
}

export async function fetchRooms(): Promise<{ rooms: { name: string; short: string }[] }> {
  const response = await fetch(`${API_BASE}/api/recordings/rooms`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch rooms');
  }
  
  return response.json();
}

export async function clearCache(): Promise<void> {
  await fetch(`${API_BASE}/api/cache-clear`, { method: 'POST' });
}

export function getVideoStreamUrl(group: string, username: string, date: string, part: string): string {
  return `${API_BASE}/api/recordings/stream-converted?group=${encodeURIComponent(group)}&username=${encodeURIComponent(username)}&date=${encodeURIComponent(date)}&part=${encodeURIComponent(part)}`;
}
