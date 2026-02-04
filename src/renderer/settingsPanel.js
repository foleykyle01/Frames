/**
 * Settings Panel Module
 * Overlay panel for app settings (themes, terminal themes)
 */

const { ipcRenderer } = require('electron');
const themeManager = require('./themeManager');

let overlay = null;
let isVisible = false;

function init() {
  ipcRenderer.on('open-settings', () => show());
}

function _createOverlay() {
  overlay = document.createElement('div');
  overlay.className = 'settings-overlay';

  const darkThemes = themeManager.APP_THEMES.filter(t => t.group === 'dark');
  const lightThemes = themeManager.APP_THEMES.filter(t => t.group === 'light');

  const darkTerminals = themeManager.TERMINAL_THEMES.filter(t => {
    if (t.id === 'auto') return true;
    const def = themeManager.XTERM_DEFS[t.id];
    return def && _isDarkColor(def.background);
  });
  const lightTerminals = themeManager.TERMINAL_THEMES.filter(t => {
    if (t.id === 'auto') return false;
    const def = themeManager.XTERM_DEFS[t.id];
    return def && !_isDarkColor(def.background);
  });

  overlay.innerHTML = `
    <div class="settings-panel">
      <div class="settings-header">
        <h2>Settings</h2>
        <button class="settings-close" title="Close (Esc)">&times;</button>
      </div>
      <div class="settings-body">
        <div class="settings-section">
          <h3>App Theme</h3>
          <div class="settings-group-label">Dark</div>
          <div class="theme-grid" data-section="app">
            ${darkThemes.map(t => `
              <button class="theme-card" data-theme="${t.id}">
                <span class="theme-swatch" style="background:linear-gradient(135deg,${t.preview[0]},${t.preview[1]})"></span>
                <span class="theme-card-label">${t.label}</span>
              </button>
            `).join('')}
          </div>
          <div class="settings-group-label">Light</div>
          <div class="theme-grid" data-section="app">
            ${lightThemes.map(t => `
              <button class="theme-card" data-theme="${t.id}">
                <span class="theme-swatch" style="background:linear-gradient(135deg,${t.preview[0]},${t.preview[1]})"></span>
                <span class="theme-card-label">${t.label}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="settings-divider"></div>

        <div class="settings-section">
          <h3>Terminal Theme</h3>
          <p class="settings-hint">Override the terminal colors independently from the app theme.</p>
          <div class="theme-grid" data-section="terminal">
            ${darkTerminals.map(t => _terminalCard(t)).join('')}
          </div>
          <div class="settings-group-label">Light</div>
          <div class="theme-grid" data-section="terminal">
            ${lightTerminals.map(t => _terminalCard(t)).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  overlay.querySelector('.settings-close').addEventListener('click', hide);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) hide(); });

  // App theme cards
  overlay.querySelectorAll('.theme-grid[data-section="app"] .theme-card').forEach(btn => {
    btn.addEventListener('click', () => {
      themeManager.applyTheme(btn.dataset.theme);
      _updateSelection();
    });
  });

  // Terminal theme cards
  overlay.querySelectorAll('.theme-grid[data-section="terminal"] .theme-card').forEach(btn => {
    btn.addEventListener('click', () => {
      themeManager.applyTerminalTheme(btn.dataset.termtheme);
      _updateSelection();
    });
  });

  document.body.appendChild(overlay);
  _injectStyles();
}

function _terminalCard(t) {
  let swatchStyle;
  if (t.id === 'auto') {
    swatchStyle = 'background:var(--bg-deep);border:1px dashed var(--border-strong)';
  } else {
    const def = themeManager.XTERM_DEFS[t.id];
    swatchStyle = `background:${def.background}`;
  }
  return `<button class="theme-card" data-termtheme="${t.id}">
    <span class="theme-swatch term-swatch" style="${swatchStyle}">
      ${t.id !== 'auto' ? _terminalPreviewDots(t.id) : '<span class="auto-label">Auto</span>'}
    </span>
    <span class="theme-card-label">${t.label}</span>
  </button>`;
}

function _terminalPreviewDots(id) {
  const d = themeManager.XTERM_DEFS[id];
  if (!d) return '';
  return `<span class="term-dots">
    <i style="background:${d.red}"></i>
    <i style="background:${d.green}"></i>
    <i style="background:${d.blue}"></i>
    <i style="background:${d.yellow}"></i>
  </span>`;
}

function _isDarkColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
}

function _updateSelection() {
  if (!overlay) return;
  const appTheme = themeManager.getTheme();
  const termTheme = themeManager.getTerminalTheme();

  overlay.querySelectorAll('.theme-grid[data-section="app"] .theme-card').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === appTheme);
  });
  overlay.querySelectorAll('.theme-grid[data-section="terminal"] .theme-card').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.termtheme === termTheme);
  });
}

function show() {
  if (!overlay) _createOverlay();
  _updateSelection();
  overlay.classList.add('visible');
  isVisible = true;
}

function hide() {
  if (overlay) overlay.classList.remove('visible');
  isVisible = false;
}

function toggle() {
  if (isVisible) hide(); else show();
}

function _injectStyles() {
  const id = 'settings-panel-styles';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    .settings-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none;
      transition: opacity var(--transition-normal);
      backdrop-filter: blur(4px);
    }
    .settings-overlay.visible { opacity: 1; pointer-events: all; }

    .settings-panel {
      background: var(--bg-primary);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      width: 560px; max-width: 92vw; max-height: 82vh;
      overflow: hidden; display: flex; flex-direction: column;
      transform: scale(0.96) translateY(8px);
      transition: transform var(--transition-normal);
    }
    .settings-overlay.visible .settings-panel {
      transform: scale(1) translateY(0);
    }

    .settings-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-lg) var(--space-xl);
      border-bottom: 1px solid var(--border-subtle);
      flex-shrink: 0;
    }
    .settings-header h2 {
      margin: 0; font-size: 16px; font-weight: 600;
      color: var(--text-primary); font-family: var(--font-sans);
    }
    .settings-close {
      background: none; border: none;
      color: var(--text-tertiary); font-size: 22px;
      cursor: pointer; padding: 0 4px; line-height: 1;
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
    }
    .settings-close:hover {
      color: var(--text-primary); background: var(--bg-hover);
    }

    .settings-body {
      padding: var(--space-xl);
      overflow-y: auto;
    }

    .settings-section h3 {
      margin: 0 0 var(--space-md) 0;
      font-size: 12px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.8px;
      color: var(--text-secondary); font-family: var(--font-sans);
    }
    .settings-hint {
      margin: 0 0 var(--space-md) 0;
      font-size: 12px; color: var(--text-tertiary);
      font-family: var(--font-sans);
    }
    .settings-group-label {
      font-size: 11px; font-weight: 500;
      color: var(--text-tertiary); font-family: var(--font-sans);
      margin: var(--space-md) 0 var(--space-sm) 0;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .settings-divider {
      height: 1px; background: var(--border-subtle);
      margin: var(--space-xl) 0;
    }

    .theme-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: var(--space-sm);
      margin-bottom: var(--space-sm);
    }

    .theme-card {
      display: flex; flex-direction: column; align-items: center;
      gap: 6px; padding: var(--space-sm);
      background: var(--bg-secondary);
      border: 2px solid transparent;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .theme-card:hover {
      border-color: var(--border-strong);
      background: var(--bg-tertiary);
    }
    .theme-card.active {
      border-color: var(--accent-primary);
      background: var(--accent-subtle);
    }

    .theme-swatch {
      width: 100%; height: 36px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
    }
    .term-swatch {
      display: flex; align-items: center; justify-content: center;
      position: relative;
    }
    .term-dots {
      display: flex; gap: 4px;
    }
    .term-dots i {
      display: block; width: 8px; height: 8px;
      border-radius: 50%;
    }
    .auto-label {
      font-size: 10px; font-weight: 600;
      color: var(--text-tertiary); letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .theme-card-label {
      font-size: 11px; font-weight: 500;
      color: var(--text-secondary); font-family: var(--font-sans);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 100%;
    }
    .theme-card.active .theme-card-label {
      color: var(--accent-primary);
    }
  `;
  document.head.appendChild(style);
}

module.exports = { init, show, hide, toggle };
