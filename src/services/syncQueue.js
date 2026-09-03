/**
 * User-safe local pending sync queue for DaySync offline persistence.
 * Keys are scoped to currently authenticated userId to prevent cross-user data leakage.
 */

function getQueueKey(userId) {
  if (!userId) return null;
  return `daysync_pending_sync_${userId}`;
}

export const syncQueue = {
  getPending: (userId) => {
    if (!userId) return [];
    try {
      const raw = localStorage.getItem(getQueueKey(userId));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  enqueue: (userId, action) => {
    if (!userId || !action) return [];
    try {
      const queue = syncQueue.getPending(userId);
      const item = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        ...action
      };
      const updated = [...queue, item];
      localStorage.setItem(getQueueKey(userId), JSON.stringify(updated));
      return updated;
    } catch (e) {
      return [];
    }
  },

  removeItems: (userId, idsToRemove) => {
    if (!userId || !idsToRemove || idsToRemove.length === 0) return [];
    try {
      const queue = syncQueue.getPending(userId);
      const updated = queue.filter(item => !idsToRemove.includes(item.id));
      localStorage.setItem(getQueueKey(userId), JSON.stringify(updated));
      return updated;
    } catch (e) {
      return [];
    }
  },

  clearQueue: (userId) => {
    if (!userId) return;
    try {
      localStorage.removeItem(getQueueKey(userId));
    } catch (e) {}
  }
};
