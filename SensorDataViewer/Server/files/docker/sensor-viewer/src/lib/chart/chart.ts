import { derived, type Readable } from 'svelte/store';
import { settings, settingsIndex } from '../settings';

export const limitMinWidth = 200;
export const limitMinHeight = 150;
export const defaultMinWidth = 310;
export const defaultMinHeight = 250;
const defaultPointSize = 2;
const defaultLineWidth = 1;

export type RectSize = {
  width: number;
  height: number;
};

export type ChartSettings = {
  enabled: boolean;
  size: number;
};

export const chartMinSize: Readable<RectSize> = derived(
  [settings, settingsIndex],
  ([$settings, $settingsIndex]) => {
    const { width: minWidth, height: minHeight } = (
      $settings?.[$settingsIndex]?.chart?.minSize || {}
    );
    const width = minWidth != null && minWidth >= limitMinWidth ? minWidth : defaultMinWidth;
    const height = minHeight != null && minHeight >= limitMinHeight ? minHeight : defaultMinHeight;
    return { width, height };
  },
);

export const chartLineSettings: Readable<ChartSettings> = derived(
  [settings, settingsIndex],
  ([$settings, $settingsIndex]) => {
    const { enabled: flag, size: sz } = (
      $settings?.[$settingsIndex]?.chart?.line || {}
    );
    const enabled = flag != null ? flag : true;
    const size = sz != null && sz > 0 ? sz : defaultLineWidth;
    return { enabled, size };
  },
);

export const chartPointSettings: Readable<ChartSettings> = derived(
  [settings, settingsIndex],
  ([$settings, $settingsIndex]) => {
    const { enabled: flag, size: sz } = (
      $settings?.[$settingsIndex]?.chart?.point || {}
    );
    const enabled = flag != null ? flag : true;
    const size = sz != null && sz > 0 ? sz : defaultPointSize;
    return { enabled, size };
  },
);

export const chartParameter: Readable<Record<string, any>> = derived(
  [chartMinSize, chartLineSettings, chartPointSettings],
  ([$chartMinSize, $chartLineSettings, $chartPointSettings]) => (
    { minSize: $chartMinSize, line: $chartLineSettings, point: $chartPointSettings }
  ),
);

export function toTitle(tableName: string): string {
  return tableName
    .split('_')
    .map((x) => (x.length > 0 ? x.charAt(0).toUpperCase() + x.slice(1) : x))
    .join(' ');
}
