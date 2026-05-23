/**
 * Toast notification system
 */
import { $ } from '../utils/dom.js';

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'high'|'medium'|'low'|'success'} severity
 */
export function showToast(message, severity = 'high') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    high: 'ti-alert-triangle text-red',
    medium: 'ti-alert-circle text-amber',
    low: 'ti-info-circle text-blue',
    success: 'ti-check text-green'
  };

  const titles = {
    high: 'Critical Alert',
    medium: 'Warning',
    low: 'Info',
    success: 'Success'
  };

  const colors = {
    high: 'var(--alert-red)',
    medium: 'var(--warning-amber)',
    low: 'var(--accent-blue)',
    success: 'var(--success-green)'
  };

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderLeftColor = colors[severity] || colors.high;

  toast.innerHTML = `
    <i class="ti ${icons[severity] || icons.high} toast-icon"></i>
    <div style="flex:1;min-width:0;">
      <div class="toast-title">${titles[severity] || 'Alert'}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  // Auto-dismiss
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}
