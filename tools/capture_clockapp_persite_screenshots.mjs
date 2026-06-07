import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as wait } from 'node:timers/promises';

const root = 'C:/GoogleAppScript/0_NewServer/ACE_System4';
const outDir = `${root}/docs/clockapp-guide`;
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

await mkdir(outDir, { recursive: true });

const plannedSites = [
  {
    id: 301,
    site_code: 'BKK001',
    site_name: 'Rama IX Test Site',
    customer: 'AIS',
    lat: 13.7563,
    lng: 100.5018,
    gps_radius_m: 500,
    workflow_statuses: ['PLANNED'],
    work_type: 'Drive Test',
    planned_start_date: '2026-06-02',
    planned_end_date: '2026-06-02',
    planned_po_count: 2,
  },
  {
    id: 302,
    site_code: 'BKK002',
    site_name: 'Sathorn Cluster',
    customer: 'TRUE',
    lat: 13.758,
    lng: 100.503,
    gps_radius_m: 500,
    workflow_statuses: ['PLANNED'],
    work_type: 'Benchmark',
    planned_start_date: '2026-06-02',
    planned_end_date: '2026-06-02',
    planned_po_count: 1,
  },
];

const allSites = plannedSites.map(s => ({
  id: s.id,
  site_code: s.site_code,
  site_name: s.site_name,
  customer: s.customer,
  lat: s.lat,
  lng: s.lng,
  gps_radius_m: s.gps_radius_m,
}));

function guideUser() {
  return {
    id: 9101,
    email: 'guide.dte@airconnect-e.com',
    firstName: 'Guide',
    lastName: 'DTE',
    name: 'Guide DTE',
    employeeCode: 'DTE000',
    role: 'EMPLOYEE',
    positionCode: 'DTE',
    positionName: 'Drive Test Engineer',
    clockType: 'PER_SITE',
    projectCode: 'DTE',
    projectName: 'Drive Test Project',
    workLat: 13.7563,
    workLng: 100.5018,
    allowedRadiusM: 500,
    workLocationName: 'ACE Office',
    mustChangePassword: false,
  };
}

function todaySessions(mode) {
  if (mode === 'before') return [];
  const dayOpen = {
    id: 700,
    sessionId: 700,
    clockIn: '2026-06-02T08:20:00+07:00',
    clockOut: null,
    clock_type: 'PER_SITE',
    site_id: null,
  };
  if (mode === 'start') return [dayOpen];
  return [
    dayOpen,
    {
      id: 701,
      sessionId: 701,
      clockIn: '2026-06-02T09:05:00+07:00',
      clockOut: null,
      clock_type: 'PER_SITE',
      site_id: 301,
      siteCode: 'BKK001',
      siteName: 'Rama IX Test Site',
      status: 'ACTIVE',
    },
  ];
}

function historySessions() {
  return {
    sessions: [
      {
        id: 701,
        clockIn: '2026-06-02T09:05:00+07:00',
        clockOut: '2026-06-02T11:20:00+07:00',
        clock_type: 'PER_SITE',
        site_id: 301,
        site_code: 'BKK001',
        site_name: 'Rama IX Test Site',
        status: 'CLOSED',
        outcome: 'COMPLETE',
        lat_in: 13.7563,
        lng_in: 100.5018,
        lat_out: 13.7562,
        lng_out: 100.5019,
      },
      {
        id: 702,
        clockIn: '2026-06-02T13:00:00+07:00',
        clockOut: '2026-06-02T14:10:00+07:00',
        clock_type: 'PER_SITE',
        site_id: 302,
        site_code: 'BKK002',
        site_name: 'Sathorn Cluster',
        status: 'CLOSED',
        outcome: 'STOP',
        lat_in: 13.758,
        lng_in: 100.503,
        lat_out: 13.7581,
        lng_out: 100.5032,
      },
    ],
  };
}

async function captureMode(mode, name, afterLoad) {
  const port = 21000 + Math.floor(Math.random() * 2000);
  const userDataDir = `${root}/.chrome-clockapp-persite-${mode}-${Date.now()}`;
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
    if (msg.method === 'Fetch.requestPaused') {
      handlePaused(msg.params).catch(err => console.error(err));
    }
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
    if (url.includes('/api/clock-permissions/')) {
      await cdp('Fetch.fulfillRequest', {
        requestId: params.requestId,
        ...jsonResponse({ roles: ['DTE'], clock_type: 'PER_SITE', sites: allSites, planned_sites: plannedSites }),
      });
    } else if (url.includes('/api/admin/clock-settings')) {
      await cdp('Fetch.fulfillRequest', {
        requestId: params.requestId,
        ...jsonResponse({ config: { DTE: { gpsRequired: true, photoRequired: true, enforceRadius: true, enabled: true } } }),
      });
    } else if (url.includes('/api/clock/today')) {
      await cdp('Fetch.fulfillRequest', {
        requestId: params.requestId,
        ...jsonResponse({ sessions: todaySessions(mode) }),
      });
    } else if (url.includes('/api/clock/history')) {
      await cdp('Fetch.fulfillRequest', {
        requestId: params.requestId,
        ...jsonResponse(historySessions()),
      });
    } else if (url.includes('/api/leave/pending-for-me')) {
      await cdp('Fetch.fulfillRequest', { requestId: params.requestId, ...jsonResponse({ pending: [] }) });
    } else if (url.includes('nominatim.openstreetmap.org')) {
      await cdp('Fetch.fulfillRequest', {
        requestId: params.requestId,
        ...jsonResponse({ display_name: 'Rama IX, Bangkok, Thailand', address: { suburb: 'Rama IX', city: 'Bangkok' } }),
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
    source: `localStorage.setItem('ace_system_auth_user_v1', JSON.stringify({...${JSON.stringify(guideUser())}, token: 'guide-token'}));`,
  });

  const tab = mode === 'history' ? 'tab=history&' : '';
  await cdp('Page.navigate', { url: `https://ace.airconnect-e.com/ClockApp?${tab}desktop=1` });
  await waitForText(mode === 'history' ? 'History' : 'ACE Clock System');
  if (afterLoad) await afterLoad({ cdp, waitForText, clickByText });
  await wait(700);
  const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`${outDir}/${name}.png`, Buffer.from(shot.data, 'base64'));
  ws.close();
  try { chrome.kill(); } catch {}
}

await captureMode('before', 'persite-01-dashboard-before');
await captureMode('start', 'persite-02-select-site', async ({ clickByText, waitForText }) => {
  await waitForText('My Planned Sites');
  await clickByText('BKK001');
});
await captureMode('active', 'persite-03-active-site', async ({ cdp, waitForText }) => {
  await waitForText("Today's Sites");
  await wait(300);
  await cdp('Runtime.evaluate', {
    expression: `
      (() => {
        const el = document.querySelector('.ace-clock-main-scroll');
        if (el) el.scrollTop = 760;
        else window.scrollTo({ top: 760, behavior: 'instant' });
      })()
    `,
  });
});
await captureMode('history', 'persite-04-history', async ({ waitForText }) => {
  await waitForText('Export CSV');
});
