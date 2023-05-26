import {
  Chart,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';
import autocolors from 'chartjs-plugin-autocolors';
import binLinearScale from './binLinearScale';

Chart.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  annotationPlugin,
  binLinearScale,
  autocolors,
);
