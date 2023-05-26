/* eslint-disable @typescript-eslint/naming-convention */
import { act, cleanup, render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import * as urql from '@urql/svelte';
import * as routing from 'svelte-routing';
import { get, writable } from 'svelte/store';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import DownloadSettingForm from '../../../../src/lib/setting/server/DownloadSettingForm.svelte';
import { settingParameters } from '../../../../src/lib/setting/server/server';
import {
  ImageUpdateMethod, LayoutType, settings, settingsIndex, ViewerSettingV1,
} from '../../../../src/lib/settings';

describe('DownloadSettingForm.svelt', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.mock('@urql/svelte');
    settings.set([{ name: 'setting-0' }]);
    settingsIndex.set(0);
  });

  afterEach(() => cleanup());

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

  it('mount', async () => {
    const { container, getByRole } = render(DownloadSettingForm);
    const apply = getByRole('button', { name: 'Apply' });
    expect(apply).toBeTruthy();
    const cancel = getByRole('button', { name: 'Cancel' });
    expect(cancel).toBeTruthy();
    expect(container.children[0].children[0].children[0].innerHTML).matchSnapshot();
  });

  describe('select setting', () => {
    const resultName = writable({ fetching: false, data: undefined, error: undefined });
    const resultConfig = writable({ fetching: false, data: undefined, error: undefined });

    beforeEach(() => {
      resultName.set({ fetching: true, data: undefined, error: undefined });
      resultConfig.set({ fetching: true, data: undefined, error: undefined });
      vi.spyOn(urql, 'queryStore')
        .mockImplementation((args) => {
          const { variables } = args;
          if (variables == null) {
            return resultName;
          }
          return resultConfig;
        });
    });

    it('setting-1', async () => {
      const { container, getByRole } = render(DownloadSettingForm);
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();

      await act(() => {
        resultName.update((x) => {
          const data = {
            viewer_config: [1, 2].map(
              (n) => ({ id: n, name: `setting-${n}` }),
            ),
          };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();
      const nameSelect = getByRole('combobox');
      await user.selectOptions(nameSelect, 'setting-1');

      await act(() => {
        resultConfig.update((x) => {
          const { name: _name, version: _version, ...config } = cfg1;
          const data = {
            viewer_config_by_pk: {
              name: 'setting-1',
              config,
            },
          };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();
    });

    it('setting-2', async () => {
      const { container, getByRole } = render(DownloadSettingForm);
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();

      await act(() => {
        resultName.update((x) => {
          const data = {
            viewer_config: [1, 2].map(
              (n) => ({ id: n, name: `setting-${n}` }),
            ),
          };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();
      const nameSelect = getByRole('combobox');
      await user.selectOptions(nameSelect, 'setting-1');

      await act(() => {
        resultConfig.update((x) => {
          const { name: _name, version: _version, ...config } = cfg1;
          const data = {
            viewer_config_by_pk: {
              name: 'setting-1',
              config,
            },
          };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();

      await user.selectOptions(nameSelect, 'setting-2');
      await act(() => {
        resultConfig.update((x) => {
          const { name: _name, version: _version, ...config } = cfg2;
          const data = {
            viewer_config_by_pk: {
              name: 'setting-2',
              config,
            },
          };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();
    });
  });

  describe('apply', () => {
    const resultName = writable({ fetching: false, data: undefined, error: undefined });
    const resultConfig = writable({ fetching: false, data: undefined, error: undefined });
    let nav;

    beforeEach(() => {
      settingsIndex.set(1);
      settingParameters.set({});
      nav = vi.spyOn(routing, 'navigate');

      resultName.set({ fetching: true, data: undefined, error: undefined });
      resultConfig.set({ fetching: true, data: undefined, error: undefined });
      vi.spyOn(urql, 'queryStore')
        .mockImplementation((args) => {
          const { variables } = args;
          if (variables == null) {
            return resultName;
          }
          return resultConfig;
        });
    });

    it('default select', async () => {
      const { container, getByRole } = render(DownloadSettingForm);
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();

      await act(() => {
        resultName.update((x) => {
          const data = {
            viewer_config: [1, 2].map(
              (n) => ({ id: n, name: `setting-${n}` }),
            ),
          };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();
      const nameSelect = getByRole('combobox');
      await user.selectOptions(nameSelect, 'setting-1');

      await act(() => {
        resultConfig.update((x) => {
          const { name: _name, version: _version, ...config } = cfg1;
          const data = {
            viewer_config_by_pk: {
              name: 'setting-1',
              config,
            },
          };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();

      const apply = getByRole('button', { name: 'Apply' });
      await user.click(apply);
      expect(nav).toHaveBeenCalledOnce();
      expect(nav).toHaveBeenCalledWith('/setting/1');
      const { from, to } = player;
      const config = {
        android, image, perftool, player: { from, to },
      };
      expect(get(settingParameters)).toMatchObject(config);
    });

    it('chart select', async () => {
      const { container, getByRole, getByText } = render(DownloadSettingForm);
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();

      await act(() => {
        resultName.update((x) => {
          const data = {
            viewer_config: [1, 2].map(
              (n) => ({ id: n, name: `setting-${n}` }),
            ),
          };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();
      const nameSelect = getByRole('combobox');
      await user.selectOptions(nameSelect, 'setting-2');

      await act(() => {
        resultConfig.update((x) => {
          const { name: _name, version: _version, ...config } = cfg2;
          const data = {
            viewer_config_by_pk: {
              name: 'setting-2',
              config,
            },
          };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();

      const chartCheckbox = getByText('Chart')?.parentElement?.parentElement?.getElementsByTagName('input')[0];
      await user.click(chartCheckbox);

      const apply = getByRole('button', { name: 'Apply' });
      await user.click(apply);
      expect(nav).toHaveBeenCalledOnce();
      expect(nav).toHaveBeenCalledWith('/setting/1');
      const { from, to } = player2;
      const config = {
        android: android2,
        image: image2,
        perftool: perftool2,
        player: { from, to },
        chart: chart2,
      };
      expect(get(settingParameters)).toMatchObject(config);
    });

    it('layout select', async () => {
      const { container, getByRole, getByText } = render(DownloadSettingForm);
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();

      await act(() => {
        resultName.update((x) => {
          const data = {
            viewer_config: [1, 2].map(
              (n) => ({ id: n, name: `setting-${n}` }),
            ),
          };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();
      const nameSelect = getByRole('combobox');
      await user.selectOptions(nameSelect, 'setting-1');

      await act(() => {
        resultConfig.update((x) => {
          const { name: _name, version: _version, ...config } = cfg1;
          const data = {
            viewer_config_by_pk: {
              name: 'setting-1',
              config,
            },
          };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();

      const chartCheckbox = getByText('Layout')?.parentElement?.parentElement?.getElementsByTagName('input')[0];
      await user.click(chartCheckbox);

      const apply = getByRole('button', { name: 'Apply' });
      await user.click(apply);
      expect(nav).toHaveBeenCalledOnce();
      expect(nav).toHaveBeenCalledWith('/setting/1');
      const { from, to } = player;
      const config = {
        android, image, perftool, player: { from, to }, layout,
      };
      expect(get(settingParameters)).toMatchObject(config);
    });

    it('playback select', async () => {
      const { container, getByRole, getByText } = render(DownloadSettingForm);
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();

      await act(() => {
        resultName.update((x) => {
          const data = {
            viewer_config: [1, 2].map(
              (n) => ({ id: n, name: `setting-${n}` }),
            ),
          };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();
      const nameSelect = getByRole('combobox');
      await user.selectOptions(nameSelect, 'setting-1');

      await act(() => {
        resultConfig.update((x) => {
          const { name: _name, version: _version, ...config } = cfg1;
          const data = {
            viewer_config_by_pk: {
              name: 'setting-1',
              config,
            },
          };
          const fetching = false;
          return { ...x, fetching, data };
        });
      });
      expect(container.children[0].children[0].children[0].innerHTML).toMatchSnapshot();

      const playbackCheckbox = getByText('Playback')?.parentElement?.parentElement?.getElementsByTagName('input')[0];
      await user.click(playbackCheckbox);
      const androidCheckbox = getByText('Android Sensors')?.parentElement?.parentElement?.getElementsByTagName('input')[0];
      await user.click(androidCheckbox);
      const raspiCheckbox = getByText('Raspberry Pi Camera')?.parentElement?.parentElement?.getElementsByTagName('input')[0];
      await user.click(raspiCheckbox);
      const perftoolCheckbox = getByText('Perftool')?.parentElement?.parentElement?.getElementsByTagName('input')[0];
      await user.click(perftoolCheckbox);

      const apply = getByRole('button', { name: 'Apply' });
      await user.click(apply);
      expect(nav).toHaveBeenCalledOnce();
      expect(nav).toHaveBeenCalledWith('/setting/1');
      expect(get(settingParameters)).toMatchObject({ player });
    });
  });

  it.each([0, 1])('cancel: %d', async (idx) => {
    settingsIndex.set(idx);
    const nav = vi.spyOn(routing, 'navigate');
    const { getByRole } = render(DownloadSettingForm);
    const cancel = getByRole('button', { name: 'Cancel' });
    await user.click(cancel);
    expect(nav).toHaveBeenCalledOnce();
    expect(nav).toHaveBeenCalledWith(`/setting/${idx}`);
  });

  it('network error', async () => {
    const ERROR_MESSAGE = '[Network] Failed to fetch';
    const result = writable({ fetching: true, data: undefined, error: undefined });
    const spy = vi.spyOn(urql, 'queryStore');
    spy.mockReturnValue(result);

    const { container, getByText, queryByText } = render(DownloadSettingForm);
    expect(queryByText(ERROR_MESSAGE)).toBeNull();
    expect(container.children[0].children[0].children[0].innerHTML).matchSnapshot();

    await act(() => {
      result.update((x) => {
        const error = { message: ERROR_MESSAGE };
        const fetching = false;
        return { ...x, fetching, error };
      });
    });
    expect(getByText(ERROR_MESSAGE)).toBeTruthy();
    expect(container.children[0].children[0].children[0].innerHTML).matchSnapshot();
  });
});
