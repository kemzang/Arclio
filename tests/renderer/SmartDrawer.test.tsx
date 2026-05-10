// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SmartDrawer } from '@renderer/components/layout/SmartDrawer.js';
import { useAppStore } from '@renderer/store/useAppStore.js';

vi.mock('@renderer/lib/analytics.js', () => ({ track: vi.fn() }));

function resetStore() {
  useAppStore.setState({
    queue: [],
    drawerOpen: false,
    showQueueTip: false,
    settings: null
  } as never);
}

describe('SmartDrawer', () => {
  it('does not render sleep banner', () => {
    window.appApi = {
      settings: { update: vi.fn().mockResolvedValue({ ok: true, data: {} }) }
    } as never;
    resetStore();
    render(<SmartDrawer />);
    expect(screen.queryByTestId('inter-job-sleep-banner')).not.toBeInTheDocument();
  });
});
