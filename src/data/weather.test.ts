import { describe, expect, it } from 'vitest';
import { describeWeather, parseWeather } from './weather';

describe('describeWeather', () => {
  it.each([
    [0, true, 'sun', 'Sunny'],
    [0, false, 'moon', 'Clear'],
    [2, true, 'partly-day', 'Partly cloudy'],
    [2, false, 'partly-night', 'Partly cloudy'],
    [3, true, 'cloud', 'Cloudy'],
    [45, true, 'fog', 'Foggy'],
    [53, true, 'rain', 'Drizzle'],
    [63, false, 'rain', 'Rain'],
    [67, true, 'rain', 'Freezing rain'],
    [75, true, 'snow', 'Snow'],
    [81, true, 'rain', 'Rain showers'],
    [86, true, 'snow', 'Snow showers'],
    [99, true, 'storm', 'Thunderstorms'],
  ] as const)('code %i (day=%s) is %s / %s', (code, isDay, kind, label) => {
    expect(describeWeather(code, isDay)).toEqual({ kind, label });
  });

  it('falls back to cloudy for unknown codes', () => {
    expect(describeWeather(42, true).kind).toBe('cloud');
  });
});

describe('parseWeather', () => {
  it('reads an Open-Meteo response and rounds the temperature', () => {
    const json = { current: { temperature_2m: 41.6, weather_code: 3, is_day: 1 } };
    expect(parseWeather(json)).toEqual({ tempF: 42, kind: 'cloud', label: 'Cloudy' });
  });

  it('uses night icons when is_day is 0', () => {
    expect(parseWeather({ current: { temperature_2m: -3.4, weather_code: 0, is_day: 0 } })).toEqual({
      tempF: -3,
      kind: 'moon',
      label: 'Clear',
    });
  });

  it('rejects unexpected shapes', () => {
    expect(parseWeather(null)).toBeNull();
    expect(parseWeather({})).toBeNull();
    expect(parseWeather({ current: { temperature_2m: '40', weather_code: 3 } })).toBeNull();
  });
});
