import Phaser from 'phaser';
import { story } from './story.js';

export class World extends Phaser.Scene {
  constructor() { super('world'); this.direction = 0; this.walkTime = 0; }
  create() {
    this.cameras.main.setBackgroundColor('#10151d');
    this.cameras.main.setBounds(0, 0, 1800, 540);
    this.art = this.add.graphics(); this.character = this.add.graphics(); this.effects = this.add.graphics();
    this.ash = Array.from({ length: 55 }, () => ({ x: Math.random() * 1800, y: Math.random() * 440, speed: .15 + Math.random() * .35, size: .5 + Math.random() * 1.6 }));
    this.redraw();
  }
  redraw() {
    if (!this.art) return;
    const g = this.art, academy = this.game.model.chapter === 'bolum1'; g.clear();
    // Katmanlı siluetler ve yerel ışıklar: harici görsel kullanılmaz.
    g.fillGradientStyle(0x182532, 0x182532, 0x080c12, 0x080c12, 1); g.fillRect(0, 0, 1800, 540);
    g.fillStyle(0xc8c7ab, .1); g.fillCircle(1330, 105, 65); g.fillStyle(0xd4d4bd, .11); g.fillCircle(1330, 105, 46);
    g.fillStyle(0x26323a, .45); g.beginPath(); g.moveTo(0, 345); for (let x = 0; x <= 1800; x += 150) g.lineTo(x, 230 + Math.sin(x * .009) * 56); g.lineTo(1800, 540); g.lineTo(0, 540); g.closePath(); g.fillPath();
    if (academy) {
      for (let x = 40; x < 1800; x += 250) {
        g.fillStyle(0x080e14, .78); g.fillRect(x, 55, 34, 360); g.fillRect(x + 170, 55, 34, 360); g.lineStyle(12, 0x080e14, .85); g.beginPath(); g.moveTo(x, 190); g.lineTo(x + 102, 75); g.lineTo(x + 204, 190); g.strokePath();
        g.fillStyle(0xf1ad5b, .045); g.fillCircle(x + 100, 292, 90); g.fillStyle(0xf3bb70, .12); g.fillCircle(x + 100, 292, 35); g.fillStyle(0xffca7a, .8); g.fillCircle(x + 100, 292, 3);
      }
    } else {
      for (let x = 0; x < 1800; x += 115) { const h = 100 + (x * 17 % 120); g.fillStyle(0x101b20, .8); g.fillTriangle(x, 405, x + 55, 405 - h, x + 110, 405); g.fillRect(x + 49, 390, 10, 55); }
      g.fillStyle(0x0a1118, .9); g.fillTriangle(1300, 380, 1450, 160, 1600, 380); g.fillRect(1390, 180, 120, 220); g.fillTriangle(1380, 180, 1450, 75, 1520, 180);
    }
    g.fillStyle(0x080c10, 1); g.fillRect(0, 415, 1800, 125); g.lineStyle(2, 0x83918a, .25); g.lineBetween(0, 415, 1800, 415);
    for (let i = 0; i < 20; i++) { g.fillStyle(0xa8b6b4, .025); g.fillEllipse(i * 105, 410 + i % 3 * 16, 230, 26); }
    const data = story[this.game.model.chapter];
    if (data) data.objects.forEach((obj, i) => {
      const active = i === this.game.model.step;
      if (i < this.game.model.step) return;
      g.fillStyle(active ? 0xe3ba7a : 0x647b7c, active ? .10 : .04); g.fillCircle(obj.x, 382, active ? 45 : 28);
      g.lineStyle(2, active ? 0xeac78f : 0x728380, active ? .85 : .3); g.strokeCircle(obj.x, 382, 10); g.lineBetween(obj.x, 365, obj.x, 399); g.lineBetween(obj.x - 17, 382, obj.x + 17, 382);
    });
  }
  update(_time, delta) {
    if (!this.character || !this.game.model) return;
    const m = this.game.model;
    if (this.game.canMove && this.direction) { m.x = Phaser.Math.Clamp(m.x + this.direction * delta * .18, 50, 1720); this.walkTime += delta; }
    this.cameras.main.setZoom(this.scale.height / 540);
    this.cameras.main.centerOn(m.x, 270);
    const g = this.character; g.clear(); const x = m.x, bob = this.direction && this.game.canMove ? Math.sin(this.walkTime / 110) * 2 : 0;
    g.fillStyle(0x000000, .4); g.fillEllipse(x, 418, 55, 10);
    g.fillStyle(0x0a0d14); g.fillTriangle(x - 21, 412, x, 325 + bob, x + 23, 412); g.fillStyle(0x242831); g.fillRect(x - 11, 343 + bob, 22, 48); g.fillStyle(0xb8aaa0); g.fillCircle(x, 330 + bob, 11); g.fillStyle(0x10141c); g.fillEllipse(x, 324 + bob, 25, 14); g.lineStyle(2, 0x9b805c, .7); g.lineBetween(x + 9, 358 + bob, x + 22, 376 + bob); g.fillStyle(0xe7b36a, .65); g.fillCircle(x + 23, 376 + bob, 2);
    const fx = this.effects; fx.clear();
    for (const p of this.ash) { p.y -= p.speed * delta / 16; p.x += Math.sin((p.y + x) / 60) * .1; if (p.y < 0) p.y = 440; fx.fillStyle(0xd8cfb7, .28); fx.fillCircle(p.x, p.y, p.size); }
  }
}
