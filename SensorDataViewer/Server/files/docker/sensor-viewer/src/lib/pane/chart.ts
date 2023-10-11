import { getContextClient, gql, queryStore } from '@urql/svelte';
import { formatISO } from 'date-fns';
import type { ResolutionSuffix } from '../viewer/timeRange';

const moduleMap = {
  accelerometer: 'ChartAccelerometer.svelte',
  'accelerometer uncalibrated': 'ChartAccelerometerUncalibrated.svelte',
  'ambient temperature': 'ChartAmbientTemperature.svelte',
  'game rotation vector': 'ChartGameRotationVector.svelte',
  'geomagnetic rotation vector': 'ChartGeomagneticRotationVector.svelte',
  gravity: 'ChartGravity.svelte',
  gyroscope: 'ChartGyroscope.svelte',
  'gyroscope uncalibrated': 'ChartGyroscopeUncalibrated.svelte',
  light: 'ChartLight.svelte',
  'linear acceleration': 'ChartLinearAcceleration.svelte',
  lte: 'ChartLte.svelte',
  'magnetic field': 'ChartMagneticField.svelte',
  'magnetic field uncalibrated': 'ChartMagneticFieldUncalibrated.svelte',
  orientation: 'ChartOrientation.svelte',
  perftool: 'ChartPerftool.svelte',
  pressure: 'ChartPressure.svelte',
  proximity: 'ChartProximity.svelte',
  'relative humidity': 'ChartRelativeHumidity.svelte',
  'rotation vector': 'ChartRotationVector.svelte',
  'step counter': 'ChartStepCounter.svelte',
};

type ChartNames = keyof typeof moduleMap;
const isChartName = (name: string): name is ChartNames => name in moduleMap;

const setupComponents = async (
  chartList: string[],
) => {
  const tables: Record<string, string> = {};
  const fields: Record<string, string[]> = {};
  const components: Record<string, any> = {};
  // eslint-disable-next-line no-restricted-syntax
  for await (const name of chartList) {
    if (isChartName(name) && tables[name] == null) {
      const m = await import(/* @vite-ignore */ `../chart/${moduleMap[name]}`);
      tables[name] = m.table;
      fields[name] = m.fields;
      components[name] = m.default;
    }
  }
  return { tables, fields, components };
};

const generateQueryTables = (
  tables: Record<string, string>,
  fields: Record<string, string[]>,
  resolution: ResolutionSuffix,
  perftoolName?: string,
) => Object.keys(tables)
  .filter((name) => tables[name] != null)
  .map((name) => {
    const tableName = `${tables[name]}${resolution}`;
    if (name === 'perftool') {
      if (perftoolName == null || perftoolName === '') {
        return '';
      }
      return `
        ${tableName}(
          where: { publisher: { _eq: "${perftoolName}" }, timestamp: {_gte: $from, _lte: $to} }
          order_by: { timestamp: asc }
        ) {
          timestamp
          ${fields[name]?.join(' ') ?? ''}
        }
        `;
    }
    return `
        ${tableName}(
          where: { publisher: { _eq: $publisher }, timestamp: {_gte: $from, _lte: $to} }
          order_by: { timestamp: asc }
        ) {
          timestamp
          ${fields[name]?.join(' ') ?? ''}
        }
        `;
  });

const setupQueryParams = (
  tables: Record<string, string>,
  fields: Record<string, string[]>,
  resolution: ResolutionSuffix,
  from: Date,
  to: Date,
  perftoolName?: string,
  publisher?: string,
) => {
  let querySig = 'query($publisher: String, $from: timestamptz, $to: timestamptz)';
  let queryVars: Record<string, any> = { publisher, from: formatISO(from), to: formatISO(to) };
  if (Object.keys(tables).length === 0) {
    return { queryTables: [], querySig, queryVars };
  }

  const queryTables = generateQueryTables(
    tables,
    fields,
    resolution,
    perftoolName,
  );

  if (Object.keys(tables).filter((name) => name !== 'perftool').length > 0) {
    querySig = 'query($publisher: String, $from: timestamptz, $to: timestamptz)';
    queryVars = { publisher, from: formatISO(from), to: formatISO(to) };
  } else {
    querySig = 'query($from: timestamptz, $to: timestamptz)';
    queryVars = { from: formatISO(from), to: formatISO(to) };
  }

  return { queryTables, querySig, queryVars };
};

const fetchQueryResult = (
  tables: Record<string, string>,
  fields: Record<string, string[]>,
  resolution: ResolutionSuffix,
  from: Date,
  to: Date,
  perftoolName?: string,
  publisher?: string,
) => {
  const { queryTables, querySig, queryVars } = setupQueryParams(
    tables,
    fields,
    resolution,
    from,
    to,
    perftoolName,
    publisher,
  );
  if (queryTables.length === 0) {
    return undefined;
  }
  return queryStore({
    client: getContextClient(),
    query: gql`
      ${querySig} {
        ${queryTables.join('\n')}
      }
    `,
    variables: queryVars,
  });
};

const calcRowsCols = (mcols: number, size: number) => {
  let rows = size;
  let cols = 1;
  let offset = 0;
  if (mcols > 1) {
    rows = Math.ceil(size / mcols);
    cols = Math.ceil(size / rows);
    const mod = size % cols;
    offset = mod === 0 ? 0 : cols - mod;
  }
  return { rows, cols, offset };
};

const updateRowsCols = (
  maxCols: number,
  size: number,
  paneViewWidth?: number,
  paneViewHeight?: number,
) => {
  let { rows, cols, offset } = calcRowsCols(maxCols, size);
  if (paneViewHeight != null && paneViewWidth != null) {
    let mcols = maxCols;
    while (mcols > 1) {
      const w = paneViewWidth / cols;
      const h = paneViewHeight / rows;
      const ratio = w / h;
      if (ratio >= 0.4) {
        break;
      }
      mcols -= 1;
      ({ rows, cols, offset } = calcRowsCols(mcols, size));
    }
  }
  return { rows, cols, offset };
};

const updatePaneHeight = (rows: number, minHeight: number, paneViewHeight?: number) => {
  const minSize = minHeight * rows + 6 * (rows - 1);
  if (paneViewHeight == null || paneViewHeight >= minSize) {
    return '100%';
  }
  return `${minSize}px`;
};

export {
  fetchQueryResult, setupComponents, updatePaneHeight, updateRowsCols,
};
