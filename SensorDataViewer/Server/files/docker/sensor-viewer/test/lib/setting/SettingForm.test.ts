import {
  cleanup, getByRole, render, screen,
} from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import * as routing from 'svelte-routing';
import { get } from 'svelte/store';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { sensors as sensorList } from '../../../src/lib/setting/AndroidSensorsForm.svelte';
import { settingParameters } from '../../../src/lib/setting/server/server';
import SettingForm from '../../../src/lib/setting/SettingForm.svelte';
import {
  currentSetting, mode, settings, settingsIndex,
} from '../../../src/lib/settings';
import { endTime, startTime } from '../../../src/lib/viewer/timeRange';

describe('SettingForm.svelt', () => {
  const NAME = 'name1';
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    settings.set([]);
    settingsIndex.set(0);
    settingParameters.set({});
  });

  afterEach(() => cleanup());

  it('mounts', () => {
    const { container } = render(SettingForm, { props: { prevIndex: 0 } });
    expect(container).toBeTruthy();
    const saveBtn = screen.getByRole('button', { name: 'Save' });
    expect(saveBtn).toBeTruthy();
    expect(saveBtn.hasAttribute('disabled')).toBe(true);
    const resetBtn = screen.getByRole('button', { name: 'Reset' });
    expect(resetBtn).toBeTruthy();
    expect(resetBtn.hasAttribute('disabled')).toBe(true);
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelBtn).toBeTruthy();
    expect(cancelBtn.hasAttribute('disabled')).toBe(true);
  });

  describe('name', () => {
    it('new settings', async () => {
      render(SettingForm, { props: { prevIndex: 0 } });
      const item = screen.getByRole('textbox', { name: 'name' });
      expect(item).toBeTruthy();
      await user.type(item, NAME);

      const saveBtn = screen.getByRole('button', { name: 'Save' });
      expect(saveBtn).toBeTruthy();
      expect(saveBtn.hasAttribute('disabled')).toBe(false);
      const resetBtn = screen.getByRole('button', { name: 'Reset' });
      expect(resetBtn).toBeTruthy();
      expect(resetBtn.hasAttribute('disabled')).toBe(false);
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelBtn).toBeTruthy();
      expect(cancelBtn.hasAttribute('disabled')).toBe(true);
    });

    it('save', async () => {
      mode.set('viewer');
      const nav = vi.spyOn(routing, 'navigate');
      render(SettingForm, { props: { prevIndex: 0 } });
      const item = screen.getByRole('textbox', { name: 'name' });
      expect(item).toBeTruthy();
      await user.type(item, NAME);

      const saveBtn = screen.getByRole('button', { name: 'Save' });
      await user.click(saveBtn);

      expect(nav).toHaveBeenCalledOnce();
      expect(nav).toHaveBeenCalledWith('/viewer/0');

      expect(get(settings)).toHaveLength(1);
      const result = get(currentSetting);
      expect(result.name).toBe(NAME);
    });

    it('unique check', async () => {
      settingsIndex.set(1);
      settings.set([{ name: NAME }]);

      render(SettingForm, { props: { prevIndex: 0 } });
      const item = screen.getByRole('textbox', { name: 'name' });
      expect(item).toBeTruthy();
      await user.type(item, NAME);

      const saveBtn = screen.getByRole('button', { name: 'Save' });
      expect(saveBtn).toBeTruthy();
      expect(saveBtn.hasAttribute('disabled')).toBe(true);
      const resetBtn = screen.getByRole('button', { name: 'Reset' });
      expect(resetBtn).toBeTruthy();
      expect(resetBtn.hasAttribute('disabled')).toBe(false);
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelBtn).toBeTruthy();
      expect(cancelBtn.hasAttribute('disabled')).toBe(false);
    });
  });

  describe('Android Sensors', () => {
    describe('publisher', () => {
      const PUBLISHER = 'pub-1';

      it('save', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.type(screen.getByRole('textbox', { name: 'publisher' }), PUBLISHER);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.android?.publisher).toBe(PUBLISHER);
      });

      it('default value', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.android?.publisher).toBe('');
      });
    });

    describe('map pane', () => {
      it('save', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('checkbox', { name: 'map pane switch' }));
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.android?.map).toBe(false);
      });

      it('default', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.android?.map).toBe(true);
      });
    });

    describe('LTE chart', () => {
      it('save', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('checkbox', { name: 'lte chart switch' }));
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.android?.lte).toBe(false);
      });

      it('default', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.android?.lte).toBe(true);
      });
    });

    describe('sensors', () => {
      const DEFAULT_SENSORS: string[] = [];

      it('default', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.android?.sensors).toHaveLength(0);
        expect(result.android?.sensors).toEqual(expect.arrayContaining(DEFAULT_SENSORS));
      });

      it('clear', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('button', { name: 'Clear' }));
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.android?.sensors).toHaveLength(0);
      });

      it('select all', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('button', { name: 'Select All' }));
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.android?.sensors).toHaveLength(sensorList.length);
        expect(result.android?.sensors).toEqual(expect.arrayContaining(sensorList));
      });

      it.each(sensorList as string[])('select: %s', async (sensor) => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        const group = screen.getByRole('article', { name: 'Android Sensors' });
        await user.click(getByRole(group, 'checkbox', { name: sensor }));
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        if (DEFAULT_SENSORS.includes(sensor)) {
          const ex = DEFAULT_SENSORS.filter((x) => (x !== sensor));
          expect(result.android?.sensors).toHaveLength(ex.length);
          expect(result.android?.sensors).toMatchObject(ex);
        } else {
          const ex = [...DEFAULT_SENSORS, sensor];
          expect(result.android?.sensors).toHaveLength(ex.length);
          expect(result.android?.sensors).toEqual(expect.arrayContaining(ex));
        }
      });
    });
  });

  describe('Raspberry Pi Camera', () => {
    describe('image topic name', () => {
      const TOPIC = 'topic-1';

      it('save', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.type(screen.getByRole('textbox', { name: 'image topic name' }), TOPIC);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.image?.topic).toBe(TOPIC);
      });

      it('default value', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.image?.topic).toBe('');
      });
    });

    describe('image pane', () => {
      it('change', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('checkbox', { name: 'image pane switch' }));
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.image?.visible).toBe(false);
      });

      it('default', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.image?.visible).toBe(true);
      });
    });

    describe('update method', () => {
      it('default', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.image?.update).toBe('push');
      });

      it('polling', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('radio', { name: 'radio polling' }));
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.image?.update).toBe('polling');
      });
    });
  });

  describe('Perftool', () => {
    describe('perftool name', () => {
      it('default', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.perftool?.name).toBe('');
      });

      it('name', async () => {
        const perftoolName = 'perf-1';
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.type(screen.getByRole('textbox', { name: 'perftool name' }), perftoolName);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.perftool?.name).toBe(perftoolName);
      });
    });

    describe('perftool chart switch', () => {
      it('default', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.perftool?.visible).toBe(true);
      });

      it('switch', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('checkbox', { name: 'perftool chart switch' }));
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.perftool?.visible).toBe(false);
      });
    });
  });

  describe('Player', () => {
    describe('From', () => {
      it('default', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect.assertions(3);
        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        const tm = get(startTime);
        if (tm != null) {
          expect(result.player?.from).toBe(format(tm, 'yyyy-MM-dd HH:mm'));
        }
      });
    });

    describe('To', () => {
      it('default', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect.assertions(3);
        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        const tm = get(endTime);
        if (tm != null) {
          expect(result.player?.to).toBe(format(tm, 'yyyy-MM-dd HH:mm'));
        }
      });
    });

    describe('Refresh interval', () => {
      it('default', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.player?.tick).toBe(1200);
      });

      it('type 100', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        const item = screen.getByRole('spinbutton', { name: 'Refresh interval' });
        await user.clear(item);
        await user.type(item, '100');
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.player?.tick).toBe(100);
      });
    });

    describe('Granularity', () => {
      it('default', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.player?.speed).toBe(10);
      });

      it('type 20', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        const item = screen.getByRole('spinbutton', { name: 'Granularity' });
        await user.clear(item);
        await user.type(item, '20');
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.player?.speed).toBe(20);
      });
    });

    describe('repeat', () => {
      it('default', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.player?.repeat).toBe(false);
      });

      it('select', async () => {
        render(SettingForm, { props: { prevIndex: 0 } });
        await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
        await user.click(screen.getByRole('checkbox', { name: 'repeat checkbox' }));
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(get(settings)).toHaveLength(1);
        const result = get(currentSetting);
        expect(result.name).toBe(NAME);
        expect(result.player?.repeat).toBe(true);
      });
    });
  });

  describe('Chart', () => {
    describe('Line', () => {
      describe('width', () => {
        it('default', async () => {
          render(SettingForm, { props: { prevIndex: 0 } });
          await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
          await user.click(screen.getByRole('button', { name: 'Save' }));

          expect(get(settings)).toHaveLength(1);
          const result = get(currentSetting);
          expect(result.name).toBe(NAME);
          expect(result.chart?.line?.size).toBe(1);
        });

        it('type 3', async () => {
          render(SettingForm, { props: { prevIndex: 0 } });
          await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
          const item = screen.getByRole('spinbutton', { name: 'line width' });
          await user.clear(item);
          await user.type(item, '3');
          await user.click(screen.getByRole('button', { name: 'Save' }));

          expect(get(settings)).toHaveLength(1);
          const result = get(currentSetting);
          expect(result.name).toBe(NAME);
          expect(result.chart?.line?.size).toBe(3);
        });
      });

      describe('enabled', () => {
        it('default', async () => {
          render(SettingForm, { props: { prevIndex: 0 } });
          await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
          await user.click(screen.getByRole('button', { name: 'Save' }));

          expect(get(settings)).toHaveLength(1);
          const result = get(currentSetting);
          expect(result.name).toBe(NAME);
          expect(result.chart?.line?.enabled).toBe(true);
        });

        it('select', async () => {
          render(SettingForm, { props: { prevIndex: 0 } });
          await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
          await user.click(screen.getByRole('checkbox', { name: 'chart line enabled' }));
          await user.click(screen.getByRole('button', { name: 'Save' }));

          expect(get(settings)).toHaveLength(1);
          const result = get(currentSetting);
          expect(result.name).toBe(NAME);
          expect(result.chart?.line?.enabled).toBe(false);
        });
      });
    });

    describe('Point', () => {
      describe('size', () => {
        it('default', async () => {
          render(SettingForm, { props: { prevIndex: 0 } });
          await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
          await user.click(screen.getByRole('button', { name: 'Save' }));

          expect(get(settings)).toHaveLength(1);
          const result = get(currentSetting);
          expect(result.name).toBe(NAME);
          expect(result.chart?.point?.size).toBe(2);
        });

        it('type 4', async () => {
          render(SettingForm, { props: { prevIndex: 0 } });
          await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
          const item = screen.getByRole('spinbutton', { name: 'point size' });
          await user.clear(item);
          await user.type(item, '4');
          await user.click(screen.getByRole('button', { name: 'Save' }));

          expect(get(settings)).toHaveLength(1);
          const result = get(currentSetting);
          expect(result.name).toBe(NAME);
          expect(result.chart?.point?.size).toBe(4);
        });
      });

      describe('enabled', () => {
        it('default', async () => {
          render(SettingForm, { props: { prevIndex: 0 } });
          await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
          await user.click(screen.getByRole('button', { name: 'Save' }));

          expect(get(settings)).toHaveLength(1);
          const result = get(currentSetting);
          expect(result.name).toBe(NAME);
          expect(result.chart?.point?.enabled).toBe(true);
        });

        it('click', async () => {
          render(SettingForm, { props: { prevIndex: 0 } });
          await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
          await user.click(screen.getByRole('checkbox', { name: 'chart point enabled' }));
          await user.click(screen.getByRole('button', { name: 'Save' }));

          expect(get(settings)).toHaveLength(1);
          const result = get(currentSetting);
          expect(result.name).toBe(NAME);
          expect(result.chart?.point?.enabled).toBe(false);
        });
      });
    });

    describe('Minimum Size', () => {
      describe('width', () => {
        it('default', async () => {
          render(SettingForm, { props: { prevIndex: 0 } });
          await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
          await user.click(screen.getByRole('button', { name: 'Save' }));

          expect(get(settings)).toHaveLength(1);
          const result = get(currentSetting);
          expect(result.name).toBe(NAME);
          expect(result.chart?.minSize?.width).toBe(310);
        });

        it('type 400', async () => {
          render(SettingForm, { props: { prevIndex: 0 } });
          await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
          const item = screen.getByRole('spinbutton', { name: 'width' });
          await user.clear(item);
          await user.type(item, '400');
          await user.click(screen.getByRole('button', { name: 'Save' }));

          expect(get(settings)).toHaveLength(1);
          const result = get(currentSetting);
          expect(result.name).toBe(NAME);
          expect(result.chart?.minSize?.width).toBe(400);
        });
      });

      describe('height', () => {
        it('default', async () => {
          render(SettingForm, { props: { prevIndex: 0 } });
          await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
          await user.click(screen.getByRole('button', { name: 'Save' }));

          expect(get(settings)).toHaveLength(1);
          const result = get(currentSetting);
          expect(result.name).toBe(NAME);
          expect(result.chart?.minSize?.height).toBe(250);
        });

        it('type 300', async () => {
          render(SettingForm, { props: { prevIndex: 0 } });
          await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
          const item = screen.getByRole('spinbutton', { name: 'height' });
          await user.clear(item);
          await user.type(item, '300');
          await user.click(screen.getByRole('button', { name: 'Save' }));

          expect(get(settings)).toHaveLength(1);
          const result = get(currentSetting);
          expect(result.name).toBe(NAME);
          expect(result.chart?.minSize?.height).toBe(300);
        });
      });
    });
  });

  describe('Layout', () => {
    it('default', async () => {
      render(SettingForm, { props: { prevIndex: 0 } });
      await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(get(settings)).toHaveLength(1);
      const result = get(currentSetting);
      expect(result.name).toBe(NAME);
      expect(result.layout?.template).toBe('horizontal');
    });

    it.each([
      'horizontal',
      'vertical-horizontal',
      'vertical',
      'vertical-2',
    ])('layout: %s', async (name) => {
      render(SettingForm, { props: { prevIndex: 0 } });
      await user.type(screen.getByRole('textbox', { name: 'name' }), NAME);
      await user.click(screen.getByRole('radio', { name }));
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(get(settings)).toHaveLength(1);
      const result = get(currentSetting);
      expect(result.name).toBe(NAME);
      expect(result.layout?.template).toBe(name);
    });
  });

  describe('Delete', () => {
    beforeEach(() => {
      settings.set([
        {
          version: '1.0',
          name: '#1',
          player: {
            from: '2023-05-30 11:19',
            to: '2023-05-30 11:34',
            tick: 1200,
            speed: 10,
            repeat: false,
          },
          android: {
            publisher: '', map: false, lte: false, sensors: [],
          },
          image: { topic: '', visible: false, update: 'push' },
          perftool: { name: '', visible: false },
          layout: { template: 'horizontal' },
          chart: {
            line: { enabled: true, size: 1 },
            point: { enabled: true, size: 2 },
            minSize: { width: 310, height: 250 },
          },
        },
        {
          version: '1.0',
          name: '#2',
          player: {
            from: '2023-05-30 11:19',
            to: '2023-05-30 11:34',
            tick: 1200,
            speed: 10,
            repeat: false,
          },
          android: {
            publisher: '', map: false, lte: false, sensors: [],
          },
          image: { topic: '', visible: false, update: 'push' },
          perftool: { name: '', visible: false },
          layout: { template: 'horizontal' },
          chart: {
            line: { enabled: true, size: 1 },
            point: { enabled: true, size: 2 },
            minSize: { width: 310, height: 250 },
          },
        },
        {
          version: '1.0',
          name: '#3',
          player: {
            from: '2023-05-30 11:19',
            to: '2023-05-30 11:34',
            tick: 1200,
            speed: 10,
            repeat: false,
          },
          android: {
            publisher: '', map: false, lte: false, sensors: [],
          },
          image: { topic: '', visible: false, update: 'push' },
          perftool: { name: '', visible: false },
          layout: { template: 'horizontal' },
          chart: {
            line: { enabled: true, size: 1 },
            point: { enabled: true, size: 2 },
            minSize: { width: 310, height: 250 },
          },
        },
      ]);
    });

    it.each([0, 1, 2])('delete %i', async (index) => {
      settingsIndex.set(index);
      render(SettingForm, { props: { prevIndex: 0 } });
      expect(get(currentSetting).name).toBe(`#${index + 1}`);
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      expect(get(settings)).toHaveLength(2);
    });
  });
});
