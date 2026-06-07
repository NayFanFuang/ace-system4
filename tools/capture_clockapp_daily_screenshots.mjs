import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as wait } from 'node:timers/promises';

const root = 'C:/GoogleAppScript/0_NewServer/ACE_System4';
const outDir = `${root}/docs/clockapp-guide`;
const userDataDir = `${root}/.chrome-clockapp-guide-${Date.now()}`;
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 19444 + Math.floor(Math.random() * 1000);

await mkdir(outDir, { recursive: true });

const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--remote-allow-origins=*',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--window-size=390,844',
  'about:blank',
], { stdio: 'ignore', detached: true });

function httpJson(url, options) {
  return fetch(url, options).then(async r => {
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    return r.json();
  });
}

async function waitForDebug() {
  for (let i = 0; i < 80; i += 1) {
    try { return await httpJson(`http://127.0.0.1:${port}/json/version`); } catch {}
    await wait(250);
  }
  throw new Error('Chrome remote debugger did not start');
}

await waitForDebug();
const target = await httpJson(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

let seq = 0;
const pending = new Map();
ws.addEventListener('message', event => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    return;
  }
  if (msg.method === 'Fetch.requestPaused') {
    handlePaused(msg.params).catch(err => {
      console.error('intercept error', err);
    });
  }
});

function cdp(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function jsonResponse(body) {
  const text = JSON.stringify(body);
  return {
    responseCode: 200,
    responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
    body: Buffer.from(text, 'utf8').toString('base64'),
  };
}

async function handlePaused(params) {
  const url = params.request.url;
  if (url.includes('/api/auth/login')) {
    await cdp('Fetch.fulfillRequest', {
      requestId: params.requestId,
      ...jsonResponse({
        access_token: 'guide-token',
        user: guideUser(),
      }),
    });
  } else if (url.includes('/api/auth/change-password')) {
    await cdp('Fetch.fulfillRequest', {
      requestId: params.requestId,
      ...jsonResponse({ success: true }),
    });
  } else if (url.includes('/api/clock-permissions/')) {
    await cdp('Fetch.fulfillRequest', {
      requestId: params.requestId,
      ...jsonResponse({ roles: ['DTA'], clock_type: 'DAILY', sites: [], planned_sites: [] }),
    });
  } else if (url.includes('/api/admin/clock-settings')) {
    await cdp('Fetch.fulfillRequest', {
      requestId: params.requestId,
      ...jsonResponse({ config: { DTA: { gpsRequired: true, photoRequired: true, enforceRadius: true, enabled: true } } }),
    });
  } else if (url.includes('/api/clock/today')) {
    await cdp('Fetch.fulfillRequest', {
      requestId: params.requestId,
      ...jsonResponse({ sessions: [] }),
    });
  } else if (url.includes('/api/leave/pending-for-me')) {
    await cdp('Fetch.fulfillRequest', {
      requestId: params.requestId,
      ...jsonResponse({ pending: [] }),
    });
  } else if (url.includes('/api/clock/history')) {
    await cdp('Fetch.fulfillRequest', {
      requestId: params.requestId,
      ...jsonResponse({
        sessions: [
          {
            id: 101,
            clockIn: '2026-06-01T08:31:12+07:00',
            clockOut: '2026-06-01T17:42:30+07:00',
            clock_type: 'DAILY',
            status: 'CLOSED',
            lat_in: 13.7563,
            lng_in: 100.5018,
            lat_out: 13.7564,
            lng_out: 100.5019,
          },
        ],
      }),
    });
  } else if (url.includes('/api/clock/in')) {
    await cdp('Fetch.fulfillRequest', {
      requestId: params.requestId,
      ...jsonResponse({ success: true, sessionId: 555 }),
    });
  } else if (url.includes('/api/clock/out/')) {
    await cdp('Fetch.fulfillRequest', {
      requestId: params.requestId,
      ...jsonResponse({ success: true, outcome: 'COMPLETE' }),
    });
  } else if (url.includes('nominatim.openstreetmap.org')) {
    await cdp('Fetch.fulfillRequest', {
      requestId: params.requestId,
      ...jsonResponse({ display_name: 'ACE Office, Bangkok, Thailand', address: { suburb: 'Bangkok', city: 'Bangkok' } }),
    });
  } else {
    await cdp('Fetch.continueRequest', { requestId: params.requestId });
  }
}

function guideUser() {
  return {
    id: 9001,
    email: 'guide.employee@airconnect-e.com',
    firstName: 'Guide',
    lastName: 'Employee',
    name: 'Guide Employee',
    employeeCode: 'ACE000',
    role: 'EMPLOYEE',
    positionCode: 'DTA',
    positionName: 'Drive Test Analyst',
    clockType: 'DAILY',
    projectCode: 'DAILY',
    projectName: 'Office / Daily Work',
    workLat: 13.7563,
    workLng: 100.5018,
    allowedRadiusM: 500,
    workLocationName: 'ACE Office',
    mustChangePassword: false,
  };
}

async function screenshot(name) {
  await wait(700);
  const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`${outDir}/${name}.png`, Buffer.from(shot.data, 'base64'));
}

async function waitForText(text, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const result = await cdp('Runtime.evaluate', {
      expression: `document.body && document.body.innerText.includes(${JSON.stringify(text)})`,
      returnByValue: true,
    });
    if (result.result.value) return;
    await wait(300);
  }
  throw new Error(`Timed out waiting for ${text}`);
}

async function clickByText(text) {
  const result = await cdp('Runtime.evaluate', {
    expression: `
      (() => {
        const needle = ${JSON.stringify(text)}.toLowerCase();
        const nodes = [...document.querySelectorAll('button,a')];
        const node = nodes.find(n => (n.innerText || n.textContent || '').replace(/\\s+/g, ' ').trim().toLowerCase().includes(needle));
        if (!node) return false;
        node.scrollIntoView({ block: 'center', inline: 'center' });
        node.click();
        return true;
      })()
    `,
    returnByValue: true,
  });
  if (!result.result.value) throw new Error(`Could not click ${text}`);
}

await cdp('Page.enable');
await cdp('Runtime.enable');
await cdp('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
await cdp('Browser.grantPermissions', {
  origin: 'https://ace.airconnect-e.com',
  permissions: ['geolocation', 'videoCapture'],
});
await cdp('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
  screenWidth: 390,
  screenHeight: 844,
});
await cdp('Emulation.setUserAgentOverride', {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
await cdp('Emulation.setGeolocationOverride', { latitude: 13.7563, longitude: 100.5018, accuracy: 15 });
await cdp('Page.addScriptToEvaluateOnNewDocument', {
  source: `
    localStorage.setItem('ace_system_auth_user_v1', JSON.stringify({...${JSON.stringify(guideUser())}, token: 'guide-token'}));
  `,
});

await cdp('Page.navigate', { url: 'https://ace.airconnect-e.com/ClockApp?desktop=1' });
await waitForText('ACE Clock System');
await screenshot('01-dashboard-ready');

await clickByText('Clock In');
await waitForText('Selfie Verification');
await screenshot('02-selfie-verification');

await cdp('Page.navigate', { url: 'https://ace.airconnect-e.com/ClockApp?desktop=1&tab=history' });
await waitForText('History');
await screenshot('03-history');

ws.close();
try { chrome.kill(); } catch {}
