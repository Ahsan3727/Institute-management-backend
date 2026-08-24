export const STORAGE_KEY = 'sloAppData_v2';
export const SESSION_KEY = 'sloAppSession_v1';
export const THEME_KEY = 'sloAppTheme_v1';

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage;

export function readJSON(key) {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function writeJSON(key, value) {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

export function removeKey(key) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch (e) {
    /* noop */
  }
}
