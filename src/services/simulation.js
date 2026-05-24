/**
 * Live data simulation engine.
 */
import { getState, setState } from '../state.js';
import { showToast } from '../components/Toast.js';
import { fetchMetrics, fetchIncidents, connectIncidentStream } from './pulseBackend.js';

let charts = {};
let intervals = [];
let wsConnection = null;
let lastFetchFailed = false;
let lastMetricsRefresh = 0;
let lastIncidentsRefresh = 0;

const METRICS_REFRESH_MS = 10000;
const INCIDENTS_REFRESH_MS = 15000;

const MAX_POINTS = 30;
const history = {
  latency: Array.from({ length: MAX_POINTS }, () => 40 + Math.random() * 20),
  error: Array.from({ length: MAX_POINTS }, () => Math.random() * 2)
};

/**
 * Register chart instances for simulation updates.
 * @param {object} chartRefs
 */
export function registerCharts(chartRefs) {
  charts = { ...charts, ...chartRefs };
}

/**
 * Start the live simulation loop.
 */
export function startSimulation() {
  stopSimulation();
  refreshLiveData();

  intervals.push(setInterval(() => {
    refreshLiveData();
  }, METRICS_REFRESH_MS));

  wsConnection = connectIncidentStream((event) => {
    if (event?.type === 'metrics') {
      updateMetrics(event.payload);
    } else if (event?.type === 'incident') {
      updateIncidents([event.payload, ...(getState('incidents') || [])]);
    }
  });
}

/**
 * Run the test failure simulation sequence.
 */
export function runTestFailure() {
  if (getState('testRunning')) return;
  setState('testRunning', true);

  const btn = document.getElementById('btn-test-failure');
  const pulse = document.getElementById('hero-pulse');

  // 1. UI Changes
  if (btn) btn.classList.add('flashing');
  if (pulse) pulse.classList.add('alert');

  // 2. Metric spikes
  const errorEl = document.getElementById('metric-error');
  const latencyEl = document.getElementById('metric-latency');
  const incidentsEl = document.getElementById('metric-incidents');
  const cardError = document.getElementById('card-error-rate');
  const cardIncidents = document.getElementById('card-incidents');

  if (errorEl) errorEl.innerText = '28.4%';
  if (latencyEl) latencyEl.innerText = '5420ms';
  if (incidentsEl) incidentsEl.innerText = '4';
  if (cardError) cardError.style.boxShadow = 'var(--shadow-glow-red)';
  if (cardIncidents) cardIncidents.style.boxShadow = 'var(--shadow-glow-red)';

  // 3. Update Charts rapidly
  let testStep = 0;
  const testInterval = setInterval(() => {
    testStep++;

    if (charts.latency) {
      charts.latency.data.datasets[0].data.shift();
      charts.latency.data.datasets[0].data.push(1000 + Math.random() * 4000);
      charts.latency.update('none');
    }

    if (charts.error) {
      charts.error.data.datasets[0].data.shift();
      charts.error.data.datasets[0].data.push(20 + Math.random() * 15);
      charts.error.update('none');
    }

    if (testStep > 10) clearInterval(testInterval);
  }, 500);

  // 4. Inject Incident
  setTimeout(() => {
    const newInc = {
      id: Date.now(),
      severity: 'high',
      endpoint: 'POST /api/checkout',
      cause: 'Payment gateway timeout — connection refused after 30s (simulated)',
      time: 'Just now',
      rcaReady: true,
      affected: '1,204',
      duration: '0m'
    };

    const incidents = getState('incidents') || [];
    setState('incidents', [newInc, ...incidents]);

    const count = (incidents || []).filter((i) => i.severity !== 'resolved').length + 1;
    setState('incidentsCount', count);
    updateIncidentBadges(count);

    showToast('Incident detected: POST /api/checkout', 'high');
  }, 1500);

  // 5. Recovery
  setTimeout(() => {
    if (btn) btn.classList.remove('flashing');
    if (pulse) pulse.classList.remove('alert');
    if (cardError) cardError.style.boxShadow = '';
    if (cardIncidents) cardIncidents.style.boxShadow = '';
    if (errorEl) errorEl.innerText = '8.4%';
    if (latencyEl) latencyEl.innerText = '1842ms';
    setState('testRunning', false);
  }, 12000);
}

/**
 * Stop all simulation intervals.
 */
export function stopSimulation() {
  intervals.forEach(id => clearInterval(id));
  intervals = [];
  if (wsConnection) {
    wsConnection.close();
    wsConnection = null;
  }
}

async function refreshLiveData() {
  if (getState('testRunning')) return;

  const now = Date.now();
  const shouldRefreshMetrics = now - lastMetricsRefresh >= METRICS_REFRESH_MS;
  const shouldRefreshIncidents = now - lastIncidentsRefresh >= INCIDENTS_REFRESH_MS;

  if (!shouldRefreshMetrics && !shouldRefreshIncidents) {
    return;
  }

  try {
    const requests = [];
    if (shouldRefreshMetrics) requests.push(fetchMetrics());
    if (shouldRefreshIncidents) requests.push(fetchIncidents({ status: 'active', limit: 25 }));

    const results = await Promise.all(requests);

    let metrics = null;
    let incidents = null;
    let cursor = 0;

    if (shouldRefreshMetrics) {
      metrics = results[cursor++];
      lastMetricsRefresh = now;
    }

    if (shouldRefreshIncidents) {
      incidents = results[cursor++];
      lastIncidentsRefresh = now;
    }

    lastFetchFailed = false;
    updateMetrics(metrics);
    updateIncidents(incidents);
  } catch (err) {
    if (!lastFetchFailed) {
      showToast('Unable to reach Pulse backend. Showing last known data.', 'medium');
    }
    lastFetchFailed = true;
  }
}

function updateMetrics(metrics) {
  if (!metrics) return;

  const errorRate = Number(metrics.errorRate || 0);
  const avgLatency = Number(metrics.avgLatencyMs ?? metrics.avgLatency ?? 0);
  const p95Latency = Number(metrics.p95LatencyMs ?? metrics.p95 ?? avgLatency);
  const requestsLastHour = Number(metrics.requestsLastHour ?? 0);
  const errorsLastHour = Number(metrics.errorsLastHour ?? 0);
  const uptime = Math.max(0, 100 - errorRate);

  const normalizedMetrics = {
    ...metrics,
    avgLatencyMs: avgLatency,
    p95LatencyMs: p95Latency,
    requestsLastHour,
    errorsLastHour,
    uptime
  };

  setState('metrics', normalizedMetrics);

  const uptimeEl = document.getElementById('metric-uptime');
  if (uptimeEl) uptimeEl.innerText = `${uptime.toFixed(1)}%`;

  const errorEl = document.getElementById('metric-error');
  if (errorEl) errorEl.innerText = `${errorRate.toFixed(1)}%`;

  const latencyEl = document.getElementById('metric-latency');
  if (latencyEl) latencyEl.innerText = `${Math.round(p95Latency)}ms`;

  const requestsEl = document.getElementById('metric-requests-hour');
  if (requestsEl) requestsEl.innerText = requestsLastHour.toLocaleString();

  const errorsHourEl = document.getElementById('metric-errors-hour');
  if (errorsHourEl) errorsHourEl.innerText = errorsLastHour.toLocaleString();

  const incidentsEl = document.getElementById('metric-incidents');
  const activeCount = getState('incidents')?.filter((i) => i.severity !== 'resolved').length || 0;
  if (incidentsEl) incidentsEl.innerText = activeCount.toString();

  const latencySeries = Array.isArray(metrics.latencySeries) && metrics.latencySeries.length > 0
    ? metrics.latencySeries.map((point) => Number(point.value || 0))
    : [avgLatency];
  const errorSeries = Array.isArray(metrics.errorSeries) && metrics.errorSeries.length > 0
    ? metrics.errorSeries.map((point) => Number(point.value || 0))
    : [errorRate];

  history.latency = normalizeHistory(latencySeries);
  history.error = normalizeHistory(errorSeries);

  if (charts.latency) {
    charts.latency.data.datasets[0].data = [...history.latency];
    if (Array.isArray(metrics.latencySeries) && metrics.latencySeries.length > 0) {
      charts.latency.data.labels = metrics.latencySeries.map((point) => formatSeriesLabel(point.t));
    }
    charts.latency.update('none');
  }

  if (charts.error) {
    charts.error.data.datasets[0].data = [...history.error];
    if (Array.isArray(metrics.errorSeries) && metrics.errorSeries.length > 0) {
      charts.error.data.labels = metrics.errorSeries.map((point) => formatSeriesLabel(point.t));
    }
    charts.error.update('none');
  }
}

function updateIncidents(rawIncidents = []) {
  const mapped = rawIncidents.map((incident) => {
    const severity = mapSeverity(incident.severity, incident.resolved);
    const age = formatAge(incident.createdAt);
    const relatedCount = incident.related_logs?.length || 0;

    return {
      id: incident.id || incident._id || incident.createdAt,
      severity,
      endpoint: incident.service ? `/${incident.service}` : incident.cause || 'Unknown',
      cause: incident.description || incident.cause || 'Incident detected',
      time: age,
      rcaReady: true,
      affected: relatedCount ? relatedCount.toString() : 'N/A',
      duration: incident.resolved ? 'Resolved' : 'Ongoing'
    };
  });

  setState('incidents', mapped);
  const activeCount = mapped.filter((i) => i.severity !== 'resolved').length;
  setState('incidentsCount', activeCount);
  updateIncidentBadges(activeCount);
}

function mapSeverity(severity, resolved) {
  if (resolved) return 'resolved';
  const normalized = String(severity || '').toLowerCase();
  if (normalized.includes('critical') || normalized.includes('high')) return 'high';
  if (normalized.includes('medium')) return 'medium';
  return 'low';
}

function formatAge(timestamp) {
  if (!timestamp) return 'Just now';
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

function pushHistory(arr, value) {
  arr.push(Number.isFinite(value) ? value : 0);
  if (arr.length > MAX_POINTS) arr.shift();
}

function normalizeHistory(values) {
  const output = [...values].slice(-MAX_POINTS);
  while (output.length < MAX_POINTS) {
    output.unshift(output[0] ?? 0);
  }
  return output;
}

function formatSeriesLabel(timestamp) {
  const value = Number(timestamp || 0);
  if (!Number.isFinite(value) || value <= 0) return '';
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function updateIncidentBadges(count) {
  const badge = document.getElementById('nav-incidents-badge');
  if (badge) {
    badge.style.display = count > 0 ? 'block' : 'none';
  }

  const bellBadge = document.getElementById('topbar-bell-badge');
  if (bellBadge) {
    bellBadge.innerText = count.toString();
  }
}
