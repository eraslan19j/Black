import Phaser from 'phaser';
import { SKILLS, WORLD_SIZE, distance, maxHealth, nearestEnemy, rewardKill, screenToWorldVector, tickResources, useSkill } from './combat.js';

const project = (x, y) => ({ x: (x - y) * .85, y: (x + y) * .425 });
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const COLORS = { scavenger: 0x978a76, mage: 0xb77d70, boss: 0xd2a568 };
const NAMES = { scavenger: 'Kül Avcısı', mage: 'Kor Gözcüsü', boss: 'Mezar Muhafızı' };
function diamond(g, x, y, w, h, color, alpha = 1) { g.fillStyle(color, alpha).fillPoints([{x, y:y-h}, {x:x+w, y}, {x, y:y+h}, {x:x-w, y}], true); }

export class World extends Phaser.Scene {
  constructor() { super('world'); this.inputX = 0; this.inputY = 0; this.running = false; }
  create() {
    this.cameras.main.setBackgroundColor('#111a1b').setBounds(-1800, -120, 3600, 2000);
    this.drawTerrain();
    this.heroGraphic = this.add.graphics();
    this.effects = this.add.graphics().setDepth(5000);
    this.texts = []; this.flashes = []; this.enemies = []; this.spawnClock = 0; this.hudClock = 0;
    this.game.worldReady?.();
    this.input.on('pointerdown', pointer => {
      if (!this.running || !this.player || pointer.downElement !== this.game.canvas) return;
      const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      let chosen = null, best = 40;
      for (const enemy of this.enemies) { const pos = project(enemy.x, enemy.y); const d = Math.hypot(p.x-pos.x, p.y-(pos.y-20)); if (d < best) { best = d; chosen = enemy; } }
      if (chosen) { this.selected = chosen; this.game.notify?.(`${NAMES[chosen.type]} hedeflendi`); }
    });
  }
  drawTerrain() {
    const g = this.add.graphics().setDepth(-10000);
    const tile = 100;
    for (let y = 0; y < WORLD_SIZE; y += tile) for (let x = 0; x < WORLD_SIZE; x += tile) {
      const p = project(x + tile/2, y + tile/2), seed = ((x * 13 + y * 37) / tile) % 7;
      diamond(g, p.x, p.y, 85, 42.5, [0x243a33, 0x293f36, 0x263c34, 0x2b4036, 0x273b32, 0x2c4237, 0x263a32][seed]);
      g.lineStyle(1, 0xb6c3a4, .035).strokePoints([{x:p.x,y:p.y-42.5},{x:p.x+85,y:p.y},{x:p.x,y:p.y+42.5},{x:p.x-85,y:p.y}], true);
      if (seed === 2 || seed === 5) { g.lineStyle(1, 0xb7ba8c, .2); g.lineBetween(p.x-12,p.y+7,p.x-15,p.y+1); g.lineBetween(p.x-15,p.y+1,p.x-18,p.y+4); }
    }
    // Dekorlar çarpışmayı engellemez; görsel derinlik için gerçek çizim sırası kullanılır.
    for (let i = 0; i < 32; i++) {
      const x = 120 + ((i * 313 + 47) % 1550), y = 120 + ((i * 541 + 131) % 1550), p = project(x,y);
      const obj = this.add.graphics().setPosition(p.x,p.y).setDepth(p.y);
      if (i % 4 === 0) {
        obj.fillStyle(0x101c18,.4).fillEllipse(0,4,58,20);
        obj.fillStyle(0x303a34).fillRect(-10,-45,20,45); diamond(obj,0,-45,10,5,0x6a7260);
        obj.fillStyle(0x222e29).fillRect(5,-43,5,42); obj.lineStyle(1,0x89917a,.35).lineBetween(-6,-33,-6,-7);
      } else {
        obj.fillStyle(0x14241b,.4).fillEllipse(0,4,58,18);
        obj.fillStyle(0x263424).fillRect(-4,-38,8,38);
        diamond(obj,0,-47,27,16,0x334b35); diamond(obj,0,-62,21,13,0x425c40); diamond(obj,0,-75,12,9,0x58704b);
      }
    }
  }
  startRun(progress) {
    this.enemies.forEach(e => e.graphic.destroy()); this.enemies = []; this.flashes = [];
    this.progress = progress;
    this.player = { x: 900, y: 900, level: progress.level, hp: maxHealth(progress.level), mana: 100, shield: 0, cooldowns: Object.fromEntries(Object.keys(SKILLS).map(k => [k,0])) };
    this.selected = null; this.inputX = 0; this.inputY = 0; this.running = true; this.spawnClock = 0;
    this.spawnWave();
  }
  spawnWave() {
    const count = Math.min(4 + this.progress.wave, 13);
    for (let i=0; i<count; i++) {
      const angle = (i / count) * Math.PI * 2 + this.progress.wave * .52, radius = 240 + (i % 3) * 75;
      const type = this.progress.wave % 5 === 0 && i === 0 ? 'boss' : (i % 3 === 2 ? 'mage' : 'scavenger');
      const health = (type === 'boss' ? 200 : type === 'mage' ? 55 : 68) + (this.progress.wave-1) * 6;
      this.enemies.push({ x:clamp(this.player.x+Math.cos(angle)*radius,80,WORLD_SIZE-80), y:clamp(this.player.y+Math.sin(angle)*radius,80,WORLD_SIZE-80), type, hp:health, maxHp:health, slow:0, attack:1 + i * .18, graphic:this.add.graphics(), offset:i });
    }
    this.game.notify?.(`${this.progress.wave}. DALGA · ${count} DÜŞMAN`);
  }
  pauseRun() { this.running = false; this.inputX = this.inputY = 0; }
  resumeRun() { if (this.player?.hp > 0) this.running = true; }
  respawn() { this.progress.gold = Math.floor(this.progress.gold * .9); this.game.saveProgress?.(); this.startRun(this.progress); }
  cast(name) {
    if (!this.running) return;
    const result = useSkill(this.player, name, this.enemies, this.selected);
    if (!result.ok) { this.game.notify?.(result.reason); return; }
    if (result.target) this.selected = result.target;
    const origin = project(this.player.x,this.player.y), target = result.target ? project(result.target.x,result.target.y) : origin;
    this.flashes.push({ name, origin, target, age:0 });
    for (const e of result.affected) { const p=project(e.x,e.y); this.floating(p.x,p.y-65, `−${SKILLS[name].damage+(this.player.level-1)*3}`, '#f6d08c'); }
    this.game.playTone?.(name);
    this.cleanDead();
    this.game.updateHud?.(this);
  }
  cleanDead() {
    for (const e of this.enemies.filter(e => e.hp <= 0)) {
      const result = rewardKill(this.progress, e.type === 'boss');
      const p = project(e.x,e.y); this.floating(p.x,p.y-34, `+${result.gold} kül`, '#edd48a');
      if (result.levelled) { this.player.level = this.progress.level; this.player.hp = maxHealth(this.player.level); this.player.mana = 100; this.game.notify?.(`SEVİYE ${this.player.level} · CAN VE ÖZ YENİLENDİ`); }
      e.graphic.destroy(); if (this.selected === e) this.selected = null;
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);
    this.game.saveProgress?.();
    if (!this.enemies.length) { this.progress.wave++; this.progress.bestWave = Math.max(this.progress.bestWave, this.progress.wave); this.game.saveProgress?.(); this.spawnClock = 2.5; this.game.notify?.('ALAN TEMİZLENDİ · YENİ DALGA YAKLAŞIYOR'); }
  }
  floating(x,y,text,color) {
    const label = this.add.text(x,y,text,{ fontFamily:'Arial',fontSize:'15px',fontStyle:'bold',color,stroke:'#101715',strokeThickness:4 }).setOrigin(.5).setDepth(6000);
    this.tweens.add({targets:label,y:y-38,alpha:0,duration:850,onComplete:()=>label.destroy()});
  }
  drawCharacter(g, kind, selected = false, scale = 1, slow = false) {
    g.clear(); g.fillStyle(0x000000,.32).fillEllipse(0,4,44*scale,16*scale);
    if (selected) { g.lineStyle(2,0xe6cc89,.9).strokeEllipse(0,4,50*scale,20*scale); }
    if (kind === 'hero') {
      g.fillStyle(0x141d21).fillTriangle(-17*scale,0,0,-55*scale,17*scale,0);
      g.fillStyle(0x4d5353).fillRect(-9*scale,-43*scale,18*scale,30*scale);
      g.fillStyle(0xc8b8a1).fillCircle(0,-50*scale,8*scale); g.fillStyle(0x20282b).fillEllipse(0,-56*scale,19*scale,11*scale);
      g.lineStyle(2,0xb99a71).lineBetween(8*scale,-36*scale,20*scale,-22*scale); g.fillStyle(0xeacc83).fillCircle(20*scale,-22*scale,3*scale);
    } else {
      const color = slow ? 0x96c9d3 : COLORS[kind];
      g.fillStyle(0x232322).fillTriangle(-16*scale,0,0,-54*scale,16*scale,0);
      g.fillStyle(color).fillEllipse(0,-33*scale,20*scale,30*scale);
      g.fillStyle(0x3c3530).fillCircle(0,-50*scale,10*scale);
      g.fillStyle(kind === 'mage' ? 0xffa96c : 0xe2c69a).fillCircle(-3*scale,-51*scale,2*scale).fillCircle(3*scale,-51*scale,2*scale);
      if (kind === 'boss') { g.lineStyle(3,0xd5b173).lineBetween(-9*scale,-55*scale,-14*scale,-67*scale).lineBetween(9*scale,-55*scale,14*scale,-67*scale); }
    }
  }
  update(time, delta) {
    if (!this.player) return;
    const dt = Math.min(delta/1000, .05), p = this.player;
    if (this.running) {
      const move = screenToWorldVector(this.inputX,this.inputY); p.x = clamp(p.x+move.x*190*dt,45,WORLD_SIZE-45); p.y = clamp(p.y+move.y*190*dt,45,WORLD_SIZE-45);
      tickResources(p,dt);
      for (const enemy of this.enemies) {
        enemy.slow = Math.max(0,enemy.slow-dt); enemy.attack -= dt;
        const d = distance(p,enemy), desired = enemy.type === 'mage' ? 185 : 40;
        if (d < 570 && d > .1) {
          const speed = (enemy.type === 'mage' ? 64 : enemy.type === 'boss' ? 49 : 76) * (enemy.slow > 0 ? .45 : 1);
          let direction = d > desired ? 1 : enemy.type === 'mage' && d < 115 ? -1 : 0;
          enemy.x = clamp(enemy.x + (p.x-enemy.x)/d * speed * direction * dt, 40,WORLD_SIZE-40);
          enemy.y = clamp(enemy.y + (p.y-enemy.y)/d * speed * direction * dt, 40,WORLD_SIZE-40);
          if (d < (enemy.type === 'mage' ? 235 : 60) && enemy.attack <= 0) {
            const damage = (enemy.type === 'boss' ? 18 : enemy.type === 'mage' ? 9 : 7) + Math.floor(this.progress.wave/3);
            const actualDamage = Math.max(1, Math.round(damage * (p.shield > 0 ? .4 : 1)));
            p.hp = Math.max(0, p.hp - actualDamage);
            enemy.attack = enemy.type === 'boss' ? 2.2 : enemy.type === 'mage' ? 2.4 : 1.7;
            const at = project(p.x,p.y); this.floating(at.x,at.y-72,`−${actualDamage}`,'#ef8b77');
            if (enemy.type === 'mage') this.flashes.push({name:'enemy',origin:project(enemy.x,enemy.y),target:at,age:0});
            if (p.hp <= 0) { this.pauseRun(); this.game.onDefeat?.(); break; }
          }
        }
      }
      if (this.spawnClock > 0) { this.spawnClock -= dt; if (this.spawnClock <= 0) this.spawnWave(); }
    }
    const point = project(p.x,p.y); const camera = this.cameras.main; camera.setZoom(this.scale.height/540); camera.centerOn(point.x,point.y-35);
    this.drawCharacter(this.heroGraphic,'hero'); this.heroGraphic.setPosition(point.x,point.y).setDepth(point.y+.1);
    if (p.shield > 0) { this.heroGraphic.lineStyle(2,0x9de3ed,.7).strokeEllipse(0,-24,65,81); }
    for (const enemy of this.enemies) {
      const pos=project(enemy.x,enemy.y), scale=enemy.type==='boss'?1.5:1;
      this.drawCharacter(enemy.graphic,enemy.type,enemy === this.selected,scale,enemy.slow>0);
      enemy.graphic.setPosition(pos.x,pos.y).setDepth(pos.y);
      enemy.graphic.fillStyle(0x151a18,.8).fillRect(-23*scale,-75*scale,46*scale,5);
      enemy.graphic.fillStyle(0xc77961).fillRect(-23*scale,-75*scale,46*scale*(enemy.hp/enemy.maxHp),5);
    }
    this.effects.clear();
    for (const fx of this.flashes) { if (this.running) fx.age += dt; const a = 1-fx.age/.45; if (a <= 0) continue;
      const color = fx.name==='ayaz'?0x95d9ed:fx.name==='siper'?0xd5e8bd:fx.name==='enemy'?0xe4705d:0xf2a658;
      if (fx.name==='ayaz' || fx.name==='siper') { this.effects.lineStyle(4,color,a).strokeEllipse(fx.origin.x,fx.origin.y,40+fx.age*380,20+fx.age*190); }
      else { this.effects.lineStyle(4,color,a).lineBetween(fx.origin.x,fx.origin.y-32,fx.target.x,fx.target.y-30); this.effects.fillStyle(color,a*.45).fillCircle(fx.target.x,fx.target.y-30,10+fx.age*22); }
    }
    this.flashes = this.flashes.filter(f => f.age < .45);
    this.hudClock += dt; if (this.hudClock > .12) { this.hudClock=0; this.game.updateHud?.(this); }
  }
}
