/**
 * Theme Manager Module
 * Handles app theme switching, terminal theme switching, and persistence
 */

const STORAGE_KEY = 'frames-theme';
const TERMINAL_STORAGE_KEY = 'frames-terminal-theme';

// ── App Themes ──────────────────────────────────────────────
const APP_THEMES = [
  { id: 'dark',            label: 'Dark',              group: 'dark',  preview: ['#151516', '#0f0f10'] },
  { id: 'one-dark',        label: 'One Dark Pro',      group: 'dark',  preview: ['#282c34', '#21252b'] },
  { id: 'dracula',         label: 'Dracula',           group: 'dark',  preview: ['#282a36', '#1e1f29'] },
  { id: 'nord',            label: 'Nord',              group: 'dark',  preview: ['#2e3440', '#242933'] },
  { id: 'tokyo-night',     label: 'Tokyo Night',       group: 'dark',  preview: ['#1a1b26', '#16161e'] },
  { id: 'monokai',         label: 'Monokai Pro',       group: 'dark',  preview: ['#2d2a2e', '#221f22'] },
  { id: 'github-dark',     label: 'GitHub Dark',       group: 'dark',  preview: ['#0d1117', '#161b22'] },
  { id: 'catppuccin-mocha',label: 'Catppuccin Mocha',  group: 'dark',  preview: ['#1e1e2e', '#181825'] },
  { id: 'solarized-dark',  label: 'Solarized Dark',    group: 'dark',  preview: ['#002b36', '#073642'] },
  { id: 'dark-bright',     label: 'Dark Bright',       group: 'dark',  preview: ['#1e1f35', '#1a1b2e'] },
  { id: 'light',           label: 'Light',             group: 'light', preview: ['#f5f4f2', '#eceae7'] },
  { id: 'github-light',    label: 'GitHub Light',      group: 'light', preview: ['#ffffff', '#f6f8fa'] },
  { id: 'solarized-light', label: 'Solarized Light',   group: 'light', preview: ['#fdf6e3', '#eee8d5'] },
  { id: 'catppuccin-latte',label: 'Catppuccin Latte',  group: 'light', preview: ['#eff1f5', '#e6e9ef'] },
];

// ── Terminal Themes ─────────────────────────────────────────
// "auto" means follow the app theme's default terminal colors
const TERMINAL_THEMES = [
  { id: 'auto',              label: 'Match App Theme' },
  { id: 'vs-dark',           label: 'VS Code Dark' },
  { id: 'one-dark',          label: 'One Dark' },
  { id: 'dracula',           label: 'Dracula' },
  { id: 'nord',              label: 'Nord' },
  { id: 'tokyo-night',       label: 'Tokyo Night' },
  { id: 'monokai',           label: 'Monokai' },
  { id: 'github-dark',       label: 'GitHub Dark' },
  { id: 'catppuccin-mocha',  label: 'Catppuccin Mocha' },
  { id: 'solarized-dark',    label: 'Solarized Dark' },
  { id: 'vs-light',          label: 'VS Code Light' },
  { id: 'github-light',      label: 'GitHub Light' },
  { id: 'solarized-light',   label: 'Solarized Light' },
  { id: 'catppuccin-latte',  label: 'Catppuccin Latte' },
];

// ── xterm color definitions ─────────────────────────────────
const XTERM_DEFS = {
  'vs-dark': {
    background: '#1e1e1e', foreground: '#d4d4d4', cursor: '#ffffff', cursorAccent: '#1e1e1e',
    selectionBackground: 'rgba(255,255,255,0.18)',
    black: '#000000', red: '#cd3131', green: '#0dbc79', yellow: '#e5e510',
    blue: '#2472c8', magenta: '#bc3fbc', cyan: '#11a8cd', white: '#e5e5e5',
    brightBlack: '#666666', brightRed: '#f14c4c', brightGreen: '#23d18b', brightYellow: '#f5f543',
    brightBlue: '#3b8eea', brightMagenta: '#d670d6', brightCyan: '#29b8db', brightWhite: '#e5e5e5'
  },
  'one-dark': {
    background: '#282c34', foreground: '#abb2bf', cursor: '#528bff', cursorAccent: '#282c34',
    selectionBackground: 'rgba(82,139,255,0.25)',
    black: '#282c34', red: '#e06c75', green: '#98c379', yellow: '#e5c07b',
    blue: '#61afef', magenta: '#c678dd', cyan: '#56b6c2', white: '#abb2bf',
    brightBlack: '#5c6370', brightRed: '#e06c75', brightGreen: '#98c379', brightYellow: '#e5c07b',
    brightBlue: '#61afef', brightMagenta: '#c678dd', brightCyan: '#56b6c2', brightWhite: '#ffffff'
  },
  'dracula': {
    background: '#282a36', foreground: '#f8f8f2', cursor: '#f8f8f2', cursorAccent: '#282a36',
    selectionBackground: 'rgba(68,71,90,0.6)',
    black: '#21222c', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c',
    blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd', white: '#f8f8f2',
    brightBlack: '#6272a4', brightRed: '#ff6e6e', brightGreen: '#69ff94', brightYellow: '#ffffa5',
    brightBlue: '#d6acff', brightMagenta: '#ff92df', brightCyan: '#a4ffff', brightWhite: '#ffffff'
  },
  'nord': {
    background: '#2e3440', foreground: '#d8dee9', cursor: '#d8dee9', cursorAccent: '#2e3440',
    selectionBackground: 'rgba(136,192,208,0.2)',
    black: '#3b4252', red: '#bf616a', green: '#a3be8c', yellow: '#ebcb8b',
    blue: '#81a1c1', magenta: '#b48ead', cyan: '#88c0d0', white: '#e5e9f0',
    brightBlack: '#4c566a', brightRed: '#bf616a', brightGreen: '#a3be8c', brightYellow: '#ebcb8b',
    brightBlue: '#81a1c1', brightMagenta: '#b48ead', brightCyan: '#8fbcbb', brightWhite: '#eceff4'
  },
  'tokyo-night': {
    background: '#1a1b26', foreground: '#a9b1d6', cursor: '#c0caf5', cursorAccent: '#1a1b26',
    selectionBackground: 'rgba(42,47,76,0.7)',
    black: '#15161e', red: '#f7768e', green: '#9ece6a', yellow: '#e0af68',
    blue: '#7aa2f7', magenta: '#bb9af7', cyan: '#7dcfff', white: '#a9b1d6',
    brightBlack: '#414868', brightRed: '#f7768e', brightGreen: '#9ece6a', brightYellow: '#e0af68',
    brightBlue: '#7aa2f7', brightMagenta: '#bb9af7', brightCyan: '#7dcfff', brightWhite: '#c0caf5'
  },
  'monokai': {
    background: '#2d2a2e', foreground: '#fcfcfa', cursor: '#fcfcfa', cursorAccent: '#2d2a2e',
    selectionBackground: 'rgba(117,113,94,0.4)',
    black: '#2d2a2e', red: '#ff6188', green: '#a9dc76', yellow: '#ffd866',
    blue: '#78dce8', magenta: '#ab9df2', cyan: '#78dce8', white: '#fcfcfa',
    brightBlack: '#727072', brightRed: '#ff6188', brightGreen: '#a9dc76', brightYellow: '#ffd866',
    brightBlue: '#78dce8', brightMagenta: '#ab9df2', brightCyan: '#78dce8', brightWhite: '#fcfcfa'
  },
  'github-dark': {
    background: '#0d1117', foreground: '#e6edf3', cursor: '#e6edf3', cursorAccent: '#0d1117',
    selectionBackground: 'rgba(56,139,253,0.25)',
    black: '#0d1117', red: '#ff7b72', green: '#7ee787', yellow: '#ffa657',
    blue: '#79c0ff', magenta: '#d2a8ff', cyan: '#a5d6ff', white: '#e6edf3',
    brightBlack: '#484f58', brightRed: '#ffa198', brightGreen: '#aff5b4', brightYellow: '#ffdf5d',
    brightBlue: '#a5d6ff', brightMagenta: '#e2c5ff', brightCyan: '#b6e3ff', brightWhite: '#ffffff'
  },
  'catppuccin-mocha': {
    background: '#1e1e2e', foreground: '#cdd6f4', cursor: '#f5e0dc', cursorAccent: '#1e1e2e',
    selectionBackground: 'rgba(88,91,112,0.4)',
    black: '#45475a', red: '#f38ba8', green: '#a6e3a1', yellow: '#f9e2af',
    blue: '#89b4fa', magenta: '#f5c2e7', cyan: '#94e2d5', white: '#bac2de',
    brightBlack: '#585b70', brightRed: '#f38ba8', brightGreen: '#a6e3a1', brightYellow: '#f9e2af',
    brightBlue: '#89b4fa', brightMagenta: '#f5c2e7', brightCyan: '#94e2d5', brightWhite: '#a6adc8'
  },
  'solarized-dark': {
    background: '#002b36', foreground: '#839496', cursor: '#839496', cursorAccent: '#002b36',
    selectionBackground: 'rgba(7,54,66,0.8)',
    black: '#073642', red: '#dc322f', green: '#859900', yellow: '#b58900',
    blue: '#268bd2', magenta: '#d33682', cyan: '#2aa198', white: '#eee8d5',
    brightBlack: '#586e75', brightRed: '#cb4b16', brightGreen: '#586e75', brightYellow: '#657b83',
    brightBlue: '#839496', brightMagenta: '#6c71c4', brightCyan: '#93a1a1', brightWhite: '#fdf6e3'
  },
  'vs-light': {
    background: '#ffffff', foreground: '#383a42', cursor: '#383a42', cursorAccent: '#ffffff',
    selectionBackground: 'rgba(0,0,0,0.08)',
    black: '#383a42', red: '#e45649', green: '#50a14f', yellow: '#c18401',
    blue: '#4078f2', magenta: '#a626a4', cyan: '#0184bc', white: '#a0a1a7',
    brightBlack: '#4f525e', brightRed: '#e06c75', brightGreen: '#98c379', brightYellow: '#e5c07b',
    brightBlue: '#61afef', brightMagenta: '#c678dd', brightCyan: '#56b6c2', brightWhite: '#ffffff'
  },
  'github-light': {
    background: '#ffffff', foreground: '#1f2328', cursor: '#1f2328', cursorAccent: '#ffffff',
    selectionBackground: 'rgba(31,35,40,0.08)',
    black: '#24292f', red: '#cf222e', green: '#1a7f37', yellow: '#9a6700',
    blue: '#0969da', magenta: '#8250df', cyan: '#0550ae', white: '#6e7781',
    brightBlack: '#57606a', brightRed: '#a40e26', brightGreen: '#2da44e', brightYellow: '#bf8700',
    brightBlue: '#218bff', brightMagenta: '#a475f9', brightCyan: '#0969da', brightWhite: '#ffffff'
  },
  'solarized-light': {
    background: '#fdf6e3', foreground: '#657b83', cursor: '#657b83', cursorAccent: '#fdf6e3',
    selectionBackground: 'rgba(238,232,213,0.8)',
    black: '#073642', red: '#dc322f', green: '#859900', yellow: '#b58900',
    blue: '#268bd2', magenta: '#d33682', cyan: '#2aa198', white: '#eee8d5',
    brightBlack: '#586e75', brightRed: '#cb4b16', brightGreen: '#586e75', brightYellow: '#657b83',
    brightBlue: '#839496', brightMagenta: '#6c71c4', brightCyan: '#93a1a1', brightWhite: '#fdf6e3'
  },
  'catppuccin-latte': {
    background: '#eff1f5', foreground: '#4c4f69', cursor: '#dc8a78', cursorAccent: '#eff1f5',
    selectionBackground: 'rgba(172,176,190,0.35)',
    black: '#5c5f77', red: '#d20f39', green: '#40a02b', yellow: '#df8e1d',
    blue: '#1e66f5', magenta: '#ea76cb', cyan: '#179299', white: '#acb0be',
    brightBlack: '#6c6f85', brightRed: '#d20f39', brightGreen: '#40a02b', brightYellow: '#df8e1d',
    brightBlue: '#1e66f5', brightMagenta: '#ea76cb', brightCyan: '#179299', brightWhite: '#bcc0cc'
  },
};

// Map app theme → default terminal theme when terminal is "auto"
const APP_TO_TERMINAL_DEFAULT = {
  'dark':             'vs-dark',
  'one-dark':         'one-dark',
  'dracula':          'dracula',
  'nord':             'nord',
  'tokyo-night':      'tokyo-night',
  'monokai':          'monokai',
  'github-dark':      'github-dark',
  'catppuccin-mocha': 'catppuccin-mocha',
  'solarized-dark':   'solarized-dark',
  'dark-bright':      'tokyo-night',
  'light':            'vs-light',
  'github-light':     'github-light',
  'solarized-light':  'solarized-light',
  'catppuccin-latte': 'catppuccin-latte',
};

let currentTheme = 'dark';
let currentTerminalTheme = 'auto';
let onChangeCallbacks = [];
let onTerminalChangeCallbacks = [];

/**
 * Initialize theme manager - apply saved themes
 */
function init() {
  const savedApp = localStorage.getItem(STORAGE_KEY);
  if (savedApp && APP_THEMES.find(t => t.id === savedApp)) {
    currentTheme = savedApp;
  }
  const savedTerm = localStorage.getItem(TERMINAL_STORAGE_KEY);
  if (savedTerm && (savedTerm === 'auto' || XTERM_DEFS[savedTerm])) {
    currentTerminalTheme = savedTerm;
  }
  applyTheme(currentTheme);
}

/**
 * Apply an app theme
 */
function applyTheme(theme) {
  currentTheme = theme;
  if (theme === 'dark') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  localStorage.setItem(STORAGE_KEY, theme);
  onChangeCallbacks.forEach(cb => cb(theme));
  // Also notify terminal listeners since "auto" depends on app theme
  if (currentTerminalTheme === 'auto') {
    onTerminalChangeCallbacks.forEach(cb => cb(getXtermTheme()));
  }
}

/**
 * Apply a terminal theme
 */
function applyTerminalTheme(themeId) {
  currentTerminalTheme = themeId;
  localStorage.setItem(TERMINAL_STORAGE_KEY, themeId);
  onTerminalChangeCallbacks.forEach(cb => cb(getXtermTheme()));
}

/**
 * Get current app theme id
 */
function getTheme() {
  return currentTheme;
}

/**
 * Get current terminal theme id
 */
function getTerminalTheme() {
  return currentTerminalTheme;
}

/**
 * Get the resolved xterm theme object
 */
function getXtermTheme() {
  if (currentTerminalTheme === 'auto') {
    const mapped = APP_TO_TERMINAL_DEFAULT[currentTheme] || 'vs-dark';
    return XTERM_DEFS[mapped];
  }
  return XTERM_DEFS[currentTerminalTheme] || XTERM_DEFS['vs-dark'];
}

/**
 * Register callback for app theme changes
 */
function onChange(cb) {
  onChangeCallbacks.push(cb);
}

/**
 * Register callback for terminal theme changes (includes auto changes)
 */
function onTerminalChange(cb) {
  onTerminalChangeCallbacks.push(cb);
}

module.exports = {
  init,
  applyTheme,
  applyTerminalTheme,
  getTheme,
  getTerminalTheme,
  getXtermTheme,
  onChange,
  onTerminalChange,
  APP_THEMES,
  TERMINAL_THEMES,
  XTERM_DEFS,
};
