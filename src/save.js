const KEY = 'kul-defteri-kayit-v1';
export const freshGame = () => ({ version: 1, chapter: 'prolog', step: 0, x: 160, depth: .55, choices: {}, inventory: [], duelWins: 0 });
export function loadGame(storage = localStorage) {
  try {
    const data = JSON.parse(storage.getItem(KEY));
    if (!data || data.version !== 1 || !['prolog', 'bolum1', 'son'].includes(data.chapter) || !Number.isInteger(data.step) || data.step < 0 || data.step > (data.chapter === 'son' ? 0 : 2) || !Number.isFinite(data.x) || data.x < 0 || data.x > 1800 || !Array.isArray(data.inventory) || !data.inventory.every(item => typeof item === 'string') || !data.choices || typeof data.choices !== 'object' || Array.isArray(data.choices)) return null;
    // Önceki sürümün derinlik alanı bulunmayan kayıtları korunur.
    const depth = data.depth === undefined ? .55 : data.depth;
    if (!Number.isFinite(depth) || depth < 0 || depth > 1 || !Number.isInteger(data.duelWins ?? 0) || (data.duelWins ?? 0) < 0) return null;
    return { ...freshGame(), ...data, depth };
  } catch { return null; }
}
export function saveGame(data, storage = localStorage) { try { storage.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; } }
export function deleteGame(storage = localStorage) { try { storage.removeItem(KEY); return true; } catch { return false; } }
