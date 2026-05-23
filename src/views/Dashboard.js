/**
 * Dashboard view
 */
import { ENDPOINTS, INCIDENTS } from '../services/mockData.js';
import { getState, subscribe } from '../state.js';
import { createLineChart, lineDataset, CHART_COLORS } from '../utils/charts.js';
import { animateValue } from '../utils/animate.js';
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
      <!-- Metrics Row -->
      <div class="metrics-grid">
        <div class="metric-card status-green animate-in stagger-1">
          <div class="metric-label">Uptime</div>
          <div class="metric-value text-green" id="metric-uptime">0.0%</div>
          <div class="metric-trend text-green"><i class="ti ti-arrow-up"></i> healthy</div>
        </div>
        <div class="metric-card status-red animate-in stagger-2" id="card-error-rate">
          <div class="metric-label">Error Rate</div>
          <div class="metric-value text-red" id="metric-error">0.0%</div>
          <div class="metric-trend text-red"><i class="ti ti-arrow-up"></i> 3.1%</div>
        </div>
        <div class="metric-card status-amber animate-in stagger-3">
          <div class="metric-label">P95 Latency</div>
          <div class="metric-value text-amber" id="metric-latency">0ms</div>
          <div class="metric-trend text-amber">above SLA</div>
        </div>
        <div class="metric-card status-red animate-in stagger-4" id="card-incidents">
          <div class="metric-label">Open Incidents</div>
          <div class="metric-value" id="metric-incidents">0</div>
          <div class="metric-trend text-secondary">2 unresolved</div>
        </div>
      </div>

      <!-- Charts Row -->
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

      <!-- Table + Feed Row -->
      <div class="table-feed-row">
        <div>
          <div class="section-header">
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
        <div>
          <div class="section-header">
            <i class="ti ti-activity"></i> Recent Activity
          </div>
          <div class="incidents-feed" id="dashboard-feed"></div>
        </div>
      </div>

      <!-- Anomaly Detection -->
      <div>
        <div class="section-header">
          <i class="ti ti-radar-2"></i> Anomaly Detection
          <span class="badge bg-purple" style="margin-left:8px;"><i class="ti ti-brain" style="margin-right:2px;font-size:10px;"></i> AI-Powered</span>
        </div>
        <div class="anomaly-section" id="anomaly-section">
          <div class="empty-state" id="anomaly-empty" style="padding:24px;">
            <i class="ti ti-radar-2"></i>
            <p>Monitoring for anomalies... AI engine is analyzing patterns in real-time.</p>
          </div>
        </div>
      </div>
    `;

    container.appendChild(view);

    // Render data
    renderEndpointsTable();
    renderIncidentsFeed();
    initDashboardCharts();
    animateMetrics();
    startAnomalyMonitor();

    // Subscribe to incident changes
    const unsub = subscribe('incidents', () => {
      renderIncidentsFeed();
    });

    return () => {
      unsub();
      if (stopAnomalies) { stopAnomalies(); stopAnomalies = null; }
      Object.values(charts).forEach(c => c.destroy?.());
      charts = {};
    };
  }
};

function renderEndpointsTable() {
  const tbody = document.getElementById('endpoints-tbody');
  if (!tbody) return;

  tbody.innerHTML = ENDPOINTS.map(ep => {
    const methodClass = `method-${ep.method.toLowerCase()}`;
    let badge = '';
    if (ep.status === 'HEALTHY') badge = '<span class="badge bg-green">Healthy</span>';
    else if (ep.status === 'WARNING' || ep.status === 'SLOW') badge = `<span class="badge bg-amber">${ep.status}</span>`;
    else badge = `<span class="badge bg-red">${ep.status}</span>`;

    return `
      <tr>
        <td style="color:var(--text-primary)">${ep.path}</td>
        <td class="${methodClass}">${ep.method}</td>
        <td style="color:${ep.latency > 1000 ? 'var(--warning-amber)' : 'inherit'}">${ep.latency}ms</td>
        <td style="color:${ep.error > 5 ? 'var(--alert-red)' : 'inherit'}">${ep.error}%</td>
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

  const allIncidents = getState('incidents') || INCIDENTS;

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

function animateMetrics() {
  const animate = (id, from, to, dur, fmt) => {
    const el = document.getElementById(id);
    if (el) animateValue(el, from, to, dur, fmt);
  };

  setTimeout(() => animate('metric-uptime', 0, 99.2, 1500, v => v.toFixed(1) + '%'), 0);
  setTimeout(() => animate('metric-error', 0, 8.4, 1500, v => v.toFixed(1) + '%'), 200);
  setTimeout(() => animate('metric-latency', 0, 1842, 1500, v => Math.floor(v) + 'ms'), 400);
  setTimeout(() => animate('metric-incidents', 0, 3, 1000, v => Math.floor(v).toString()), 600);
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
