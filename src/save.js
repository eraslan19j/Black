import { freshProgress, xpNeeded } from './combat.js';
const KEY = 'kul-defteri-arena-v1';
export function loadGame(storage = localStorage) {
  try {
    const data = JSON.parse(storage.getItem(KEY));
    if (!data || data.version !== 1) return null;
    for (const field of ['level', 'xp', 'gold', 'kills', 'wave', 'bestWave']) if (!Number.isInteger(data[field]) || data[field] < (['level', 'wave', 'bestWave'].includes(field) ? 1 : 0) || data[field] > 1000000) return null;
    if (data.level > 1000 || data.xp >= xpNeeded(data.level) || data.bestWave < data.wave) return null;
    return { ...freshProgress(), ...data };
  } catch { return null; }
}
export function saveGame(data, storage = localStorage) { try { storage.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; } }
export function deleteGame(storage = localStorage) { try { storage.removeItem(KEY); return true; } catch { return false; } }
