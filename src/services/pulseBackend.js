/**
 * Pulse backend client utilities.
 */

const DEFAULT_PULSE_BACKEND_URL = 'https://pulse-backend-production-817f.up.railway.app';

export function getPulseBackendUrl() {
  return localStorage.getItem('pulseBackendUrl') || DEFAULT_PULSE_BACKEND_URL;
}

export function setPulseBackendUrl(url) {
  if (!url) return;
  localStorage.setItem('pulseBackendUrl', url.replace(/\/+$/, ''));
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch (err) {
    return null;
  }
}

export async function fetchMetrics() {
  const baseUrl = getPulseBackendUrl();
  const res = await fetch(`${baseUrl}/api/v1/metrics`, { cache: 'no-store' });
  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error || `Metrics request failed (${res.status})`);
  }
  return res.json();
}

export async function fetchIncidents({ resolved, status, limit, since } = {}) {
  const baseUrl = getPulseBackendUrl();
  const url = new URL(`${baseUrl}/api/v1/incidents`);
  if (typeof resolved === 'boolean') {
    url.searchParams.set('resolved', String(resolved));
  }
  if (status) {
    url.searchParams.set('status', status);
  }
  if (typeof limit === 'number') {
    url.searchParams.set('limit', String(limit));
  }
  if (since) {
    url.searchParams.set('since', since);
  }

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error || `Incidents request failed (${res.status})`);
  }
  return res.json();
}

export async function fetchTopology() {
  const baseUrl = getPulseBackendUrl();
  const res = await fetch(`${baseUrl}/api/v1/topology`, { cache: 'no-store' });
  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error || `Topology request failed (${res.status})`);
  }
  return res.json();
}

export async function resolveIncident(incidentId) {
  const baseUrl = getPulseBackendUrl();
  const res = await fetch(`${baseUrl}/api/v1/incidents/${encodeURIComponent(incidentId)}/resolve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store'
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error || `Incident resolve failed (${res.status})`);
  }
  return res.json();
}

export async function fetchRca(incidentId) {
  const baseUrl = getPulseBackendUrl();
  const res = await fetch(`${baseUrl}/api/v1/rca`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incidentId })
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.error || `RCA request failed (${res.status})`);
  }
  return res.json();
}

export function connectIncidentStream(onEvent) {
  const baseUrl = getPulseBackendUrl();
  const wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws';
  const socket = new WebSocket(wsUrl);

  socket.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      onEvent?.(data);
    } catch (err) {
      // Ignore malformed events
    }
  });

  return socket;
}
