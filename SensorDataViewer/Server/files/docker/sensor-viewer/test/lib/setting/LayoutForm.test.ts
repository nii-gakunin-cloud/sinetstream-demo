import { cleanup, render, screen } from '@testing-library/svelte';
import {
  afterEach, describe, expect, it,
} from 'vitest';
import LayoutForm from '../../../src/lib/setting/LayoutForm.svelte';

describe('LayoutForm.svelt', () => {
  afterEach(() => cleanup());

  it('mounts', () => {
    const { container } = render(LayoutForm);
    expect(container).toBeTruthy();
  });

  it('expansion open', () => {
    render(LayoutForm);
    const item = screen.getByRole('group');
    expect(item.getAttribute('open')).not.toBeNull();
  });

  it.each([
    'horizontal',
    'vertical-horizontal',
    'vertical',
    'vertical-2',
  ])('layout: %s', (name) => {
    render(LayoutForm);
    const item = screen.getByRole('radio', { name });
    expect(item).toBeTruthy();
    expect(item).toHaveProperty('name', 'layout.template');
    expect(item.parentElement?.innerHTML).toMatchSnapshot();
  });
});
