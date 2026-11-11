/** Current weather for Fargo, ND, from Open-Meteo (free, no API key, CC BY 4.0). */

export const WEATHER_PLACE = 'Fargo, ND';
export const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=46.8772&longitude=-96.7898' +
  '&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit&timezone=America%2FChicago';
export const WEATHER_REFRESH_MS = 15 * 60 * 1000;

export type WeatherKind =
  | 'sun'
  | 'moon'
  | 'partly-day'
  | 'partly-night'
  | 'cloud'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'storm';

export interface Weather {
  tempF: number;
  kind: WeatherKind;
  /** Short human description, e.g. "Partly cloudy". */
  label: string;
}

/** Maps a WMO weather code (as used by Open-Meteo) to an icon and a short description. */
export function describeWeather(code: number, isDay: boolean): Pick<Weather, 'kind' | 'label'> {
  if (code === 0) return isDay ? { kind: 'sun', label: 'Sunny' } : { kind: 'moon', label: 'Clear' };
  if (code === 1) return isDay ? { kind: 'sun', label: 'Mostly sunny' } : { kind: 'moon', label: 'Mostly clear' };
  if (code === 2) return { kind: isDay ? 'partly-day' : 'partly-night', label: 'Partly cloudy' };
  if (code === 3) return { kind: 'cloud', label: 'Cloudy' };
  if (code === 45 || code === 48) return { kind: 'fog', label: 'Foggy' };
  if (code >= 51 && code <= 55) return { kind: 'rain', label: 'Drizzle' };
  if (code === 56 || code === 57) return { kind: 'rain', label: 'Freezing drizzle' };
  if (code >= 61 && code <= 65) return { kind: 'rain', label: 'Rain' };
  if (code === 66 || code === 67) return { kind: 'rain', label: 'Freezing rain' };
  if (code >= 71 && code <= 77) return { kind: 'snow', label: 'Snow' };
  if (code >= 80 && code <= 82) return { kind: 'rain', label: 'Rain showers' };
  if (code === 85 || code === 86) return { kind: 'snow', label: 'Snow showers' };
  if (code >= 95) return { kind: 'storm', label: 'Thunderstorms' };
  return { kind: 'cloud', label: 'Cloudy' };
}

/** Validates an Open-Meteo response; returns null if it isn't the shape we expect. */
export function parseWeather(json: unknown): Weather | null {
  const current = (json as { current?: Record<string, unknown> } | null)?.current;
  const temp = current?.temperature_2m;
  const code = current?.weather_code;
  if (typeof temp !== 'number' || typeof code !== 'number') return null;
  return { tempF: Math.round(temp), ...describeWeather(code, current?.is_day !== 0) };
}
