export const WORLD_SIZE = 1800;
export const SKILLS = {
  saldiri: { name: 'Asa Darbesi', cooldown: .65, mana: 0, range: 220, damage: 17 },
  kor: { name: 'Kor Küresi', cooldown: 4, mana: 22, range: 340, damage: 38, radius: 90 },
  ayaz: { name: 'Ayaz Halkası', cooldown: 7, mana: 28, range: 210, damage: 24 },
  siper: { name: 'Kül Sığınağı', cooldown: 12, mana: 30, heal: 35 },
};
export const freshProgress = () => ({ version: 1, level: 1, xp: 0, gold: 0, kills: 0, wave: 1, bestWave: 1 });
export const xpNeeded = level => 45 + (level - 1) * 30;
export const maxHealth = level => 110 + (level - 1) * 12;
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function screenToWorldVector(x, y) {
  // İzometrik izdüşümün tersini al; hareket parmağın yönüne uyumlu kalsın.
  const wx = x / .85 + y / .425, wy = -x / .85 + y / .425;
  const len = Math.hypot(wx, wy); const magnitude = Math.min(1, Math.hypot(x, y));
  return len ? { x: wx / len * magnitude, y: wy / len * magnitude } : { x: 0, y: 0 };
}
export function nearestEnemy(player, enemies, range = Infinity, selected = null) {
  if (selected && selected.hp > 0 && enemies.includes(selected) && distance(player, selected) <= range) return selected;
  let best = null, bestDistance = range;
  for (const enemy of enemies) { const d = distance(player, enemy); if (enemy.hp > 0 && d <= bestDistance) { best = enemy; bestDistance = d; } }
  return best;
}
export function useSkill(state, name, enemies, selected) {
  const skill = SKILLS[name];
  if (!skill || state.hp <= 0) return { ok: false, reason: 'Kullanılamıyor' };
  if (state.cooldowns[name] > 0) return { ok: false, reason: 'Büyü henüz hazır değil' };
  if (state.mana < skill.mana) return { ok: false, reason: 'Yeterli öz yok' };
  let target = null, affected = [];
  if (name === 'saldiri' || name === 'kor') {
    target = nearestEnemy(state, enemies, skill.range, selected);
    if (!target) return { ok: false, reason: 'Menzilde düşman yok' };
    affected = name === 'kor' ? enemies.filter(e => e.hp > 0 && distance(target, e) <= skill.radius) : [target];
  } else if (name === 'ayaz') {
    affected = enemies.filter(e => e.hp > 0 && distance(state, e) <= skill.range);
    if (!affected.length) return { ok: false, reason: 'Yakında düşman yok' };
  }
  state.mana -= skill.mana; state.cooldowns[name] = skill.cooldown;
  if (name === 'siper') { state.hp = Math.min(maxHealth(state.level), state.hp + skill.heal); state.shield = 5; }
  for (const enemy of affected) {
    enemy.hp = Math.max(0, enemy.hp - (skill.damage + (state.level - 1) * 3));
    if (name === 'ayaz') enemy.slow = 3;
  }
  return { ok: true, target, affected };
}
export function tickResources(state, dt) {
  for (const skill of Object.keys(SKILLS)) state.cooldowns[skill] = Math.max(0, state.cooldowns[skill] - dt);
  state.mana = Math.min(100, state.mana + dt * 4);
  state.shield = Math.max(0, state.shield - dt);
}
export function rewardKill(progress, isBoss = false) {
  const gold = isBoss ? 30 : 6, xp = isBoss ? 50 : 15;
  progress.gold += gold; progress.xp += xp; progress.kills++;
  let levelled = false;
  while (progress.xp >= xpNeeded(progress.level)) { progress.xp -= xpNeeded(progress.level); progress.level++; levelled = true; }
  return { gold, xp, levelled };
}
