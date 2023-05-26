import { act, cleanup, render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import * as urql from '@urql/svelte';
import * as routing from 'svelte-routing';
import { writable } from 'svelte/store';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import UploadSettingForm from '../../../../src/lib/setting/server/UploadSettingForm.svelte';
import {
  ImageUpdateMethod, LayoutType, settings, settingsIndex, ViewerSettingV1,
} from '../../../../src/lib/settings';

describe('UploadSettingForm.svelt', () => {
  let user;

  const player = {
    from: '2023-02-01 00:00',
    to: '2023-02-03 14:30',
    tick: 1200,
    speed: 10,
    repeat: false,
  };
  const android = {
    publisher: 'pub-1',
    map: true,
    lte: true,
    sensors: [],
  };
  const image = {
    topic: 'topic-1',
    update: 'push' as ImageUpdateMethod,
    visible: true,
  };
  const perftool = {
    name: 'perf-1',
    visible: true,
  };
  const layout = {
    template: 'horizontal' as LayoutType,
  };
  const chart = {
    minSize: {
      width: 300,
      height: 200,
    },
    point: {
      size: 3,
      enabled: true,
    },
    line: {
      size: 3,
      enabled: true,
    },
  };
  const cfg1: ViewerSettingV1 = {
    name: 'setting-1',
    version: '1.0',
    android,
    image,
    perftool,
    player,
    layout,
    chart,
  };
  const player2 = {
    from: '2023-01-01 00:00',
    to: '2023-01-03 14:30',
    tick: 1201,
    speed: 11,
    repeat: true,
  };
  const android2 = {
    publisher: 'pub-0',
    map: false,
    lte: false,
    sensors: ['light'],
  };
  const image2 = {
    topic: 'topic-0',
    update: 'polloing' as ImageUpdateMethod,
    visible: false,
  };
  const perftool2 = {
    name: 'perf-0',
    visible: false,
  };
  const layout2 = {
    template: 'vertical' as LayoutType,
  };
  const chart2 = {
    minSize: {
      width: 301,
      height: 201,
    },
    point: {
      size: 1,
      enabled: false,
    },
    line: {
      size: 1,
      enabled: false,
    },
  };
  const cfg2: ViewerSettingV1 = {
    name: 'setting-2',
    version: '1.0',
    android: android2,
    image: image2,
    perftool: perftool2,
    player: player2,
    layout: layout2,
    chart: chart2,
  };

  beforeEach(() => {
    settings.set([cfg1, cfg2]);
    settingsIndex.set(0);
    user = userEvent.setup();
    vi.mock('@urql/svelte');
  });

  afterEach(() => cleanup());

  it('mount', async () => {
    const { container, getByRole } = render(UploadSettingForm);
    const upload = getByRole('button', { name: 'Upload' });
    expect(upload).toBeTruthy();
    const cancel = getByRole('button', { name: 'Cancel' });
    expect(cancel).toBeTruthy();
    expect(container.children[0].children[0].children[0].innerHTML).matchSnapshot();
  });

  describe('upload', () => {
    const resultQuery = writable({ fetching: false, data: undefined, error: undefined });
    const resultMutation = writable({ fetching: false, data: undefined, error: undefined });

    beforeEach(() => {
      resultQuery.set({ fetching: true, data: undefined, error: undefined });
      resultMutation.set({ fetching: true, data: undefined, error: undefined });
      vi.spyOn(urql, 'queryStore').mockReturnValue(resultQuery);
      vi.spyOn(urql, 'mutationStore').mockReturnValue(resultMutation);
    });

    it('insert', async () => {
      const nav = vi.spyOn(routing, 'navigate');
      const { getByRole } = render(UploadSettingForm);
      const nameInput = getByRole('textbox', { name: 'name' });
      await user.clear(nameInput);
      await user.type(nameInput, 'setting-0');
      await act(() => {
        resultQuery.update((x) => {
          const data = { viewer_config: [] };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });

      expect(nav).not.toHaveBeenCalled();
      await act(() => {
        resultMutation.update((x) => {
          const data = { insert_viewer_config: { returning: [{ id: 17 }] } };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });

      const upload = getByRole('button', { name: 'Upload' });
      await user.click(upload);

      expect(nav).toHaveBeenCalledOnce();
      expect(nav).toHaveBeenCalledWith('/setting/0');
    });

    it('update', async () => {
      const nav = vi.spyOn(routing, 'navigate');
      const { container, getByRole } = render(UploadSettingForm);
      const nameInput = getByRole('textbox', { name: 'name' });
      await user.clear(nameInput);
      await user.type(nameInput, 'setting-1');
      await act(() => {
        resultQuery.update((x) => {
          const data = { viewer_config: [{ id: 17, config: {} }] };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(nav).not.toHaveBeenCalled();
      expect(container.children[0].children[0].children[0].innerHTML).matchSnapshot();

      await user.click(getByRole('button', { name: 'Upload' }));
      expect(nav).not.toHaveBeenCalled();
      expect(container.children[0].children[0].children[0].innerHTML).matchSnapshot();

      await user.click(getByRole('button', { name: 'OK' }));
      expect(container.children[0].children[0].children[0].innerHTML).matchSnapshot();
      expect(nav).not.toHaveBeenCalled();

      await act(() => {
        resultMutation.update((x) => {
          const data = { update_viewer_config_by_pk: { id: 17 } };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(nav).toHaveBeenCalledOnce();
      expect(nav).toHaveBeenCalledWith('/setting/0');
    });
  });

  it.each([0, 1])('cancel: %d', async (idx) => {
    settingsIndex.set(idx);
    const nav = vi.spyOn(routing, 'navigate');
    const { getByRole } = render(UploadSettingForm);
    await user.click(getByRole('button', { name: 'Cancel' }));
    expect(nav).toHaveBeenCalledOnce();
    expect(nav).toHaveBeenCalledWith(`/setting/${idx}`);
  });

  describe('network error', () => {
    const ERROR_MESSAGE = '[Network] Failed to fetch';
    const result = writable({ fetching: false, data: undefined, error: undefined });

    beforeEach(() => {
      result.set({ fetching: true, data: undefined, error: undefined });
      const spy = vi.spyOn(urql, 'queryStore');
      spy.mockReturnValue(result);
    });

    it('query error', async () => {
      const { container, getByRole, queryByText } = render(UploadSettingForm);
      expect(queryByText(ERROR_MESSAGE)).toBeNull();

      await act(() => {
        result.update((x) => {
          const error = { message: ERROR_MESSAGE };
          const fetching = false;
          return { ...x, fetching, error };
        });
      });
      expect(queryByText(ERROR_MESSAGE)).toBeTruthy();
      expect(container.children[0].children[0].children[0].innerHTML).matchSnapshot();
      const upload = getByRole('button', { name: 'Upload' });
      expect(upload.hasAttribute('disabled')).toBe(true);
    });
  });
});
