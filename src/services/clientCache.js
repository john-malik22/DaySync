/**
 * User-safe local cache for DaySync read data
 * Keys are scoped to currently authenticated userId to prevent cross-user data leakage.
 */

function getCacheKey(userId, key) {
  if (!userId) return null;
  return `daysync_cache_${userId}_${key}`;
}

const memoryStorage = new Map();

function getStorage() {
  if (typeof localStorage !== 'undefined') return localStorage;
  return {
    getItem: (key) => memoryStorage.get(key) || null,
    setItem: (key, val) => memoryStorage.set(key, val),
    removeItem: (key) => memoryStorage.delete(key),
    get keys() { return Array.from(memoryStorage.keys()); }
  };
}

export const clientCache = {
  save: (userId, key, data) => {
    if (!userId || !data) return;
    try {
      const payload = {
        timestamp: Date.now(),
        data
      };
      const storage = getStorage();
      storage.setItem(getCacheKey(userId, key), JSON.stringify(payload));
    } catch (e) {
      console.warn('Cache write failed:', e);
    }
  },

  load: (userId, key) => {
    if (!userId) return null;
    try {
      const storage = getStorage();
      const raw = storage.getItem(getCacheKey(userId, key));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  clearUserCache: (userId) => {
    if (!userId) return;
    try {
      const storage = getStorage();
      const keys = typeof localStorage !== 'undefined' ? Object.keys(localStorage) : Array.from(memoryStorage.keys());
      keys.forEach(k => {
        if (k.startsWith(`daysync_cache_${userId}_`)) {
          storage.removeItem(k);
        }
      });
    } catch (e) {}
  }
};

export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'recently';
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 45) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  return `${Math.floor(diffHr / 24)} d ago`;
}
