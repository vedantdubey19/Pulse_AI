/**
 * Live data simulation engine.
 */
import { getState, setState } from '../state.js';
import { INCIDENTS } from './mockData.js';
import { showToast } from '../components/Toast.js';

let charts = {};
let intervals = [];

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
  // Live chart scrolling (every 3s)
  intervals.push(setInterval(() => {
    if (getState('testRunning')) return;

    if (charts.latency) {
      charts.latency.data.datasets[0].data.shift();
      charts.latency.data.datasets[0].data.push(40 + Math.random() * 20);
      charts.latency.update('none');
    }

    if (charts.error) {
      charts.error.data.datasets[0].data.shift();
      charts.error.data.datasets[0].data.push(Math.random() * 2);
      charts.error.update('none');
    }
  }, 3000));

  // Random metric jitter (every 5s)
  intervals.push(setInterval(() => {
    if (getState('testRunning')) return;
    const errorEl = document.getElementById('metric-error');
    if (errorEl) {
      const jitter = (Math.random() - 0.5) * 0.4;
      errorEl.innerText = (8.4 + jitter).toFixed(1) + '%';
    }
  }, 5000));
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

    const incidents = getState('incidents');
    setState('incidents', [newInc, ...incidents]);

    const count = getState('incidentsCount') + 1;
    setState('incidentsCount', count);

    const badge = document.getElementById('nav-incidents-badge');
    if (badge) badge.style.display = 'block';

    const bellBadge = document.getElementById('topbar-bell-badge');
    if (bellBadge) bellBadge.innerText = count;

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
}
