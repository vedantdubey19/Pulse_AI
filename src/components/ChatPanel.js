/**
 * AI Chat sliding panel
 */
import { getState, setState, subscribe } from '../state.js';
import { getAIResponse, getWelcomeMessage, getQuickActions } from '../services/chatResponses.js';

let messages = [];
let panelEl = null;

/**
 * Initialize the chat panel.
 */
export function initChatPanel() {
  const root = document.getElementById('chat-panel-root');
  if (!root) return;

  // Create FAB button
  const fab = document.createElement('button');
  fab.className = 'chat-fab';
  fab.id = 'chat-fab';
  fab.innerHTML = '<i class="ti ti-message-chatbot"></i>';
  fab.addEventListener('click', () => toggleChat());
  document.body.appendChild(fab);

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'chat-overlay';
  overlay.addEventListener('click', () => toggleChat(false));
  root.appendChild(overlay);

  // Create panel
  panelEl = document.createElement('div');
  panelEl.className = 'chat-panel';
  panelEl.innerHTML = `
    <div class="chat-header">
      <div class="chat-header-left">
        <div class="chat-header-icon"><i class="ti ti-brain"></i></div>
        <div>
          <div class="chat-header-title">AI Assistant</div>
          <div class="chat-header-sub">Powered by Pulse AI</div>
        </div>
      </div>
      <button class="chat-close" id="chat-close"><i class="ti ti-x"></i></button>
    </div>
    <div class="chat-messages" id="chat-messages"></div>
    <div class="chat-chips" id="chat-chips"></div>
    <div class="chat-input-bar">
      <input class="chat-input" id="chat-input" type="text" placeholder="Ask about API issues..." />
      <button class="chat-send" id="chat-send"><i class="ti ti-send"></i></button>
    </div>
  `;
  root.appendChild(panelEl);

  // Event listeners
  document.getElementById('chat-close').addEventListener('click', () => toggleChat(false));
  document.getElementById('chat-send').addEventListener('click', sendMessage);
  document.getElementById('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Quick action chips
  renderChips();

  // Welcome message
  addMessage('ai', getWelcomeMessage());

  // Subscribe to state
  subscribe('chatOpen', (open) => {
    panelEl.classList.toggle('open', open);
    overlay.classList.toggle('open', open);
    fab.classList.toggle('hidden', open);
    if (open) {
      setTimeout(() => document.getElementById('chat-input')?.focus(), 300);
    }
  });
}

function toggleChat(forceState) {
  const newState = forceState !== undefined ? forceState : !getState('chatOpen');
  setState('chatOpen', newState);
}

function renderChips() {
  const chipsEl = document.getElementById('chat-chips');
  if (!chipsEl) return;

  const actions = getQuickActions();
  chipsEl.innerHTML = actions.map(action =>
    `<button class="chat-chip">${action}</button>`
  ).join('');

  chipsEl.querySelectorAll('.chat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const input = document.getElementById('chat-input');
      if (input) {
        input.value = chip.textContent;
        sendMessage();
      }
    });
  });
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  if (!input || !input.value.trim()) return;

  const userMsg = input.value.trim();
  input.value = '';

  // Add user message
  addMessage('user', userMsg);

  // Show typing indicator
  showTyping();

  // Simulate AI response delay
  setTimeout(() => {
    hideTyping();
    const response = getAIResponse(userMsg);
    addMessage('ai', response);
  }, 1000 + Math.random() * 1000);
}

function addMessage(role, content) {
  const messagesEl = document.getElementById('chat-messages');
  if (!messagesEl) return;

  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  // Simple markdown-like formatting
  const formatted = formatMessage(content);

  const msgEl = document.createElement('div');
  msgEl.className = `chat-msg ${role}`;
  msgEl.innerHTML = `
    <div class="chat-bubble">${formatted}</div>
    <div class="chat-timestamp">${time}</div>
  `;

  messagesEl.appendChild(msgEl);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  messages.push({ role, content, time });
}

function formatMessage(text) {
  return text
    // Code blocks
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Tables (simple)
    .replace(/\|(.+)\|\n\|[-|]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
      const ths = header.split('|').filter(Boolean).map(h => `<th>${h.trim()}</th>`).join('');
      const trs = rows.trim().split('\n').map(row => {
        const tds = row.split('|').filter(Boolean).map(d => `<td>${d.trim()}</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<table style="width:100%;font-size:11px;margin:8px 0;border-collapse:collapse;"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
    })
    // Bullet points
    .replace(/^[•] (.+)$/gm, '<div style="padding-left:12px;">• $1</div>')
    // Line breaks
    .replace(/\n/g, '<br>');
}

function showTyping() {
  const messagesEl = document.getElementById('chat-messages');
  if (!messagesEl) return;

  const typing = document.createElement('div');
  typing.className = 'chat-msg ai';
  typing.id = 'typing-indicator';
  typing.innerHTML = `
    <div class="chat-bubble typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  messagesEl.appendChild(typing);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function hideTyping() {
  const typing = document.getElementById('typing-indicator');
  if (typing) typing.remove();
}

export { toggleChat };
