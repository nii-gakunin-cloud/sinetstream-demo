import { cleanup, render } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import {
  afterEach, describe, expect, it,
} from 'vitest';
import ServerItemFieldset from '../../../../src/lib/setting/server/ServerItemFieldset.svelte';
import { ImageUpdateMethod, LayoutType, ViewerSettingV1 } from '../../../../src/lib/settings';
import ItemContextTest from './ItemContextTest.svelte';

describe('ServerItemFieldset.svelt', () => {
  afterEach(() => cleanup());

  it('empty', () => {
    const targets = writable([]);
    const setting = {};
    const { container, getByRole } = render(ItemContextTest, {
      props: {
        Component: ServerItemFieldset,
        targets,
        props: { setting },
        value: 'xxx',
        emptySlot: true,
      },
    });
    expect(getByRole('group')).toBeTruthy();
    expect(container.outerHTML).toMatchSnapshot();
  });

  it('setting', () => {
    const targets = writable([]);
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
    const setting: ViewerSettingV1 = {
      name: 'setting-1',
      version: '1.0',
      android,
      image,
      perftool,
      player,
      layout,
      chart,
    };
    const { container, getByRole } = render(ItemContextTest, {
      props: {
        Component: ServerItemFieldset,
        targets,
        props: { setting },
        value: 'xxx',
        emptySlot: true,
      },
    });
    expect(getByRole('group')).toBeTruthy();
    expect(container.outerHTML).toMatchSnapshot();
  });

  it('initValues', () => {
    const targets = writable([]);
    const setting = null;
    const { container, getByRole } = render(ItemContextTest, {
      props: {
        Component: ServerItemFieldset,
        targets,
        props: { setting },
        value: 'xxx',
        emptySlot: true,
      },
    });
    expect(getByRole('group')).toBeTruthy();
    expect(container.outerHTML).toMatchSnapshot();
  });
});
