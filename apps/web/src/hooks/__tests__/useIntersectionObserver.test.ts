import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createElement, useCallback } from 'react';

import { useIntersectionObserver } from '../useIntersectionObserver';

let mockObserve: ReturnType<typeof vi.fn>;
let mockDisconnect: ReturnType<typeof vi.fn>;
let capturedCallback: IntersectionObserverCallback | undefined;
let capturedOptions: IntersectionObserverInit | undefined;

beforeEach(() => {
  capturedCallback = undefined;
  capturedOptions = undefined;
  mockObserve = vi.fn();
  mockDisconnect = vi.fn();

  class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      capturedCallback = callback;
      capturedOptions = options;
    }
    observe = mockObserve;
    disconnect = mockDisconnect;
    unobserve = vi.fn();
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

function TestComponent({
  enabled,
  rootMargin,
  onIntersect,
}: {
  enabled: boolean;
  rootMargin?: string;
  onIntersect: () => void;
}) {
  const stableOnIntersect = useCallback(() => onIntersect(), [onIntersect]);
  const ref = useIntersectionObserver({ enabled, rootMargin, onIntersect: stableOnIntersect });
  return createElement('div', { ref, 'data-testid': 'trigger' });
}

describe('useIntersectionObserver', () => {
  it('enabled=false: observeが呼ばれない', () => {
    const onIntersect = vi.fn();
    mockObserve.mockClear();

    render(createElement(TestComponent, { enabled: false, onIntersect }));

    expect(mockObserve).not.toHaveBeenCalled();
  });

  it('enabled=true: observeが呼ばれる', () => {
    const onIntersect = vi.fn();

    render(createElement(TestComponent, { enabled: true, onIntersect }));

    expect(mockObserve).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('trigger')).toBeInTheDocument();
  });

  it('rootMarginが正しく渡される', () => {
    const onIntersect = vi.fn();

    render(createElement(TestComponent, { enabled: true, rootMargin: '200px', onIntersect }));

    expect(capturedOptions?.rootMargin).toBe('200px');
  });

  it('デフォルトrootMarginが0px', () => {
    const onIntersect = vi.fn();

    render(createElement(TestComponent, { enabled: true, onIntersect }));

    expect(capturedOptions?.rootMargin).toBe('0px');
  });

  it('交差検出時: onIntersectが呼ばれる', () => {
    const onIntersect = vi.fn();

    render(createElement(TestComponent, { enabled: true, onIntersect }));

    act(() => {
      capturedCallback!(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(onIntersect).toHaveBeenCalledTimes(1);
  });

  it('非交差時: onIntersectが呼ばれない', () => {
    const onIntersect = vi.fn();

    render(createElement(TestComponent, { enabled: true, onIntersect }));

    act(() => {
      capturedCallback!(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(onIntersect).not.toHaveBeenCalled();
  });

  it('アンマウント時: disconnectが呼ばれる', () => {
    const onIntersect = vi.fn();

    const { unmount } = render(createElement(TestComponent, { enabled: true, onIntersect }));

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('空のentries配列: onIntersectが呼ばれない', () => {
    const onIntersect = vi.fn();

    render(createElement(TestComponent, { enabled: true, onIntersect }));

    act(() => {
      capturedCallback!(
        [],
        {} as IntersectionObserver
      );
    });

    expect(onIntersect).not.toHaveBeenCalled();
  });
});
