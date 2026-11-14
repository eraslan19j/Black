// Önizleme sunucusu çalışırken: CHROME_BIN=/chromium npm run test:browser
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const binary = process.env.CHROME_BIN;
if (!binary) throw new Error('CHROME_BIN ile Chromium çalıştırılabilir dosyasını belirtin.');
const browser = await chromium.launch({ executablePath: binary, headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, hasTouch: true });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173/');
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.getByRole('button', {name: 'YOLCULUĞA BAŞLA'}).click();
  await page.getByRole('button', {name: 'Hikâyeye gir'}).click();
  const readSave = () => page.evaluate(() => JSON.parse(localStorage.getItem('kul-defteri-kayit-v1')));
  // Joystick hem yatay hem derinlik ekseninde hareket eder; bırakıldığında durur.
  const stick = await page.locator('.joystick').boundingBox();
  const cdp = await page.context().newCDPSession(page);
  const center = {x: stick.x + stick.width/2, y: stick.y + stick.height/2, id: 1};
  const moved = {x: stick.x + stick.width*.85, y: stick.y + stick.height*.85, id: 1};
  await cdp.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[center]});
  await cdp.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[moved]});
  await page.waitForTimeout(900);
  // Diğer parmakla ses düğmesine basarken joystick işaretçi yakalamasını kaybetmemeli.
  const sound = await page.getByRole('button', {name:'Sesi aç veya kapat'}).boundingBox();
  const second = {x:sound.x+sound.width/2, y:sound.y+sound.height/2, id:2};
  await cdp.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[moved, second]});
  await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[moved]});
  await page.waitForTimeout(400); await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
  let saved = await readSave(); assert.ok(saved.x > 175, `Joystick x: ${saved.x}`); assert.ok(saved.depth > .57, `Joystick derinlik: ${saved.depth}`);
  const oldX = saved.x; await page.waitForTimeout(700); saved = await readSave(); assert.ok(Math.abs(saved.x-oldX) < 4, 'Joystick bırakılınca durmalı');
  await page.getByRole('button', {name: 'RÜN'}).click();
  const canvas = page.locator('.canvas-wrap canvas');
  async function drawV() { const r = await canvas.boundingBox(); await page.mouse.move(r.x+r.width*.2,r.y+r.height*.2); await page.mouse.down(); await page.mouse.move(r.x+r.width*.5,r.y+r.height*.8,{steps:10}); await page.mouse.move(r.x+r.width*.8,r.y+r.height*.2,{steps:10}); await page.mouse.up(); }
  await drawV(); await page.getByText('Su İzi:', {exact:false}).waitFor();
  // Yolculuğun aşamaları gerçek düğmelerle geçilir; yalnızca uzun yürüyüşler kayıt konumuyla kısaltılır.
  async function approach(x) {
    await page.getByRole('button', {name:'Menü'}).click(); await page.getByRole('button', {name:'Ana menü'}).click();
    await page.evaluate(x => { const k='kul-defteri-kayit-v1'; const v=JSON.parse(localStorage.getItem(k)); v.x=x; localStorage.setItem(k,JSON.stringify(v)); }, x);
    await page.reload(); await page.getByRole('button', {name:'YOLCULUĞA DEVAM ET'}).click();
    await page.getByRole('button', {name:'İNCELE'}).click();
  }
  await approach(520); await page.getByText('Yaprağı al').click();
  await approach(1000); await page.getByText('“Kendi yolunu bul.”').click(); await page.getByRole('button',{name:'Devam et',exact:true}).click();
  await approach(1490); await page.getByText('Yola çık').click(); await page.getByText('Koridora gir').click();
  await approach(520); await page.getByText('Çiçeği al').click();
  await approach(1000); await page.getByText('Hatırla').click();
  await approach(1490); assert.ok(await page.getByText('Benim büyülerimi bana karşı mı kullanıyorsun?',{exact:false}).count()); await page.getByText('Düelloya gir').click(); await page.getByText('Karşı koy').click();
  for (let i=0; i<3; i++) { await page.getByRole('button',{name:'SU RÜNÜNÜ ÇİZ'}).click(); await drawV(); if (i<2) { await page.getByText('Doğru karşılık').waitFor(); await page.getByText('Düelloya dön').click(); } }
  await page.getByText('Ateşin sustuğu an').waitFor(); await page.getByRole('button',{name:'Devam et',exact:true}).click(); await page.getByText('BİRİNCİ BÖLÜMÜN SONU').waitFor();
  await page.getByRole('button',{name:'ANA MENÜYE DÖN'}).click(); await page.reload(); await page.getByRole('button',{name:'YOLCULUĞA DEVAM ET'}).click(); await page.getByText('BİRİNCİ BÖLÜMÜN SONU').waitFor();
  assert.deepEqual(errors, []); console.log('Başarılı: hareket, derinlik, rün, prolog, bölüm, düello ve kayıt.');
} finally { await browser.close(); }
