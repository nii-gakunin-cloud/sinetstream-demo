import { LinearScale } from 'chart.js';

export default class BinLinearScale extends LinearScale {
  buildTicks() {
    const ticks0 = super.buildTicks();
    const step = ticks0[1].value - ticks0[0].value;
    let base;
    if (step < 16) {
      return ticks0;
    }
    if (step < 100) {
      base = 16;
    } else if (step < 1000) {
      base = 128;
    } else {
      base = 1024;
    }
    const opts = this.options;
    const tickOpts = opts.ticks;
    tickOpts.stepSize = Math.ceil(step / base) * base;
    return super.buildTicks();
  }
}

BinLinearScale.id = 'bin_linear';
BinLinearScale.defaults = {};
