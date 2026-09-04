import { Preferences } from '@capacitor/preferences';

/**
 * Persistent Authentication & User Storage
 * Uses native Android SharedPreferences via Capacitor Preferences plugin
 * with synchronous localStorage sync as fall-back for web.
 */
export const authStorage = {
  async getToken() {
    try {
      const { value } = await Preferences.get({ key: 'luna_token' });
      if (value && value !== 'null' && value !== 'undefined' && value.trim()) {
        const clean = value.trim();
        try { localStorage.setItem('luna_token', clean); } catch (e) {}
        return clean;
      }
    } catch (e) {}

    try {
      const local = localStorage.getItem('luna_token');
      if (local && local !== 'null' && local !== 'undefined' && local.trim()) {
        const clean = local.trim();
        try { await Preferences.set({ key: 'luna_token', value: clean }); } catch (e) {}
        return clean;
      }
    } catch (e) {}

    return null;
  },

  async getUserProfile() {
    try {
      const { value } = await Preferences.get({ key: 'daysync_user_profile' });
      if (value && value !== 'null' && value !== 'undefined') {
        try { localStorage.setItem('daysync_user_profile', value); } catch (e) {}
        return JSON.parse(value);
      }
    } catch (e) {}

    try {
      const local = localStorage.getItem('daysync_user_profile');
      if (local && local !== 'null' && local !== 'undefined') {
        const parsed = JSON.parse(local);
        try { await Preferences.set({ key: 'daysync_user_profile', value: local }); } catch (e) {}
        return parsed;
      }
    } catch (e) {}

    return null;
  },

  async setSession(token, user) {
    if (token) {
      const cleanToken = String(token).trim();
      try { localStorage.setItem('luna_token', cleanToken); } catch (e) {}
      try { await Preferences.set({ key: 'luna_token', value: cleanToken }); } catch (e) {}
    }
    if (user) {
      const userStr = JSON.stringify(user);
      try { localStorage.setItem('daysync_user_profile', userStr); } catch (e) {}
      try { await Preferences.set({ key: 'daysync_user_profile', value: userStr }); } catch (e) {}
    }
  },

  async updateUserProfile(user) {
    if (user) {
      const userStr = JSON.stringify(user);
      try { localStorage.setItem('daysync_user_profile', userStr); } catch (e) {}
      try { await Preferences.set({ key: 'daysync_user_profile', value: userStr }); } catch (e) {}
    }
  },

  async clearSession() {
    try { localStorage.removeItem('luna_token'); } catch (e) {}
    try { localStorage.removeItem('daysync_user_profile'); } catch (e) {}
    try { await Preferences.remove({ key: 'luna_token' }); } catch (e) {}
    try { await Preferences.remove({ key: 'daysync_user_profile' }); } catch (e) {}
  }
};
