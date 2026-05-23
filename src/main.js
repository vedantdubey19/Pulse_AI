/**
 * Pulse AI — Main Entry Point
 */
import './styles/index.css';

import { registerRoute, initRouter } from './router.js';
import { setState, getState } from './state.js';
import { INCIDENTS } from './services/mockData.js';
import { startSimulation } from './services/simulation.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderTopbar } from './components/Topbar.js';
import { initChatPanel } from './components/ChatPanel.js';
import { initCommandPalette } from './components/CommandPalette.js';

// Views
import Dashboard from './views/Dashboard.js';
import Incidents from './views/Incidents.js';
import Metrics from './views/Metrics.js';
import RCA from './views/RCA.js';
import Topology from './views/Topology.js';
import Settings from './views/Settings.js';

/**
 * Initialize the application.
 */
function init() {
  const app = document.getElementById('app');
  if (!app) return;

  // Set up app structure
  app.innerHTML = '<main id="main-container"></main>';

  const main = document.getElementById('main-container');

  // Render shell components
  renderSidebar(app);
  renderTopbar(main);

  // Create content area
  const contentArea = document.createElement('div');
  contentArea.id = 'content-area';
  main.appendChild(contentArea);

  // Initialize state
  setState('incidents', [...INCIDENTS]);

  // Register routes
  registerRoute('dashboard', Dashboard);
  registerRoute('incidents', Incidents);
  registerRoute('metrics', Metrics);
  registerRoute('rca', RCA);
  registerRoute('topology', Topology);
  registerRoute('settings', Settings);

  // Start router
  initRouter(contentArea, 'dashboard');

  // Initialize global components
  initChatPanel();
  initCommandPalette();

  // Start live simulation
  startSimulation();

  // Initialize WebMCP Agentic Tools
  initAgenticTools();
}

/**
 * Initialize WebMCP to expose tools to Agentic AI assistants.
 * This is the crucial feature that makes Pulse AI truly agentic.
 */
function initAgenticTools() {
  if (!window.navigator || !navigator.modelContext) {
    console.log('WebMCP not supported or not enabled in this browser. Skipping agentic tools initialization.');
    return;
  }

  // Tool 1: Get Active Incidents
  navigator.modelContext.registerTool({
    name: 'get-active-incidents',
    description: 'Fetch the list of currently active system incidents and anomalies in Pulse AI.',
    inputSchema: { type: 'object', properties: {} },
    execute: async () => {
      const incidents = getState ? getState('incidents') : [];
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(incidents, null, 2)
        }]
      };
    },
    annotations: { readOnlyHint: true }
  });

  // Tool 2: Resolve Incident
  navigator.modelContext.registerTool({
    name: 'resolve-incident',
    description: 'Mark a specific system incident as resolved.',
    inputSchema: {
      type: 'object',
      properties: {
        incidentId: { type: 'string', description: 'The ID of the incident to resolve (e.g., INC-001).' }
      },
      required: ['incidentId']
    },
    execute: async ({ incidentId }) => {
      if (!getState || !setState) return { content: [{ type: 'text', text: 'Error: State manager not available.' }] };
      const incidents = getState('incidents') || [];
      const index = incidents.findIndex(i => i.id === incidentId);
      
      if (index === -1) {
        return { content: [{ type: 'text', text: `Incident ${incidentId} not found.` }] };
      }
      
      incidents[index].status = 'resolved';
      setState('incidents', [...incidents]);
      
      return { content: [{ type: 'text', text: `Successfully resolved incident ${incidentId}.` }] };
    }
  });

  // Tool 3: Navigate
  navigator.modelContext.registerTool({
    name: 'navigate-dashboard',
    description: 'Navigate the Pulse AI dashboard to a specific view (e.g., dashboard, incidents, metrics, rca, topology).',
    inputSchema: {
      type: 'object',
      properties: {
        viewName: { type: 'string', description: 'The name of the view to navigate to.', enum: ['dashboard', 'incidents', 'metrics', 'rca', 'topology', 'settings'] }
      },
      required: ['viewName']
    },
    execute: async ({ viewName }) => {
      window.location.hash = viewName;
      return { content: [{ type: 'text', text: `Navigated to ${viewName}.` }] };
    }
  });

  console.log('WebMCP Agentic Tools successfully registered!');
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
