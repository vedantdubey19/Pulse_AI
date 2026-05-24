/**
 * Dashboard view
 */
import { DEMO_ENDPOINTS } from '../services/demoConfig.js';
import { getState, subscribe } from '../state.js';
import { createLineChart, lineDataset, CHART_COLORS } from '../utils/charts.js';
import { registerCharts } from '../services/simulation.js';
import { startAnomalyDetection } from '../services/anomalyEngine.js';
import { createAnomalyCard } from '../components/AnomalyCard.js';
import { navigate } from '../router.js';

let charts = {};
let stopAnomalies = null;

export default {
  mount(container) {
    const view = document.createElement('div');
    view.className = 'view active';
    view.id = 'view-dashboard';

    view.innerHTML = `
      <div class="dashboard-masonry">
        <!-- Main Column -->
        <div class="main-column">
          <div class="metrics-cluster">
            <div class="metric-card status-green animate-in stagger-1">
              <div class="metric-label">System Health</div>
              <div class="metric-value text-green" id="metric-uptime">0.0%</div>
              <div class="metric-trend text-green"><i class="ti ti-activity-heartbeat"></i> All systems operational</div>
            </div>
            <div class="metric-card status-red animate-in stagger-2" id="card-error-rate">
              <div class="metric-label">Error Rate</div>
              <div class="metric-value text-red" id="metric-error">0.0%</div>
              <div class="metric-trend text-red"><i class="ti ti-arrow-up-right"></i> 3.1% from baseline</div>
            </div>
            <div class="metric-card status-amber animate-in stagger-3">
              <div class="metric-label">P95 Latency</div>
              <div class="metric-value text-amber" id="metric-latency">0ms</div>
              <div class="metric-trend text-amber">Performance degrading</div>
            </div>
            <div class="metric-card status-blue animate-in stagger-4">
              <div class="metric-label">Requests / Hour</div>
              <div class="metric-value text-blue" id="metric-requests-hour">0</div>
              <div class="metric-trend text-blue"><i class="ti ti-activity"></i> From backend aggregate</div>
            </div>
            <div class="metric-card status-purple animate-in stagger-5">
              <div class="metric-label">Errors / Hour</div>
              <div class="metric-value text-purple" id="metric-errors-hour">0</div>
              <div class="metric-trend text-purple"><i class="ti ti-alert-octagon"></i> Hourly failure count</div>
            </div>
          </div>

          <div class="charts-row">
            <div class="chart-container">
              <div class="chart-title"><i class="ti ti-clock"></i> Latency (ms) — last 30 min</div>
              <div class="chart-canvas-wrapper">
                <canvas id="chart-latency"></canvas>
              </div>
            </div>
            <div class="chart-container">
              <div class="chart-title"><i class="ti ti-alert-octagon"></i> Error rate (%) — last 30 min</div>
              <div class="chart-canvas-wrapper">
                <canvas id="chart-error"></canvas>
              </div>
            </div>
          </div>

          <div class="section-header mt-4">
            <i class="ti ti-server"></i> Endpoint Health
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Method</th>
                  <th>Avg Latency</th>
                  <th>Error Rate</th>
                  <th>Status</th>
                  <th>Last seen</th>
                </tr>
              </thead>
              <tbody id="endpoints-tbody"></tbody>
            </table>
          </div>
        </div>

        <!-- Side Column -->
        <div class="side-column">
          <div class="metric-card status-red animate-in stagger-4" id="card-incidents">
            <div class="metric-label">Active Critical Incidents</div>
            <div class="metric-value" id="metric-incidents">0</div>
            <div class="metric-trend text-secondary">Requires immediate attention</div>
          </div>

          <div class="section-header mt-4">
            <i class="ti ti-activity"></i> Live Activity Feed
          </div>
          <div class="incidents-feed" id="dashboard-feed"></div>

          <div class="section-header mt-4">
            <i class="ti ti-radar-2"></i> AI Anomalies
            <span class="badge bg-purple" style="margin-left:8px;"><i class="ti ti-sparkles" style="margin-right:2px;font-size:10px;"></i> Neural Engine</span>
          </div>
          <div class="anomaly-section" id="anomaly-section">
            <div class="empty-state" id="anomaly-empty" style="padding:24px;">
              <i class="ti ti-radar-2"></i>
              <p>Analyzing network topology in real-time...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(view);

    // Render data
    renderEndpointsTable();
    renderIncidentsFeed();
    initDashboardCharts();
    startAnomalyMonitor();

    // Subscribe to incident changes
    const unsubIncidents = subscribe('incidents', () => {
      renderIncidentsFeed();
      renderEndpointsTable();
    });

    const unsubMetrics = subscribe('metrics', (metrics) => {
      renderEndpointsTable();
      renderMetricCards(metrics);
      syncMetricCharts(metrics);
    });

    return () => {
      unsubIncidents();
      unsubMetrics();
      if (stopAnomalies) { stopAnomalies(); stopAnomalies = null; }
      Object.values(charts).forEach(c => c.destroy?.());
      charts = {};
    };
  }
};

function renderEndpointsTable() {
  const tbody = document.getElementById('endpoints-tbody');
  if (!tbody) return;

  const metrics = getState('metrics') || {};
  const baseLatency = Math.round(metrics.avgLatencyMs ?? metrics.avgLatency ?? 0);
  const baseError = Number(metrics.errorRate || 0);

  tbody.innerHTML = DEMO_ENDPOINTS.map(ep => {
    const jitter = Math.round((Math.random() - 0.5) * 120);
    const latency = Math.max(0, baseLatency + jitter);
    const error = Math.max(0, baseError + (Math.random() - 0.5) * 2);
    const status = error > 10 || latency > 1200 ? 'DEGRADED' : error > 2 || latency > 600 ? 'SLOW' : 'HEALTHY';
    const methodClass = `method-${ep.method.toLowerCase()}`;
    let badge = '';
    if (status === 'HEALTHY') badge = '<span class="badge bg-green">Healthy</span>';
    else if (status === 'SLOW') badge = '<span class="badge bg-amber">SLOW</span>';
    else badge = '<span class="badge bg-red">DEGRADED</span>';

    return `
      <tr>
        <td style="color:var(--text-primary)">${ep.path}</td>
        <td class="${methodClass}">${ep.method}</td>
        <td style="color:${latency > 1000 ? 'var(--warning-amber)' : 'inherit'}">${latency}ms</td>
        <td style="color:${error > 5 ? 'var(--alert-red)' : 'inherit'}">${error.toFixed(1)}%</td>
        <td>${badge}</td>
        <td style="color:var(--text-secondary)">Just now</td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('tr').forEach(tr => {
    tr.addEventListener('click', () => navigate('incidents'));
  });
}

function renderIncidentsFeed() {
  const feed = document.getElementById('dashboard-feed');
  if (!feed) return;

  const allIncidents = getState('incidents') || [];

  feed.innerHTML = allIncidents.slice(0, 5).map((inc, i) => {
    const icons = {
      high: '<i class="ti ti-alert-triangle text-red"></i>',
      medium: '<i class="ti ti-alert-circle text-amber"></i>',
      low: '<i class="ti ti-info-circle text-blue"></i>',
      resolved: '<i class="ti ti-check text-green"></i>'
    };

    const rcaBadge = inc.rcaReady ? '<span class="badge bg-purple" style="font-size:8px;">RCA</span>' : '';

    return `
      <div class="incident-row ${i === 0 && getState('testRunning') ? 'new' : ''}">
        ${icons[inc.severity] || icons.low}
        <div class="incident-endpoint">${inc.endpoint} ${rcaBadge}</div>
        <div class="incident-cause" style="text-decoration:${inc.severity === 'resolved' ? 'line-through' : 'none'}">${inc.cause}</div>
        <div class="incident-time">${inc.time}</div>
      </div>
    `;
  }).join('');
}

function initDashboardCharts() {
  // Latency chart
  const latCanvas = document.getElementById('chart-latency');
  if (latCanvas) {
    let latData = Array.from({ length: 30 }, () => 40 + Math.random() * 20);
    for (let i = 15; i < 25; i++) latData[i] = 800 + Math.random() * 400;

    charts.latency = createLineChart(latCanvas, {
      labels: Array(30).fill(''),
      datasets: [lineDataset({ data: latData, color: CHART_COLORS.amber })]
    });
  }

  // Error chart
  const errCanvas = document.getElementById('chart-error');
  if (errCanvas) {
    let errData = Array.from({ length: 30 }, () => Math.random() * 2);
    for (let i = 18; i < 28; i++) errData[i] = 10 + Math.random() * 25;

    charts.error = createLineChart(errCanvas, {
      labels: Array(30).fill(''),
      datasets: [lineDataset({ data: errData, color: CHART_COLORS.red })]
    });
  }

  registerCharts(charts);
}

function renderMetricCards(metrics = {}) {
  const p95 = Number(metrics.p95LatencyMs ?? metrics.p95 ?? metrics.avgLatencyMs ?? metrics.avgLatency ?? 0);
  const requestsLastHour = Number(metrics.requestsLastHour ?? 0);
  const errorsLastHour = Number(metrics.errorsLastHour ?? 0);

  const p95El = document.getElementById('metric-latency');
  const requestsEl = document.getElementById('metric-requests-hour');
  const errorsEl = document.getElementById('metric-errors-hour');

  if (p95El) p95El.innerText = `${Math.round(p95)}ms`;
  if (requestsEl) requestsEl.innerText = requestsLastHour.toLocaleString();
  if (errorsEl) errorsEl.innerText = errorsLastHour.toLocaleString();
}

function syncMetricCharts(metrics = {}) {
  const latencySeries = Array.isArray(metrics.latencySeries) ? metrics.latencySeries : [];
  const errorSeries = Array.isArray(metrics.errorSeries) ? metrics.errorSeries : [];

  if (charts.latency) {
    if (latencySeries.length > 0) {
      charts.latency.data.labels = latencySeries.map((point) => formatSeriesLabel(point.t));
      charts.latency.data.datasets[0].data = latencySeries.map((point) => Number(point.value || 0));
      charts.latency.update('none');
    }
  }

  if (charts.error) {
    if (errorSeries.length > 0) {
      charts.error.data.labels = errorSeries.map((point) => formatSeriesLabel(point.t));
      charts.error.data.datasets[0].data = errorSeries.map((point) => Number(point.value || 0));
      charts.error.update('none');
    }
  }
}

function formatSeriesLabel(timestamp) {
  const value = Number(timestamp || 0);
  if (!Number.isFinite(value) || value <= 0) return '';
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function startAnomalyMonitor() {
  const section = document.getElementById('anomaly-section');
  if (!section) return;

  stopAnomalies = startAnomalyDetection((anomaly) => {
    const empty = document.getElementById('anomaly-empty');
    if (empty) empty.remove();

    const card = createAnomalyCard(anomaly);
    section.prepend(card);

    // Keep max 5 anomaly cards
    const cards = section.querySelectorAll('.anomaly-card');
    if (cards.length > 5) {
      cards[cards.length - 1].remove();
    }
  });
}
