/**
 * Chart.js factory and shared configuration
 */
import { Chart, registerables } from 'chart.js';

// Register all Chart.js components
Chart.register(...registerables);

export const CHART_COLORS = {
  red: '#ef4444',
  amber: '#f59e0b',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  grid: 'rgba(255,255,255,0.05)',
  text: '#64748b'
};

/** Shared defaults for all charts */
const baseDefaults = () => {
  Chart.defaults.color = CHART_COLORS.text;
  Chart.defaults.font.family = "'JetBrains Mono', monospace";
  Chart.defaults.font.size = 11;
};

baseDefaults();

/**
 * Common chart options factory
 * @param {object} overrides
 * @returns {object}
 */
function commonOptions(overrides = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1c2333',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
        bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
        cornerRadius: 6,
        padding: 10,
        displayColors: true,
        boxPadding: 4
      }
    },
    scales: {
      x: { display: false },
      y: {
        grid: { color: CHART_COLORS.grid },
        border: { display: false },
        beginAtZero: true
      }
    },
    animation: { duration: 0 },
    elements: {
      point: { radius: 0, hitRadius: 10, hoverRadius: 4 }
    },
    ...overrides
  };
}

/**
 * Create a line chart
 * @param {HTMLCanvasElement} canvas
 * @param {object} config
 * @returns {Chart}
 */
export function createLineChart(canvas, { labels, datasets, options = {} }) {
  return new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { labels, datasets },
    options: commonOptions(options)
  });
}

/**
 * Create a bar chart
 * @param {HTMLCanvasElement} canvas
 * @param {object} config
 * @returns {Chart}
 */
export function createBarChart(canvas, { labels, datasets, options = {} }) {
  return new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets },
    options: commonOptions(options)
  });
}

/**
 * Generate a dataset config for a line chart
 * @param {object} config
 * @returns {object}
 */
export function lineDataset({ data, color, label = '', fill = true, width = 2, dash = [] }) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: fill ? color + '1A' : 'transparent',
    borderWidth: width,
    fill,
    tension: 0.3,
    borderDash: dash
  };
}
