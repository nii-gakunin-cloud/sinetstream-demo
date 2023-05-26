import { format, parseISO, sub } from 'date-fns';
import { persisted } from 'svelte-local-storage-store';
import {
  derived, writable, type Readable, type Writable,
} from 'svelte/store';
import * as zod from 'zod';

const paneVisibleSchema = zod.object({
  map: zod.boolean().optional(),
  image: zod.boolean().optional(),
  perftool: zod.boolean().optional(),
  lte: zod.boolean().optional(),
  sensors: zod.array(zod.string()).optional(),
});
const playerSchema = zod.object({
  from: zod.union([zod.preprocess(
    (arg) => (typeof arg === 'string' ? parseISO(arg) : arg),
    zod.date(),
  ), zod.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)]),
  to: zod.union([zod.preprocess(
    (arg) => (typeof arg === 'string' ? parseISO(arg) : arg),
    zod.date(),
  ), zod.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)]),
  tick: zod.number().gte(100),
  speed: zod.number().gte(1).lte(100),
  repeat: zod.boolean(),
});
const chartV0Schema = zod.object({
  minSize: zod.object({
    width: zod.number().gte(200).optional(),
    height: zod.number().gte(150).optional(),
  }).optional(),
  line: zod.object({
    enabled: zod.boolean().optional(),
    size: zod.number().gt(0).optional(),
  }).optional(),
  point: zod.object({
    enabled: zod.boolean().optional(),
    size: zod.number().gt(0).optional(),
  }).optional(),
});
const layoutTemplateSchema = zod.enum(['horizontal', 'vertical-horizontal', 'vertical', 'vertical-2']);
const viewerSettingSchemaV0 = zod.object({
  name: zod.string(),
  publisher: zod.string().optional(),
  imageTopic: zod.string().optional(),
  perftoolName: zod.string().optional(),
  panes: paneVisibleSchema.optional(),
  imageUpdate: zod.enum(['push', 'polling']).optional(),
  player: playerSchema.optional(),
  layout: zod.object({ template: layoutTemplateSchema }).optional(),
  chart: chartV0Schema.optional(),
});
const androidSchema = zod.object({
  publisher: zod.string(),
  map: zod.boolean(),
  lte: zod.boolean(),
  sensors: zod.array(zod.string()),
});
const picameraSchema = zod.object({
  topic: zod.string(),
  update: zod.enum(['push', 'polling']),
  visible: zod.boolean(),
});
const layoutSchema = zod.object({
  template: layoutTemplateSchema,
});
const perftoolSchema = zod.object({
  name: zod.string(),
  visible: zod.boolean(),
});
const chartV1Schema = zod.object({
  minSize: zod.object({
    width: zod.number().gte(200),
    height: zod.number().gte(150),
  }),
  line: zod.object({
    enabled: zod.boolean(),
    size: zod.number().gt(0),
  }),
  point: zod.object({
    enabled: zod.boolean(),
    size: zod.number().gt(0),
  }),
});
const viewerSettingSchemaV1 = zod.object({
  name: zod.string(),
  version: zod.literal('1.0'),
  android: androidSchema,
  chart: chartV1Schema,
  image: picameraSchema,
  layout: layoutSchema,
  perftool: perftoolSchema,
  player: playerSchema,
});

type ViewerSettingV0 = zod.infer<typeof viewerSettingSchemaV0>;
type ViewerSettingV1 = zod.infer<typeof viewerSettingSchemaV1>;
type ViewerSetting = ViewerSettingV0 | ViewerSettingV1;
type PaneVisible = zod.infer<typeof paneVisibleSchema>;
type SensorViewerMode = 'viewer' | 'player';
type LayoutType = 'horizontal' | 'vertical-horizontal' | 'vertical' | 'vertical-2';
type ImageUpdateMethod = 'push' | 'polling';

function isViewerSettingV0(value: unknown): value is ViewerSettingV0 {
  return viewerSettingSchemaV0.safeParse(value).success;
}

function isViewerSettingV1(value: unknown): value is ViewerSettingV1 {
  return viewerSettingSchemaV1.safeParse(value).success;
}

const mode: Writable<SensorViewerMode> = persisted('mode', 'viewer');
const settings: Writable<ViewerSetting[]> = persisted('settings', []);
const settingsIndex = writable(0);

function defaultDateTime(minutes = 0): string {
  return format(sub(new Date(), { minutes }), 'yyyy-MM-dd HH:mm');
}

function toV1(v0: ViewerSettingV0): ViewerSettingV1 {
  return {
    name: v0.name,
    version: '1.0',
    android: {
      publisher: v0.publisher ?? '',
      map: v0.panes?.map ?? true,
      lte: v0.panes?.lte ?? true,
      sensors: v0.panes?.sensors ?? [],
    },
    chart: {
      minSize: {
        width: v0.chart?.minSize?.width ?? 310,
        height: v0.chart?.minSize?.height ?? 250,
      },
      line: {
        enabled: v0.chart?.line?.enabled ?? true,
        size: v0.chart?.line?.size ?? 1,
      },
      point: {
        enabled: v0.chart?.point?.enabled ?? true,
        size: v0.chart?.point?.size ?? 2,
      },
    },
    image: {
      topic: v0.imageTopic ?? '',
      update: v0.imageUpdate ?? 'push',
      visible: v0.panes?.image ?? true,
    },
    layout: {
      template: v0.layout?.template ?? 'horizontal',
    },
    perftool: {
      name: v0.perftoolName ?? '',
      visible: v0.panes?.perftool ?? true,
    },
    player: {
      from: v0.player?.from ?? defaultDateTime(15),
      to: v0.player?.to ?? defaultDateTime(),
      tick: v0.player?.tick ?? 1200,
      speed: v0.player?.tick ?? 10,
      repeat: v0.player?.repeat ?? false,
    },
  };
}

function defaultSetting(settingName: string): ViewerSettingV1 {
  return toV1({ name: settingName });
}

const currentSetting: Readable<ViewerSettingV1> = derived(
  [settings, settingsIndex],
  ([$settings, $settingsIndex], set) => {
    if ($settingsIndex < $settings.length && $settingsIndex >= 0) {
      const current = $settings[$settingsIndex];
      if (isViewerSettingV1(current)) {
        set(current);
      } else if (isViewerSettingV0(current)) {
        set(toV1(current));
      }
    } else {
      set(defaultSetting(''));
    }
  },
);

const name: Readable<string> = derived([currentSetting], ([$currentSetting], set) => {
  set($currentSetting.name);
});

const publisher: Readable<string> = derived([currentSetting], ([$currentSetting], set) => {
  set($currentSetting.android.publisher);
});

const perftoolName: Readable<string> = derived([currentSetting], ([$currentSetting], set) => {
  set($currentSetting.perftool.name);
});

const imageTopic: Readable<string> = derived([currentSetting], ([$currentSetting], set) => {
  set($currentSetting.image.topic);
});

const pane: Readable<PaneVisible> = derived([currentSetting], ([$currentSetting], set) => {
  const current = $currentSetting;
  set({
    lte: current.android.lte,
    map: current.android.map,
    sensors: current.android.sensors,
    image: current.image.visible,
    perftool: current.perftool.visible,
  });
});

const charts: Readable<string[]> = derived([currentSetting], ([$currentSetting], set) => {
  const current = $currentSetting;
  const { sensors } = current.android;
  const result: string[] = [...sensors];
  if (current.android.lte) {
    result.unshift('lte');
  }
  if (current.perftool.visible) {
    result.unshift('perftool');
  }
  set(result);
});

const imageUpdateMethod: Readable<ImageUpdateMethod> = derived(
  [currentSetting],
  ([$currentSetting], set) => {
    set($currentSetting.image.update);
  },
);

export {
  settings,
  settingsIndex,
  mode,
  name,
  publisher,
  perftoolName,
  imageTopic,
  pane,
  charts,
  imageUpdateMethod,
  currentSetting,
  isViewerSettingV0,
  isViewerSettingV1,
  viewerSettingSchemaV1,
};
export type {
  SensorViewerMode,
  ImageUpdateMethod,
  ViewerSetting,
  ViewerSettingV0,
  ViewerSettingV1,
  PaneVisible,
  LayoutType,
};
