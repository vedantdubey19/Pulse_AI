/**
 * Sidebar component
 */
import { navigate } from '../router.js';
import { getState, subscribe } from '../state.js';
import { $ } from '../utils/dom.js';

const NAV_ITEMS = [
  { id: 'dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { id: 'incidents', icon: 'ti-alert-triangle', label: 'Incidents', badge: true },
  { id: 'metrics', icon: 'ti-chart-bar', label: 'Metrics' },
  { id: 'topology', icon: 'ti-topology-star-3', label: 'Topology' },
  { id: 'rca', icon: 'ti-brain', label: 'AI RCA', iconClass: 'text-purple' },
  { id: 'settings', icon: 'ti-settings', label: 'Settings' }
];

/**
 * Render the sidebar into the app.
 * @param {HTMLElement} container
 */
export function renderSidebar(container) {
  const sidebar = document.createElement('aside');
  sidebar.id = 'sidebar';

  sidebar.innerHTML = `
    <div class="logo-container">
      <i class="ti ti-activity logo-icon"></i>
      <span>Pulse AI</span>
    </div>
    <ul class="nav-menu" id="nav-menu">
      ${NAV_ITEMS.map((item, i) => `
        <li class="nav-item animate-in stagger-${i + 1} ${item.id === 'dashboard' ? 'active' : ''}" data-route="${item.id}">
          <i class="ti ${item.icon} nav-icon ${item.iconClass || ''}"></i>
          <span class="nav-label">${item.label}</span>
          ${item.badge ? '<div class="nav-badge" id="nav-incidents-badge"></div>' : ''}
        </li>
      `).join('')}
    </ul>
    <div class="api-status">
      <span class="nav-label">API Key</span>
      <div class="api-key-box">
        <span>pk_prod_8f...2a9</span>
        <i class="ti ti-copy"></i>
      </div>
    </div>
  `;

  container.prepend(sidebar);

  // Navigation click handlers
  const navItems = sidebar.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const route = item.dataset.route;
      navigate(route);
    });
  });

  // Subscribe to route changes to update active state
  subscribe('currentView', (newView) => {
    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.route === newView);
    });

    // Update page title
    const titleEl = document.getElementById('page-title');
    if (titleEl) {
      const navItem = NAV_ITEMS.find(n => n.id === newView);
      titleEl.innerText = navItem ? navItem.label : newView;
    }
  });

  // Copy API key
  const copyBtn = sidebar.querySelector('.api-key-box .ti-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard?.writeText('pk_prod_8f3a7c2b1d9e4f6a8b0c1d2e3f4a5b6c7d8e9f2a9');
      copyBtn.className = 'ti ti-check';
      setTimeout(() => { copyBtn.className = 'ti ti-copy'; }, 1500);
    });
  }

  // Mobile sidebar toggle
  const backdrop = document.createElement('div');
  backdrop.className = 'sidebar-backdrop';
  container.appendChild(backdrop);

  backdrop.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });

  subscribe('sidebarOpen', (open) => {
    sidebar.classList.toggle('open', open);
  });
}
