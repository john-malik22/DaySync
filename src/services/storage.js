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
        console.log('[DaySync AuthStorage] getToken() retrieved token from Capacitor Preferences (SharedPreferences):', clean.substring(0, 15) + '...');
        return clean;
      }
    } catch (e) {
      console.warn('[DaySync AuthStorage] Preferences.get(luna_token) error:', e);
    }

    try {
      const local = localStorage.getItem('luna_token');
      if (local && local !== 'null' && local !== 'undefined' && local.trim()) {
        const clean = local.trim();
        try { await Preferences.set({ key: 'luna_token', value: clean }); } catch (e) {}
        console.log('[DaySync AuthStorage] getToken() retrieved token from localStorage fallback:', clean.substring(0, 15) + '...');
        return clean;
      }
    } catch (e) {}

    console.log('[DaySync AuthStorage] getToken() found no stored token.');
    return null;
  },

  async getUserProfile() {
    try {
      const { value } = await Preferences.get({ key: 'daysync_user_profile' });
      if (value && value !== 'null' && value !== 'undefined') {
        try { localStorage.setItem('daysync_user_profile', value); } catch (e) {}
        const parsed = JSON.parse(value);
        console.log('[DaySync AuthStorage] getUserProfile() retrieved profile from Capacitor Preferences:', parsed?.email || parsed?.name || parsed?.id);
        return parsed;
      }
    } catch (e) {
      console.warn('[DaySync AuthStorage] Preferences.get(daysync_user_profile) error:', e);
    }

    try {
      const local = localStorage.getItem('daysync_user_profile');
      if (local && local !== 'null' && local !== 'undefined') {
        const parsed = JSON.parse(local);
        try { await Preferences.set({ key: 'daysync_user_profile', value: local }); } catch (e) {}
        console.log('[DaySync AuthStorage] getUserProfile() retrieved profile from localStorage fallback:', parsed?.email || parsed?.name || parsed?.id);
        return parsed;
      }
    } catch (e) {}

    console.log('[DaySync AuthStorage] getUserProfile() found no stored user profile.');
    return null;
  },

  async setSession(token, user) {
    console.log('[DaySync AuthStorage] setSession() saving session for key luna_token and daysync_user_profile:', user?.email || user?.name || user?.id);
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
    console.log('[DaySync AuthStorage] updateUserProfile() updating daysync_user_profile:', user?.email || user?.name || user?.id);
    if (user) {
      const userStr = JSON.stringify(user);
      try { localStorage.setItem('daysync_user_profile', userStr); } catch (e) {}
      try { await Preferences.set({ key: 'daysync_user_profile', value: userStr }); } catch (e) {}
    }
  },

  async clearSession(reason = 'Explicit logout / session expired') {
    console.log('[DaySync AuthStorage] clearSession() called. Reason:', reason);
    try { localStorage.removeItem('luna_token'); } catch (e) {}
    try { localStorage.removeItem('daysync_user_profile'); } catch (e) {}
    try { await Preferences.remove({ key: 'luna_token' }); } catch (e) {}
    try { await Preferences.remove({ key: 'daysync_user_profile' }); } catch (e) {}
  }
};
