import { act, cleanup, render } from '@testing-library/svelte';
import { Writable, writable } from 'svelte/store';
import {
  afterEach, describe, expect, it, vi,
} from 'vitest';

import SubItemCheckbox from '../../../../src/lib/setting/server/SubItemCheckbox.svelte';
import ItemContextTest, { DEFAULT_TEXT } from './ItemContextTest.svelte';

describe('SubItemCheckbox.svelt', () => {
  const PARENT = 'parent';
  const CHILD = 'child';
  const NAME = `${PARENT}.${CHILD}`;
  const TEXT = 'child value';

  afterEach(() => cleanup());

  describe('label.svelt', () => {
    it('value', () => {
      const targets = writable([]);
      const { getByRole, getByText } = render(ItemContextTest, {
        props: {
          Component: SubItemCheckbox,
          value: PARENT,
          targets,
          updateTargets: vi.fn(),
          props: {
            name: 'child',
            value: TEXT,
          },
        },
      });
      expect(getByText(`${DEFAULT_TEXT}: "${TEXT}"`)).toBeTruthy();
      const item = getByRole('checkbox', { name: NAME });
      expect(item).toBeTruthy();
      expect(item.parentElement?.parentElement?.outerHTML).matchSnapshot();
    });

    it('slot', () => {
      const targets = writable([]);
      const { getByRole, getByText } = render(ItemContextTest, {
        props: {
          Component: SubItemCheckbox,
          value: PARENT,
          targets,
          updateTargets: vi.fn(),
          props: {
            name: 'child',
            text: TEXT,
          },
        },
      });
      expect(getByText(TEXT)).toBeTruthy();
      expect(() => getByText(DEFAULT_TEXT)).toThrowError();
      const item = getByRole('checkbox', { name: NAME });
      expect(item).toBeTruthy();
      expect(item.parentElement?.parentElement?.outerHTML).matchSnapshot();
    });
  });

  describe('parent state', () => {
    it('checked', () => {
      const targets = writable([PARENT]);
      const { getByRole } = render(ItemContextTest, {
        props: {
          Component: SubItemCheckbox,
          value: PARENT,
          targets,
          updateTargets: vi.fn(),
          props: {
            name: 'child',
            value: TEXT,
          },
        },
      });
      const item = getByRole('checkbox', { name: NAME });
      expect(item).toBeTruthy();
      expect(item.hasAttribute('disabled')).toBe(true);
      expect(item.parentElement?.parentElement?.outerHTML).matchSnapshot();
    });

    it('unchecked', () => {
      const targets = writable([]);
      const { getByRole } = render(ItemContextTest, {
        props: {
          Component: SubItemCheckbox,
          value: PARENT,
          targets,
          updateTargets: vi.fn(),
          props: {
            name: 'child',
            value: TEXT,
          },
        },
      });
      const item = getByRole('checkbox', { name: NAME });
      expect(item).toBeTruthy();
      expect(item.hasAttribute('disabled')).toBe(false);
      expect(item.parentElement?.parentElement?.outerHTML).matchSnapshot();
    });
  });

  describe('link', () => {
    it('checked', async () => {
      const targets: Writable<string[]> = writable([]);
      const updateTargets = vi.fn();
      render(ItemContextTest, {
        props: {
          Component: SubItemCheckbox,
          value: PARENT,
          targets,
          updateTargets,
          props: {
            name: 'child',
            value: TEXT,
          },
        },
      });
      expect(updateTargets).not.toHaveBeenCalled();
      await act(() => {
        targets.set([PARENT]);
      });
      expect(updateTargets).toHaveBeenCalledWith([PARENT, NAME]);
    });

    it('already checked', async () => {
      const targets: Writable<string[]> = writable([NAME]);
      const updateTargets = vi.fn();
      render(ItemContextTest, {
        props: {
          Component: SubItemCheckbox,
          value: PARENT,
          targets,
          updateTargets,
          props: {
            name: 'child',
            value: TEXT,
          },
        },
      });
      expect(updateTargets).not.toHaveBeenCalled();
      await act(() => {
        targets.set([PARENT, NAME]);
      });
      expect(updateTargets).toHaveBeenCalledWith([PARENT, NAME]);
    });

    it('unchecked', async () => {
      const targets: Writable<string[]> = writable([PARENT, NAME]);
      const updateTargets = vi.fn();
      render(ItemContextTest, {
        props: {
          Component: SubItemCheckbox,
          value: PARENT,
          targets,
          updateTargets,
          props: {
            name: 'child',
            value: TEXT,
          },
        },
      });
      expect(updateTargets).not.toHaveBeenCalled();
      await act(() => {
        targets.set([NAME]);
      });
      expect(updateTargets).toHaveBeenCalledWith([]);
    });

    it('already unchecked', async () => {
      const targets: Writable<string[]> = writable([PARENT]);
      const updateTargets = vi.fn();
      render(ItemContextTest, {
        props: {
          Component: SubItemCheckbox,
          value: PARENT,
          targets,
          updateTargets,
          props: {
            name: 'child',
            value: TEXT,
          },
        },
      });
      expect(updateTargets).not.toHaveBeenCalled();
      await act(() => {
        targets.set([]);
      });
      expect(updateTargets).toHaveBeenCalledWith([]);
    });
  });
});
