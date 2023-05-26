import {
  differenceInMinutes, hoursToMilliseconds, minutesToMilliseconds, secondsToMilliseconds, sub,
  type Duration,
} from 'date-fns';
import { persisted } from 'svelte-local-storage-store';
import { derived, type Readable } from 'svelte/store';
import type { SensorViewerMode } from '../settings';

export type ResolutionSuffix = '' | '_30sec' | '_1min' | '_2min' | '_10min';

export type TimeRange = {
  label: string;
  resolution: ResolutionSuffix;
  duration: Duration;
};

export const timeRanges: TimeRange[] = [
  {
    label: 'Last 5 minutes',
    resolution: '',
    duration: { minutes: 5 },
  },
  {
    label: 'Last 15 minutes',
    resolution: '',
    duration: { minutes: 15 },
  },
  {
    label: 'Last 30 minutes',
    resolution: '',
    duration: { minutes: 30 },
  },
  {
    label: 'Last 1 hour',
    resolution: '',
    duration: { hours: 1 },
  },
  {
    label: 'Last 3 hours',
    resolution: '_30sec',
    duration: { hours: 3 },
  },
  {
    label: 'Last 6 hours',
    resolution: '_30sec',
    duration: { hours: 6 },
  },
  {
    label: 'Last 12 hours',
    resolution: '_1min',
    duration: { hours: 12 },
  },
  {
    label: 'Last 24 hours',
    resolution: '_2min',
    duration: { days: 1 },
  },
  {
    label: 'Last 2 days',
    resolution: '_2min',
    duration: { days: 2 },
  },
  {
    label: 'Last 4 days',
    resolution: '_10min',
    duration: { days: 4 },
  },
  {
    label: 'Last 7 days',
    resolution: '_10min',
    duration: { days: 7 },
  },
];

export const timeRange = persisted('timeRange', timeRanges[1], {
  serializer: {
    parse: (label: string) => {
      const ret = timeRanges.find((x) => x.label === label);
      return ret != null ? ret : timeRanges[1];
    },
    stringify: (value: TimeRange) => (value.label),
  },
});

export type RefreshInterval = {
  label: string;
  interval: number;
};

export const refreshIntervals: RefreshInterval[] = [
  {
    label: 'Off',
    interval: 0,
  },
  {
    label: '5s',
    interval: secondsToMilliseconds(5),
  },
  {
    label: '10s',
    interval: secondsToMilliseconds(10),
  },
  {
    label: '30s',
    interval: secondsToMilliseconds(30),
  },
  {
    label: '1m',
    interval: minutesToMilliseconds(1),
  },
  {
    label: '5m',
    interval: minutesToMilliseconds(5),
  },
  {
    label: '15m',
    interval: minutesToMilliseconds(15),
  },
  {
    label: '30m',
    interval: minutesToMilliseconds(30),
  },
  {
    label: '1h',
    interval: hoursToMilliseconds(1),
  },
];

export const refreshInterval = persisted('refreshInterval', refreshIntervals[3], {
  serializer: {
    parse: (label: string) => {
      const ret = refreshIntervals.find((x) => x.label === label);
      return ret != null ? ret : refreshIntervals[3];
    },
    stringify: (value: RefreshInterval) => (value.label),
  },
});

export function findIndex(target, items, defaultValue = 1): number {
  const ret = items.findIndex((x) => x.label === target.label);
  return ret >= 0 ? ret : defaultValue;
}

export type ResolutionParameter = {
  from?: Date,
  to?: Date,
  mode?: SensorViewerMode,
  range?: TimeRange,
};

export function toResolution(params: ResolutionParameter): ResolutionSuffix {
  if (params?.mode === 'viewer' && params?.range != null) {
    return params?.range.resolution;
  }
  if (params?.from == null || params?.to == null) {
    return '';
  }
  const diff = differenceInMinutes(params?.to, params?.from);
  if (diff < 180) {
    return '';
  }
  if (diff < 12 * 60) {
    return '_30sec';
  }
  if (diff < 24 * 60) {
    return '_1min';
  }
  if (diff <= 7 * 24 * 60) {
    return '_2min';
  }
  return '_10min';
}

export const endTime: Readable<Date | null> = derived(
  [refreshInterval],
  ([$refreshInterval], set) => {
    if ($refreshInterval.interval > 0) {
      set(new Date());
      const interval = setInterval(() => {
        const now = new Date();
        set(now);
      }, $refreshInterval.interval);
      return () => {
        clearInterval(interval);
      };
    }
    set(new Date());
    return () => { };
  },
  new Date(),
);

export const startTime: Readable<Date> = derived([timeRange, endTime], ([$timeRange, $endTime]) => (
  sub($endTime, $timeRange.duration)
));
