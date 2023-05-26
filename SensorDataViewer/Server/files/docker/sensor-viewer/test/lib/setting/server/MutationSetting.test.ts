import { act, cleanup, render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import * as urql from '@urql/svelte';
import { writable } from 'svelte/store';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import MutationSetting from '../../../../src/lib/setting/server/MutationSetting.svelte';
import { settings, settingsIndex } from '../../../../src/lib/settings';

describe('MutationSetting.svelt', () => {
  const resultQuery = writable({ fetching: false, data: undefined, error: undefined });
  const resultMutation = writable({ fetching: false, data: undefined, error: undefined });
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.mock('@urql/svelte');
    settings.set([]);
    settingsIndex.set(0);
    resultQuery.set({ fetching: true, data: undefined, error: undefined });
    resultMutation.set({ fetching: true, data: undefined, error: undefined });
    vi.spyOn(urql, 'queryStore').mockReturnValue(resultQuery);
    vi.spyOn(urql, 'mutationStore').mockReturnValue(resultMutation);
  });

  afterEach(() => cleanup());

  describe('mutation', () => {
    it('insert', async () => {
      const { component, container } = render(MutationSetting, {
        props: {
          name: 'setting-0',
          comment: 'comment 0',
          targets: ['android', 'image'],
        },
      });
      const handler = vi.fn();
      component.$on('notify', handler);

      await act(() => {
        resultQuery.update((x) => {
          const data = { viewer_config: [] };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(handler).not.toHaveBeenCalled();
      expect(container.innerHTML).toMatchSnapshot();

      await act(() => {
        resultMutation.update((x) => {
          const data = { insert_viewer_config: { returning: [{ id: 17 }] } };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(handler).toHaveBeenCalledOnce();
      const { detail } = handler.mock.calls[0][0];
      expect(detail).toHaveProperty('mutation');
      expect(detail).not.toHaveProperty('error');
    });

    it('update', async () => {
      const { component, container, getByRole } = render(MutationSetting, {
        props: {
          name: 'setting-1',
          comment: 'comment 1',
          targets: ['android', 'image'],
        },
      });
      const handler = vi.fn();
      component.$on('notify', handler);

      await act(() => {
        resultQuery.update((x) => {
          const data = { viewer_config: [{ id: 17, config: {} }] };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(handler).not.toHaveBeenCalled();
      expect(container.innerHTML).toMatchSnapshot();

      await user.click(getByRole('button', { name: 'OK' }));
      expect(container.innerHTML).toMatchSnapshot();

      await act(() => {
        resultMutation.update((x) => {
          const data = { update_viewer_config_by_pk: { id: 17 } };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(handler).toHaveBeenCalledOnce();
      const { detail } = handler.mock.calls[0][0];
      expect(detail).toHaveProperty('mutation');
      expect(detail).not.toHaveProperty('error');
    });

    it('cancel update', async () => {
      const { component, container, getByRole } = render(MutationSetting, {
        props: {
          name: 'setting-1',
          comment: 'comment 1',
          targets: ['android', 'image'],
        },
      });
      const handler = vi.fn();
      component.$on('notify', handler);
      const cancelHandler = vi.fn();
      component.$on('cancel', cancelHandler);

      await act(() => {
        resultQuery.update((x) => {
          const data = { viewer_config: [{ id: 17, config: {} }] };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(cancelHandler).not.toHaveBeenCalledOnce();
      expect(handler).not.toHaveBeenCalled();
      expect(container.innerHTML).toMatchSnapshot();

      await user.click(getByRole('button', { name: 'Cancel' }));
      expect(container.innerHTML).toMatchSnapshot();
      expect(cancelHandler).toHaveBeenCalledOnce();
      expect(handler).not.toHaveBeenCalledOnce();
    });
  });

  describe('error', () => {
    const ERROR_MESSAGE = '[Network] Failed to fetch';

    it('query error', async () => {
      const { component } = render(MutationSetting, {
        props: { name: 'setting-0' },
      });
      const handler = vi.fn();
      component.$on('notify', handler);

      await act(() => {
        resultQuery.update((x) => {
          const error = { message: ERROR_MESSAGE };
          const fetching = false;
          return { ...x, fetching, error };
        });
      });
      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0]?.detail).toMatchObject({ error: { message: ERROR_MESSAGE } });
    });

    it('insert error', async () => {
      const { component } = render(MutationSetting, {
        props: { name: 'setting-0' },
      });
      const handler = vi.fn();
      component.$on('notify', handler);

      await act(() => {
        resultQuery.update((x) => {
          const data = { viewer_config: [] };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(handler).not.toHaveBeenCalled();
      await act(() => {
        resultMutation.update((x) => {
          const error = { message: ERROR_MESSAGE };
          const fetching = false;
          return { ...x, fetching, error };
        });
      });
      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0]?.detail).toMatchObject({ error: { message: ERROR_MESSAGE } });
    });

    it('update error', async () => {
      const { component, container, getByRole } = render(MutationSetting, {
        props: { name: 'setting-1' },
      });
      const handler = vi.fn();
      component.$on('notify', handler);

      await act(() => {
        resultQuery.update((x) => {
          const data = { viewer_config: [{ id: 17, config: {} }] };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(handler).not.toHaveBeenCalled();
      expect(container.innerHTML).toMatchSnapshot();

      await user.click(getByRole('button', { name: 'OK' }));
      expect(container.innerHTML).toMatchSnapshot();

      await act(() => {
        resultMutation.update((x) => {
          const error = { message: ERROR_MESSAGE };
          const fetching = false;
          return { ...x, fetching, error };
        });
      });
      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0]?.detail).toMatchObject({ error: { message: ERROR_MESSAGE } });
    });
  });
});
