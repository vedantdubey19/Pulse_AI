/**
 * Settings view
 */
import { loadSettings, saveSetting, saveAllSettings } from '../utils/storage.js';
import { showToast } from '../components/Toast.js';
import { ENDPOINTS } from '../services/mockData.js';

export default {
  mount(container) {
    const settings = loadSettings();

    const view = document.createElement('div');
    view.className = 'view active';
    view.id = 'view-settings';

    view.innerHTML = `
      <div class="settings-grid">
        <!-- Alert Thresholds -->
        <div class="settings-section">
          <div class="settings-section-title"><i class="ti ti-bell-ringing"></i> Alert Thresholds</div>

          <div class="setting-row">
            <div class="setting-label">Error Rate<small>Trigger alert above this percentage</small></div>
            <div style="display:flex;align-items:center;">
              <input type="range" id="set-error-rate" min="1" max="50" value="${settings.errorRateThreshold}" />
              <div class="setting-value" id="set-error-rate-val">${settings.errorRateThreshold}%</div>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-label">P95 Latency<small>Alert when latency exceeds threshold</small></div>
            <div style="display:flex;align-items:center;">
              <input type="range" id="set-latency" min="100" max="10000" step="100" value="${settings.latencyThreshold}" />
              <div class="setting-value" id="set-latency-val">${settings.latencyThreshold}ms</div>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-label">Uptime SLA<small>Target uptime percentage</small></div>
            <div style="display:flex;align-items:center;">
              <input type="range" id="set-uptime" min="95" max="100" step="0.1" value="${settings.uptimeSLA}" />
              <div class="setting-value" id="set-uptime-val">${settings.uptimeSLA}%</div>
            </div>
          </div>
        </div>

        <!-- Alert Channels -->
        <div class="settings-section">
          <div class="settings-section-title"><i class="ti ti-send"></i> Alert Channels</div>

          ${['discord', 'slack', 'email', 'pagerduty'].map(ch => {
            const icons = { discord: 'ti-brand-discord', slack: 'ti-brand-slack', email: 'ti-mail', pagerduty: 'ti-bell' };
            const labels = { discord: 'Discord', slack: 'Slack', email: 'Email', pagerduty: 'PagerDuty' };
            return `
              <div class="setting-row">
                <div class="setting-label" style="flex-direction:row;gap:8px;align-items:center;">
                  <i class="ti ${icons[ch]}"></i> ${labels[ch]}
                </div>
                <label class="toggle">
                  <input type="checkbox" data-channel="${ch}" ${settings.channels[ch] ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Notification Preferences -->
        <div class="settings-section">
          <div class="settings-section-title"><i class="ti ti-notification"></i> Notification Preferences</div>

          ${Object.entries({ critical: 'Critical alerts', warning: 'Warning alerts', recovery: 'Recovery notifications', autoRCA: 'Auto-trigger AI RCA' }).map(([key, label]) => `
            <label class="checkbox-row">
              <input type="checkbox" data-notif="${key}" ${settings.notifications[key] ? 'checked' : ''} />
              ${label}
            </label>
          `).join('')}
        </div>

        <!-- Appearance -->
        <div class="settings-section">
          <div class="settings-section-title"><i class="ti ti-palette"></i> Appearance</div>

          <div class="setting-row">
            <div class="setting-label">Data Refresh Interval</div>
            <select id="set-refresh">
              ${[1, 3, 5, 10, 30].map(s =>
                `<option value="${s}" ${settings.refreshInterval === s ? 'selected' : ''}>${s}s</option>`
              ).join('')}
            </select>
          </div>

          <div class="setting-row" style="border-bottom:none;">
            <div class="setting-label">Theme</div>
            <div class="badge bg-purple" style="font-size:11px;">Dark Mode</div>
          </div>
        </div>
      </div>

      <!-- Monitored Endpoints -->
      <div class="settings-section" style="margin-top:20px;">
        <div class="settings-section-title"><i class="ti ti-server"></i> Monitored Endpoints</div>
        <div id="endpoint-list">
          ${ENDPOINTS.map(ep => `
            <div class="endpoint-list-item">
              <div>
                <span class="endpoint-name">${ep.path}</span>
                <span class="badge bg-${ep.method === 'POST' ? 'amber' : 'blue'}" style="margin-left:8px;font-size:9px;">${ep.method}</span>
              </div>
              <label class="toggle">
                <input type="checkbox" checked />
                <span class="toggle-slider"></span>
              </label>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.appendChild(view);

    // Slider handlers
    const bindSlider = (id, key, suffix, transform = v => v) => {
      const slider = document.getElementById(id);
      const display = document.getElementById(id + '-val');
      if (slider && display) {
        slider.addEventListener('input', () => {
          const val = transform(parseFloat(slider.value));
          display.innerText = val + suffix;
          saveSetting(key, parseFloat(slider.value));
        });
      }
    };

    bindSlider('set-error-rate', 'errorRateThreshold', '%');
    bindSlider('set-latency', 'latencyThreshold', 'ms');
    bindSlider('set-uptime', 'uptimeSLA', '%');

    // Channel toggles
    view.querySelectorAll('[data-channel]').forEach(cb => {
      cb.addEventListener('change', () => {
        const channels = { ...loadSettings().channels };
        channels[cb.dataset.channel] = cb.checked;
        saveSetting('channels', channels);
      });
    });

    // Notification checkboxes
    view.querySelectorAll('[data-notif]').forEach(cb => {
      cb.addEventListener('change', () => {
        const notifs = { ...loadSettings().notifications };
        notifs[cb.dataset.notif] = cb.checked;
        saveSetting('notifications', notifs);
      });
    });

    // Refresh interval
    document.getElementById('set-refresh')?.addEventListener('change', (e) => {
      saveSetting('refreshInterval', parseInt(e.target.value));
    });

    return () => {};
  }
};
