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

    return `
      <div class="incident-card ${inc.severity}">
        <div class="ic-top">
          <div style="display:flex;align-items:center;gap:12px;">
            ${badges[inc.severity] || badges.low}
            <span class="font-mono" style="color:var(--text-primary)">${inc.endpoint}</span>
          </div>
          <div class="font-mono text-secondary" style="font-size:12px;">${inc.time} ago</div>
        </div>
        <div class="ic-body cause-text">${inc.cause}</div>
        <div class="ic-bottom">
          <div class="ic-stats">
            <div><i class="ti ti-users"></i> ${inc.affected} requests</div>
            <div><i class="ti ti-clock"></i> Duration: ${inc.duration}</div>
          </div>
          <div>${actionBtn}</div>
        </div>
      </div>
    `;
  }).join('');

  // RCA button handlers
  list.querySelectorAll('[data-action="rca"]').forEach(btn => {
    btn.addEventListener('click', () => navigate('rca'));
  });
}
