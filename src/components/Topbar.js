/**
 * Topbar component
 */
import { setState } from '../state.js';
import { runTestFailure } from '../services/simulation.js';

/**
 * Render the topbar.
 * @param {HTMLElement} container
 */
export function renderTopbar(container) {
  const header = document.createElement('header');
  header.id = 'topbar';

  header.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;">
      <button class="hamburger" id="hamburger-btn">
        <i class="ti ti-menu-2"></i>
      </button>
      <div class="page-title" id="page-title">Dashboard</div>
    </div>

    <svg class="hero-pulse" id="hero-pulse" viewBox="0 0 200 40" preserveAspectRatio="none">
      <path d="M0,20 L50,20 L60,5 L70,35 L80,20 L200,20" />
    </svg>

    <div class="topbar-right">
      <div class="live-status">
        <div class="live-dot"></div> LIVE
      </div>
      <button class="btn-test" id="btn-test-failure">
        <i class="ti ti-flask"></i>
        <span>Run test failure</span>
      </button>
      <div class="notification" id="notification-bell">
        <i class="ti ti-bell"></i>
        <div class="notification-badge" id="topbar-bell-badge">3</div>
      </div>
    </div>
  `;

  container.appendChild(header);

  // Test failure button
  document.getElementById('btn-test-failure').addEventListener('click', runTestFailure);

  // Notification bell
  const bell = document.getElementById('notification-bell');
  if (bell) {
    bell.addEventListener('click', () => {
      window.location.hash = 'incidents';
    });
  }

  // Hamburger toggle (mobile)
  document.getElementById('hamburger-btn').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  });
}
