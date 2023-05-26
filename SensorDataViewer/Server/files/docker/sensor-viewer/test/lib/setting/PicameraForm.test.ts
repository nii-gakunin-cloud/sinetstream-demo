import { cleanup, render, screen } from '@testing-library/svelte';
import {
  afterEach, describe, expect, it,
} from 'vitest';
import PicameraForm from '../../../src/lib/setting/PicameraForm.svelte';

describe('PicameraForm.svelt', () => {
  afterEach(() => cleanup());

  it('mounts', () => {
    const { container } = render(PicameraForm);
    expect(container).toBeTruthy();
  });

  it('name', () => {
    render(PicameraForm);
    const item = screen.getByRole('textbox', { name: 'image topic name' });
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'image.topic');
    expect(item).toHaveProperty('type', 'text');
  });

  it('switch', () => {
    render(PicameraForm);
    const item = screen.getByRole('checkbox', { name: 'image pane switch' });
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'image.visible');
  });

  it('update method', () => {
    render(PicameraForm);
    const items = screen.getAllByRole('radio');
    expect(items).toBeTruthy();
    expect(items).toHaveLength(2);
    items.forEach((item) => {
      expect(item).toHaveProperty('name', 'image.update');
      expect(item.parentElement?.outerHTML).toMatchSnapshot();
    });
  });

  it('expansion open', () => {
    render(PicameraForm);
    const item = screen.getByRole('group');
    expect(item.getAttribute('open')).not.toBeNull();
  });
});
