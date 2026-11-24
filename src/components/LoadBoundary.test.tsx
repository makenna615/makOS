import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoadBoundary } from './LoadBoundary';

function Broken(): never {
  throw new Error('Failed to fetch dynamically imported module');
}

describe('LoadBoundary', () => {
  it('shows a reload option instead of breaking the page when an app fails to load', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); // React logs caught errors
    render(
      <LoadBoundary>
        <Broken />
      </LoadBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent("couldn't load");
    expect(screen.getByRole('button', { name: 'Reload makOS' })).toBeInTheDocument();
    vi.mocked(console.error).mockRestore();
  });
});
