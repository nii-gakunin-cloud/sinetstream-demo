import { cleanup, render, screen } from '@testing-library/svelte';
import {
  afterEach, describe, expect, it,
} from 'vitest';
import PerftoolForm from '../../../src/lib/setting/PerftoolForm.svelte';

describe('PerftoolForm.svelt', () => {
  afterEach(() => cleanup());

  it('mounts', () => {
    const { container } = render(PerftoolForm);
    expect(container).toBeTruthy();
  });

  it('name', () => {
    render(PerftoolForm);
    const item = screen.getByRole('textbox', { name: 'perftool name' });
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'perftool.name');
  });

  it('switch', () => {
    render(PerftoolForm);
    const item = screen.getByRole('checkbox', { name: 'perftool chart switch' });
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'perftool.visible');
  });

  it('expansion open', () => {
    render(PerftoolForm);
    const item = screen.getByRole('group');
    expect(item.getAttribute('open')).not.toBeNull();
  });
});
