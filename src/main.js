import Phaser from 'phaser';
import './style.css';
import { World } from './world.js';
import { story } from './story.js';
import { recognize } from './recognizer.js';
import { freshGame, loadGame, saveGame, deleteGame } from './save.js';
import { Soundscape } from './audio.js';
import { joystickVector, keyboardVector } from './movement.js';

const ui = document.querySelector('#interface');
const sound = new Soundscape();
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 800, height: 540, backgroundColor: '#10151d', scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: true, powerPreference: 'high-performance' }, fps: { target: 60, forceSetTimeOut: false }, scene: World });
game.model = freshGame(); game.canMove = false;
const scene = () => game.scene.getScene('world');
let state = 'menu', duel = null, lastSavedX = 0, lastSavedDepth = 0, toastTimer;
const heldKeys = new Set();
function stopMovement() { heldKeys.clear(); const world = scene(); if (world) { world.direction = 0; world.depthDirection = 0; } const stick = document.querySelector('.stick'); if (stick) stick.style.transform = 'translate(0, -50%)'; }
const persist = () => { if (!saveGame(game.model)) toast('Kayıt yapılamadı. Cihaz depolamasını kontrol et.'); };
const refreshWorld = () => { if (scene()?.art) scene().redraw(); };
function toast(text) { let el = document.querySelector('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; ui.append(el); } el.textContent = text; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.remove(), 2600); }
function menu() {
  state = 'menu'; game.canMove = false; stopMovement();
  const saved = loadGame();
  ui.innerHTML = `<div class="menu-screen"><div class="menu-art"><div class="moon"></div><div class="tower"></div><div class="menu-fog"></div></div><div class="menu-content"><p class="eyebrow">MİRRA VADİSİ'NİN UNUTULAN HİKÂYESİ</p><h1>KÜL<br><em>DEFTERİ</em></h1><div class="ornament">✦ ───────── ✦</div><p class="intro">Bazı sırlar küle dönüşse de<br>rüzgâr onları unutmaz.</p><div class="menu-buttons">${saved ? '<button class="primary" data-do="continue">YOLCULUĞA DEVAM ET <span>→</span></button>' : ''}<button class="${saved ? 'secondary' : 'primary'}" data-do="new">${saved ? 'YENİ YOLCULUK' : 'YOLCULUĞA BAŞLA'} <span>→</span></button><button class="text-button" data-do="about">OYUN HAKKINDA</button></div><p class="menu-foot">BİR HİKÂYE AKSİYON RPG’Sİ <span>•</span> SÜRÜM 1.0</p></div></div>`;
  bind('continue', () => { sound.start(); game.model = loadGame() || freshGame(); if (game.model.chapter === 'son') return ending(); enterWorld(); });
  bind('new', () => { sound.start(); if (saved) return modal('Yeni bir yolculuk?', 'Önceki yolculuğun silinecek. Bu karar geri alınamaz.', [{ label: 'Vazgeç', action: menu }, { label: 'Yeni oyuna başla', action: () => { deleteGame(); game.model = freshGame(); persist(); prologueIntro(); } }]); game.model = freshGame(); persist(); prologueIntro(); });
  bind('about', () => modal('Kül Defteri', 'Mirra Vadisi ve Noctis Akademisi’nde geçen, kayıp ve hatıralar üzerine özgün bir hikâye. İnternet bağlantısı gerektirmez; ilerleme yalnızca bu cihazda saklanır.\n\nDokunarak ya da klavyedeki yön tuşlarıyla hareket et. Yakınındaki izlerle etkileşime geç.', [{ label: 'Geri dön', action: menu }]));
}
function bind(name, fn) { document.querySelector(`[data-do="${name}"]`)?.addEventListener('click', fn); }
function modal(title, text, buttons) {
  game.canMove = false; stopMovement();
  document.querySelector('.modal-wrap')?.remove();
  const wrap = document.createElement('div'); wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="dialogue"><p class="eyebrow">✦ &nbsp; KÜL DEFTERİ</p><h2></h2><p class="dialogue-text"></p><div class="dialogue-buttons"></div></div>`;
  wrap.querySelector('h2').textContent = title; wrap.querySelector('.dialogue-text').textContent = text;
  buttons.forEach(({ label, action }, i) => { const b = document.createElement('button'); b.className = i === buttons.length - 1 ? 'primary' : 'secondary'; b.textContent = label; b.onclick = () => { wrap.remove(); action(); }; wrap.querySelector('.dialogue-buttons').append(b); });
  ui.append(wrap);
}
function prologueIntro() { modal('Bir zamanlar, Mirra Vadisi’nde', 'Sorin Vael, yoksul bir kasabanın melez kanlı çocuğuydu. Başkalarının sustuğu yerde o, küllerin fısıltısını duyuyordu.\n\nO gün henüz bilmiyordu: Bir deftere yazdığı her büyü, bir gün dönüp kendi kalbini sınayacaktı.', [{ label: 'Hikâyeye gir', action: enterWorld }]); }
function enterWorld() {
  state = 'world'; stopMovement(); game.canMove = true; duel = null; refreshWorld(); renderHud();
}
function renderHud() {
  const m = game.model, chapter = story[m.chapter]; if (!chapter) return;
  ui.innerHTML = `<div class="hud"><div class="topbar"><div class="chapter"><span>${chapter.label} <i>✦</i> ${chapter.place}</span><strong>${chapter.title}</strong></div><div class="top-actions"><button data-do="sound" aria-label="Sesi aç veya kapat">${sound.enabled ? '♫' : '♪̸'}</button><button data-do="pause" aria-label="Menü">Ⅱ</button></div></div><div class="objective"><span>ŞİMDİKİ İZ</span><p>${chapter.tasks[m.step] || ''}</p><small class="objective-distance"></small></div><div class="bottom-controls"><div class="joystick" aria-label="Hareket alanı"><div class="stick"></div><span>HAREKET</span></div><div class="right-controls"><button class="interact" data-do="interact"><b>✦</b><span>İNCELE</span></button><button class="spell-button" data-do="spell"><b>⌁</b><span>RÜN</span></button></div></div><div class="keyboard-hint">YÖN TUŞLARI / W A S D · E: İNCELE · R: RÜN</div></div>`;
  bind('pause', () => modal('Yolculuk duraklatıldı', 'İlerlemen bu cihazda otomatik olarak saklanır.', [{ label: 'Ana menü', action: () => { persist(); menu(); } }, { label: 'Devam et', action: enterWorld }]));
  bind('sound', () => { const enabled = sound.toggle(); document.querySelector('[data-do="sound"]').textContent = enabled ? '♫' : '♪̸'; }); bind('interact', interact); bind('spell', () => runePanel(false));
  setupJoystick(); updateObjective();
}
function updateObjective() {
  if (state !== 'world') return;
  const obj = story[game.model.chapter]?.objects[game.model.step];
  const el = document.querySelector('.objective-distance');
  if (!obj || !el) return;
  const dx = obj.x - game.model.x;
  el.textContent = Math.abs(dx) <= 150 ? 'İZ YAKINDA · İNCELEYEBİLİRSİN' : (dx > 0 ? 'SAĞA İLERLE  →' : '←  SOLA İLERLE');
  document.querySelector('.interact')?.classList.toggle('near', Math.abs(dx) <= 150);
}
function setupJoystick() {
  const area = document.querySelector('.joystick'), stick = area.querySelector('.stick'); let id = null;
  const move = e => {
    if (e.pointerId !== id || !game.canMove) return;
    const rect = area.getBoundingClientRect(), radius = rect.width * .38;
    const vector = joystickVector(e.clientX - rect.left - rect.width / 2, e.clientY - rect.top - rect.height / 2, radius);
    scene().direction = vector.x; scene().depthDirection = vector.y;
    stick.style.transform = `translate(${vector.x * radius * .65}px, calc(-50% + ${vector.y * radius * .65}px))`;
  };
  area.addEventListener('pointerdown', e => { if (id !== null || !game.canMove) return; e.preventDefault(); id = e.pointerId; area.setPointerCapture(id); move(e); });
  area.addEventListener('pointermove', move);
  const end = e => { if (e.pointerId !== id) return; id = null; scene().direction = 0; scene().depthDirection = 0; stick.style.transform = 'translate(0, -50%)'; persist(); };
  area.addEventListener('pointerup', end); area.addEventListener('pointercancel', end); area.addEventListener('lostpointercapture', end);
}
function interact() {
  if (state !== 'world' || !game.canMove) return;
  const m = game.model, obj = story[m.chapter].objects[m.step];
  if (!obj || Math.abs(obj.x - m.x) > 150) return toast('İzi incelemek için biraz daha yaklaş.');
  if (obj.choices) return modal(obj.title, obj.text, obj.choices.map(c => ({ label: c.text, action: () => { m.choices.liora = c.value; modal('Söylenmeyenler', c.reply, [{ label: 'Devam et', action: advance }]); } })));
  modal(obj.title, obj.text, [{ label: obj.button, action: () => { if (m.chapter === 'bolum1' && m.step === 2) startDuel(); else advance(); } }]);
}
function advance() {
  const m = game.model;
  if (m.chapter === 'prolog' && m.step === 0) m.inventory.push('Yanık yaprak');
  if (m.chapter === 'bolum1' && m.step === 0) m.inventory.push('Ay çiçeği');
  m.step++;
  if (m.chapter === 'prolog' && m.step === 3) { m.chapter = 'bolum1'; m.step = 0; m.x = 160; m.depth = .55; persist(); refreshWorld(); return modal('Bölüm 01 · Taşın Hafızası', 'Yıllar geçti. Noctis Akademisi’nin koridorlarında Sorin’in adı fısıltıyla anılır oldu. Fakat bir defterden koparılan sayfa, sahibine karşı dönmek üzereydi.', [{ label: 'Koridora gir', action: enterWorld }]); }
  persist(); refreshWorld(); enterWorld();
}
function startDuel() {
  state = 'duel'; game.canMove = false; stopMovement(); duel = { player: 3, enemy: 3 };
  modal('AYNA DÜELLO', 'Öğrenci senin Kor Mührü’nü kullanıyor. Ateşin karşıtı sudur: V şeklindeki su rününü tek vuruşla çiz. Üç başarılı karşılık düelloyu bitirir; üç hata seni düşürür.', [{ label: 'Karşı koy', action: renderDuel }]);
}
function renderDuel() {
  state = 'duel';
  ui.innerHTML = `<div class="duel-hud"><div class="duel-title"><span>AYNA DÜELLO · KOR MÜHRÜ</span><h2>İcadın sana karşı.</h2><p>Ateşi söndürmek için su rününü çiz.</p></div><div class="health"><div><span>SORİN</span><b>${'●'.repeat(duel.player)}${'○'.repeat(3-duel.player)}</b></div><div><span>ÖĞRENCİ</span><b>${'●'.repeat(duel.enemy)}${'○'.repeat(3-duel.enemy)}</b></div></div><div class="duel-mark">◯ <span>→</span> V</div><button class="primary duel-cast" data-do="counter">SU RÜNÜNÜ ÇİZ &nbsp; →</button></div>`;
  bind('counter', () => runePanel(true));
}
function runePanel(inDuel) {
  game.canMove = false; stopMovement();
  const overlay = document.createElement('div'); overlay.className = 'rune-overlay';
  overlay.innerHTML = `<div class="rune-panel"><div class="rune-header"><div><p class="eyebrow">TEK VURUŞTA ÇİZ</p><h2>Rün çemberi</h2></div><button class="close" aria-label="Kapat">×</button></div><div class="rune-body"><div class="rune-guide"><p>Parmağını kaldırmadan bir şekil çiz.</p><div><b>◯</b><span>KOR<br><small>Çember</small></span></div><div><b>V</b><span>SU<br><small>Aşağı kırık çizgi</small></span></div><div><b>∧</b><span>SİPER<br><small>Yukarı kırık çizgi</small></span></div>${inDuel ? '<p class="rune-clue">KOR’UN KARŞITI: SU</p>' : ''}</div><div class="canvas-wrap"><canvas aria-label="Rün çizim alanı"></canvas><span>RÜNÜ BURAYA ÇİZ</span></div></div><p class="rune-status">Çizimini bitirdiğinde büyü çözümlenir.</p></div>`;
  ui.append(overlay);
  const canvas = overlay.querySelector('canvas'), ctx = canvas.getContext('2d');
  let points = [], drawing = false, pointerId = null;
  const resize = () => {
    const rect = canvas.getBoundingClientRect(), ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio)); canvas.height = Math.max(1, Math.round(rect.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#e9c68b'; ctx.lineWidth = 4; ctx.shadowBlur = 10; ctx.shadowColor = '#e6b773';
    drawing = false; points = [];
  };
  resize(); window.addEventListener('resize', resize);
  const close = () => { window.removeEventListener('resize', resize); overlay.remove(); };
  const getPoint = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX-r.left, y: e.clientY-r.top }; };
  canvas.onpointerdown = e => { if (drawing) return; e.preventDefault(); drawing = true; pointerId = e.pointerId; canvas.setPointerCapture(pointerId); points = [getPoint(e)]; ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight); };
  canvas.onpointermove = e => {
    if (!drawing || e.pointerId !== pointerId) return;
    // Her parça yalnızca bir kez çizilir; uzun dokunuşlarda kare hızı korunur.
    const events = e.getCoalescedEvents?.();
    for (const event of events?.length ? events : [e]) {
      const p = getPoint(event), previous = points[points.length - 1];
      if (Math.hypot(p.x - previous.x, p.y - previous.y) < .5) continue;
      points.push(p); ctx.beginPath(); ctx.moveTo(previous.x, previous.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
  };
  const finish = e => {
    if (!drawing || e.pointerId !== pointerId) return;
    drawing = false; points.push(getPoint(e)); const result = recognize(points);
    if (!result) { overlay.querySelector('.rune-status').textContent = 'Rün anlaşılmadı. Bir daha dene; şekli tek vuruşta çiz.'; return; }
    sound.tone(result.name === 'su' ? 440 : 280); close();
    if (inDuel) resolveDuel(result.name);
    else { enterWorld(); toast(({ kor: 'Kor Mührü: Karanlıkta küçük bir kıvılcım.', su: 'Su İzi: Serin bir yankı avuçlarında geziniyor.', siper: 'Siper: Kısa bir an için dünya susuyor.' })[result.name]); scene().cast(({kor: 0xe9a65e, su: 0x79c5dd, siper: 0xc0b5df})[result.name]); }
  };
  canvas.onpointerup = finish; canvas.onpointercancel = () => { drawing = false; points = []; };
  canvas.onlostpointercapture = () => { drawing = false; };
  overlay.querySelector('.close').onclick = () => { close(); if (inDuel) renderDuel(); else enterWorld(); };
}
function resolveDuel(name) {
  if (name === 'su') { duel.enemy--; scene().cast(0x79c5dd); scene().cameras.main.flash(350, 120, 190, 220); sound.tone(550); } else { duel.player--; scene().cameras.main.shake(180, .008); sound.tone(110); }
  if (duel.enemy === 0) { game.model.duelWins++; game.model.chapter = 'son'; game.model.step = 0; persist(); return modal('Ateşin sustuğu an', 'Su, çalınmış büyünün çevresine dolandı. Öğrenci dizlerinin üstüne çöktü. Sorin, zaferden çok bir kaybın ağırlığını duydu.\n\n“Bir büyüyü bilmek,” dedi usulca, “onu anlamak değildir.”', [{ label: 'Devam et', action: ending }]); }
  if (duel.player === 0) return modal('Kül yeniden savrulur', 'Kor Mührü savunmanı aştı. Bir hatıra kırıldı; fakat hikâye henüz bitmedi. Ateşin karşıtı olan suyu hatırla.', [{ label: 'Düelloyu yeniden dene', action: startDuel }, { label: 'Ana menü', action: menu }]);
  modal(name === 'su' ? 'Doğru karşılık' : 'Kor seni yaraladı', name === 'su' ? 'Su rünü alevi söndürdü. Öğrenci büyüyü yeniden hazırlıyor.' : 'Bu rün Kor Mührü’nün karşıtı değil. Ateşi söndürmek için V şeklindeki su rününü çiz.', [{ label: 'Düelloya dön', action: renderDuel }]);
}
function ending() { state = 'ending'; game.canMove = false; ui.innerHTML = `<div class="ending"><p class="eyebrow">BİRİNCİ BÖLÜMÜN SONU</p><h1>Kül, gerçeği<br><em>saklamaz.</em></h1><p>Sorin defteri kapattı. Sayfaların arasında Liora’nın adı, silinmemiş bir yara gibi duruyordu.</p><button class="primary" data-do="menu">ANA MENÜYE DÖN →</button></div>`; bind('menu', menu); }
const keyMap = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down' };
function syncKeyboard() { const vector = keyboardVector(new Set([...heldKeys].map(key => keyMap[key]))); scene().direction = vector.x; scene().depthDirection = vector.y; }
window.addEventListener('keydown', e => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (state !== 'world' || !game.canMove) return;
  if (keyMap[key]) { e.preventDefault(); heldKeys.add(key); syncKeyboard(); return; }
  if (e.repeat) return;
  if (key === 'e') interact(); if (key === 'r') runePanel(false);
});
window.addEventListener('keyup', e => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (keyMap[key]) { heldKeys.delete(key); if (state === 'world' && game.canMove) { syncKeyboard(); persist(); } }
});
window.addEventListener('blur', () => { stopMovement(); if (state === 'world') persist(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { stopMovement(); if (state === 'world') persist(); } });
setInterval(() => {
  if (state !== 'world') return;
  updateObjective();
  if (Math.abs(game.model.x-lastSavedX) > 20 || Math.abs(game.model.depth-lastSavedDepth) > .05) { lastSavedX = game.model.x; lastSavedDepth = game.model.depth; persist(); }
}, 500);
menu();
