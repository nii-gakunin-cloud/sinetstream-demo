import {
  format, fromUnixTime, getUnixTime, parseISO,
} from 'date-fns';
import { derived, writable, type Readable } from 'svelte/store';
import { settings, settingsIndex } from '../settings';
import { endTime, startTime } from '../viewer/timeRange';

export const fromTime: Readable<number> = derived(
  [settings, settingsIndex, startTime],
  ([$settings, $settingsIndex, $startTime]) => {
    const from = $settings?.[$settingsIndex]?.player?.from;
    return (from != null
      ? getUnixTime(typeof from === 'string' ? parseISO(from) : from)
      : getUnixTime($startTime)
    );
  },
);

export const toTime: Readable<number> = derived(
  [settings, settingsIndex, endTime],
  ([$settings, $settingsIndex, $endTime]) => {
    const to = $settings?.[$settingsIndex]?.player?.to;
    return (to != null
      ? getUnixTime(typeof to === 'string' ? parseISO(to) : to)
      : getUnixTime($endTime)
    );
  },
);

export const speed: Readable<number> = derived(
  [settings, settingsIndex],
  ([$settings, $settingsIndex]) => {
    const speed0 = $settings?.[$settingsIndex]?.player?.speed;
    return speed0 != null ? speed0 : 10;
  },
);

export const tick: Readable<number> = derived(
  [settings, settingsIndex],
  ([$settings, $settingsIndex]) => {
    const tick0 = $settings?.[$settingsIndex]?.player?.tick;
    return tick0 != null ? tick0 : 1200;
  },
);
export const repeat: Readable<boolean> = derived(
  [settings, settingsIndex],
  ([$settings, $settingsIndex]) => {
    const repeat0 = $settings?.[$settingsIndex]?.player?.repeat;
    return repeat0 != null ? repeat0 : false;
  },
);

export const step: Readable<number> = derived(
  [fromTime, toTime, speed],
  ([$fromTime, $toTime, $speed]) => (
    Math.ceil((($toTime - $fromTime) / 10000) * $speed)
  ),
);

export const playerParameter: Readable<Record<string, any>> = derived(
  [fromTime, toTime, speed, tick, repeat],
  ([$fromTime, $toTime, $speed, $tick, $repeat]) => ({
    from: format(fromUnixTime($fromTime), 'yyyy-MM-dd HH:mm'),
    to: format(fromUnixTime($toTime), 'yyyy-MM-dd HH:mm'),
    speed: $speed,
    tick: $tick,
    repeat: $repeat,
  }),
);

export const current = writable(0);
