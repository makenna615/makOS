import type { ReactNode } from 'react';
import { WEATHER_PLACE, type WeatherKind } from '../data/weather';
import { useWeather } from '../hooks/useWeather';

/** Small hand-drawn weather glyphs, decorative (the text carries the meaning). */
function WeatherIcon({ kind, size = 18 }: { kind: WeatherKind; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="icon weather-icon">
      {GLYPHS[kind]}
    </svg>
  );
}

const sun = (cx: number, cy: number, r: number) => (
  <g>
    <g stroke="#ffb703" strokeWidth="3.5" strokeLinecap="round">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <line
            key={a}
            x1={cx + Math.cos(rad) * (r + 4)}
            y1={cy + Math.sin(rad) * (r + 4)}
            x2={cx + Math.cos(rad) * (r + 9)}
            y2={cy + Math.sin(rad) * (r + 9)}
          />
        );
      })}
    </g>
    <circle cx={cx} cy={cy} r={r} fill="#ffd34d" stroke="#f29e0c" strokeWidth="2" />
  </g>
);
const moon = (cx: number, cy: number, r: number) => (
  <path
    d={`M${cx + r * 0.3} ${cy - r} a${r} ${r} 0 1 0 ${r * 0.75} ${r * 1.55} a${r * 0.85} ${r * 0.85} 0 0 1 -${r * 0.75} -${r * 1.55}z`}
    fill="#f4e7a1"
    stroke="#c9b25a"
    strokeWidth="2"
  />
);
const cloud = (fill = '#f4f8fd', stroke = '#8aa0bf', dy = 0) => (
  <path
    d={`M13 ${38 + dy}h23a8 8 0 0 0 0-16 11 11 0 0 0-21-2 8 8 0 0 0-2 18z`}
    fill={fill}
    stroke={stroke}
    strokeWidth="2.5"
    strokeLinejoin="round"
  />
);

const GLYPHS: Record<WeatherKind, ReactNode> = {
  sun: sun(24, 24, 10),
  moon: moon(22, 24, 13),
  'partly-day': (
    <>
      {sun(30, 16, 8)}
      {cloud('#f4f8fd', '#8aa0bf', 4)}
    </>
  ),
  'partly-night': (
    <>
      {moon(28, 14, 10)}
      {cloud('#e6edf6', '#7f93b2', 4)}
    </>
  ),
  cloud: (
    <>
      <path d="M26 22a9 9 0 0 1 16 5 6 6 0 0 1-1 12H34" fill="#c9d4e3" stroke="#7d8ea8" strokeWidth="2.5" strokeLinejoin="round" />
      {cloud('#eef3f9', '#7d8ea8', 2)}
    </>
  ),
  fog: (
    <>
      {cloud('#e3e9f1', '#8aa0bf', -6)}
      <g stroke="#9fb0c8" strokeWidth="3" strokeLinecap="round">
        <line x1="8" y1="38" x2="34" y2="38" />
        <line x1="14" y1="44" x2="42" y2="44" />
      </g>
    </>
  ),
  rain: (
    <>
      {cloud('#dfe7f2', '#6f86a8', -6)}
      <g stroke="#2f80ed" strokeWidth="3" strokeLinecap="round">
        <line x1="16" y1="37" x2="13" y2="44" />
        <line x1="25" y1="37" x2="22" y2="44" />
        <line x1="34" y1="37" x2="31" y2="44" />
      </g>
    </>
  ),
  snow: (
    <>
      {cloud('#eef3f9', '#7f93b2', -6)}
      <g fill="#7fb2ff" stroke="#3f7fd6" strokeWidth="1">
        <circle cx="15" cy="40" r="2.6" />
        <circle cx="24" cy="44" r="2.6" />
        <circle cx="33" cy="40" r="2.6" />
      </g>
    </>
  ),
  storm: (
    <>
      {cloud('#b9c4d4', '#56657d', -6)}
      <path d="M26 33l-6 9h6l-3 6 9-11h-6l3-4z" fill="#ffd34d" stroke="#e09a00" strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
};

/**
 * "Fargo, ND ☁ 42°F" for the taskbar tray and the phone status bar.
 * Not interactive; the hover title and a visually hidden description give the conditions in words.
 */
export function WeatherWidget() {
  const weather = useWeather();
  const title = weather
    ? `${weather.label}, ${weather.tempF}°F in ${WEATHER_PLACE}. Weather data by Open-Meteo.com`
    : WEATHER_PLACE;

  return (
    <span className="weather" title={title}>
      <span className="weather-place">{WEATHER_PLACE}</span>
      {weather && (
        <>
          <WeatherIcon kind={weather.kind} />
          <span className="visually-hidden">{weather.label},</span>
          <span className="weather-temp">{weather.tempF}°F</span>
        </>
      )}
    </span>
  );
}
