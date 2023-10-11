/* eslint-disable no-param-reassign */
import type { ViewerSettingV1 } from 'src/lib/settings';
import { writable, type Writable } from 'svelte/store';

const itemKey = Symbol('download item context key');
const formKey = Symbol('download form context key');
const settingParameters: Writable<Record<string, any>> = writable({});

const pickup1 = (cfg: ViewerSettingV1, rst: Record<string, any>, item: string) => {
  if (item in cfg) {
    return { ...rst, [item]: cfg[item as keyof ViewerSettingV1] };
  }

  if (item === 'player.from') {
    const { from, to } = cfg.player ?? {};
    if (from != null && to != null) {
      rst.player = { ...(rst.player ?? {}), from, to };
    }
  } else if (item === 'android.publisher') {
    const { publisher } = cfg.android ?? {};
    if (publisher != null) {
      rst.android = { ...(rst.android ?? {}), publisher };
    }
  } else if (item === 'image.topic') {
    const { topic } = cfg.image ?? {};
    if (topic != null) {
      rst.image = { ...(rst.image ?? {}), topic };
    }
  } else if (item === 'perftool.name') {
    const { name } = cfg.perftool ?? {};
    if (name != null) {
      rst.perftool = { ...(rst.perftool ?? {}), name };
    }
  }
  return rst;
};

const pickupParameter = (
  cfg: ViewerSettingV1,
  targets: string[],
  init: Record<string, any> = {},
) => targets.sort().reduce(
  (rst: Record<string, any>, item: string) => pickup1(cfg, rst, item),
  init,
);

export {
  itemKey, formKey, settingParameters, pickupParameter,
};
