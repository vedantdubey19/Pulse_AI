/**
 * Service Topology / Dependency Map view (SVG-based)
 */
import { TOPOLOGY_NODES, TOPOLOGY_EDGES, SERVICE_DETAILS } from '../services/mockData.js';
import { fetchTopology } from '../services/pulseBackend.js';

const STATUS_COLORS = {
  healthy: '#22c55e',
  warning: '#f59e0b',
  degraded: '#f59e0b',
  critical: '#ef4444'
};

const TYPE_ICONS = {
  gateway: '⚡',
  service: '🔧',
  database: '💾',
  external: '🌐'
};

let activePopover = null;
let refreshTimer = null;
let liveTopology = null;

export default {
  mount(container) {
    const view = document.createElement('div');
    view.className = 'view active';
    view.id = 'view-topology';

    view.innerHTML = `
      <div class="topology-container" id="topology-container">
        <svg class="topology-svg" id="topology-svg" viewBox="0 0 820 420"></svg>
        <div class="topology-legend">
          <div class="legend-item"><div class="legend-dot" style="background:#22c55e"></div> Healthy</div>
          <div class="legend-item"><div class="legend-dot" style="background:#f59e0b"></div> Degraded</div>
          <div class="legend-item"><div class="legend-dot" style="background:#ef4444"></div> Critical</div>
        </div>
      </div>
    `;

    container.appendChild(view);
    loadTopology();

    refreshTimer = setInterval(loadTopology, 30000);

    // Close popover on click outside
    const closeHandler = (e) => {
      if (activePopover && !e.target.closest('.node-popover') && !e.target.closest('.service-node')) {
        removePopover();
      }
    };
    document.addEventListener('click', closeHandler);

    return () => {
      document.removeEventListener('click', closeHandler);
      if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
      }
      removePopover();
    };
  }
};

async function loadTopology() {
  try {
    liveTopology = await fetchTopology();
  } catch (err) {
    liveTopology = null;
  }

  renderTopology();
}

function renderTopology() {
  const svg = document.getElementById('topology-svg');
  if (!svg) return;

  const nodes = Array.isArray(liveTopology?.services) && liveTopology.services.length
    ? liveTopology.services.map((service, index) => normalizeServiceNode(service, index))
    : TOPOLOGY_NODES;

  const edges = Array.isArray(liveTopology?.edges) && liveTopology.edges.length
    ? liveTopology.edges.map((edge) => normalizeServiceEdge(edge, nodes))
    : TOPOLOGY_EDGES;

  let svgContent = '';

  // Draw edges
  edges.forEach((edge, i) => {
    const from = nodes.find(n => n.id === edge.from);
    const to = nodes.find(n => n.id === edge.to);
    if (!from || !to) return;

    const toStatus = STATUS_COLORS[to.status] || '#64748b';

    svgContent += `
      <line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"
        stroke="${toStatus}" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.4" />
      <circle r="3" fill="${toStatus}" opacity="0.8">
        <animateMotion dur="${2 + i * 0.3}s" repeatCount="indefinite"
          path="M${from.x},${from.y} L${to.x},${to.y}" />
      </circle>
    `;
  });

  // Draw nodes
  nodes.forEach(node => {
    const color = STATUS_COLORS[node.status] || '#64748b';
    const r = node.type === 'gateway' ? 30 : 24;
    const isActive = node.status === 'critical' || node.status === 'degraded';

    svgContent += `
      <g class="service-node" data-id="${node.id}" style="cursor:pointer;">
        ${isActive ? `<circle cx="${node.x}" cy="${node.y}" r="${r + 8}" fill="none" stroke="${color}" stroke-width="1" opacity="0.3" class="node-ring">
          <animate attributeName="r" values="${r + 6};${r + 14};${r + 6}" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
        </circle>` : ''}
        <circle cx="${node.x}" cy="${node.y}" r="${r}" fill="#141922" stroke="${color}" stroke-width="2" />
        <circle cx="${node.x}" cy="${node.y}" r="${r - 2}" fill="#141922" />
        <text x="${node.x}" y="${node.y + 1}" text-anchor="middle" dominant-baseline="middle"
          font-size="14" fill="${color}">${TYPE_ICONS[node.type] || '●'}</text>
        <text x="${node.x}" y="${node.y + r + 16}" text-anchor="middle"
          font-size="11" fill="#e2e8f0" font-family="Sora, sans-serif" font-weight="500">${node.label}</text>
        <circle cx="${node.x + r - 4}" cy="${node.y - r + 4}" r="5" fill="${color}" stroke="#141922" stroke-width="2" />
      </g>
    `;
  });

  svg.innerHTML = svgContent;

  // Click handlers for nodes
  svg.querySelectorAll('.service-node').forEach(nodeEl => {
    nodeEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const nodeId = nodeEl.dataset.id;
      showPopover(nodeId);
    });
  });
}

function showPopover(nodeId) {
  removePopover();

  const nodes = Array.isArray(liveTopology?.services) && liveTopology.services.length
    ? liveTopology.services.map((service, index) => normalizeServiceNode(service, index))
    : TOPOLOGY_NODES;
  const node = nodes.find(n => n.id === nodeId);
  const details = getServiceDetails(nodeId, node);
  if (!node || !details) return;

  const containerEl = document.getElementById('topology-container');
  if (!containerEl) return;

  const color = STATUS_COLORS[node.status];
  const statusLabel = node.status.charAt(0).toUpperCase() + node.status.slice(1);

  // Calculate position relative to container
  const svgEl = document.getElementById('topology-svg');
  const rect = svgEl.getBoundingClientRect();
  const containerRect = containerEl.getBoundingClientRect();
  const scaleX = rect.width / 820;
  const scaleY = rect.height / 420;

  const popX = (node.x * scaleX) + rect.left - containerRect.left + 30;
  const popY = (node.y * scaleY) + rect.top - containerRect.top - 20;

  const popover = document.createElement('div');
  popover.className = 'node-popover';
  popover.style.left = `${Math.min(popX, containerRect.width - 260)}px`;
  popover.style.top = `${Math.min(popY, containerRect.height - 200)}px`;

  popover.innerHTML = `
    <div class="popover-header">
      <div class="popover-name">${TYPE_ICONS[node.type]} ${node.label}</div>
      <span class="badge" style="background:${color}20;border:1px solid ${color}50;color:${color};font-size:9px;">${statusLabel}</span>
    </div>
    <div class="popover-stats">
      <div class="popover-stat">
        <div>Latency</div>
        <div class="popover-stat-value">${details.latency}</div>
      </div>
      <div class="popover-stat">
        <div>Error Rate</div>
        <div class="popover-stat-value">${details.errorRate}</div>
      </div>
      <div class="popover-stat">
        <div>Requests</div>
        <div class="popover-stat-value">${details.requests}</div>
      </div>
      <div class="popover-stat">
        <div>Last Incident</div>
        <div class="popover-stat-value">${details.lastIncident}</div>
      </div>
    </div>
  `;

  containerEl.appendChild(popover);
  activePopover = popover;
}

function normalizeServiceNode(service, index) {
  const status = normalizeStatus(service.status);
  const baseNodes = TOPOLOGY_NODES;
  const fallback = baseNodes[index] || baseNodes[0];
  return {
    id: service.id || `service-${index}`,
    label: service.name || service.id || `Service ${index + 1}`,
    type: service.type || fallback.type || 'service',
    x: service.x ?? fallback.x,
    y: service.y ?? fallback.y,
    status
  };
}

function normalizeServiceEdge(edge, nodes) {
  const fromExists = nodes.some(node => node.id === edge.from);
  const toExists = nodes.some(node => node.id === edge.to);
  if (!fromExists || !toExists) {
    return edge;
  }
  return edge;
}

function normalizeStatus(status) {
  const normalized = String(status || '').toLowerCase();
  if (['healthy', 'degraded', 'critical', 'unknown'].includes(normalized)) return normalized;
  if (normalized === 'warning') return 'degraded';
  return 'unknown';
}

function getServiceDetails(nodeId, node) {
  const liveService = liveTopology?.services?.find((service) => service.id === nodeId);
  const meta = liveService?.meta || {};

  if (liveService) {
    return {
      latency: meta.avgLatencyMs != null ? `${Math.round(meta.avgLatencyMs)}ms` : SERVICE_DETAILS[nodeId]?.latency || 'N/A',
      errorRate: meta.errorRate != null ? `${Number(meta.errorRate).toFixed(1)}%` : SERVICE_DETAILS[nodeId]?.errorRate || 'N/A',
      requests: meta.totalRequests != null ? `${Math.round(meta.totalRequests).toLocaleString()}/min` : SERVICE_DETAILS[nodeId]?.requests || 'N/A',
      lastIncident: liveService.resolved ? 'Resolved' : liveService.lastIncident || SERVICE_DETAILS[nodeId]?.lastIncident || 'None'
    };
  }

  return SERVICE_DETAILS[nodeId] || {
    latency: node?.status === 'critical' ? 'N/A' : 'N/A',
    errorRate: 'N/A',
    requests: 'N/A',
    lastIncident: 'None'
  };
}

function removePopover() {
  if (activePopover) {
    activePopover.remove();
    activePopover = null;
  }
}
