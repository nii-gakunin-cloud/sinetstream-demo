import {
  cleanup, render, screen,
} from '@testing-library/svelte';
import {
  afterEach, beforeEach, describe, expect, it,
} from 'vitest';
import PlayerForm from '../../../src/lib/setting/PlayerForm.svelte';
import { mode } from '../../../src/lib/settings';

describe('PlayerForm.svelt', () => {
  afterEach(() => cleanup());

  it('mounts', () => {
    const { container } = render(PlayerForm);
    expect(container).toBeTruthy();
  });

  it('From', () => {
    render(PlayerForm);
    const item = screen.getByLabelText('From');
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'player.from');
    expect(item).toHaveProperty('type', 'datetime-local');
  });

  it('To', () => {
    render(PlayerForm);
    const item = screen.getByLabelText('To');
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'player.to');
    expect(item).toHaveProperty('type', 'datetime-local');
  });

  it('Refresh interval', () => {
    render(PlayerForm);
    const item = screen.getByRole('spinbutton', { name: 'Refresh interval' });
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'player.tick');
    expect(item).toHaveProperty('type', 'number');
  });

  it('Granularity', () => {
    render(PlayerForm);
    const item = screen.getByRole('spinbutton', { name: 'Granularity' });
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'player.speed');
    expect(item).toHaveProperty('type', 'number');
  });

  it('repeat', () => {
    render(PlayerForm);
    const item = screen.getByRole('checkbox', { name: 'repeat checkbox' });
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'player.repeat');
    expect(item).toHaveProperty('type', 'checkbox');
  });

  describe('expansion', () => {
    beforeEach(() => {
      mode.set('viewer');
    });

    it('default', () => {
      render(PlayerForm);
      const item = screen.getByRole('group');
      expect(item.getAttribute('open')).toBeNull();
    });

    it('player', () => {
      mode.set('player');
      render(PlayerForm);
      const item = screen.getByRole('group');
      expect(item.getAttribute('open')).not.toBeNull();
    });
  });
});
