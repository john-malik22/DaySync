import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { clientCache } from '../services/clientCache';

/**
 * User-safe Auto-Save & Draft Recovery Hook
 * Keeps drafts local to the current authenticated userId to prevent data leakage.
 */
export function useFormDraft(formKey, currentValues, setValuesFn) {
  const { user } = useAuth();
  const userId = user?.id;
  const [draftStatus, setDraftStatus] = useState(null); // 'restored' | 'saved' | null
  const isRestoredRef = useRef(false);

  const fullKey = userId ? `draft_${formKey}` : null;

  // 1. Restore draft on initial mount
  useEffect(() => {
    if (!userId || !fullKey || isRestoredRef.current) return;

    try {
      const cached = clientCache.load(userId, fullKey);
      if (cached && cached.data && typeof cached.data === 'object') {
        const values = Object.values(cached.data);
        const hasContent = values.some(val =>
          typeof val === 'string' ? val.trim().length > 0 : Boolean(val)
        );

        if (hasContent) {
          setValuesFn(cached.data);
          setDraftStatus('restored');
          isRestoredRef.current = true;
          const timer = setTimeout(() => setDraftStatus(null), 3000);
          return () => clearTimeout(timer);
        }
      }
    } catch (e) {
      console.warn('Draft restoration failed:', e);
    }
  }, [userId, fullKey, setValuesFn]);

  // 2. Auto-save draft on input change (debounced 400ms)
  useEffect(() => {
    if (!userId || !fullKey) return;

    const values = Object.values(currentValues);
    const hasContent = values.some(val =>
      typeof val === 'string' ? val.trim().length > 0 : Boolean(val)
    );

    if (!hasContent) return;

    const timer = setTimeout(() => {
      clientCache.save(userId, fullKey, currentValues);
      setDraftStatus('saved');
      const hideTimer = setTimeout(() => setDraftStatus(null), 2000);
      return () => clearTimeout(hideTimer);
    }, 400);

    return () => clearTimeout(timer);
  }, [userId, fullKey, currentValues]);

  // 3. Clear draft on form submission
  const clearDraft = () => {
    if (!userId || !fullKey) return;
    try {
      clientCache.save(userId, fullKey, null);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`daysync_cache_${userId}_${fullKey}`);
      }
      setDraftStatus(null);
      isRestoredRef.current = false;
    } catch (e) {}
  };

  return { draftStatus, clearDraft };
}
