/**
 * Dashboard view
 */
import { getState, subscribe } from '../state.js';
import { createLineChart, lineDataset, CHART_COLORS } from '../utils/charts.js';
import { animateValue } from '../utils/animate.js';
import { navigate } from '../router.js';
import { fetchMetrics } from '../services/apiClient.js';
import { createAnomalyCard } from '../components/AnomalyCard.js';

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
    
    // Subscribe to live metrics
    const unsubMetrics = subscribe('liveMetrics', (payload) => {
      if (payload) {
        updateDashboardMetrics(payload);
        updateDashboardCharts(payload);
      }
    });

    // Poll metrics every 2 seconds since backend doesn't broadcast them
    let metricsInterval = setInterval(async () => {
      const payload = await fetchMetrics();
      if (payload) {
        updateDashboardMetrics(payload);
        updateDashboardCharts(payload);
      }
    }, 2000);

    // Subscribe to incident changes
    const unsub = subscribe('incidents', () => {
      renderIncidentsFeed();
      renderAnomalies();
      const incCount = document.getElementById('metric-incidents');
      if (incCount) incCount.innerText = (getState('incidents') || []).filter(i => !i.resolved).length;
    });

    return () => {
      clearInterval(metricsInterval);
      unsub();
      unsubMetrics();
      Object.values(charts).forEach(c => c.destroy?.());
      charts = {};
    };
  }
};

function renderEndpointsTable() {
  const tbody = document.getElementById('endpoints-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary)">Awaiting endpoint telemetry...</td></tr>';
}

function renderIncidentsFeed() {
  const feed = document.getElementById('dashboard-feed');
  if (!feed) return;

  const allIncidents = getState('incidents') || [];

  feed.innerHTML = allIncidents.slice(0, 5).map((inc, i) => {
    const severityLower = (inc.severity || 'low').toLowerCase();
    const icons = {
      critical: '<i class="ti ti-alert-triangle text-red"></i>',
      high: '<i class="ti ti-alert-triangle text-red"></i>',
      medium: '<i class="ti ti-alert-circle text-amber"></i>',
      low: '<i class="ti ti-info-circle text-blue"></i>',
      resolved: '<i class="ti ti-check text-green"></i>'
    };

    const rcaBadge = inc.rcaReady ? '<span class="badge bg-purple" style="font-size:8px;">RCA</span>' : '';
    const timeStr = inc.startTime ? new Date(inc.startTime).toLocaleTimeString() : 'Just now';
    const isResolved = inc.resolved;

    return `
      <div class="incident-row ${i === 0 && getState('testRunning') ? 'new' : ''}">
        ${icons[isResolved ? 'resolved' : severityLower] || icons.low}
        <div class="incident-endpoint">${inc.service} ${rcaBadge}</div>
        <div class="incident-cause" style="text-decoration:${isResolved ? 'line-through' : 'none'}">${inc.description || inc.cause}</div>
        <div class="incident-time">${timeStr}</div>
      </div>
    `;
  }).join('');
}

function renderAnomalies() {
  const container = document.getElementById('anomaly-section');
  if (!container) return;
  const active = (getState('incidents') || []).filter(i => !i.resolved);
  if (active.length === 0) {
    container.innerHTML = `
      <div class="empty-state" id="anomaly-empty" style="padding:24px;">
        <i class="ti ti-radar-2"></i>
        <p>Analyzing network topology in real-time...</p>
      </div>`;
  } else {
    container.innerHTML = '';
    active.slice(0, 2).forEach(inc => {
      const card = createAnomalyCard({
        severity: inc.severity === 'Critical' ? 'high' : 'medium',
        score: inc.severity === 'Critical' ? '98%' : '75%',
        title: `Anomaly in ${inc.service}`,
        description: inc.description,
        endpoint: inc.service,
        deviation: inc.cause,
        timestamp: new Date().toLocaleTimeString(),
        sparkData: inc.severity === 'Critical' ? [10, 20, 50, 90, 100] : [10, 20, 15, 40, 50]
      });
      container.appendChild(card);
    });
  }
}

function initDashboardCharts() {
  // Latency chart
  const latCanvas = document.getElementById('chart-latency');
  if (latCanvas) {
    charts.latency = createLineChart(latCanvas, {
      labels: Array(30).fill(''),
      datasets: [lineDataset({ data: Array(30).fill(0), color: CHART_COLORS.amber })]
    });
  }

  // Error chart
  const errCanvas = document.getElementById('chart-error');
  if (errCanvas) {
    charts.error = createLineChart(errCanvas, {
      labels: Array(30).fill(''),
      datasets: [lineDataset({ data: Array(30).fill(0), color: CHART_COLORS.red })]
    });
  }
}

function updateDashboardMetrics(payload) {
  const errEl = document.getElementById('metric-error');
  const latEl = document.getElementById('metric-latency');
  
  if (errEl) errEl.innerText = (payload.errorRate || 0).toFixed(1) + '%';
  if (latEl) latEl.innerText = (payload.avgLatencyMs || 0).toFixed(0) + 'ms';
}

function updateDashboardCharts(payload) {
  // Assuming payload has latencySeries and errorSeries arrays of last 30 values
  if (charts.latency && payload.latencySeries) {
    charts.latency.data.datasets[0].data = payload.latencySeries.map(s => s.value);
    charts.latency.update('none');
  }
  if (charts.error && payload.errorSeries) {
    charts.error.data.datasets[0].data = payload.errorSeries.map(s => s.value);
    charts.error.update('none');
  }
}
