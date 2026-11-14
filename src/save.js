const KEY = 'kul-defteri-kayit-v1';
export const freshGame = () => ({ version: 1, chapter: 'prolog', step: 0, x: 160, choices: {}, inventory: [], duelWins: 0 });
export function loadGame(storage = localStorage) {
  try {
    const data = JSON.parse(storage.getItem(KEY));
    if (!data || data.version !== 1 || !['prolog', 'bolum1', 'son'].includes(data.chapter) || !Number.isInteger(data.step) || data.step < 0 || data.step > 3 || !Number.isFinite(data.x) || data.x < 0 || data.x > 2000 || !Array.isArray(data.inventory) || !data.choices || typeof data.choices !== 'object') return null;
    return { ...freshGame(), ...data };
  } catch { return null; }
}
export function saveGame(data, storage = localStorage) { try { storage.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; } }
export function deleteGame(storage = localStorage) { try { storage.removeItem(KEY); } catch { /* Kullanıcıya yeni oyun yine sunulur. */ } }
