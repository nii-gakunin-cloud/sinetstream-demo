import { cleanup, render } from '@testing-library/svelte';
import {
  afterEach, describe, expect, it,
} from 'vitest';

import ItemCheckbox from '../../../../src/lib/setting/server/ItemCheckbox.svelte';
import SlotTest from './SlotTest.svelte';

describe('SubItemLabel.svelt', () => {
  afterEach(() => cleanup());

  describe('name', () => {
    const value = 'item';

    it('default name', () => {
      const { container, getByRole } = render(ItemCheckbox, {
        props: { value },
      });
      expect(container.outerHTML).toMatchSnapshot();
      const item = getByRole('checkbox');
      expect(item).toBeTruthy();
      expect(item).toHaveProperty('name', 'targets');
    });

    it('name property', () => {
      const name = 'name1';
      const { container, getByRole } = render(ItemCheckbox, {
        props: { name, value },
      });
      expect(container.outerHTML).toMatchSnapshot();
      const item = getByRole('checkbox');
      expect(item).toBeTruthy();
      expect(item).toHaveProperty('name', name);
    });
  });

  it('value', () => {
    const value = 'item';
    const { container, getByRole } = render(ItemCheckbox, {
      props: { value },
    });
    expect(container.outerHTML).toMatchSnapshot();
    const item = getByRole('checkbox');
    expect(item).toBeTruthy();
    expect(item).toHaveProperty('value', value);
  });

  it('slot', () => {
    const value = 'item';
    const { container, getByTestId } = render(SlotTest, {
      props: {
        Component: ItemCheckbox,
        parameters: { value },
      },
    });
    expect(container.outerHTML).toMatchSnapshot();
    expect(getByTestId('default-slot')).toBeTruthy();
    expect(getByTestId('label-slot')).toBeTruthy();
  });
});
