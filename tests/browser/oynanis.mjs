import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const binary = process.env.CHROME_BIN;
if (!binary) throw new Error('CHROME_BIN ile Chromium çalıştırılabilir dosyasını belirtin.');
const browser = await chromium.launch({ executablePath: binary, headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, hasTouch: true });
const errors = []; page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173/');
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.getByRole('button', {name: 'SAVAŞA BAŞLA'}).click();
  await page.getByText('1. DALGA · 5 DÜŞMAN', {exact:false}).first().waitFor();
  const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('kul-defteri-arena-v1')));
  const pos = () => page.locator('.hud').evaluate(el => ({x:Number(el.dataset.x), y:Number(el.dataset.y)}));
  const stick = await page.locator('.joystick').boundingBox(), cdp = await page.context().newCDPSession(page);
  const center={x:stick.x+stick.width/2,y:stick.y+stick.height/2,id:1}, moved={x:stick.x+stick.width*.85,y:stick.y+stick.height*.5,id:1};
  const before=await pos();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[center]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[moved]});
  await page.waitForTimeout(800);
  const sound=await page.getByRole('button',{name:'Sesi aç veya kapat'}).boundingBox(), second={x:sound.x+sound.width/2,y:sound.y+sound.height/2,id:2};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[moved,second]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[moved]});
  await page.waitForTimeout(300); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(300); const after=await pos(); assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>15, 'Dokunmatik hareket çalışmalı');
  const still=await pos(); await page.waitForTimeout(500); const stopped=await pos(); assert.ok(Math.hypot(still.x-stopped.x,still.y-stopped.y)<5, 'Joystick bırakılınca durmalı');
  // Düşmanlar yaklaşır; büyü harcaması ve hasarı görünür olmalı.
  const mana=()=>page.locator('.mana-bar span').innerText();
  await page.getByRole('button',{name:'Kor Küresi'}).click(); await page.waitForTimeout(250);
  assert.ok(parseInt(await mana(),10)<100,'Kor büyüsü öz tüketmeli');
  assert.ok(Number.parseFloat(await page.locator('.target-health i').evaluate(el=>el.style.width)) < 100, 'Kor hedefe hasar vermeli');
  await page.waitForTimeout(1800);
  for(let i=0;i<14 && (await save()).kills===0;i++){ await page.getByRole('button',{name:'Asa Darbesi'}).click(); await page.waitForTimeout(700); }
  const progress=await save(); assert.ok(progress.kills>0 && progress.gold>0,'Düşman yenilgisi ve ödül kaydedilmeli');
  await page.getByRole('button',{name:'Duraklat'}).click(); await page.getByText('Savaş duraklatıldı').waitFor(); await page.getByRole('button',{name:'Ana menü'}).click();
  await page.reload(); await page.getByRole('button',{name:'SAVAŞA DEVAM ET'}).click(); assert.equal((await save()).kills,progress.kills);
  // Düşman yapay zekâsı hareket eder ve saldırarak canı azaltır.
  await page.waitForFunction(()=>{const el=document.querySelector('.health-bar span');return el && parseInt(el.textContent,10) < Number(el.textContent.split('/')[1]);},null,{timeout:25000});
  assert.deepEqual(errors,[]); console.log('Başarılı: çoklu dokunma, hedefleme, büyü, yapay zekâ, ödül ve kayıt.');
} finally { await browser.close(); }
