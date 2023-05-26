import {
  cleanup, fireEvent, getAllByRole, render, screen,
} from '@testing-library/svelte';
import {
  afterEach, describe, expect, it, vi,
} from 'vitest';
import AndroidSensorsForm, {
  sensors as sensorList,
} from '../../../src/lib/setting/AndroidSensorsForm.svelte';

describe('AndroidSensorsForm.svelt', () => {
  afterEach(() => cleanup());

  it('mounts', () => {
    const { container } = render(AndroidSensorsForm);
    expect(container).toBeTruthy();
  });

  it('publisher', () => {
    render(AndroidSensorsForm);
    const item = screen.getByRole('textbox', { name: 'publisher' });
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'android.publisher');
    expect(item).toHaveProperty('type', 'text');
  });

  it('map switch', () => {
    render(AndroidSensorsForm);
    const item = screen.getByRole('checkbox', { name: 'map pane switch' });
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'android.map');
  });

  it('lte switch', () => {
    render(AndroidSensorsForm);
    const item = screen.getByRole('checkbox', { name: 'lte chart switch' });
    expect(item).toBeTruthy();
    expect(item.parentElement?.outerHTML).toMatchSnapshot();
    expect(item).toHaveProperty('name', 'android.lte');
  });

  it('sensors', () => {
    render(AndroidSensorsForm);
    const fieldset = screen.getByRole('group', { name: 'sensor list' });
    const checks = getAllByRole(fieldset, 'checkbox');
    expect(checks).toBeTruthy();
    expect(checks).toHaveLength(18);
    checks.forEach((item) => {
      expect(item).toHaveProperty('name', 'android.sensors');
    });
  });

  it('expansion open', () => {
    render(AndroidSensorsForm);
    const parent = screen.getByRole('article', { name: 'Android Sensors' });
    const item = parent.querySelector('details');
    expect(item?.getAttribute('open')).not.toBeNull();
  });

  describe('select all button', () => {
    it('Nothing is selected.', () => {
      const setFields = vi.fn();
      const updateDirty = vi.fn();
      render(AndroidSensorsForm, { props: { setFields, updateDirty } });
      const item = screen.getByRole('button', { name: 'Select All' });
      expect(item).toBeTruthy();
      fireEvent.click(item);
      expect(setFields).toHaveBeenCalledOnce();
      expect(setFields).toHaveBeenCalledWith('android.sensors', sensorList, true);
      expect(updateDirty).toHaveBeenCalledOnce();
    });

    it('All selected', () => {
      const setFields = vi.fn();
      const updateDirty = vi.fn();
      const selected = [...sensorList];
      render(AndroidSensorsForm, { props: { setFields, updateDirty, selected } });
      const item = screen.getByRole('button', { name: 'Select All' });
      expect(item).toBeTruthy();
      fireEvent.click(item);
      expect(setFields).toHaveBeenCalledOnce();
      expect(setFields).toHaveBeenCalledWith('android.sensors', sensorList, true);
      expect(updateDirty).not.toHaveBeenCalled();
    });
  });

  describe('clear button', () => {
    it('Nothing is selected.', () => {
      const setFields = vi.fn();
      const updateDirty = vi.fn();
      render(AndroidSensorsForm, { props: { setFields, updateDirty } });
      const item = screen.getByRole('button', { name: 'Clear' });
      expect(item).toBeTruthy();
      fireEvent.click(item);
      expect(setFields).toHaveBeenCalledOnce();
      expect(setFields).toHaveBeenCalledWith('android.sensors', []);
      expect(updateDirty).not.toHaveBeenCalled();
    });

    it('All selected', () => {
      const setFields = vi.fn();
      const updateDirty = vi.fn();
      const selected = [...sensorList];
      render(AndroidSensorsForm, { props: { setFields, updateDirty, selected } });
      const item = screen.getByRole('button', { name: 'Clear' });
      expect(item).toBeTruthy();
      fireEvent.click(item);
      expect(setFields).toHaveBeenCalledOnce();
      expect(setFields).toHaveBeenCalledWith('android.sensors', []);
      expect(updateDirty).toHaveBeenCalledOnce();
    });
  });
});
