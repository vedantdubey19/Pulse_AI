/**
 * Incidents view
 */
import { INCIDENTS } from '../services/mockData.js';
import { getState, subscribe } from '../state.js';
import { navigate } from '../router.js';

let activeFilter = 'all';

export default {
  mount(container) {
    const view = document.createElement('div');
    view.className = 'view active';
    view.id = 'view-incidents';

    view.innerHTML = `
      <div class="filter-bar" id="filter-bar">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="high">High</button>
        <button class="filter-btn" data-filter="medium">Medium</button>
        <button class="filter-btn" data-filter="low">Low</button>
        <button class="filter-btn" data-filter="resolved">Resolved</button>
      </div>
      <div id="incidents-list"></div>
    `;

    container.appendChild(view);

    // Filter buttons
    activeFilter = 'all';
    view.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        view.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        renderIncidents();
      });
    });

    renderIncidents();

    const unsub = subscribe('incidents', () => renderIncidents());
    return () => unsub();
  }
};

function renderIncidents() {
  const list = document.getElementById('incidents-list');
  if (!list) return;

  const allIncidents = getState('incidents') || INCIDENTS;
  const filtered = activeFilter === 'all' ? allIncidents : allIncidents.filter(i => i.severity === activeFilter);

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-mood-happy"></i>
        <p>No incidents matching this filter. All clear!</p>
      </div>
    `;
    return;
  }

  list.innerHTML = filtered.map(inc => {
    const badges = {
      high: '<span class="badge bg-red">HIGH</span>',
      medium: '<span class="badge bg-amber">MEDIUM</span>',
      low: '<span class="badge bg-blue">LOW</span>',
      resolved: '<span class="badge bg-green">RESOLVED</span>'
    };

    let actionBtn = '';
    if (inc.rcaReady && inc.severity !== 'resolved') {
      actionBtn = `<button class="btn-rca" data-action="rca"><i class="ti ti-brain"></i> Trigger AI RCA</button>`;
    } else if (inc.rcaReady && inc.severity === 'resolved') {
      actionBtn = `<span class="badge" style="border:1px solid var(--ai-purple);color:var(--ai-purple)"><i class="ti ti-brain" style="margin-right:4px"></i>RCA Ready</span>`;
    }

    const causeParts = inc.cause.split('—').map(s => s.trim());
    const mainCause = causeParts[0];
    const detailCause = causeParts[1] || '';

    const bulletNotes = detailCause ? `
      <ul class="cause-details mt-2">
        <li>${detailCause}</li>
        <li>Automated health checks failing for ${inc.endpoint}</li>
        ${inc.severity === 'high' ? '<li>Immediate intervention recommended</li>' : ''}
      </ul>
    ` : '';

    return `
      <div class="incident-card ${inc.severity}">
        <div class="ic-top">
          <div style="display:flex;align-items:center;gap:12px;">
            ${badges[inc.severity] || badges.low}
            <span class="font-mono" style="color:var(--text-primary)">${inc.endpoint}</span>
          </div>
          <div class="font-mono text-secondary" style="font-size:12px;">${inc.time} ago</div>
        </div>
        <div class="ic-body cause-text">
          <div class="cause-main">${mainCause}</div>
          ${bulletNotes}
        </div>
        <div class="ic-bottom mt-2">
          <div class="ic-stats">
            <div><i class="ti ti-users"></i> ${inc.affected} requests affected</div>
            <div><i class="ti ti-clock"></i> Duration: ${inc.duration}</div>
          </div>
          <div>${actionBtn}</div>
        </div>
      </div>
    `;
  }).join('');

  // RCA button handlers
  list.querySelectorAll('[data-action="rca"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (btn.dataset.loading === 'true') return;
      btn.dataset.loading = 'true';
      const card = e.target.closest('.incident-card');
      
      // Phase 1
      btn.innerHTML = '<i class="ti ti-loader" style="animation: spin 1s linear infinite;"></i> <span class="font-mono">INITIALIZING...</span>';
      
      // Phase 2
      const statuses = ["Fetching logs...", "Analyzing patterns...", "Identifying root cause..."];
      for (const status of statuses) {
        await new Promise(r => setTimeout(r, 400));
        btn.innerHTML = `<i class="ti ti-loader" style="animation: spin 1s linear infinite;"></i> <span class="font-mono">${status}</span>`;
      }
      
      // Phase 3
      btn.innerHTML = '<i class="ti ti-check"></i> <span class="font-mono">RCA COMPLETE</span>';
      btn.style.backgroundColor = 'var(--success-green)';
      btn.style.borderColor = 'var(--success-green)';
      btn.style.color = '#fff';
      
      // Expand card to show View RCA action
      const body = card.querySelector('.ic-body');
      const rcaPanel = document.createElement('div');
      rcaPanel.className = 'font-mono text-purple';
      rcaPanel.style.marginTop = '12px';
      rcaPanel.style.padding = '12px';
      rcaPanel.style.backgroundColor = 'var(--ai-purple-dim)';
      rcaPanel.style.border = '1px solid var(--ai-purple)';
      rcaPanel.style.borderRadius = 'var(--radius-md)';
      rcaPanel.style.animation = 'slideInRight var(--duration-normal) var(--ease-out) forwards';
      rcaPanel.innerHTML = `
        <div style="margin-bottom: 8px; color: var(--text-primary);">Root Cause Identified:</div>
        <div style="margin-bottom: 12px; font-size: 11px;">Anomalous spike in database connections leading to pool exhaustion.</div>
        <button class="btn-primary" style="font-size: 12px; width: 100%; justify-content: center;" onclick="window.location.hash='rca'">View Full RCA</button>
      `;
      body.appendChild(rcaPanel);
    });
  });
}
