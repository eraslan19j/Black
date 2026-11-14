import Phaser from 'phaser';
import './style.css';
import { World } from './world.js';
import { story } from './story.js';
import { recognize } from './recognizer.js';
import { freshGame, loadGame, saveGame, deleteGame } from './save.js';
import { Soundscape } from './audio.js';

const ui = document.querySelector('#interface');
const sound = new Soundscape();
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 800, height: 540, backgroundColor: '#10151d', scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: true, powerPreference: 'high-performance' }, fps: { target: 60, forceSetTimeOut: false }, scene: World });
game.model = freshGame(); game.canMove = false;
const scene = () => game.scene.getScene('world');
let state = 'menu', duel = null, lastSavedX = 0, toastTimer;
const persist = () => { if (!saveGame(game.model)) toast('Kayıt yapılamadı. Cihaz depolamasını kontrol et.'); };
const refreshWorld = () => { if (scene().art) scene().redraw(); };
function toast(text) { let el = document.querySelector('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; ui.append(el); } el.textContent = text; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.remove(), 2600); }
function menu() {
  state = 'menu'; game.canMove = false; if (scene()) scene().direction = 0;
  const saved = loadGame();
  ui.innerHTML = `<div class="menu-screen"><div class="menu-art"><div class="moon"></div><div class="tower"></div><div class="menu-fog"></div></div><div class="menu-content"><p class="eyebrow">MİRRA VADİSİ'NİN UNUTULAN HİKÂYESİ</p><h1>KÜL<br><em>DEFTERİ</em></h1><div class="ornament">✦ ───────── ✦</div><p class="intro">Bazı sırlar küle dönüşse de<br>rüzgâr onları unutmaz.</p><div class="menu-buttons">${saved ? '<button class="primary" data-do="continue">YOLCULUĞA DEVAM ET <span>→</span></button>' : ''}<button class="${saved ? 'secondary' : 'primary'}" data-do="new">${saved ? 'YENİ YOLCULUK' : 'YOLCULUĞA BAŞLA'} <span>→</span></button><button class="text-button" data-do="about">OYUN HAKKINDA</button></div><p class="menu-foot">BİR HİKÂYE AKSİYON RPG’Sİ <span>•</span> SÜRÜM 1.0</p></div></div>`;
  bind('continue', () => { sound.start(); game.model = loadGame() || freshGame(); if (game.model.chapter === 'son') return ending(); enterWorld(); });
  bind('new', () => { sound.start(); if (saved) return modal('Yeni bir yolculuk?', 'Önceki yolculuğun silinecek. Bu karar geri alınamaz.', [{ label: 'Vazgeç', action: menu }, { label: 'Yeni oyuna başla', action: () => { deleteGame(); game.model = freshGame(); persist(); prologueIntro(); } }]); game.model = freshGame(); persist(); prologueIntro(); });
  bind('about', () => modal('Kül Defteri', 'Mirra Vadisi ve Noctis Akademisi’nde geçen, kayıp ve hatıralar üzerine özgün bir hikâye. İnternet bağlantısı gerektirmez; ilerleme yalnızca bu cihazda saklanır.\n\nDokunarak ya da klavyedeki yön tuşlarıyla hareket et. Yakınındaki izlerle etkileşime geç.', [{ label: 'Geri dön', action: menu }]));
}
function bind(name, fn) { document.querySelector(`[data-do="${name}"]`)?.addEventListener('click', fn); }
function modal(title, text, buttons) {
  game.canMove = false; scene().direction = 0;
  document.querySelector('.modal-wrap')?.remove();
  const wrap = document.createElement('div'); wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="dialogue"><p class="eyebrow">✦ &nbsp; KÜL DEFTERİ</p><h2></h2><p class="dialogue-text"></p><div class="dialogue-buttons"></div></div>`;
  wrap.querySelector('h2').textContent = title; wrap.querySelector('.dialogue-text').textContent = text;
  buttons.forEach(({ label, action }, i) => { const b = document.createElement('button'); b.className = i === buttons.length - 1 ? 'primary' : 'secondary'; b.textContent = label; b.onclick = () => { wrap.remove(); action(); }; wrap.querySelector('.dialogue-buttons').append(b); });
  ui.append(wrap);
}
function prologueIntro() { modal('Bir zamanlar, Mirra Vadisi’nde', 'Sorin Vael, yoksul bir kasabanın melez kanlı çocuğuydu. Başkalarının sustuğu yerde o, küllerin fısıltısını duyuyordu.\n\nO gün henüz bilmiyordu: Bir deftere yazdığı her büyü, bir gün dönüp kendi kalbini sınayacaktı.', [{ label: 'Hikâyeye gir', action: enterWorld }]); }
function enterWorld() {
  state = 'world'; game.canMove = true; duel = null; refreshWorld(); renderHud();
}
function renderHud() {
  const m = game.model, chapter = story[m.chapter]; if (!chapter) return;
  ui.innerHTML = `<div class="hud"><div class="topbar"><div class="chapter"><span>${chapter.label} <i>✦</i> ${chapter.place}</span><strong>${chapter.title}</strong></div><div class="top-actions"><button data-do="sound" aria-label="Sesi aç veya kapat">${sound.enabled ? '♫' : '♪̸'}</button><button data-do="pause" aria-label="Menü">Ⅱ</button></div></div><div class="objective"><span>ŞİMDİKİ İZ</span><p>${chapter.tasks[m.step] || ''}</p></div><div class="bottom-controls"><div class="joystick" aria-label="Hareket alanı"><div class="stick"></div><span>HAREKET</span></div><div class="right-controls"><button class="interact" data-do="interact"><b>✦</b><span>İNCELE</span></button><button class="spell-button" data-do="spell"><b>⌁</b><span>RÜN</span></button></div></div><div class="keyboard-hint">YÖN TUŞLARI / A D · E: İNCELE · R: RÜN</div></div>`;
  bind('pause', () => modal('Yolculuk duraklatıldı', 'İlerlemen bu cihazda otomatik olarak saklanır.', [{ label: 'Ana menü', action: () => { persist(); menu(); } }, { label: 'Devam et', action: enterWorld }]));
  bind('sound', () => { sound.toggle(); renderHud(); }); bind('interact', interact); bind('spell', () => runePanel(false));
  setupJoystick();
}
function setupJoystick() {
  const area = document.querySelector('.joystick'), stick = area.querySelector('.stick'); let id = null;
  const move = e => { if (e.pointerId !== id) return; const rect = area.getBoundingClientRect(), dx = e.clientX - (rect.left + rect.width / 2); scene().direction = Math.abs(dx) < 8 ? 0 : Math.max(-1, Math.min(1, dx / (rect.width * .35))); stick.style.transform = `translate(${scene().direction * 22}px, -50%)`; };
  area.addEventListener('pointerdown', e => { id = e.pointerId; area.setPointerCapture(id); move(e); }); area.addEventListener('pointermove', move);
  const end = e => { if (e.pointerId !== id) return; id = null; scene().direction = 0; stick.style.transform = 'translate(0, -50%)'; persist(); };
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
  if (m.chapter === 'prolog' && m.step === 3) { m.chapter = 'bolum1'; m.step = 0; m.x = 160; persist(); refreshWorld(); return modal('Bölüm 01 · Taşın Hafızası', 'Yıllar geçti. Noctis Akademisi’nin koridorlarında Sorin’in adı fısıltıyla anılır oldu. Fakat bir defterden koparılan sayfa, sahibine karşı dönmek üzereydi.', [{ label: 'Koridora gir', action: enterWorld }]); }
  persist(); refreshWorld(); enterWorld();
}
function startDuel() {
  state = 'duel'; game.canMove = false; scene().direction = 0; duel = { player: 3, enemy: 3 };
  modal('AYNA DÜELLO', 'Öğrenci senin Kor Mührü’nü kullanıyor. Ateşin karşıtı sudur: V şeklindeki su rününü tek vuruşla çiz. Üç başarılı karşılık düelloyu bitirir; üç hata seni düşürür.', [{ label: 'Karşı koy', action: renderDuel }]);
}
function renderDuel() {
  state = 'duel';
  ui.innerHTML = `<div class="duel-hud"><div class="duel-title"><span>AYNA DÜELLO · KOR MÜHRÜ</span><h2>İcadın sana karşı.</h2><p>Ateşi söndürmek için su rününü çiz.</p></div><div class="health"><div><span>SORİN</span><b>${'●'.repeat(duel.player)}${'○'.repeat(3-duel.player)}</b></div><div><span>ÖĞRENCİ</span><b>${'●'.repeat(duel.enemy)}${'○'.repeat(3-duel.enemy)}</b></div></div><div class="duel-mark">◯ <span>→</span> V</div><button class="primary duel-cast" data-do="counter">SU RÜNÜNÜ ÇİZ &nbsp; →</button></div>`;
  bind('counter', () => runePanel(true));
}
function runePanel(inDuel) {
  game.canMove = false; scene().direction = 0;
  const overlay = document.createElement('div'); overlay.className = 'rune-overlay';
  overlay.innerHTML = `<div class="rune-panel"><div class="rune-header"><div><p class="eyebrow">TEK VURUŞTA ÇİZ</p><h2>Rün çemberi</h2></div><button class="close" aria-label="Kapat">×</button></div><div class="rune-body"><div class="rune-guide"><p>Parmağını kaldırmadan bir şekil çiz.</p><div><b>◯</b><span>KOR<br><small>Çember</small></span></div><div><b>V</b><span>SU<br><small>Aşağı kırık çizgi</small></span></div><div><b>∧</b><span>SİPER<br><small>Yukarı kırık çizgi</small></span></div>${inDuel ? '<p class="rune-clue">KOR’UN KARŞITI: SU</p>' : ''}</div><div class="canvas-wrap"><canvas aria-label="Rün çizim alanı"></canvas><span>RÜNÜ BURAYA ÇİZ</span></div></div><p class="rune-status">Çizimini bitirdiğinde büyü çözümlenir.</p></div>`;
  ui.append(overlay);
  const canvas = overlay.querySelector('canvas'), ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect(); canvas.width = Math.round(rect.width * devicePixelRatio); canvas.height = Math.round(rect.height * devicePixelRatio); ctx.scale(devicePixelRatio, devicePixelRatio); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#e9c68b'; ctx.lineWidth = 4; ctx.shadowBlur = 14; ctx.shadowColor = '#e6b773';
  let points = [], drawing = false, pointerId = null;
  const getPoint = e => { const r = canvas.getBoundingClientRect(); return { x: e.clientX-r.left, y: e.clientY-r.top }; };
  canvas.onpointerdown = e => { if (drawing) return; drawing = true; pointerId = e.pointerId; canvas.setPointerCapture(pointerId); points = [getPoint(e)]; ctx.clearRect(0, 0, rect.width, rect.height); ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); };
  canvas.onpointermove = e => { if (!drawing || e.pointerId !== pointerId) return; const p = getPoint(e); points.push(p); ctx.lineTo(p.x,p.y); ctx.stroke(); };
  const finish = e => { if (!drawing || e.pointerId !== pointerId) return; drawing = false; const result = recognize(points); if (!result) { overlay.querySelector('.rune-status').textContent = 'Rün anlaşılmadı. Bir daha dene; şekli tek vuruşta çiz.'; return; } sound.tone(result.name === 'su' ? 440 : 280); overlay.remove(); if (inDuel) resolveDuel(result.name); else { enterWorld(); toast(({ kor: 'Kor Mührü: Karanlıkta küçük bir kıvılcım.', su: 'Su İzi: Serin bir yankı avuçlarında geziniyor.', siper: 'Siper: Kısa bir an için dünya susuyor.' })[result.name]); scene().cameras.main.flash(300, 210, 170, 110, false); } };
  canvas.onpointerup = finish; canvas.onpointercancel = () => { drawing = false; };
  overlay.querySelector('.close').onclick = () => { overlay.remove(); if (inDuel) renderDuel(); else enterWorld(); };
}
function resolveDuel(name) {
  if (name === 'su') { duel.enemy--; scene().cameras.main.flash(350, 120, 190, 220); sound.tone(550); } else { duel.player--; scene().cameras.main.shake(180, .008); sound.tone(110); }
  if (duel.enemy === 0) { game.model.duelWins++; game.model.chapter = 'son'; game.model.step = 0; persist(); return modal('Ateşin sustuğu an', 'Su, çalınmış büyünün çevresine dolandı. Öğrenci dizlerinin üstüne çöktü. Sorin, zaferden çok bir kaybın ağırlığını duydu.\n\n“Bir büyüyü bilmek,” dedi usulca, “onu anlamak değildir.”', [{ label: 'Devam et', action: ending }]); }
  if (duel.player === 0) return modal('Kül yeniden savrulur', 'Kor Mührü savunmanı aştı. Bir hatıra kırıldı; fakat hikâye henüz bitmedi. Ateşin karşıtı olan suyu hatırla.', [{ label: 'Düelloyu yeniden dene', action: startDuel }, { label: 'Ana menü', action: menu }]);
  modal(name === 'su' ? 'Doğru karşılık' : 'Kor seni yaraladı', name === 'su' ? 'Su rünü alevi söndürdü. Öğrenci büyüyü yeniden hazırlıyor.' : 'Bu rün Kor Mührü’nün karşıtı değil. Ateşi söndürmek için V şeklindeki su rününü çiz.', [{ label: 'Düelloya dön', action: renderDuel }]);
}
function ending() { state = 'ending'; game.canMove = false; ui.innerHTML = `<div class="ending"><p class="eyebrow">BİRİNCİ BÖLÜMÜN SONU</p><h1>Kül, gerçeği<br><em>saklamaz.</em></h1><p>Sorin defteri kapattı. Sayfaların arasında Liora’nın adı, silinmemiş bir yara gibi duruyordu.</p><button class="primary" data-do="menu">ANA MENÜYE DÖN →</button></div>`; bind('menu', menu); }
window.addEventListener('keydown', e => { if (state !== 'world' || !game.canMove || e.repeat) return; if (['ArrowLeft','a','A'].includes(e.key)) scene().direction = -1; if (['ArrowRight','d','D'].includes(e.key)) scene().direction = 1; if (['e','E'].includes(e.key)) interact(); if (['r','R'].includes(e.key)) runePanel(false); });
window.addEventListener('keyup', e => { if (['ArrowLeft','ArrowRight','a','A','d','D'].includes(e.key)) { scene().direction = 0; if (state === 'world') persist(); } });
window.addEventListener('blur', () => { scene().direction = 0; if (state === 'world') persist(); });
setInterval(() => { if (state === 'world' && Math.abs(game.model.x-lastSavedX) > 20) { lastSavedX = game.model.x; persist(); } }, 3000);
menu();
