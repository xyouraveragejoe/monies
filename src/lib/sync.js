import { syncKey, replaceKey, friendlyMessage } from './db.js';

/**
 * Saves changes to Supabase one at a time per section, in order, and reports honestly:
 *   { state: 'saving' } | { state: 'saved' } | { state: 'error', message }
 * If a save fails, that section is remembered as "dirty" and the next successful save
 * (or the Retry button) re-sends the whole current section so nothing is lost.
 */
export function createSync(sb, onStatus) {
  const chains = {};
  const dirty = new Set();
  let inflight = 0;
  let lastError = null;

  const report = () => onStatus(
    lastError ? { state: 'error', message: lastError } : inflight > 0 ? { state: 'saving' } : { state: 'saved' }
  );

  return {
    enqueue(key, prev, next) {
      inflight++;
      report();
      chains[key] = (chains[key] || Promise.resolve()).then(async () => {
        try {
          if (dirty.has(key)) await replaceKey(sb, key, next);
          else await syncKey(sb, key, prev, next);
          dirty.delete(key);
          if (!dirty.size) lastError = null;
        } catch (e) {
          dirty.add(key);
          lastError = friendlyMessage(e);
        } finally {
          inflight--;
          report();
        }
      });
      return chains[key];
    },

    async retry(getState) {
      inflight++;
      report();
      for (const key of [...dirty]) {
        try {
          await replaceKey(sb, key, getState()[key]);
          dirty.delete(key);
        } catch (e) {
          lastError = friendlyMessage(e);
        }
      }
      if (!dirty.size) lastError = null;
      inflight--;
      report();
    },

    pending: () => inflight > 0 || dirty.size > 0,
  };
}
