import Phaser from 'phaser';
import './style.css';
import { World } from './world.js';
import { freshProgress, maxHealth, nearestEnemy, SKILLS, xpNeeded } from './combat.js';
import { loadGame, saveGame, deleteGame } from './save.js';
import { joystickVector, keyboardVector } from './movement.js';
import { Soundscape } from './audio.js';

const ui = document.querySelector('#interface');
const sound = new Soundscape();
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 960, height: 540, backgroundColor: '#111a1b', scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: true, powerPreference: 'high-performance' }, fps: { target: 60 }, scene: World });
const scene = () => game.scene.getScene('world');
const keys = new Set();
let state = 'menu', progress = null, toastTimer, attackTimer = null;
const byAction = name => ui.querySelector(`[data-do="${name}"]`);
const bind = (name, fn) => byAction(name)?.addEventListener('click', fn);
function stopControls() { keys.clear(); clearInterval(attackTimer); attackTimer = null; const world = scene(); if (world) { world.inputX = 0; world.inputY = 0; } }
function persist() { if (progress && !saveGame(progress)) notify('Kayıt yapılamadı. Cihaz depolamasını kontrol et.'); }
function notify(text) { const el = ui.querySelector('.toast'); if (!el) return; el.textContent = text; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 2200); }
game.notify = notify; game.saveProgress = persist;
game.worldReady = () => { if (state === 'menu') ui.querySelectorAll('[data-do="new"], [data-do="continue"]').forEach(button => { button.disabled = false; }); };
game.playTone = name => sound.tone(({ saldiri: 260, kor: 180, ayaz: 450, siper: 350 })[name] || 240, .4, .13);
function menu() {
  state = 'menu'; stopControls(); scene()?.pauseRun(); const saved = loadGame();
  ui.innerHTML = `<main class="menu-screen"><div class="menu-visual"><div class="moon"></div><div class="mountain back"></div><div class="mountain front"></div><div class="menutower"></div></div><div class="menu-content"><div class="menu-brand"><span class="brand-mark">✧</span><span>ÇEVRİMDIŞI AKSİYON RPG</span></div><div class="menu-copy"><p class="eyebrow">KARANLIKTA GÜCÜNÜ BUL</p><h1>KÜL<br><em>DEFTERİ</em></h1><div class="title-rule"><span>✦</span></div><p class="menu-description">Büyülerini hazırla. Tehlikeli topraklarda savaş, güçlen ve dalgalara karşı ayakta kal.</p><div class="menu-buttons">${saved ? '<button class="primary" data-do="continue">SAVAŞA DEVAM ET <span>→</span></button>' : ''}<button class="${saved ? 'secondary' : 'primary'}" data-do="new">${saved ? 'YENİ SAVAŞ' : 'SAVAŞA BAŞLA'} <span>→</span></button><button class="text-button" data-do="help">NASIL OYNANIR? <span>↗</span></button></div></div><p class="menu-footer">TEK OYUNCULU <b>✦</b> YEREL KAYIT <b>✦</b> TÜRKÇE</p></div></main>`;
  if (!scene()?.heroGraphic) ui.querySelectorAll('[data-do="new"], [data-do="continue"]').forEach(button => { button.disabled = true; });
  bind('continue', () => { sound.start(); start(loadGame() || freshProgress()); });
  bind('new', () => { sound.start(); if (saved) return dialog('Yeni bir savaş?', 'Önceki arena ilerlemen silinecek. Bu işlem geri alınamaz.', [{label:'Vazgeç', fn:menu}, {label:'Yeni savaşa başla', fn:() => { deleteGame(); start(freshProgress()); }}]); start(freshProgress()); });
  bind('help', () => dialog('Savaşa hazırlan', 'Soldaki kumandayla hareket et. Düşmana dokunarak hedef seçebilir veya menzildeki en yakın düşmanı otomatik hedefleyebilirsin.\n\nAsa Darbesi sürekli saldırır; Kor Küresi alan hasarı verir, Ayaz Halkası yakın düşmanları yavaşlatır, Kül Sığınağı iyileştirir ve korur. Büyüler öz tüketir ve bekleme süresine sahiptir.\n\nKlavye: WASD / yön tuşları, Q / E / R / F büyüler.', [{label:'Anladım', fn:menu}]));
}
function dialog(title, text, buttons) {
  stopControls(); scene()?.pauseRun();
  ui.querySelector('.modal-wrap')?.remove();
  const wrap = document.createElement('div'); wrap.className = 'modal-wrap';
  wrap.innerHTML = '<section class="dialogue"><p class="eyebrow">✦ &nbsp; KÜL DEFTERİ</p><h2></h2><p class="dialogue-text"></p><div class="dialogue-buttons"></div></section>';
  wrap.querySelector('h2').textContent = title; wrap.querySelector('.dialogue-text').textContent = text;
  buttons.forEach(({label,fn}, i) => { const b=document.createElement('button'); b.className=i===buttons.length-1?'primary':'secondary'; b.textContent=label; b.onclick=()=>{ wrap.remove(); fn(); }; wrap.querySelector('.dialogue-buttons').append(b); });
  ui.append(wrap);
}
function start(data) {
  if (!scene()?.heroGraphic) { notify('Arena hazırlanıyor'); return; }
  progress = data; persist(); state = 'playing'; renderHud(); scene().startRun(progress); updateHud(scene());
}
function renderHud() {
  ui.innerHTML = `<div class="hud"><div class="top-left"><div class="portrait"><span>✦</span><b class="level-number">1</b></div><div class="vitals"><div class="player-name">KÜL GEZGİNİ <span>✧</span></div><div class="bar health-bar"><i></i><span></span></div><div class="bar mana-bar"><i></i><span></span></div><div class="xp-bar"><i></i></div></div></div><div class="top-right"><div class="currency"><span>✦</span> <b class="gold">0</b><small>KÜL</small></div><button class="icon-button" data-do="sound" aria-label="Sesi aç veya kapat">${sound.enabled ? '♫' : '♪̸'}</button><button class="icon-button" data-do="pause" aria-label="Duraklat">Ⅱ</button></div><div class="area-heading"><span>TEK OYUNCULU ARENA</span><strong>KÜL TOPRAKLARI</strong><small class="wave"></small></div><div class="target-card"><span>HEDEF</span><strong class="target-name">Hedef aranıyor</strong><div class="target-health"><i></i></div></div><div class="toast"></div><div class="bottom-controls"><div class="joystick" aria-label="Hareket alanı"><div class="joystick-inner"></div><div class="stick"></div><span>HAREKET</span></div><div class="skills"><div class="skill-group"><button class="skill" data-skill="ayaz" aria-label="Ayaz Halkası"><i class="cooldown"></i><b>❄</b><span>AYAZ</span><small>R</small></button><button class="skill" data-skill="siper" aria-label="Kül Sığınağı"><i class="cooldown"></i><b>✧</b><span>SIĞINAK</span><small>F</small></button><button class="skill" data-skill="kor" aria-label="Kor Küresi"><i class="cooldown"></i><b>✹</b><span>KOR</span><small>E</small></button></div><button class="skill attack" data-skill="saldiri" aria-label="Asa Darbesi"><i class="cooldown"></i><b>⚔</b><span>SALDIR</span><small>Q</small></button></div></div><div class="bottom-caption">WASD · HAREKET &nbsp; | &nbsp; Q E R F · BÜYÜLER</div></div>`;
  bind('sound', () => { byAction('sound').textContent = sound.toggle() ? '♫' : '♪̸'; });
  bind('pause', pause); setupJoystick(); setupSkills();
}
function setupJoystick() {
  const area=ui.querySelector('.joystick'), stick=area.querySelector('.stick'); let id=null;
  const move=e=>{ if (id!==e.pointerId || state!=='playing') return; const r=area.getBoundingClientRect(), radius=r.width*.4, v=joystickVector(e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2,radius); scene().inputX=v.x; scene().inputY=v.y; stick.style.transform=`translate(${v.x*radius*.65}px, calc(-50% + ${v.y*radius*.65}px))`; };
  area.addEventListener('pointerdown',e=>{if(id!==null || state!=='playing')return;e.preventDefault();id=e.pointerId;area.setPointerCapture(id);move(e);});
  area.addEventListener('pointermove',move);
  const end=e=>{if(id!==e.pointerId)return;id=null;scene().inputX=scene().inputY=0;stick.style.transform='translate(0, -50%)';};
  area.addEventListener('pointerup',end); area.addEventListener('pointercancel',end); area.addEventListener('lostpointercapture',end);
}
function setupSkills() {
  for (const button of ui.querySelectorAll('[data-skill]')) {
    const name=button.dataset.skill;
    button.addEventListener('pointerdown', e=>{ if(state!=='playing')return; e.preventDefault(); button.setPointerCapture(e.pointerId); scene().cast(name); if(name==='saldiri') { clearInterval(attackTimer); attackTimer=setInterval(()=>scene()?.cast('saldiri'), 680); } });
    const stop=()=>{ if(name==='saldiri') { clearInterval(attackTimer); attackTimer=null; } };
    button.addEventListener('pointerup',stop); button.addEventListener('pointercancel',stop); button.addEventListener('lostpointercapture',stop);
    button.addEventListener('click',e=>{if(e.detail===0 && state==='playing')scene().cast(name);});
  }
}
function updateHud(world) {
  if(state!=='playing' || !world.player) return;
  const p=world.player; ui.querySelector('.hud').dataset.x = p.x.toFixed(1); ui.querySelector('.hud').dataset.y = p.y.toFixed(1);
  const set=(selector,text)=>{const el=ui.querySelector(selector);if(el)el.textContent=text;};
  set('.level-number',p.level); set('.gold',progress.gold); set('.wave',`${progress.wave}. DALGA · ${world.enemies.length} DÜŞMAN`);
  const health=maxHealth(p.level); const healthEl=ui.querySelector('.health-bar'), manaEl=ui.querySelector('.mana-bar');
  healthEl.querySelector('i').style.width=`${p.hp/health*100}%`; healthEl.querySelector('span').textContent=`${Math.ceil(p.hp)} / ${health}`;
  manaEl.querySelector('i').style.width=`${p.mana}%`; manaEl.querySelector('span').textContent=`${Math.floor(p.mana)} / 100`;
  ui.querySelector('.xp-bar i').style.width=`${progress.xp/xpNeeded(progress.level)*100}%`;
  const target=nearestEnemy(p,world.enemies,450,world.selected), names={scavenger:'Kül Avcısı',mage:'Kor Gözcüsü',boss:'Mezar Muhafızı'};
  set('.target-name',target ? names[target.type] : (world.spawnClock>0 ? 'Yeni dalga hazırlanıyor' : 'Menzilde düşman yok'));
  ui.querySelector('.target-health i').style.width=target?`${target.hp/target.maxHp*100}%`:'0%';
  for (const button of ui.querySelectorAll('[data-skill]')) { const cd=p.cooldowns[button.dataset.skill], skill=SKILLS[button.dataset.skill]; button.querySelector('.cooldown').style.height=`${cd/skill.cooldown*100}%`; button.classList.toggle('unavailable', cd>0 || p.mana<skill.mana); button.title=`${skill.name} · ${skill.mana} öz${cd>0 ? ` · ${cd.toFixed(1)} sn` : ''}`; }
}
game.updateHud=updateHud;
function pause() {
  if(state!=='playing')return; state='pause'; persist();
  dialog('Savaş duraklatıldı', 'Dalga ve gelişim bu cihazda saklanır. Arenaya döndüğünde düşmanlar yeniden yerleşir.', [{label:'Ana menü', fn:menu},{label:'Devam et',fn:()=>{state='playing'; scene().resumeRun();}}]);
}
game.onDefeat=()=>{
  if(state!=='playing')return; state='dead'; persist();
  dialog('Yere düştün', `Mücadele henüz bitmedi. Aynı dalgayı yeniden dene; biriktirdiğin külün %10’u kaybolacak.\n\nUlaştığın dalga: ${progress.wave} · Yendiğin düşman: ${progress.kills}`, [{label:'Ana menü',fn:menu},{label:'Yeniden savaş',fn:()=>{state='playing';scene().respawn();updateHud(scene());}}]);
};
const keyMap={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down',s:'down'}, skillKeys={q:'saldiri',e:'kor',r:'ayaz',f:'siper'};
function syncKeyboard(){const v=keyboardVector(new Set([...keys].map(k=>keyMap[k])));scene().inputX=v.x;scene().inputY=v.y;}
window.addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(state!=='playing')return;if(keyMap[k]){e.preventDefault();keys.add(k);syncKeyboard();return;}if(skillKeys[k]&&(!e.repeat||k==='q')){e.preventDefault();scene().cast(skillKeys[k]);}if(k==='Escape'&&!e.repeat)pause();});
window.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(keyMap[k]){keys.delete(k);if(state==='playing')syncKeyboard();}});
window.addEventListener('blur',()=>{stopControls();if(state==='playing')persist();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopControls();if(state==='playing')pause();}});
menu();
