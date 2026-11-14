import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshGame, saveGame, loadGame, deleteGame } from '../src/save.js';
const memory = () => { const map = new Map(); return { getItem: k => map.get(k) ?? null, setItem: (k,v) => map.set(k,v), removeItem: k => map.delete(k) }; };
test('kayıt saklanır, okunur ve silinir', () => { const s = memory(), game = freshGame(); game.chapter='bolum1'; game.step=2; game.choices.liora='yol'; assert.equal(saveGame(game,s),true); assert.deepEqual(loadGame(s),game); deleteGame(s); assert.equal(loadGame(s),null); });
test('bozuk veya uyumsuz kayıtlar reddedilir', () => { const s = memory(); s.setItem('kul-defteri-kayit-v1', '{'); assert.equal(loadGame(s),null); s.setItem('kul-defteri-kayit-v1', JSON.stringify({...freshGame(), chapter:'yanlış'})); assert.equal(loadGame(s),null); });
test('depolama kapalıysa hata fırlatılmaz', () => { assert.equal(saveGame(freshGame(), {setItem(){throw Error('dolu')}}),false); });
