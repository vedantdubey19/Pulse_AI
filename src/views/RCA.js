/**
 * AI Root Cause Analysis view
 */
import { TIMELINE_EVENTS, RCA_DATA } from '../services/mockData.js';
import { showToast } from '../components/Toast.js';
import { fetchRca, resolveIncident } from '../services/pulseBackend.js';
import { getState } from '../state.js';

export default {
  mount(container) {
    const view = document.createElement('div');
    view.className = 'view active';
    view.id = 'view-rca';

    // Show loading first, then reveal content
    view.innerHTML = `
      <div id="rca-loading-state" class="rca-loading">
        <div class="loader"></div>
        <div class="loading-text" id="rca-loading-text">Fetching logs...</div>
      </div>
      <div class="rca-layout" id="rca-content" style="display:none;">
        <div class="timeline-col">
          <div class="section-header" style="margin-bottom:24px;">
            <i class="ti ti-clock-hour-4"></i> Incident Timeline
          </div>
          <div id="rca-timeline"></div>
        </div>
        <div class="rca-col">
          <div class="rca-header">
            <div class="badge bg-purple"><i class="ti ti-brain" style="margin-right:4px"></i> AI RCA</div>
            <div style="font-size:12px;color:var(--text-secondary);">Powered by Pulse AI</div>
          </div>

          <div class="rca-box root-cause" id="rca-root-cause-box">
            <div class="rca-box-title text-purple">
              <i class="ti ti-target"></i> Root cause identified
            </div>
            <div class="rca-box-body" id="rca-root-cause-body">
              ${RCA_DATA.rootCause}
              <ul class="evidence-list">
                ${RCA_DATA.evidence.map(e => `<li>${e}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div class="rca-box recommendation" id="rca-recommendation-box">
            <div class="rca-box-title text-green">
              <i class="ti ti-check"></i> Fix recommendation
            </div>
            <div class="rca-box-body" id="rca-recommendation-body">${RCA_DATA.recommendation}</div>
          </div>

          <div class="log-block" id="rca-logs-block">${RCA_DATA.logs}</div>

          <div class="action-bar">
            <button class="btn btn-primary" id="rca-copy"><i class="ti ti-copy"></i> Copy report</button>
            <button class="btn btn-secondary" id="rca-resolve"><i class="ti ti-check"></i> Mark resolved</button>
            <button class="btn btn-secondary"><i class="ti ti-brand-slack"></i> Send to Slack</button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(view);

    // Animate loading sequence
    const loadingText = document.getElementById('rca-loading-text');
    const loadingState = document.getElementById('rca-loading-state');
    const content = document.getElementById('rca-content');

    setTimeout(() => { if (loadingText) loadingText.innerText = 'Analysing patterns...'; }, 800);
    setTimeout(() => { if (loadingText) loadingText.innerText = 'Identifying root cause...'; }, 1800);
    setTimeout(() => {
      if (loadingState) loadingState.style.display = 'none';
      if (content) content.style.display = 'grid';
    }, 2800);

    // Render timeline
    renderTimeline();
    loadLiveRca();

    // Action buttons
    document.getElementById('rca-copy')?.addEventListener('click', () => {
      const text = `Root Cause: ${RCA_DATA.rootCause.replace(/<[^>]*>/g, '')}\n\nRecommendation: ${RCA_DATA.recommendation.replace(/<[^>]*>/g, '')}\n\nLogs:\n${RCA_DATA.logs}`;
      navigator.clipboard?.writeText(text);
      showToast('RCA report copied to clipboard', 'success');
    });

    document.getElementById('rca-resolve')?.addEventListener('click', () => {
      markResolved();
    });

    return () => {};
  }
};

function renderTimeline() {
  const tl = document.getElementById('rca-timeline');
  if (!tl) return;

  tl.innerHTML = TIMELINE_EVENTS.map(ev => `
    <div class="timeline-item">
      <div class="timeline-dot" style="background-color:${ev.color}"></div>
      <div class="timeline-content">
        <div class="timeline-time">${ev.time}</div>
        <div class="timeline-text">${ev.text}</div>
      </div>
    </div>
  `).join('');
}

async function loadLiveRca() {
  const activeIncident = (getState('incidents') || []).find((incident) => incident.severity !== 'resolved');
  if (!activeIncident?.id) return;

  try {
    const result = await fetchRca(activeIncident.id);
    const rca = result?.rca;
    if (!rca) return;

    const rootCauseBody = document.getElementById('rca-root-cause-body');
    const recommendationBody = document.getElementById('rca-recommendation-body');
    const logsBlock = document.getElementById('rca-logs-block');

    if (rootCauseBody) {
      rootCauseBody.innerHTML = `
        ${rca.summary || RCA_DATA.rootCause}
        <ul class="evidence-list">
          ${(rca.evidence || RCA_DATA.evidence).map((item) => `<li>${item}</li>`).join('')}
        </ul>
      `;
    }

    if (recommendationBody) {
      recommendationBody.innerHTML = rca.suggestedFix || RCA_DATA.recommendation;
    }

    if (logsBlock) {
      logsBlock.textContent = `Confidence: ${Number(rca.confidence ?? 0).toFixed(2)}\nGenerated at: ${result.generatedAt || 'now'}`;
    }
  } catch (err) {
    showToast('Using local RCA fallback', 'medium');
  }
}

async function markResolved() {
  const activeIncident = (getState('incidents') || []).find((incident) => incident.severity !== 'resolved');
  if (!activeIncident?.id) {
    showToast('No active incident to resolve', 'medium');
    return;
  }

  try {
    await resolveIncident(activeIncident.id);
    showToast('Incident marked as resolved', 'success');
  } catch (err) {
    showToast('Unable to resolve incident', 'high');
  }
}
