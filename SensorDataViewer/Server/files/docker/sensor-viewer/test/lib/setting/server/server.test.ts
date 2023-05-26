import { describe, expect, it } from 'vitest';
import { pickupParameter } from '../../../../src/lib/setting/server/server';
import { ImageUpdateMethod, LayoutType, ViewerSettingV1 } from '../../../../src/lib/settings';

describe('server.ts', () => {
  describe('pickupParameter', () => {
    const player = {
      from: '2023-02-01 00:00',
      to: '2023-02-03 14:30',
      tick: 1200,
      speed: 10,
      repeat: false,
    };
    const android = {
      publisher: 'pub-1',
      map: true,
      lte: true,
      sensors: [],
    };
    const image = {
      topic: 'topic-1',
      update: 'push' as ImageUpdateMethod,
      visible: true,
    };
    const perftool = {
      name: 'perf-1',
      visible: true,
    };
    const layout = {
      template: 'horizontal' as LayoutType,
    };
    const chart = {
      minSize: {
        width: 300,
        height: 200,
      },
      point: {
        size: 3,
        enabled: true,
      },
      line: {
        size: 3,
        enabled: true,
      },
    };
    const cfg: ViewerSettingV1 = {
      name: 'setting-1',
      version: '1.0',
      android,
      image,
      perftool,
      player,
      layout,
      chart,
    };

    describe('targets', () => {
      it('empty', () => {
        const rst = pickupParameter(cfg, []);
        expect(rst).toMatchObject({});
      });

      it('player', () => {
        const rst = pickupParameter(cfg, ['player']);
        expect(rst).toMatchObject({ player });
      });

      it('player.from', () => {
        const rst = pickupParameter(cfg, ['player.from']);
        const { from, to } = player;
        expect(rst).toMatchObject({ player: { from, to } });
      });

      it('android', () => {
        const rst = pickupParameter(cfg, ['android']);
        expect(rst).toMatchObject({ android });
      });

      it('android.publisher', () => {
        const rst = pickupParameter(cfg, ['android.publisher']);
        const { publisher } = android;
        expect(rst).toMatchObject({ android: { publisher } });
      });

      it('image', () => {
        const rst = pickupParameter(cfg, ['image']);
        expect(rst).toMatchObject({ image });
      });

      it('image.topic', () => {
        const rst = pickupParameter(cfg, ['image.topic']);
        const { topic } = image;
        expect(rst).toMatchObject({ image: { topic } });
      });

      it('perftool', () => {
        const rst = pickupParameter(cfg, ['perftool']);
        expect(rst).toMatchObject({ perftool });
      });

      it('perftool.name', () => {
        const rst = pickupParameter(cfg, ['perftool.name']);
        const { name } = perftool;
        expect(rst).toMatchObject({ perftool: { name } });
      });

      it('layout', () => {
        const rst = pickupParameter(cfg, ['layout']);
        expect(rst).toMatchObject({ layout });
      });

      it('chart', () => {
        const rst = pickupParameter(cfg, ['chart']);
        expect(rst).toMatchObject({ chart });
      });
    });

    describe('init', () => {
      const player0 = {
        from: '2023-01-01 00:00',
        to: '2023-01-03 14:30',
        tick: 1201,
        speed: 11,
        repeat: true,
      };
      const android0 = {
        publisher: 'pub-0',
        map: false,
        lte: false,
        sensors: ['light'],
      };
      const image0 = {
        topic: 'topic-0',
        update: 'polloing' as ImageUpdateMethod,
        visible: false,
      };
      const perftool0 = {
        name: 'perf-0',
        visible: false,
      };
      const layout0 = {
        template: 'vertical' as LayoutType,
      };
      const chart0 = {
        minSize: {
          width: 301,
          height: 201,
        },
        point: {
          size: 1,
          enabled: false,
        },
        line: {
          size: 1,
          enabled: false,
        },
      };
      const init: ViewerSettingV1 = {
        name: 'setting-0',
        version: '1.0',
        android: android0,
        image: image0,
        perftool: perftool0,
        player: player0,
        layout: layout0,
        chart: chart0,
      };

      it('empty', () => {
        const rst = pickupParameter(cfg, [], init);
        expect(rst).toMatchObject(init);
      });

      it('player.from', () => {
        const rst = pickupParameter(cfg, ['player.from'], init);
        const { from, to } = player;
        expect(rst).toMatchObject({ ...init, player: { ...player0, from, to } });
      });

      it('android.publisher', () => {
        const rst = pickupParameter(cfg, ['android.publisher'], init);
        const { publisher } = android;
        expect(rst).toMatchObject({ ...init, android: { ...android0, publisher } });
      });

      it('image.topic', () => {
        const rst = pickupParameter(cfg, ['image.topic'], init);
        const { topic } = image;
        expect(rst).toMatchObject({ ...init, image: { ...image0, topic } });
      });

      it('perftool.name', () => {
        const rst = pickupParameter(cfg, ['perftool.name'], init);
        const { name } = perftool;
        expect(rst).toMatchObject({ ...init, perftool: { ...perftool0, name } });
      });

      it('chart', () => {
        const rst = pickupParameter(cfg, ['chart'], init);
        expect(rst).toMatchObject({ ...init, chart });
      });
    });
  });
});
