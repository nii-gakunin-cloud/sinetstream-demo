import { cleanup, render } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import {
  afterEach, describe, expect, it,
} from 'vitest';

import SubItemLabel from '../../../../src/lib/setting/server/SubItemLabel.svelte';
import ItemContextTest, { DEFAULT_TEXT } from './ItemContextTest.svelte';

describe('SubItemLabel.svelt', () => {
  const PARENT = 'parent';
  const TEXT = 'child value';

  afterEach(() => cleanup());

  it('uncheck', () => {
    const targets = writable([]);
    const { container, getByText } = render(ItemContextTest, {
      props: {
        Component: SubItemLabel,
        value: PARENT,
        targets,
      },
    });
    expect(getByText('unpublished')).toBeTruthy();
    expect(() => getByText('check_circle')).toThrowError();
    expect(container.outerHTML).toMatchSnapshot();
  });

  it('check', () => {
    const targets = writable([PARENT]);
    const { container, getByText } = render(ItemContextTest, {
      props: {
        Component: SubItemLabel,
        value: PARENT,
        targets,
      },
    });
    expect(getByText('check_circle')).toBeTruthy();
    expect(() => getByText('unpublished')).toThrowError();
    expect(container.outerHTML).toMatchSnapshot();
  });

  it('value', () => {
    const targets = writable([PARENT]);
    const { container, getByText } = render(ItemContextTest, {
      props: {
        Component: SubItemLabel,
        value: PARENT,
        targets,
        props: {
          value: TEXT,
        },
      },
    });
    expect(getByText('check_circle')).toBeTruthy();
    expect(() => getByText('unpublished')).toThrowError();
    expect(getByText(`${DEFAULT_TEXT}: "${TEXT}"`)).toBeTruthy();
    expect(container.outerHTML).toMatchSnapshot();
  });

  it('slot', () => {
    const targets = writable([PARENT]);
    const { container, getByText } = render(ItemContextTest, {
      props: {
        Component: SubItemLabel,
        value: PARENT,
        targets,
        props: {
          text: TEXT,
        },
      },
    });
    expect(getByText('check_circle')).toBeTruthy();
    expect(() => getByText('unpublished')).toThrowError();
    expect(getByText(TEXT)).toBeTruthy();
    expect(() => getByText(DEFAULT_TEXT)).toThrowError();
    expect(container.outerHTML).toMatchSnapshot();
  });
});
