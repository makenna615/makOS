import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** What to show if loading fails; defaults to a message with a Reload button. */
  fallback?: ReactNode;
}

/**
 * Catches a failed on-demand download (most often: the site was updated while this tab was open, so
 * the old file is gone) and shows a way out instead of breaking the whole page.
 */
export class LoadBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return (
      <div className="app-loading" role="alert">
        <p>This app couldn&apos;t load. makOS may have been updated since you opened it.</p>
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          Reload makOS
        </button>
      </div>
    );
  }
}
