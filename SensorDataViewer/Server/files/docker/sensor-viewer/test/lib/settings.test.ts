import { get } from 'svelte/store';
import {
  beforeEach, describe, expect, it,
} from 'vitest';
import {
  charts, imageTopic, imageUpdateMethod, ImageUpdateMethod, name, pane, perftoolName, publisher,
  settings, settingsIndex,
} from '../../src/lib/settings';

describe('settings.ts', () => {
  const NAME1 = 'name-1';
  const NAME2 = 'name-2';
  const NAME3 = 'name-3';
  describe('name', () => {
    beforeEach(() => {
      const init = [{ name: NAME1 }, { name: NAME2 }];
      settings.set(init);
      settingsIndex.set(0);
    });

    it('init', () => {
      expect(get(name)).toBe(NAME1);
    });

    it('update index', () => {
      settingsIndex.set(1);
      expect(get(name)).toBe(NAME2);
    });

    it('index out of range', () => {
      settingsIndex.set(2);
      expect(get(name)).toBe('');
    });
  });

  describe('publisher', () => {
    const PUB1 = 'publisher-1';
    const PUB2 = 'publisher-2';

    beforeEach(() => {
      const init = [
        { name: NAME1, publisher: PUB1 },
        { name: NAME2, publisher: PUB2 },
        { name: NAME3 },
      ];
      settings.set(init);
      settingsIndex.set(0);
    });

    it('init', () => {
      expect(get(publisher)).toBe(PUB1);
    });

    it('update index', () => {
      settingsIndex.set(1);
      expect(get(publisher)).toBe(PUB2);
    });

    it('empty', () => {
      settingsIndex.set(2);
      expect(get(publisher)).toBe('');
    });

    it('index out of range', () => {
      settingsIndex.set(-1);
      expect(get(publisher)).toBe('');
    });
  });

  describe('perftoolName', () => {
    const PERF1 = 'perftool-1';
    const PERF2 = 'perftool-2';

    beforeEach(() => {
      const init = [
        { name: NAME1, perftoolName: PERF1 },
        { name: NAME2, perftoolName: PERF2 },
        { name: NAME3 },
      ];
      settings.set(init);
      settingsIndex.set(0);
    });

    it('init', () => {
      expect(get(perftoolName)).toBe(PERF1);
    });

    it('update index', () => {
      settingsIndex.set(1);
      expect(get(perftoolName)).toBe(PERF2);
    });

    it('empty', () => {
      settingsIndex.set(2);
      expect(get(perftoolName)).toBe('');
    });

    it('index out of range', () => {
      settingsIndex.set(-1);
      expect(get(perftoolName)).toBe('');
    });
  });

  describe('imageTopic', () => {
    const IMG1 = 'image-1';
    const IMG2 = 'image-2';

    beforeEach(() => {
      const init = [
        { name: NAME1, imageTopic: IMG1 },
        { name: NAME2, imageTopic: IMG2 },
        { name: NAME3 },
      ];
      settings.set(init);
      settingsIndex.set(0);
    });

    it('init', () => {
      expect(get(imageTopic)).toBe(IMG1);
    });

    it('update index', () => {
      settingsIndex.set(1);
      expect(get(imageTopic)).toBe(IMG2);
    });

    it('empty', () => {
      settingsIndex.set(2);
      expect(get(imageTopic)).toBe('');
    });

    it('index out of range', () => {
      settingsIndex.set(-1);
      expect(get(imageTopic)).toBe('');
    });
  });

  describe('pane', () => {
    const PANE1 = {
      image: false,
      lte: true,
      map: true,
      perftool: false,
      sensors: ['light'],
    };
    const PANE2 = {
      image: true,
      perftool: true,
    };
    const DEFAULT_PANE = {
      image: true,
      lte: true,
      map: true,
      perftool: true,
      sensors: [],
    };

    beforeEach(() => {
      const init = [
        { name: NAME1, panes: PANE1 },
        { name: NAME2, panes: PANE2 },
        { name: NAME3 },
      ];
      settings.set(init);
      settingsIndex.set(0);
    });

    it('init', () => {
      expect(get(pane)).toMatchObject(PANE1);
    });

    it('update index', () => {
      settingsIndex.set(1);
      expect(get(pane)).toMatchObject(PANE2);
    });

    it('default values', () => {
      settingsIndex.set(2);
      expect(get(pane)).toMatchObject(DEFAULT_PANE);
    });

    it('index out of range', () => {
      settingsIndex.set(-1);
      expect(get(pane)).toMatchObject(DEFAULT_PANE);
    });
  });

  describe('charts', () => {
    const SENSORS1 = ['light'];
    const DEFAULT_SENSORS = [];
    const PANE1 = {
      image: false,
      lte: true,
      map: true,
      perftool: false,
      sensors: SENSORS1,
    };
    const PANE2 = {
      image: true,
      lte: false,
      perftool: true,
    };

    beforeEach(() => {
      const init = [
        { name: NAME1, panes: PANE1 },
        { name: NAME2, panes: PANE2 },
        { name: NAME3 },
      ];
      settings.set(init);
      settingsIndex.set(0);
    });

    it('init', () => {
      const res = get(charts);
      const exp = ['lte', ...SENSORS1];
      expect(res).toHaveLength(exp.length);
      expect(res).toEqual(expect.arrayContaining(exp));
    });

    it('update index', () => {
      settingsIndex.set(1);
      const res = get(charts);
      const exp = ['perftool', ...DEFAULT_SENSORS];
      expect(res).toHaveLength(exp.length);
      expect(res).toEqual(expect.arrayContaining(exp));
    });

    it('default values', () => {
      settingsIndex.set(2);
      const res = get(charts);
      const exp = ['lte', 'perftool', ...DEFAULT_SENSORS];
      expect(res).toHaveLength(exp.length);
      expect(res).toEqual(expect.arrayContaining(exp));
    });

    it('index out of range', () => {
      settingsIndex.set(-1);
      const res = get(charts);
      const exp = ['lte', 'perftool', ...DEFAULT_SENSORS];
      expect(res).toHaveLength(exp.length);
      expect(res).toEqual(expect.arrayContaining(exp));
    });
  });

  describe('imageUpdateMethod', () => {
    const METHOD1: ImageUpdateMethod = 'push';
    const METHOD2: ImageUpdateMethod = 'polling';
    const DEFAULT_METHOD = 'push';

    beforeEach(() => {
      const init = [
        { name: NAME1, imageUpdate: METHOD1 },
        { name: NAME2, imageUpdate: METHOD2 },
        { name: NAME3 },
      ];
      settings.set(init);
      settingsIndex.set(0);
    });

    it('init', () => {
      expect(get(imageUpdateMethod)).toBe(METHOD1);
    });

    it('update index', () => {
      settingsIndex.set(1);
      expect(get(imageUpdateMethod)).toBe(METHOD2);
    });

    it('default value', () => {
      settingsIndex.set(2);
      expect(get(imageUpdateMethod)).toBe(DEFAULT_METHOD);
    });

    it('index out of range', () => {
      settingsIndex.set(-1);
      expect(get(imageUpdateMethod)).toBe(DEFAULT_METHOD);
    });
  });
});
