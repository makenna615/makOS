import { useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

export interface TabDef {
  id: string;
  label: string;
  content: ReactNode;
}

/** WAI-ARIA tabs with automatic activation (arrow keys switch tabs). */
export function Tabs({ tabs, label }: { tabs: TabDef[]; label: string }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (index: number) => {
    const next = tabs[(index + tabs.length) % tabs.length]!;
    setActive(next.id);
    tabRefs.current[(index + tabs.length) % tabs.length]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const target = keys[event.key];
    if (target === undefined) return;
    event.preventDefault();
    select(target);
  };

  return (
    <div className="tabs">
      <div role="tablist" aria-label={label} className="tablist">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`${baseId}-panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={active !== tab.id}
          tabIndex={0}
          className="tabpanel"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
