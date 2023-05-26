import { cleanup, render, screen } from '@testing-library/svelte';
import {
  afterEach, describe, expect, it,
} from 'vitest';
import ChartForm from '../../../src/lib/setting/ChartForm.svelte';

describe('ChartForm.svelt', () => {
  afterEach(() => cleanup());

  it('mounts', () => {
    const { container } = render(ChartForm);
    expect(container).toBeTruthy();
  });

  it('line width', () => {
    render(ChartForm);
    const item = screen.getByRole('spinbutton', { name: 'line width' });
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'chart.line.size');
    expect(item).toHaveProperty('type', 'number');
  });

  it('line enabled', () => {
    render(ChartForm);
    const item = screen.getByRole('checkbox', { name: 'chart line enabled' });
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'chart.line.enabled');
  });

  it('point size', () => {
    render(ChartForm);
    const item = screen.getByRole('spinbutton', { name: 'point size' });
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'chart.point.size');
    expect(item).toHaveProperty('type', 'number');
  });

  it('point enabled', () => {
    render(ChartForm);
    const item = screen.getByRole('checkbox', { name: 'chart point enabled' });
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'chart.point.enabled');
  });

  it('min width', () => {
    render(ChartForm);
    const item = screen.getByRole('spinbutton', { name: 'width' });
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'chart.minSize.width');
    expect(item).toHaveProperty('type', 'number');
  });

  it('min height', () => {
    render(ChartForm);
    const item = screen.getByRole('spinbutton', { name: 'height' });
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'chart.minSize.height');
    expect(item).toHaveProperty('type', 'number');
  });

  it('expansion open', () => {
    render(ChartForm);
    const item = screen.getByRole('group');
    expect(item.getAttribute('open')).toBeNull();
  });
});
