const API_BASE = 'http://localhost:8080/api/v1';

export async function fetchMetrics() {
    try {
        const res = await fetch(`${API_BASE}/metrics`);
        if (!res.ok) throw new Error('Failed to fetch metrics');
        return await res.json();
    } catch (e) {
        console.error('API Error:', e);
        return null;
    }
}

export async function fetchIncidents() {
    try {
        const res = await fetch(`${API_BASE}/incidents`);
        if (!res.ok) throw new Error('Failed to fetch incidents');
        return await res.json();
    } catch (e) {
        console.error('API Error:', e);
        return [];
    }
}

export async function fetchTopology() {
    try {
        const res = await fetch(`${API_BASE}/topology`);
        if (!res.ok) throw new Error('Failed to fetch topology');
        return await res.json();
    } catch (e) {
        console.error('API Error:', e);
        return { services: [], edges: [] };
    }
}

export async function requestRCA(incidentId) {
    try {
        const res = await fetch(`${API_BASE}/rca`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ incidentId, requester: 'ui' })
        });
        if (!res.ok) throw new Error('Failed to fetch RCA');
        return await res.json();
    } catch (e) {
        console.error('API Error:', e);
        throw e;
    }
}
