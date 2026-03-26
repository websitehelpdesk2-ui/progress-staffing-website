const THEME_STORAGE_KEY = 'psa_portal_theme';

function safeGetTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (_error) {
    return null;
  }
}

function safeSetTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (_error) {
    // Ignore storage write failures (private mode or blocked storage)
  }
}

function getStoredTheme() {
  return safeGetTheme() === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme) {
  const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
  document.body.classList.toggle('theme-dark', normalizedTheme === 'dark');
  document.body.dataset.theme = normalizedTheme;
  safeSetTheme(normalizedTheme);

  const toggle = document.getElementById('portalThemeToggleBtn') || document.getElementById('globalThemeToggleBtn');
  if (toggle) {
    const darkEnabled = normalizedTheme === 'dark';
    toggle.textContent = darkEnabled ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    toggle.classList.toggle('button--secondary', darkEnabled);
  }
}

function ensureThemeToggleButton() {
  let toggle = document.getElementById('portalThemeToggleBtn') || document.getElementById('globalThemeToggleBtn');
  if (toggle) return toggle;

  const headerInner = document.querySelector('.header-inner');
  if (!headerInner) return null;

  const wrapper = document.createElement('div');
  wrapper.className = 'header-theme-toggle';

  toggle = document.createElement('button');
  toggle.id = 'globalThemeToggleBtn';
  toggle.type = 'button';
  toggle.className = 'button button--ghost button--sm';
  toggle.textContent = 'Switch to Dark Mode';
  wrapper.appendChild(toggle);

  headerInner.appendChild(wrapper);
  return toggle;
}

function bindThemeToggle() {
  if (!document.body) return;

  const toggle = ensureThemeToggleButton();
  applyTheme(getStoredTheme());

  if (!toggle || toggle.dataset.bound === '1') return;

  toggle.dataset.bound = '1';
  toggle.addEventListener('click', () => {
    const nextTheme = getStoredTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindThemeToggle);
} else {
  bindThemeToggle();
}
