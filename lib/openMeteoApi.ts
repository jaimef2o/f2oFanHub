export interface HourlyUVData {
  time: string[];
  uv_index: number[];
}

export interface UVForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: HourlyUVData;
}

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export async function fetchUVForecast(
  latitude: number,
  longitude: number,
  forecastDays: number = 7
): Promise<UVForecastResponse> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    hourly: 'uv_index',
    forecast_days: forecastDays.toString(),
    timezone: 'auto',
  });

  const response = await fetch(`${BASE_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }
  return response.json();
}

/** Get today's hourly UV data */
export function getTodayUV(data: UVForecastResponse): { hours: number[]; uvValues: number[] } {
  const today = new Date().toISOString().split('T')[0];
  const hours: number[] = [];
  const uvValues: number[] = [];

  data.hourly.time.forEach((time, i) => {
    if (time.startsWith(today)) {
      const hour = new Date(time).getHours();
      hours.push(hour);
      uvValues.push(data.hourly.uv_index[i] ?? 0);
    }
  });

  return { hours, uvValues };
}

/** Get current UV index (nearest hour) */
export function getCurrentUV(data: UVForecastResponse): number {
  const now = new Date();
  const currentHour = now.getHours();
  const today = now.toISOString().split('T')[0];

  for (let i = 0; i < data.hourly.time.length; i++) {
    const time = data.hourly.time[i];
    if (time.startsWith(today)) {
      const hour = new Date(time).getHours();
      if (hour === currentHour) {
        return data.hourly.uv_index[i] ?? 0;
      }
    }
  }
  return 0;
}

/** Get peak UV for a given day index (0 = today) */
export function getPeakUV(data: UVForecastResponse, dayOffset: number = 0): { uv: number; hour: number } {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const dateStr = date.toISOString().split('T')[0];

  let maxUV = 0;
  let peakHour = 12;

  data.hourly.time.forEach((time, i) => {
    if (time.startsWith(dateStr)) {
      const uv = data.hourly.uv_index[i] ?? 0;
      if (uv > maxUV) {
        maxUV = uv;
        peakHour = new Date(time).getHours();
      }
    }
  });

  return { uv: maxUV, hour: peakHour };
}

/** Get synthesis window (hours where UV >= 3) for a day */
export function getSynthesisWindow(
  data: UVForecastResponse,
  dayOffset: number = 0
): { start: number; end: number; hasWindow: boolean } {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const dateStr = date.toISOString().split('T')[0];

  let start = -1;
  let end = -1;

  data.hourly.time.forEach((time, i) => {
    if (time.startsWith(dateStr)) {
      const uv = data.hourly.uv_index[i] ?? 0;
      const hour = new Date(time).getHours();
      if (uv >= 3) {
        if (start === -1) start = hour;
        end = hour;
      }
    }
  });

  return { start, end: end + 1, hasWindow: start !== -1 };
}

/** Get max UV for each day in the forecast */
export function getDailyMaxUV(data: UVForecastResponse): { date: string; maxUV: number }[] {
  const dailyMap = new Map<string, number>();

  data.hourly.time.forEach((time, i) => {
    const dateStr = time.split('T')[0];
    const uv = data.hourly.uv_index[i] ?? 0;
    const current = dailyMap.get(dateStr) ?? 0;
    if (uv > current) {
      dailyMap.set(dateStr, uv);
    }
  });

  return Array.from(dailyMap.entries()).map(([date, maxUV]) => ({ date, maxUV }));
}

export type SolarStatus = 'OPTIMAL' | 'LOW' | 'ZERO';

export function getSolarStatus(uvIndex: number): SolarStatus {
  if (uvIndex >= 4) return 'OPTIMAL';
  if (uvIndex >= 2) return 'LOW';
  return 'ZERO';
}

export function getSolarStatusColor(status: SolarStatus): string {
  switch (status) {
    case 'OPTIMAL':
      return '#22C55E';
    case 'LOW':
      return '#FFD700';
    case 'ZERO':
      return '#EF4444';
  }
}

export function getSolarStatusLabel(status: SolarStatus): string {
  switch (status) {
    case 'OPTIMAL':
      return 'OPTIMAL';
    case 'LOW':
      return 'LOW UV';
    case 'ZERO':
      return 'VITAMIN D WINTER';
  }
}
