/**
 * Metrics view — 24h latency percentiles + request volume charts
 */
import { createLineChart, createBarChart, lineDataset, CHART_COLORS } from '../utils/charts.js';

let charts = {};

export default {
  mount(container) {
    const view = document.createElement('div');
    view.className = 'view active';
    view.id = 'view-metrics';

    view.innerHTML = `
      <div class="chart-container" style="height:320px;">
        <div class="chart-title"><i class="ti ti-chart-line"></i> Latency percentiles (24h)</div>
        <div class="chart-canvas-wrapper">
          <canvas id="chart-metrics-latency"></canvas>
        </div>
      </div>
      <div class="chart-container" style="height:320px;">
        <div class="chart-title"><i class="ti ti-chart-bar"></i> Request volume & Error rate (24h)</div>
        <div class="chart-canvas-wrapper">
          <canvas id="chart-metrics-volume"></canvas>
        </div>
      </div>
    `;

    container.appendChild(view);
    initMetricsCharts();

    return () => {
      Object.values(charts).forEach(c => c.destroy?.());
      charts = {};
    };
  }
};

function initMetricsCharts() {
  const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

  // Latency percentiles
  const latCanvas = document.getElementById('chart-metrics-latency');
  if (latCanvas) {
    charts.latency = createLineChart(latCanvas, {
      labels,
      datasets: [
        lineDataset({ label: 'p50', data: Array.from({ length: 24 }, () => 40 + Math.random() * 10), color: CHART_COLORS.green, width: 1, fill: false }),
        lineDataset({ label: 'p90', data: Array.from({ length: 24 }, () => 100 + Math.random() * 50), color: CHART_COLORS.amber, width: 1, fill: false }),
        lineDataset({ label: 'p95', data: Array.from({ length: 24 }, (_, i) => i === 14 ? 1800 : 200 + Math.random() * 100), color: CHART_COLORS.red, width: 2, fill: false }),
        lineDataset({ label: 'p99', data: Array.from({ length: 24 }, (_, i) => i === 14 ? 3500 : 400 + Math.random() * 200), color: '#ff0000', width: 1, fill: false, dash: [5, 5] })
      ],
      options: {
        plugins: {
          legend: { display: true, position: 'top', labels: { usePointStyle: true, boxWidth: 6 } }
        },
        scales: {
          x: { display: true, grid: { display: false } },
          y: { grid: { color: CHART_COLORS.grid } }
        }
      }
    });
  }

  // Volume + Error rate
  const volCanvas = document.getElementById('chart-metrics-volume');
  if (volCanvas) {
    let volData = Array.from({ length: 24 }, () => 5000 + Math.random() * 2000);
    volData[14] = 12000;

    charts.volume = createBarChart(volCanvas, {
      labels,
      datasets: [{
        label: 'Requests',
        data: volData,
        backgroundColor: Array.from({ length: 24 }, (_, i) => i === 14 ? CHART_COLORS.red + '80' : CHART_COLORS.green + '80'),
        borderRadius: 4
      }],
      options: {
        scales: {
          x: { display: true, grid: { display: false } },
          y: { grid: { color: CHART_COLORS.grid } }
        }
      }
    });
  }
}
