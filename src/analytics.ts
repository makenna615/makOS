/**
 * Privacy-friendly visit counts with Vercel Web Analytics: no cookies, no personal data, nothing
 * stored in the browser. The script is served from this site's own domain, so the Content Security
 * Policy doesn't need to change. It only runs on the deployed site (not locally or in tests), and not
 * for visitors whose browser asks not to be tracked (Do Not Track or Global Privacy Control).
 */
declare global {
  interface Window {
    va?: (...args: unknown[]) => void;
    vaq?: unknown[][];
  }
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}

export function shouldTrack(env: { prod: boolean; hostname: string; doNotTrack: string | null; gpc?: boolean }) {
  const local = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|0\.0\.0\.0)$/.test(env.hostname);
  return env.prod && !local && env.doNotTrack !== '1' && env.gpc !== true;
}

export function startAnalytics() {
  if (
    !shouldTrack({
      prod: import.meta.env.PROD,
      hostname: window.location.hostname,
      doNotTrack: navigator.doNotTrack,
      gpc: navigator.globalPrivacyControl,
    })
  ) {
    return;
  }
  window.va ??= (...args: unknown[]) => {
    (window.vaq ??= []).push(args);
  };
  const script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/insights/script.js';
  document.head.appendChild(script);
}
