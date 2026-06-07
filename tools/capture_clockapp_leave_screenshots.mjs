import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as wait } from 'node:timers/promises';

const root = 'C:/GoogleAppScript/0_NewServer/ACE_System4';
const outDir = `${root}/docs/clockapp-guide`;
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 23500 + Math.floor(Math.random() * 2000);
const userDataDir = `${root}/.chrome-clockapp-leave-${Date.now()}`;

await mkdir(outDir, { recursive: true });

const user = {
  id: 9201,
  email: 'guide.employee@airconnect-e.com',
  firstName: 'Guide',
  lastName: 'Employee',
  name: 'Guide Employee',
  employeeCode: 'ACE000',
  role: 'EMPLOYEE',
  positionCode: 'DTA',
  positionName: 'Drive Test Analyst',
  clockType: 'DAILY',
  team: 'Operation',
  department: 'RF Project',
  projectCode: 'DAILY',
  projectName: 'Office / Daily Work',
  workLat: 13.7563,
  workLng: 100.5018,
  allowedRadiusM: 500,
  workLocationName: 'ACE Office',
  mustChangePassword: false,
};

const leaves = [
  {
    id: 801,
    leaveType: 'Annual Leave',
    sessionType: 'Full Day',
    startDate: '2026-06-10',
    endDate: '2026-06-11',
    days: 2,
    reason: 'Family trip',
    status: 'PENDING_PM',
  },
  {
    id: 802,
    leaveType: 'Sick Leave',
    sessionType: 'Morning Half',
    startDate: '2026-05-21',
    endDate: '2026-05-21',
    days: 0.5,
    reason: 'Medical appointment',
    status: 'APPROVED',
    reviewedBy: 'PM Manager',
  },
];

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
  if (msg.method === 'Fetch.requestPaused') handlePaused(msg.params).catch(console.error);
});

function cdp(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function jsonResponse(body) {
  return {
    responseCode: 200,
    responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
    body: Buffer.from(JSON.stringify(body), 'utf8').toString('base64'),
  };
}

async function handlePaused(params) {
  const url = params.request.url;
  if (url.includes('/api/leave/my')) {
    await cdp('Fetch.fulfillRequest', { requestId: params.requestId, ...jsonResponse({ leaves }) });
  } else if (url.includes('/api/leave/policy')) {
    await cdp('Fetch.fulfillRequest', {
      requestId: params.requestId,
      ...jsonResponse({ entitlements: { 'Sick Leave': 30, 'Personal Leave': 3, 'Annual Leave': 6 } }),
    });
  } else if (url.includes('/api/leave/pending-for-me')) {
    await cdp('Fetch.fulfillRequest', { requestId: params.requestId, ...jsonResponse({ pending: [] }) });
  } else if (url.includes('/api/clock-permissions/')) {
    await cdp('Fetch.fulfillRequest', {
      requestId: params.requestId,
      ...jsonResponse({ roles: ['DTA'], clock_type: 'DAILY', sites: [], planned_sites: [] }),
    });
  } else if (url.includes('/api/admin/clock-settings')) {
    await cdp('Fetch.fulfillRequest', { requestId: params.requestId, ...jsonResponse({ config: {} }) });
  } else if (url.includes('/api/clock/today')) {
    await cdp('Fetch.fulfillRequest', { requestId: params.requestId, ...jsonResponse({ sessions: [] }) });
  } else if (url.includes('nominatim.openstreetmap.org')) {
    await cdp('Fetch.fulfillRequest', {
      requestId: params.requestId,
      ...jsonResponse({ display_name: 'ACE Office, Bangkok, Thailand', address: { city: 'Bangkok' } }),
    });
  } else {
    await cdp('Fetch.continueRequest', { requestId: params.requestId });
  }
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

async function screenshot(name) {
  await wait(700);
  const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`${outDir}/${name}.png`, Buffer.from(shot.data, 'base64'));
}

async function scrollMain(top) {
  await cdp('Runtime.evaluate', {
    expression: `
      (() => {
        const el = document.querySelector('.ace-clock-main-scroll');
        if (el) el.scrollTop = ${top};
        else window.scrollTo({ top: ${top}, behavior: 'instant' });
      })()
    `,
  });
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
  source: `localStorage.setItem('ace_system_auth_user_v1', JSON.stringify({...${JSON.stringify(user)}, token: 'guide-token'}));`,
});

await cdp('Page.navigate', { url: 'https://ace.airconnect-e.com/ClockApp?tab=leave&desktop=1' });
await waitForText('Submit Leave Request');
await screenshot('leave-01-submit-form');

await scrollMain(620);
await waitForText('Leave Statistics');
await screenshot('leave-02-statistics-flow');

await scrollMain(1120);
await waitForText('My Leave Requests');
await screenshot('leave-03-requests-rules');

ws.close();
try { chrome.kill(); } catch {}
