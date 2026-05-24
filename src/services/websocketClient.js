import { setState, getState } from '../state.js';
import { showToast } from '../components/Toast.js';
import { fetchIncidents } from './apiClient.js';

let ws = null;

export function connectWebSocket() {
    if (ws) return;

    ws = new WebSocket('ws://localhost:8080/ws');

    ws.onopen = () => {
        console.log('Connected to Pulse Backend WebSocket');
    };

    ws.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            handleWsMessage(msg);
        } catch (e) {
            console.error('Failed to parse WebSocket message', e);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting in 3s...');
        ws = null;
        setTimeout(connectWebSocket, 3000);
    };
}

function handleWsMessage(msg) {
    if (msg.type === 'incident') {
        fetchIncidents().then(incidents => {
            setState('incidents', incidents);
            setState('incidentsCount', incidents.length);
            showToast(`New Incident: ${msg.service} (${msg.cause})`, msg.severity === 'Critical' ? 'high' : 'medium');
        });
    } else if (msg.type === 'metrics') {
        // Trigger a re-render/update for components listening to real-time metrics
        setState('liveMetrics', msg.payload);
    } else if (msg.type === 'topology') {
        setState('topology', msg.payload);
    }
}
