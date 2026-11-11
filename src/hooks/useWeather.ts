import { useEffect, useState } from 'react';
import { WEATHER_REFRESH_MS, WEATHER_URL, parseWeather, type Weather } from '../data/weather';

/**
 * Fetches current Fargo weather and refreshes it every 15 minutes.
 * Returns null while loading or if the service is unavailable, so callers can fall back to just the place name.
 */
export function useWeather(): Weather | null {
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    let controller: AbortController | undefined;
    const load = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const res = await fetch(WEATHER_URL, { signal: controller.signal });
        if (!res.ok) return;
        const parsed = parseWeather(await res.json());
        if (parsed) setWeather(parsed);
      } catch {
        // Offline, blocked or aborted: keep showing the last reading (or none).
      }
    };
    void load();
    const interval = window.setInterval(load, WEATHER_REFRESH_MS);
    return () => {
      window.clearInterval(interval);
      controller?.abort();
    };
  }, []);

  return weather;
}
