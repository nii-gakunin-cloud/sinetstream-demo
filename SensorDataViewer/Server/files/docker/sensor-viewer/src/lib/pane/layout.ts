import { derived, type Readable } from 'svelte/store';
import { settings, settingsIndex } from '../settings';

export type LayoutTemplate = 'horizontal' | 'vertical-horizontal' | 'vertical' | 'vertical-2';

export const layoutTemplate: Readable<LayoutTemplate> = derived(
  [settings, settingsIndex],
  ([$settings, $settingsIndex]) => {
    const { template } = $settings?.[$settingsIndex]?.layout || {};
    return template != null ? template : 'horizontal';
  },
);

export function chartColumns(count, width, minWidth) {
  if (width < 576 || width / minWidth < 2.0) {
    return 1;
  }
  if (width / minWidth < 3.0) {
    return 2;
  }
  if (width / minWidth < 4.0) {
    return 3;
  }
  if (width / minWidth < 5.0) {
    if (count > 9) {
      return 4;
    }
    if (count > 4) {
      return 3;
    }
    return 2;
  }
  return 5;
}
