/**
 * Hash-based SPA router.
 */
import { setState, getState } from './state.js';

const routes = {};
let currentCleanup = null;

/**
 * Register a route.
 * @param {string} name - Route name (e.g., 'dashboard')
 * @param {object} handler - { mount(container), unmount() }
 */
export function registerRoute(name, handler) {
  routes[name] = handler;
}

/**
 * Navigate to a route.
 * @param {string} name
 */
export function navigate(name) {
  if (!routes[name]) {
    console.warn(`Route "${name}" not found`);
    return;
  }

  window.location.hash = name;
}

/**
 * Initialize the router — listen for hash changes and mount initial route.
 * @param {HTMLElement} container - The content area to mount views into
 * @param {string} defaultRoute
 */
export function initRouter(container, defaultRoute = 'dashboard') {
  const handleRoute = () => {
    const hash = window.location.hash.replace('#', '') || defaultRoute;
    const routeName = routes[hash] ? hash : defaultRoute;

    // Cleanup previous view
    if (currentCleanup) {
      currentCleanup();
      currentCleanup = null;
    }

    const updateDOM = () => {
      // Clear container
      container.innerHTML = '';

      // Mount new view
      const route = routes[routeName];
      if (route) {
        const cleanup = route.mount(container);
        if (typeof cleanup === 'function') {
          currentCleanup = cleanup;
        }
        setState('currentView', routeName);
      }
    };

    if (!document.startViewTransition) {
      updateDOM();
    } else {
      document.startViewTransition(() => {
        updateDOM();
      });
    }
  };

  window.addEventListener('hashchange', handleRoute);
  handleRoute();

  return () => {
    window.removeEventListener('hashchange', handleRoute);
  };
}

/**
 * Get the current route name.
 * @returns {string}
 */
export function getCurrentRoute() {
  return getState('currentView');
}
