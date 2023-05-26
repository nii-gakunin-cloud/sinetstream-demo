import { act, cleanup, render } from '@testing-library/svelte';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';

import ErrorToast from '../../../../src/lib/setting/server/ErrorToast.svelte';

describe('ErrorToast.svelt', () => {
  const MESSAGE = 'error message';

  afterEach(() => cleanup());

  it('message', () => {
    const { container, getByText, getByRole } = render(ErrorToast, { props: { message: MESSAGE } });
    expect(getByText(MESSAGE)).toBeTruthy();
    const toast = getByRole('generic', { name: 'error-toast' });
    expect(Object.values(toast.classList)).toEqual(expect.arrayContaining(['toast']));
    expect(container.outerHTML).matchSnapshot();
  });

  describe('position', () => {
    it('top', () => {
      const { container, getByText, getByRole } = render(ErrorToast, {
        props: {
          message: MESSAGE,
          position: 'top',
        },
      });
      expect(getByText(MESSAGE)).toBeTruthy();
      const toast = getByRole('generic', { name: 'error-toast' });
      expect(Object.values(toast.classList)).toEqual(expect.arrayContaining(['toast', 'top']));
      expect(container.outerHTML).matchSnapshot();
    });

    it('bottom', () => {
      const { container, getByText, getByRole } = render(ErrorToast, {
        props: {
          message: MESSAGE,
          position: 'bottom',
        },
      });
      expect(getByText(MESSAGE)).toBeTruthy();
      const toast = getByRole('generic', { name: 'error-toast' });
      expect(Object.values(toast.classList)).toEqual(expect.arrayContaining(['toast']));
      expect(Object.values(toast.classList)).not.toEqual(expect.arrayContaining(['top']));
      expect(container.outerHTML).matchSnapshot();
    });

    it('top->bottom', async () => {
      const {
        component, container, getByText, getByRole,
      } = render(ErrorToast, {
        props: {
          message: MESSAGE,
          position: 'top',
        },
      });
      expect(getByText(MESSAGE)).toBeTruthy();
      const toast = getByRole('generic', { name: 'error-toast' });
      expect(Object.values(toast.classList)).toEqual(expect.arrayContaining(['toast', 'top']));
      expect(container.outerHTML).matchSnapshot();

      await act(() => {
        component.$set({ position: 'bottom' });
      });
      expect(Object.values(toast.classList)).not.toEqual(expect.arrayContaining(['top']));
      expect(container.outerHTML).matchSnapshot();
    });

    it('bottom->top', async () => {
      const {
        component, container, getByText, getByRole,
      } = render(ErrorToast, {
        props: {
          message: MESSAGE,
          position: 'bottom',
        },
      });
      expect(getByText(MESSAGE)).toBeTruthy();
      let toast = getByRole('generic', { name: 'error-toast' });
      expect(Object.values(toast.classList)).toEqual(expect.arrayContaining(['toast']));
      expect(Object.values(toast.classList)).not.toEqual(expect.arrayContaining(['top']));
      expect(container.outerHTML).matchSnapshot();

      await act(() => {
        component.$set({ position: 'top' });
      });
      toast = getByRole('generic', { name: 'error-toast' });
      expect(Object.values(toast.classList)).toEqual(expect.arrayContaining(['top']));
      expect(container.outerHTML).matchSnapshot();
    });
  });

  describe('timeout', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('default timeout', async () => {
      const { container, getByText, getByRole } = render(ErrorToast, {
        props: { message: MESSAGE },
      });
      expect(getByText(MESSAGE)).toBeTruthy();
      const toast = getByRole('generic', { name: 'error-toast' });
      expect(Object.values(toast.classList)).toEqual(expect.arrayContaining(['toast', 'active']));
      expect(container.outerHTML).matchSnapshot();

      await act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(Object.values(toast.classList)).toEqual(expect.arrayContaining(['active']));
      expect(container.outerHTML).matchSnapshot();

      await act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(Object.values(toast.classList)).not.toEqual(expect.arrayContaining(['active']));
      expect(container.outerHTML).matchSnapshot();
    });

    it('timeout 10sec', async () => {
      const { container, getByText, getByRole } = render(ErrorToast, {
        props: { message: MESSAGE, timeout: 10000 },
      });
      expect(getByText(MESSAGE)).toBeTruthy();
      const toast = getByRole('generic', { name: 'error-toast' });
      expect(Object.values(toast.classList)).toEqual(expect.arrayContaining(['toast', 'active']));
      expect(container.outerHTML).matchSnapshot();

      await act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(Object.values(toast.classList)).toEqual(expect.arrayContaining(['active']));
      expect(container.outerHTML).matchSnapshot();

      await act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(Object.values(toast.classList)).toEqual(expect.arrayContaining(['active']));
      expect(container.outerHTML).matchSnapshot();

      await act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(Object.values(toast.classList)).not.toEqual(expect.arrayContaining(['active']));
      expect(container.outerHTML).matchSnapshot();
    });

    it('disable timeout', async () => {
      const { container, getByText, getByRole } = render(ErrorToast, {
        props: { message: MESSAGE, timeout: -1 },
      });
      expect(getByText(MESSAGE)).toBeTruthy();
      const toast = getByRole('generic', { name: 'error-toast' });
      expect(Object.values(toast.classList)).toEqual(expect.arrayContaining(['toast', 'active']));
      expect(container.outerHTML).matchSnapshot();

      await act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(Object.values(toast.classList)).toEqual(expect.arrayContaining(['active']));
      expect(container.outerHTML).matchSnapshot();

      await act(() => {
        vi.advanceTimersByTime(3600000);
      });
      expect(Object.values(toast.classList)).toEqual(expect.arrayContaining(['active']));
      expect(container.outerHTML).matchSnapshot();
    });
  });
});
