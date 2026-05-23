/**
 * Command Palette (Cmd+K)
 */
import { navigate } from '../router.js';
import { getState, setState, subscribe } from '../state.js';
import { toggleChat } from './ChatPanel.js';
import { runTestFailure } from '../services/simulation.js';

const COMMANDS = [
  { group: 'Navigation', items: [
    { id: 'nav-dashboard', icon: 'ti-layout-dashboard', label: 'Go to Dashboard', action: () => navigate('dashboard') },
    { id: 'nav-incidents', icon: 'ti-alert-triangle', label: 'Go to Incidents', action: () => navigate('incidents') },
    { id: 'nav-metrics', icon: 'ti-chart-bar', label: 'Go to Metrics', action: () => navigate('metrics') },
    { id: 'nav-topology', icon: 'ti-topology-star-3', label: 'Go to Topology', action: () => navigate('topology') },
    { id: 'nav-rca', icon: 'ti-brain', label: 'Go to AI RCA', action: () => navigate('rca') },
    { id: 'nav-settings', icon: 'ti-settings', label: 'Go to Settings', action: () => navigate('settings') },
  ]},
  { group: 'Actions', items: [
    { id: 'run-test', icon: 'ti-flask', label: 'Run Test Failure', action: () => runTestFailure() },
    { id: 'open-chat', icon: 'ti-message-chatbot', label: 'Open AI Chat', action: () => toggleChat(true) },
  ]}
];

let selectedIndex = 0;
let filteredItems = [];

/**
 * Initialize the command palette.
 */
export function initCommandPalette() {
  const root = document.getElementById('command-palette-root');
  if (!root) return;

  root.innerHTML = `
    <div class="cmd-overlay" id="cmd-overlay">
      <div class="cmd-palette">
        <div class="cmd-input-wrapper">
          <i class="ti ti-search cmd-input-icon"></i>
          <input class="cmd-input" id="cmd-input" type="text" placeholder="Type a command..." />
          <span class="cmd-shortcut">ESC</span>
        </div>
        <div class="cmd-list" id="cmd-list"></div>
        <div class="cmd-footer">
          <div class="cmd-footer-keys">
            <span><kbd>↑↓</kbd> navigate</span>
            <span><kbd>↵</kbd> select</span>
            <span><kbd>esc</kbd> close</span>
          </div>
          <span>Pulse AI</span>
        </div>
      </div>
    </div>
  `;

  const overlay = document.getElementById('cmd-overlay');
  const input = document.getElementById('cmd-input');

  // Keyboard shortcut: Cmd+K or Ctrl+K
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      togglePalette();
    }
    if (e.key === 'Escape' && getState('commandPaletteOpen')) {
      togglePalette(false);
    }
  });

  // Click outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) togglePalette(false);
  });

  // Input filtering
  input.addEventListener('input', () => {
    renderCommands(input.value);
  });

  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filteredItems.length - 1);
      updateSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      updateSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        togglePalette(false);
      }
    }
  });

  subscribe('commandPaletteOpen', (open) => {
    overlay.classList.toggle('open', open);
    if (open) {
      input.value = '';
      selectedIndex = 0;
      renderCommands('');
      setTimeout(() => input.focus(), 100);
    }
  });
}

function togglePalette(forceState) {
  const newState = forceState !== undefined ? forceState : !getState('commandPaletteOpen');
  setState('commandPaletteOpen', newState);
}

function renderCommands(query) {
  const list = document.getElementById('cmd-list');
  if (!list) return;

  const lower = query.toLowerCase();
  filteredItems = [];
  let html = '';

  for (const group of COMMANDS) {
    const items = group.items.filter(item =>
      item.label.toLowerCase().includes(lower)
    );

    if (items.length === 0) continue;

    html += `<div class="cmd-group-label">${group.group}</div>`;
    for (const item of items) {
      const idx = filteredItems.length;
      filteredItems.push(item);
      html += `
        <div class="cmd-item ${idx === selectedIndex ? 'selected' : ''}" data-idx="${idx}">
          <i class="ti ${item.icon} cmd-item-icon"></i>
          <span class="cmd-item-label">${item.label}</span>
        </div>
      `;
    }
  }

  if (filteredItems.length === 0) {
    html = '<div style="padding:20px;text-align:center;color:var(--text-tertiary);font-size:13px;">No matching commands</div>';
  }

  list.innerHTML = html;

  // Click handlers
  list.querySelectorAll('.cmd-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx);
      if (filteredItems[idx]) {
        filteredItems[idx].action();
        togglePalette(false);
      }
    });
    el.addEventListener('mouseenter', () => {
      selectedIndex = parseInt(el.dataset.idx);
      updateSelection();
    });
  });
}

function updateSelection() {
  const items = document.querySelectorAll('#cmd-list .cmd-item');
  items.forEach((el, i) => {
    el.classList.toggle('selected', i === selectedIndex);
  });
}
