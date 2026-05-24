/**
 * Service Topology / Dependency Map view (SVG-based)
 */
import { fetchTopology } from '../services/apiClient.js';

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
let currentNodes = [];
let currentEdges = [];
let currentDetails = {};
let topoInterval = null;

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

    const fetchAndRender = async () => {
      try {
        const topo = await fetchTopology();
        if (topo && topo.services) {
          const cx = 410, cy = 210, r = 130;
          const len = topo.services.length;
          currentNodes = topo.services.map((n, i) => {
            const angle = (i / len) * 2 * Math.PI - Math.PI / 2;
            return {
              id: n.id,
              label: n.name,
              type: n.meta?.type || 'service',
              status: n.status,
              x: cx + r * Math.cos(angle),
              y: cy + r * Math.sin(angle),
              details: {
                latency: `${n.meta?.avgLatencyMs || 0}ms`,
                errorRate: n.meta?.errorCount ? `${(n.meta.errorCount / Math.max(1, n.meta.totalRequests) * 100).toFixed(1)}%` : '0%',
                requests: `${n.meta?.totalRequests || 0}/min`,
                lastIncident: n.status === 'critical' ? 'Ongoing' : 'None'
              }
            };
          });
          currentEdges = topo.edges;
          currentDetails = {};
          currentNodes.forEach(n => currentDetails[n.id] = n.details);
          renderTopology();
        }
      } catch (e) {
        console.error('Topology error', e);
      }
    };

    fetchAndRender();
    topoInterval = setInterval(fetchAndRender, 3000);

    // Close popover on click outside
    const closeHandler = (e) => {
      if (activePopover && !e.target.closest('.node-popover') && !e.target.closest('.service-node')) {
        removePopover();
      }
    };
    document.addEventListener('click', closeHandler);

    return () => {
      document.removeEventListener('click', closeHandler);
      clearInterval(topoInterval);
      removePopover();
    };
  }
};

function renderTopology() {
  const svg = document.getElementById('topology-svg');
  if (!svg) return;

  let svgContent = '';

  // Draw edges
  currentEdges.forEach((edge, i) => {
    const from = currentNodes.find(n => n.id === edge.from);
    const to = currentNodes.find(n => n.id === edge.to);
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
  currentNodes.forEach(node => {
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

  const node = currentNodes.find(n => n.id === nodeId);
  const details = currentDetails[nodeId];
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

function removePopover() {
  if (activePopover) {
    activePopover.remove();
    activePopover = null;
  }
}
