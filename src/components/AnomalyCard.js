/**
 * Anomaly detection card component
 */
import { navigate } from '../router.js';

/**
 * Create an anomaly card element.
 * @param {object} anomaly
 * @returns {HTMLElement}
 */
export function createAnomalyCard(anomaly) {
  const card = document.createElement('div');
  card.className = `anomaly-card ${anomaly.severity === 'high' ? 'critical' : ''}`;

  // Build mini sparkline SVG
  const sparkSvg = buildSparkline(anomaly.sparkData, anomaly.severity);

  card.innerHTML = `
    <div class="anomaly-score ${anomaly.severity}">
      ${anomaly.score}
    </div>
    <div class="anomaly-details">
      <div class="anomaly-title">${anomaly.title}</div>
      <div class="anomaly-desc">${anomaly.description}</div>
      <div class="anomaly-meta">
        <span class="font-mono">${anomaly.endpoint}</span> · ${anomaly.deviation} · ${anomaly.timestamp}
      </div>
    </div>
    <div class="anomaly-sparkline">${sparkSvg}</div>
    <button class="btn-rca" data-action="investigate">
      <i class="ti ti-search"></i> Investigate
    </button>
  `;

  card.querySelector('[data-action="investigate"]').addEventListener('click', (e) => {
    e.stopPropagation();
    navigate('rca');
  });

  // Auto-fade after 30 seconds
  setTimeout(() => {
    card.style.transition = 'opacity 0.5s, transform 0.5s';
    card.style.opacity = '0';
    card.style.transform = 'translateX(-20px)';
    setTimeout(() => card.remove(), 500);
  }, 30000);

  return card;
}

/**
 * Build a sparkline SVG.
 * @param {number[]} data
 * @param {string} severity
 * @returns {string}
 */
function buildSparkline(data, severity) {
  if (!data || data.length === 0) return '';

  const width = 80;
  const height = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const color = severity === 'high' ? '#ef4444' : '#f59e0b';

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
}
