// Android'in yerel WebView hedefini Chrome DevTools protokolüyle kontrol eder.
process.on('uncaughtException', error => { console.error(`::error::Android WebView: ${error.message}`); process.exit(1); });
process.on('unhandledRejection', error => { console.error(`::error::Android WebView: ${error.message || error}`); process.exit(1); });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let target;
for (let i = 0; i < 40 && !target; i++) {
  try { target = (await (await fetch('http://127.0.0.1:9222/json')).json()).find(t => t.type === 'page' && t.url.startsWith('https://localhost')); } catch { /* WebView henüz başlamadı. */ }
  if (!target) await delay(1000);
}
if (!target) throw Error('Yerel oyun sayfası Android WebView içinde açılamadı.');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let id = 0; const pending = new Map(), errors = [];
socket.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  if (message.id && pending.has(message.id)) { const { resolve, reject } = pending.get(message.id); pending.delete(message.id); message.error ? reject(Error(message.error.message)) : resolve(message.result); }
};
function send(method, params = {}) { return new Promise((resolve, reject) => { const request = ++id; pending.set(request, {resolve, reject}); socket.send(JSON.stringify({id: request, method, params})); }); }
async function evaluate(expression) { const response = await send('Runtime.evaluate', {expression, returnByValue:true}); if (response.exceptionDetails) throw Error(response.exceptionDetails.text); return response.result.value; }
async function waitFor(expression) { for (let i = 0; i < 30; i++) { if (await evaluate(expression)) return; await delay(1000); } throw Error(`Android WebView bekleme süresi aşıldı: ${expression}`); }
try {
  await send('Runtime.enable');
  await waitFor("!!document.querySelector('[data-do=new]')");
  await evaluate("document.querySelector('[data-do=new]').click()");
  await waitFor("!!document.querySelector('.dialogue-buttons button')");
  await evaluate("document.querySelector('.dialogue-buttons button').click()");
  await waitFor("!!document.querySelector('#game canvas') && !!document.querySelector('.objective')");
  const valid = await evaluate("JSON.parse(localStorage.getItem('kul-defteri-kayit-v1')).chapter === 'prolog'");
  if (!valid || errors.length) throw Error(`Android WebView kayıt veya çalışma hatası: ${errors.join(', ')}`);
  console.log('Android WebView: çevrimdışı menü, giriş, Phaser kanvası ve yerel kayıt doğrulandı.');
} finally { socket.close(); }
