import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as wait } from 'node:timers/promises';

const root = 'C:/GoogleAppScript/0_NewServer/ACE_System4';
const outDir = `${root}/docs/clockapp-guide`;
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 25200 + Math.floor(Math.random() * 2000);
const userDataDir = `${root}/.chrome-clockapp-render-${Date.now()}`;
const pageName = process.argv[2] || 'leave-infographic';
const url = `file:///${root.replaceAll('\\', '/')}/docs/clockapp-guide/${pageName}.html`;
const outPath = `${outDir}/${pageName}-a4.png`;

await mkdir(outDir, { recursive: true });

const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--disable-gpu-sandbox',
  '--disable-software-rasterizer',
  '--disable-dev-shm-usage',
  '--no-sandbox',
  '--no-first-run',
  '--no-default-browser-check',
  '--remote-allow-origins=*',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--window-size=1240,1754',
  'about:blank',
], { stdio: 'ignore', detached: true });

function httpJson(targetUrl, options) {
  return fetch(targetUrl, options).then(async r => {
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    return r.json();
  });
}

for (let i = 0; i < 80; i += 1) {
  try { await httpJson(`http://127.0.0.1:${port}/json/version`); break; } catch { await wait(250); }
  if (i === 79) throw new Error('Chrome remote debugger did not start');
}

const target = await httpJson(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
const ws = new WebSocket(target.webSocketDebuggerUrl);

await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

let id = 0;
const callbacks = new Map();
ws.addEventListener('message', event => {
  const msg = JSON.parse(event.data);
  if (msg.id && callbacks.has(msg.id)) {
    const { resolve, reject } = callbacks.get(msg.id);
    callbacks.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result || {});
  }
});

function cdp(method, params = {}) {
  const callId = ++id;
  const promise = new Promise((resolve, reject) => callbacks.set(callId, { resolve, reject }));
  ws.send(JSON.stringify({ id: callId, method, params }));
  return promise;
}

await cdp('Page.enable');
await cdp('Runtime.enable');
await cdp('Emulation.setDeviceMetricsOverride', {
  width: 1240,
  height: 1754,
  deviceScaleFactor: 1,
  mobile: false,
  screenWidth: 1240,
  screenHeight: 1754,
});
await cdp('Page.navigate', { url });

for (let i = 0; i < 80; i += 1) {
  const result = await cdp('Runtime.evaluate', {
    expression: 'document.readyState === "complete" && [...document.images].every(img => img.complete)',
    returnByValue: true,
  });
  if (result.result?.value) break;
  await wait(250);
  if (i === 79) throw new Error('Page did not finish loading images');
}

await wait(500);
const shot = await cdp('Page.captureScreenshot', {
  format: 'png',
  captureBeyondViewport: false,
  fromSurface: true,
});
await writeFile(outPath, Buffer.from(shot.data, 'base64'));

ws.close();
try { chrome.kill(); } catch {}
console.log(outPath);
