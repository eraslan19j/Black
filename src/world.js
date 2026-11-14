import Phaser from 'phaser';
import { story } from './story.js';

const WIDTH = 1800;
const GROUND_BACK = 376;
const GROUND_FRONT = 450;

export class World extends Phaser.Scene {
  constructor() { super('world'); this.direction = 0; this.depthDirection = 0; this.walkTime = 0; this.facing = 1; }
  create() {
    this.cameras.main.setBackgroundColor('#10151d').setBounds(0, 0, WIDTH, 540);
    // Uzak, orta ve ön plan kameraya farklı hızlarda tepki verir.
    this.sky = this.add.graphics().setScrollFactor(.15, 1);
    this.distant = this.add.graphics().setScrollFactor(.35, 1);
    this.mid = this.add.graphics().setScrollFactor(.68, 1);
    this.art = this.add.graphics();
    this.character = this.add.graphics();
    this.foreground = this.add.graphics().setScrollFactor(1.08, 1);
    this.effects = this.add.graphics();
    this.ash = Array.from({ length: 45 }, (_, i) => ({ x: (i * 137 + 23) % WIDTH, y: (i * 71 + 19) % 450, speed: .15 + (i % 5) * .06, size: .6 + (i % 3) * .4 }));
    this.pulse = null;
    this.redraw();
  }
  redraw() {
    if (!this.art) return;
    const academy = this.game.model.chapter === 'bolum1';
    const sky = this.sky, far = this.distant, mid = this.mid, g = this.art, fg = this.foreground;
    [sky, far, mid, g, fg].forEach(layer => layer.clear());
    sky.fillGradientStyle(0x192a36, 0x192a36, 0x0c141c, 0x0c141c, 1).fillRect(-1000, 0, 4000, 540);
    sky.fillStyle(0xc6c6a9, .035).fillCircle(900, 92, 94);
    sky.fillStyle(0xc7cbb4, .10).fillCircle(900, 92, 57);
    sky.fillStyle(0xd3d1b9, .17).fillCircle(900, 92, 39);
    far.fillStyle(0x30404a, .4).beginPath().moveTo(-500, 380);
    for (let x = -500; x <= 2600; x += 110) far.lineTo(x, 260 + Math.sin(x * .004) * 45 + Math.sin(x * .011) * 28);
    far.lineTo(2600, 480).lineTo(-500, 480).closePath().fillPath();
    if (academy) {
      // Kemerlere paralaks ve tekrarlanan sütunlarla koridor derinliği verilir.
      mid.fillStyle(0x101b22, .8).fillRect(-500, 100, 3000, 300);
      for (let x = -250; x < 2300; x += 260) {
        mid.fillStyle(0x202d31, .65).fillRect(x + 22, 120, 175, 285);
        mid.lineStyle(11, 0x101a20, .9).beginPath().moveTo(x, 402).lineTo(x, 202).lineTo(x + 110, 75).lineTo(x + 220, 202).lineTo(x + 220, 402).strokePath();
        mid.lineStyle(2, 0x6c7e78, .18).beginPath().moveTo(x + 28, 395).lineTo(x + 28, 210).lineTo(x + 110, 115).lineTo(x + 192, 210).lineTo(x + 192, 395).strokePath();
        mid.fillStyle(0xb5c8bb, .035).fillTriangle(x + 105, 117, x + 42, 385, x + 178, 385);
      }
      for (let x = 180; x < WIDTH; x += 310) {
        g.fillStyle(0xe8a354, .035).fillCircle(x, 294, 86);
        g.fillStyle(0xefae63, .07).fillCircle(x, 294, 43);
        g.fillStyle(0x886749, .85).fillRect(x - 3, 293, 6, 20);
        g.fillStyle(0xf5c681, .95).fillTriangle(x - 3, 293, x, 283, x + 3, 293);
      }
    } else {
      for (let x = -300; x < 2400; x += 100) {
        const h = 100 + ((x + 300) * 17 % 130);
        mid.fillStyle(0x14232a, .9).fillTriangle(x, 398, x + 50, 398 - h, x + 100, 398).fillRect(x + 45, 365, 10, 40);
      }
      mid.fillStyle(0x0d1920, .95).fillRect(1450, 170, 125, 230).fillTriangle(1438, 170, 1512, 66, 1587, 170);
      mid.fillStyle(0xc8a879, .35).fillRect(1493, 230, 5, 20).fillRect(1531, 263, 5, 20);
    }
    // Perspectif zemin ve çizgiler: karakter, arka ve ön sınırlar arasında dolaşabilir.
    g.fillGradientStyle(0x263337, 0x263337, 0x090e13, 0x090e13, 1).fillRect(0, GROUND_BACK, WIDTH, 164);
    g.lineStyle(2, 0x7c8b80, .28).lineBetween(0, GROUND_BACK, WIDTH, GROUND_BACK);
    for (let y = 390; y <= 540; y += (y - 366) * .48) g.lineStyle(1, 0x93a59b, .10).lineBetween(0, y, WIDTH, y);
    for (let x = -300; x < WIDTH + 400; x += 90) g.lineStyle(1, 0xa4b0a4, .10).lineBetween(x, GROUND_BACK, x * 1.42 - 380, 540);
    for (let i = 0; i < 20; i++) g.fillStyle(0xc8d2c7, .025).fillEllipse(i * 105, 391 + i % 4 * 10, 200, 13);
    const data = story[this.game.model.chapter];
    if (data) data.objects.forEach((obj, i) => {
      if (i < this.game.model.step) return;
      const active = i === this.game.model.step;
      if ((this.game.model.chapter === 'prolog' && i === 1) || (academy && i === 2)) {
        const px = obj.x, py = 392;
        g.fillStyle(0x000000, .3).fillEllipse(px, py + 26, 48, 9);
        g.fillStyle(academy ? 0x25202a : 0x2b3031).fillTriangle(px - 17, py + 23, px, py - 43, px + 17, py + 23);
        g.fillStyle(0xb9aba1, .8).fillCircle(px, py - 39, 8);
        g.fillStyle(academy ? 0x16141c : 0x352f2c).fillEllipse(px, py - 44, 20, 12);
      }
      g.fillStyle(active ? 0xe3ba7a : 0x647b7c, active ? .09 : .025).fillCircle(obj.x, 357, active ? 40 : 25);
      g.lineStyle(2, active ? 0xeac78f : 0x728380, active ? .9 : .3).strokeCircle(obj.x, 357, 9);
      g.lineBetween(obj.x, 342, obj.x, 372).lineBetween(obj.x - 15, 357, obj.x + 15, 357);
    });
    // Ön plan siluetleri sahnenin geri kalanından hızlı kayar.
    for (let x = -100; x < 2300; x += academy ? 520 : 390) {
      fg.fillStyle(0x080e12, .7);
      if (academy) { fg.fillRect(x, 0, 22, 540); fg.fillRect(x - 12, 0, 46, 30); }
      else { fg.fillTriangle(x - 18, 540, x + 12, 270, x + 42, 540); fg.fillRect(x + 2, 350, 14, 190); }
    }
  }
  cast(color = 0xe5be7d) { this.pulse = { start: this.time.now, color }; }
  update(time, delta) {
    if (!this.character || !this.game.model) return;
    const m = this.game.model;
    const dt = Math.min(delta, 50);
    if (this.game.canMove && (this.direction || this.depthDirection)) {
      m.x = Phaser.Math.Clamp(m.x + this.direction * dt * .21, 50, WIDTH - 50);
      m.depth = Phaser.Math.Clamp((m.depth ?? .55) + this.depthDirection * dt * .0008, 0, 1);
      if (Math.abs(this.direction) > .05) this.facing = Math.sign(this.direction);
      this.walkTime += dt;
    }
    const camera = this.cameras.main;
    const zoom = this.scale.height / 540;
    if (camera.zoom !== zoom) camera.setZoom(zoom);
    camera.centerOn(m.x, 270);
    const depth = m.depth ?? .55, y = Phaser.Math.Linear(GROUND_BACK + 10, GROUND_FRONT, depth);
    const size = .78 + depth * .32, x = m.x;
    const walking = this.game.canMove && (Math.abs(this.direction) + Math.abs(this.depthDirection)) > .05;
    const bob = walking ? Math.sin(this.walkTime / 100) * 2 : Math.sin(time / 850) * .5;
    const g = this.character; g.clear();
    g.fillStyle(0x000000, .38).fillEllipse(x, y + 3, 54 * size, 10 * size);
    g.fillStyle(0xe6b96b, .035).fillCircle(x + this.facing * 20 * size, y - 35 * size, 53 * size);
    g.fillStyle(0x0a0e15).fillTriangle(x - 20 * size, y, x, y - 84 * size + bob, x + 22 * size, y);
    g.fillStyle(0x242b32).fillRect(x - 11 * size, y - 68 * size + bob, 22 * size, 45 * size);
    g.lineStyle(1, 0x727870, .55).lineBetween(x, y - 62 * size + bob, x - 4 * size, y - 10 * size);
    g.fillStyle(0xb7aaa0).fillCircle(x, y - 82 * size + bob, 10 * size);
    g.fillStyle(0x10151c).fillEllipse(x, y - 87 * size + bob, 24 * size, 13 * size);
    g.lineStyle(2, 0x9b805c, .8).lineBetween(x + this.facing * 8 * size, y - 57 * size + bob, x + this.facing * 23 * size, y - 38 * size + bob);
    g.fillStyle(0xeac17a, .85).fillCircle(x + this.facing * 23 * size, y - 38 * size + bob, 2 * size);
    const fx = this.effects; fx.clear();
    for (const p of this.ash) {
      p.y -= p.speed * dt / 16; p.x += Math.sin((p.y + time / 50) / 45) * dt * .003;
      if (p.y < 0) p.y = 455;
      fx.fillStyle(0xd8cfb7, .25).fillCircle(p.x, p.y, p.size);
    }
    if (this.pulse) {
      const age = (time - this.pulse.start) / 800;
      if (age >= 1) this.pulse = null;
      else { fx.lineStyle(3 * (1 - age), this.pulse.color, (1 - age) * .8).strokeCircle(x, y - 40 * size, 12 + age * 100); fx.fillStyle(this.pulse.color, (1 - age) * .09).fillCircle(x, y - 40 * size, 25 + age * 80); }
    }
  }
}
