import {
  act, cleanup, getByText, render,
} from '@testing-library/svelte';
import * as urql from '@urql/svelte';
import { writable } from 'svelte/store';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import ConfigNameSelect from '../../../../src/lib/setting/server/ConfigNameSelect.svelte';
import { settings, settingsIndex } from '../../../../src/lib/settings';

describe('ConfigNameSelect.svelt', () => {
  beforeEach(() => {
    vi.mock('@urql/svelte');
    settings.set([{ name: 'setting-0' }]);
    settingsIndex.set(0);
  });

  afterEach(() => cleanup());

  it('no data', () => {
    const { container, getAllByRole } = render(ConfigNameSelect, { props: { name: 'name' } });
    const opts = getAllByRole('option');
    expect(opts).toHaveLength(1);
    expect(opts[0]).toHaveProperty('value', '');
    expect(container.outerHTML).matchSnapshot();
  });

  describe('two items', () => {
    let result;

    beforeEach(() => {
      result = writable({ fetching: true, data: undefined, error: undefined });
      const spy = vi.spyOn(urql, 'queryStore');
      spy.mockReturnValue(result);
    });

    it('no match', async () => {
      const { component, container, getAllByRole } = render(ConfigNameSelect, { props: { name: 'name' } });
      expect(container.outerHTML).toMatchSnapshot();
      const handler = vi.fn();
      component.$on('match', handler);

      await act(() => {
        result.update((x) => {
          const data = {
            viewer_config: [1, 2].map(
              (n) => ({ id: n, name: `setting-${n}` }),
            ),
          };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      const opts = getAllByRole('option');
      expect(opts).toHaveLength(3);
      expect(opts[0]).toHaveProperty('value', '');
      [1, 2].forEach((n) => {
        expect(opts[n]).toHaveProperty('value', n.toString());
        expect(getByText(opts[n], `setting-${n}`)).toBeTruthy();
      });
      expect(container.outerHTML).toMatchSnapshot();
      expect(handler).not.toHaveBeenCalled();
    });

    it('match event', async () => {
      settings.set([{ name: 'setting-2' }]);
      const { component, container, getAllByRole } = render(ConfigNameSelect, { props: { name: 'name' } });
      expect(container.outerHTML).toMatchSnapshot();
      const handler = vi.fn();
      component.$on('match', handler);

      await act(() => {
        result.update((x) => {
          const data = {
            viewer_config: [1, 2].map(
              (n) => ({ id: n, name: `setting-${n}` }),
            ),
          };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      const opts = getAllByRole('option');
      expect(opts).toHaveLength(3);
      expect(opts[0]).toHaveProperty('value', '');
      [1, 2].forEach((n) => {
        expect(opts[n]).toHaveProperty('value', n.toString());
        expect(getByText(opts[n], `setting-${n}`)).toBeTruthy();
      });
      expect(container.outerHTML).toMatchSnapshot();
      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0]?.detail).toMatchObject({ id: 2 });

      await act(() => {
        component.$set({ selected: 2 });
      });
      expect(getAllByRole('option')).toHaveLength(2);
      expect(container.outerHTML).toMatchSnapshot();
    });
  });

  it('error', async () => {
    const ERROR_MESSAGE = '[Network] Failed to fetch';
    const result = writable({ fetching: true, data: undefined, error: undefined });
    const spy = vi.spyOn(urql, 'queryStore');
    spy.mockReturnValue(result);

    const { container, getAllByRole } = render(ConfigNameSelect, { props: { name: 'name' } });
    expect(container.outerHTML).toMatchSnapshot();

    await act(() => {
      result.update((x) => {
        const error = { message: ERROR_MESSAGE };
        const fetching = false;
        return { ...x, fetching, error };
      });
    });
    const opts = getAllByRole('option');
    expect(opts).toHaveLength(1);
    expect(container.outerHTML).toMatchSnapshot();
    expect(getByText(container, ERROR_MESSAGE)).toBeTruthy();
  });
});
