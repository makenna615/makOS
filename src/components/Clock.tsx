import { useEffect, useState } from 'react';

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'full' });

export function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let interval: number | undefined;
    // Line the ticks up with the start of each minute so the clock never lags.
    const timeout = window.setTimeout(() => {
      setNow(new Date());
      interval = window.setInterval(() => setNow(new Date()), 60_000);
    }, 60_000 - (Date.now() % 60_000));
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <time className="clock" dateTime={now.toISOString()} title={dateFormat.format(now)}>
      {timeFormat.format(now)}
    </time>
  );
}
