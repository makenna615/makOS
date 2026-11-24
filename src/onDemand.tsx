import { lazy, type ComponentType } from 'react';

/**
 * Like React.lazy, but once the code has downloaded (for example from the idle preload) the component
 * renders straight away. React.lazy would still suspend for a moment and React holds suspended
 * content back by ~300ms, which made apps feel slow to open.
 */
export function onDemand<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  let Loaded: ComponentType<P> | null = null;
  let pending: Promise<{ default: ComponentType<P> }> | null = null;
  const fetch = () => {
    pending ??= load().then(
      (module) => {
        Loaded = module.default;
        return module;
      },
      (error: unknown) => {
        pending = null; // allow a retry
        throw error;
      },
    );
    return pending;
  };
  const Lazy = lazy(fetch);
  function OnDemand(props: P) {
    return Loaded ? <Loaded {...props} /> : <Lazy {...props} />;
  }
  return { Component: OnDemand, preload: () => void fetch().catch(() => {}) };
}
